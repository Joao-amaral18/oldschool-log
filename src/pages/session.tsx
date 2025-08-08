import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { useModal } from '@/hooks/useModal'
import type { PerformedSet, WorkoutTemplate, TemplateExercise, Exercise } from '@/types'
import { Button } from '@/components/ui/button'
// import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { formatSeconds } from '@/lib/utils'
import { toast } from 'sonner'
import { X, Plus, ChevronDown, Timer, Circle, CheckCircle2 } from 'lucide-react'
import { api } from '@/lib/api'
import { enqueueSet, registerSync } from '@/lib/offlineQueue'
import { SessionSkeleton } from '@/components/skeletons'

type LocalSet = { id: number; reps: string; load: string; isCompleted: boolean }
type ExerciseLocalState = { sets: LocalSet[]; isCompleted: boolean }

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
  const [exerciseStates, setExerciseStates] = useState<Record<string, ExerciseLocalState>>({})
  const exerciseRefs = useRef<Array<HTMLDivElement | null>>([])
  const timerRef = useRef<number | null>(null)
  const startedAtRef = useRef<number>(Date.now())
  const workoutIdRef = useRef<string>('')
  const performedExerciseIdsRef = useRef<string[]>([])

  // Initialize session
  useEffect(() => {
    const onSwMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_SETS') {
        // Try to flush queued sets now via API
        try {
          const { listQueuedPerformedSets, removeQueuedItem } = await import('@/lib/offlineQueue')
          const queued = await listQueuedPerformedSets()
          for (const item of queued) {
            try {
              await api.addPerformedSet(item.performedExerciseId, item.set)
              await removeQueuedItem(item.id)
            } catch { }
          }
        } catch { }
      }
    }
    navigator.serviceWorker?.addEventListener?.('message', onSwMessage as any)
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

        // Initialize local UI state for rows per exercise
        const init: Record<string, ExerciseLocalState> = {}
        for (const te of tpl.exercises) {
          const count = Math.max(1, te.sets || 1)
          init[te.id] = {
            isCompleted: false,
            sets: Array.from({ length: count }, (_, i) => ({
              id: i + 1,
              reps: te.reps ? String(te.reps) : '',
              load: te.load ? String(te.load) : '',
              isCompleted: false,
            })),
          }
        }
        // Restore draft if present
        try {
          const key = `session-draft:${workoutIdRef.current}`
          const raw = localStorage.getItem(key)
          if (raw) {
            const saved = JSON.parse(raw) as Record<string, ExerciseLocalState>
            setExerciseStates(saved)
          } else {
            setExerciseStates(init)
          }
        } catch {
          setExerciseStates(init)
        }
        exerciseRefs.current = Array.from({ length: tpl.exercises.length }, () => null)

        // Timer will be started in a separate effect once template is ready
      } catch (e: any) {
        toast.error(e?.message || 'Erro ao iniciar sessão')
        navigate('/treino')
      }
    }
    boot()
    // Ensure background sync is registered when session page is active
    registerSync()
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
      navigator.serviceWorker?.removeEventListener?.('message', onSwMessage as any)
    }
  }, [session, templateId])

  // Start/update timer when template is ready. Compute elapsed based on startedAtRef to avoid double increments
  useEffect(() => {
    if (!template) return
    // Clear any stray interval
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    // Sync immediately
    setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000))
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000))
    }, 1000)
    timerRef.current = id as unknown as number
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      } else {
        window.clearInterval(id)
      }
    }
  }, [template?.id])

  // Persist drafts per workout (must come before any conditional return)
  useEffect(() => {
    const key = `session-draft:${workoutIdRef.current}`
    try {
      if (workoutIdRef.current) localStorage.setItem(key, JSON.stringify(exerciseStates))
    } catch { }
  }, [exerciseStates])

  if (!template) {
    return <SessionSkeleton />
  }

  // Progress based on local row completion
  const totalSetsPlanned = template.exercises.reduce((acc, te) => acc + (exerciseStates[te.id]?.sets.length ?? te.sets), 0)
  const completedSetsCount = template.exercises.reduce((acc, te) => acc + (exerciseStates[te.id]?.sets.filter((s) => s.isCompleted).length ?? 0), 0)
  const progressValue = totalSetsPlanned > 0 ? (completedSetsCount / totalSetsPlanned) * 100 : 0

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
    }
    // Optimistic UI first
    setPerformedSetsState((prev) => {
      const next = prev.map((arr) => [...arr])
      next[exerciseIndex] = [...next[exerciseIndex], newSet]
      return next
    })

    try {
      await api.addPerformedSet(performedExerciseId, newSet)
    } catch {
      // Offline or API error: enqueue for background sync
      await enqueueSet({
        endpoint: '/offline/sets',
        payload: { performedExerciseId, set: newSet },
      })
      await registerSync()
      toast.info('Sem conexão. Série será sincronizada quando voltar internet.')
    }
  }

  // kept for compatibility with previous UI (currently unused)
  // const handleExerciseComplete = (_exerciseIndex: number) => {}

  const handleExerciseToggle = (exerciseIndex: number) => {
    if (!completedExercises.has(exerciseIndex)) setExpandedExerciseIndex(exerciseIndex)
  }

  const handleSetUpdate = (exerciseId: string, setId: number, field: 'reps' | 'load', value: string) => {
    setExerciseStates((prev) => {
      const next = { ...prev }
      const st = { ...(next[exerciseId] ?? { sets: [], isCompleted: false }) }
      st.sets = st.sets.map((s) => (s.id === setId ? { ...s, [field]: value } : s))
      next[exerciseId] = st
      return next
    })
  }

  const handleSetToggleComplete = (exerciseId: string, setId: number) => {
    let justCompleted = false
    setExerciseStates((prev) => {
      const next = { ...prev }
      const st = { ...(next[exerciseId] ?? { sets: [], isCompleted: false }) }
      st.sets = st.sets.map((s) => {
        if (s.id !== setId) return s
        const newCompleted = !s.isCompleted
        if (newCompleted && !s.isCompleted) justCompleted = true
        return { ...s, isCompleted: newCompleted }
      })
      st.isCompleted = st.sets.length > 0 && st.sets.every((s) => s.isCompleted)
      next[exerciseId] = st
      return next
    })
    // If toggled to completed, send performed set to backend using current values
    if (justCompleted) {
      const teIndex = template.exercises.findIndex((te) => te.id === exerciseId)
      if (teIndex !== -1) {
        const row = exerciseStates[exerciseId]?.sets.find((s) => s.id === setId)
        const parsedLoad = row?.load ? Number(row.load) : 0
        const parsedReps = row?.reps ? Number(row.reps) : 0
        if (parsedLoad > 0 && parsedReps > 0) {
          void handleSetComplete(teIndex, { load: parsedLoad, reps: parsedReps, kind: 'working' })
        }
      }
    }
  }

  const handleAddSet = (exerciseId: string) => {
    setExerciseStates((prev) => {
      const next = { ...prev }
      const st = { ...(next[exerciseId] ?? { sets: [], isCompleted: false }) }
      const nextId = st.sets.length > 0 ? Math.max(...st.sets.map((s) => s.id)) + 1 : 1
      const last = st.sets[st.sets.length - 1]
      st.sets = [...st.sets, { id: nextId, reps: last?.reps ?? '', load: last?.load ?? '', isCompleted: false }]
      st.isCompleted = false
      next[exerciseId] = st
      return next
    })
    const idx = template.exercises.findIndex((te) => te.id === exerciseId)
    setCompletedExercises((prev) => {
      const next = new Set(prev)
      if (idx !== -1) next.delete(idx)
      return next
    })
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

  // computed but not used; keep if needed for future UI
  // const allExercisesCompleted = template.exercises.every((te) => exerciseStates[te.id]?.isCompleted)
  const completedExercisesCount = template.exercises.filter((te) => exerciseStates[te.id]?.isCompleted).length
  const currentExerciseId = template.exercises[expandedExerciseIndex]?.id
  const allSetsForCurrentExerciseCompleted = currentExerciseId ? (exerciseStates[currentExerciseId]?.sets.every((s) => s.isCompleted) ?? false) : false

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-14 md:top-[73px] bg-background/95 backdrop-blur-md z-30 py-4 border-b px-4">
        <Button variant="ghost" size="icon" onClick={handleCloseSession}><X className="h-5 w-5" /></Button>
        <div className="text-center">
          <p className="font-semibold">{template.name}</p>
        </div>
        <div className="w-24 text-right flex items-center justify-end gap-2">
          <Timer className="w-4 h-4" />
          <span className="font-mono">{formatSeconds(elapsed)}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="p-4">
        <Progress value={progressValue} className="w-full h-2" />
        <p className="text-center text-sm text-muted-foreground mt-2">{completedExercisesCount} de {template.exercises.length} exercícios concluídos</p>
      </div>

      {/* Exercise Blocks */}
      <main className="flex-grow flex flex-col px-4 pb-24 space-y-3">
        {template.exercises.map((te, idx) => {
          const exercise = exercises.find((e) => e.id === te.exerciseId)
          if (!exercise) return null
          const st = exerciseStates[te.id]
          const isExpanded = idx === expandedExerciseIndex
          const isCompleted = !!st?.isCompleted
          const seriesDisp = `${Math.max(1, te.sets || 1)} séries${te.reps ? ` x ${te.reps} reps` : ''}`
          const restDisp = te.restSec ? `${te.restSec}s descanso` : null
          return (
            <div key={te.id} ref={(el) => { exerciseRefs.current[idx] = el }}>
              <button
                type="button"
                onClick={() => handleExerciseToggle(idx)}
                className={cn('flex w-full items-center gap-4 p-4 rounded-lg border border-stone-700 bg-card transition-colors', isExpanded ? 'border-primary' : 'border-stone-800 hover:border-zinc-500')}
              >
                <div className="flex items-center gap-4 flex-grow text-left">
                  {isCompleted ? (<CheckCircle2 className="w-5 h-5 text-primary" />) : (<Circle className="w-5 h-5 text-muted-foreground" />)}
                  <div>
                    <p className="font-semibold text-foreground">{exercise.name}</p>
                    <p className="text-xs text-muted-foreground">{seriesDisp} {restDisp && `• ${restDisp}`}</p>
                  </div>
                </div>
                <ChevronDown className={cn('h-5 w-5 text-muted-foreground transition-transform', isExpanded && 'rotate-180')} />
              </button>

              {isExpanded && (
                <div className="bg-card border border-stone-700 -0 rounded-b-lg p-4 space-y-4">
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2">
                    <div className="col-span-2 text-center">Série</div>
                    <div className="col-span-4 text-center">Carga (kg)</div>
                    <div className="col-span-4 text-center">Reps</div>
                    <div className="col-span-2"></div>
                  </div>
                  <div className="space-y-2">
                    {st?.sets.map((s) => (
                      <div key={s.id} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-2 text-center">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-foreground mx-auto">{s.id}</div>
                        </div>
                        <div className="col-span-4">
                          <Input type="number" placeholder="-" value={s.load} onChange={(e) => handleSetUpdate(te.id, s.id, 'load', e.target.value)} className="bg-background border-input text-center text-base" />
                        </div>
                        <div className="col-span-4">
                          <Input type="number" placeholder="-" value={s.reps} onChange={(e) => handleSetUpdate(te.id, s.id, 'reps', e.target.value)} className="bg-background border-input text-center text-base" />
                        </div>
                        <div className="col-span-2 flex justify-center">
                          <input type="checkbox" checked={s.isCompleted} onChange={() => handleSetToggleComplete(te.id, s.id)} className="h-5 w-5 rounded border-stone-800" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => handleAddSet(te.id)}>
                    <Plus className="h-4 w-4 mr-2" /> Adicionar Set
                  </Button>
                </div>
              )}
            </div>
          )
        })}

        <Button variant="outline" className="w-full" onClick={addNewExerciseToSession}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar Exercício
        </Button>
      </main>

      {allSetsForCurrentExerciseCompleted && (
        <div className="p-4 w-full max-w-2xl mx-auto fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm ">
          <Button onClick={() => {
            const currentIdx = expandedExerciseIndex
            const nextIdx = template.exercises.findIndex((_, idx) => idx > currentIdx && !(exerciseStates[template.exercises[idx].id]?.isCompleted))
            if (nextIdx !== -1) setExpandedExerciseIndex(nextIdx)
            else void handleFinishWorkout()
          }} className="w-full h-14 text-lg">
            {expandedExerciseIndex < template.exercises.length - 1 ? 'Próximo Exercício' : 'Finalizar Treino'}
          </Button>
        </div>
      )}
    </motion.div>
  )
}