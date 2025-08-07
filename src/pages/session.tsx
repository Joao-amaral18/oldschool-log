import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { useModal } from '@/hooks/useModal'
import type { PerformedSet, WorkoutTemplate, TemplateExercise, Exercise } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { formatSeconds } from '@/lib/utils'
import { toast } from 'sonner'
import { X, Clock, Plus } from 'lucide-react'
import { ExerciseCard } from '@/components/workout/ExerciseCard'
import { api } from '@/lib/api'
import { SessionSkeleton } from '@/components/skeletons'

export default function SessionPage() {
  const { templateId } = useParams<{ templateId: string }>()
  const { session } = useAuth()
  const navigate = useNavigate()
  const modal = useModal()
  const [template, setTemplate] = useState<WorkoutTemplate | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [performedSetsState, setPerformedSetsState] = useState<PerformedSet[][]>([])
  const [elapsed, setElapsed] = useState(0)
  const [expandedExerciseIndex, setExpandedExerciseIndex] = useState(0)
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set())
  const timerRef = useRef<number | null>(null)
  const startedAtRef = useRef<number>(Date.now())
  const workoutIdRef = useRef<string>('')
  const performedExerciseIdsRef = useRef<string[]>([])

  // Initialize session
  useEffect(() => {
    const boot = async () => {
      if (!session) {
        navigate('/login')
        return
      }
      try {
        // Load template & exercises
        const tpl = await api.getTemplate(templateId!)
        if (!tpl) {
          navigate('/treino')
          return
        }
        setTemplate(tpl)
        const ids = Array.from(new Set(tpl.exercises.map((e) => e.exerciseId)))
        const ex = await api.getExercisesByIds(ids)
        setExercises(ex)

        // Start workout in backend
        const started = await api.startWorkout(tpl)
        workoutIdRef.current = started.workoutId
        startedAtRef.current = Date.parse(started.startedAt as unknown as string) || Date.now()
        // Map performed exercise ids aligned by index
        performedExerciseIdsRef.current = tpl.exercises.map((te) => started.performedMapByTemplateExerciseId[te.id])
        setPerformedSetsState(tpl.exercises.map(() => []))

        // Start timer
        timerRef.current = window.setInterval(() => setElapsed((v) => v + 1), 1000)
      } catch (e: any) {
        toast.error(e?.message || 'Erro ao iniciar sessão')
        navigate('/treino')
      }
    }
    boot()
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [session, templateId])

  if (!template) {
    return <SessionSkeleton />
  }

  const totalSets = template.exercises.reduce((acc, e) => acc + e.sets, 0)
  const completedSets = performedSetsState.reduce((acc, arr) => acc + arr.length, 0)
  const progressValue = totalSets > 0 ? (completedSets / totalSets) * 100 : 0

  const handleSetComplete = async (
    exerciseIndex: number,
    setData: { load: number; reps: number; kind: 'warmup' | 'recognition' | 'working' },
  ) => {
    const performedExerciseId = performedExerciseIdsRef.current[exerciseIndex]
    if (!performedExerciseId) return
    const newSet: PerformedSet = {
      id: crypto.randomUUID(),
      reps: setData.reps,
      load: setData.load,
      kind: setData.kind,
      doneAt: Date.now(),
    }
    try {
      await api.addPerformedSet(performedExerciseId, newSet)
      setPerformedSetsState((prev) => {
        const next = prev.map((arr) => [...arr])
        next[exerciseIndex] = [...next[exerciseIndex], newSet]
        return next
      })
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao salvar set')
    }
  }

  const handleExerciseComplete = (exerciseIndex: number) => {
    setCompletedExercises((prev) => new Set(prev).add(exerciseIndex))
    // Find next uncompleted exercise
    const nextExerciseIndex = template.exercises.findIndex((_, idx) => idx > exerciseIndex && !completedExercises.has(idx))
    if (nextExerciseIndex !== -1) setExpandedExerciseIndex(nextExerciseIndex)
  }

  const handleExerciseToggle = (exerciseIndex: number) => {
    if (!completedExercises.has(exerciseIndex)) setExpandedExerciseIndex(exerciseIndex)
  }

  const handleCloseSession = async () => {
    const confirmed = await modal.confirm({
      title: 'Fechar Sessão',
      description: 'Tem certeza que deseja fechar esta sessão? Seu progresso será perdido.',
      confirmText: 'Fechar',
      cancelText: 'Continuar Treino',
      variant: 'destructive',
    })
    if (confirmed) {
      if (timerRef.current) window.clearInterval(timerRef.current)
      navigate('/treino')
    }
  }

  const handleFinishWorkout = async () => {
    if (timerRef.current) window.clearInterval(timerRef.current)
    try {
      await api.finishWorkout(workoutIdRef.current, startedAtRef.current)
      const shouldSave = await modal.confirm({
        title: 'Salvar como Template?',
        description: 'Deseja salvar este treino como um novo template?',
        confirmText: 'Salvar',
        cancelText: 'Não salvar',
      })
      if (shouldSave) {
        const templateName = await modal.prompt({
          title: 'Nome do Template',
          description: 'Digite um nome para o novo template:',
          defaultValue: `${template.name} - ${new Date().toLocaleDateString()}`,
          placeholder: 'Ex: Treino Push - Avançado',
        })
        if (templateName?.trim()) {
          // Build averaged exercises from performedSetsState
          const averaged: TemplateExercise[] = template.exercises.map((te, idx) => {
            const sets = performedSetsState[idx]
            const avgLoad = sets.length > 0 ? Math.round(sets.reduce((s, x) => s + x.load, 0) / sets.length) : te.load
            const avgReps = sets.length > 0 ? Math.round(sets.reduce((s, x) => s + x.reps, 0) / sets.length) : te.reps
            return { ...te, id: crypto.randomUUID(), load: avgLoad, reps: avgReps, sets: Math.max(sets.length, te.sets) }
          })
          await api.createTemplateWithExercises(templateName.trim(), averaged)
          toast.success('Template salvo!')
        }
      }
      toast.success('Treino finalizado!')
      navigate('/history')
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao finalizar treino')
    }
  }

  const addNewExerciseToSession = async () => {
    try {
      const allExercises = await api.listExercises()
      if (allExercises.length === 0) {
        await modal.alert({
          title: 'Nenhum exercício disponível',
          description: 'Adicione exercícios na biblioteca primeiro.',
          variant: 'warning',
        })
        return
      }
      const exerciseOptions = allExercises.map((e) => ({ value: e.id, label: e.name, description: e.muscleGroup }))
      const selectedExerciseId = await modal.select({
        title: 'Escolher Exercício',
        description: 'Selecione um exercício da sua biblioteca:',
        options: exerciseOptions,
      })
      if (!selectedExerciseId) return
      const selectedExercise = allExercises.find((e) => e.id === selectedExerciseId)!
      const defaultSets = await modal.prompt({ title: 'Número de Séries', description: 'Quantas séries para este exercício?', defaultValue: '3', inputType: 'number' })
      if (!defaultSets || parseInt(defaultSets) <= 0) return
      const defaultReps = await modal.prompt({ title: 'Repetições por Série', description: 'Quantas repetições por série?', defaultValue: '10', inputType: 'number' })
      if (!defaultReps || parseInt(defaultReps) <= 0) return
      const defaultLoad = await modal.prompt({ title: 'Carga (kg)', description: 'Qual a carga inicial em quilos?', defaultValue: '20', inputType: 'number' })
      if (!defaultLoad || parseInt(defaultLoad) < 0) return
      const defaultRest = await modal.prompt({ title: 'Descanso (segundos)', description: 'Tempo de descanso entre séries:', defaultValue: '60', inputType: 'number' })
      if (!defaultRest || parseInt(defaultRest) < 0) return

      // Update UI template list (ephemeral)
      const newTemplateExercise: TemplateExercise = {
        id: crypto.randomUUID(),
        exerciseId: selectedExercise.id,
        sets: parseInt(defaultSets),
        reps: parseInt(defaultReps),
        load: parseInt(defaultLoad),
        restSec: parseInt(defaultRest),
      }
      const newIndex = template.exercises.length
      const nextTemplate = { ...template, exercises: [...template.exercises, newTemplateExercise] }
      setTemplate(nextTemplate)
      setExercises((prev) => (prev.find((e) => e.id === selectedExercise.id) ? prev : [...prev, selectedExercise]))
      setPerformedSetsState((prev) => [...prev, []])

      // Create performed_exercise row
      const peId = await api.addPerformedExercise(workoutIdRef.current, selectedExercise.id, newIndex, null)
      performedExerciseIdsRef.current = [...performedExerciseIdsRef.current, peId]
      toast.success(`${selectedExercise.name} adicionado ao treino!`)
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao adicionar exercício')
    }
  }

  const allExercisesCompleted = template.exercises.every((_, idx) => completedExercises.has(idx))

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6 pb-8">
      {/* Header com botão fechar */}
      <div className="flex items-center justify-between sticky top-14 md:top-[73px] bg-background/95 backdrop-blur-md z-30 py-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleCloseSession}>
            <X className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-semibold">{template.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {formatSeconds(elapsed)}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <Card className="surface">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Progresso Geral</span>
              <span className="text-sm text-muted-foreground">{completedSets}/{totalSets} séries</span>
            </div>
            <Progress value={progressValue} className="h-2" />
            <div className="text-xs text-muted-foreground">
              {completedExercises.size}/{template.exercises.length} exercícios concluídos
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercise List */}
      <div className="space-y-4">
        {template.exercises.map((templateExercise, index) => {
          const exercise = exercises.find((e) => e.id === templateExercise.exerciseId)
          if (!exercise) return null
          const performedSets = performedSetsState[index] || []
          return (
            <ExerciseCard
              key={templateExercise.id}
              templateExercise={templateExercise}
              exercise={exercise}
              performedSets={performedSets}
              isExpanded={expandedExerciseIndex === index}
              isCompleted={completedExercises.has(index)}
              onSetComplete={(setData) => handleSetComplete(index, setData)}
              onExerciseComplete={() => handleExerciseComplete(index)}
              onToggleExpand={() => handleExerciseToggle(index)}
            />
          )
        })}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button variant="outline" className="w-full" onClick={addNewExerciseToSession}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Exercício
        </Button>

        {allExercisesCompleted && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Button className="w-full h-12 glow" onClick={handleFinishWorkout}>
              Finalizar Treino
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}