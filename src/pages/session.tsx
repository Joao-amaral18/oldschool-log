import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { useModal } from '@/hooks/useModal'
import type { PerformedSet, WorkoutTemplate, TemplateExercise, Exercise } from '@/types'
import { Button } from '@/components/ui/button'
// import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

import { cn } from '@/lib/utils'
import { formatSeconds, getRandomFromRange } from '@/lib/utils'
import { toast } from 'sonner'
import { X, Plus, ChevronDown, Timer, Circle, CheckCircle2 } from 'lucide-react'
import { api } from '@/lib/api'
import { enqueueSet, registerSync } from '@/lib/offlineQueue'
import { SessionSkeleton } from '@/components/skeletons'
import { SwipeableSet } from '@/components/ui/swipeable-set'

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
              // Convert string reps to number for API call
              const setData = {
                ...item.set,
                reps: typeof item.set.reps === 'number' ? item.set.reps : parseInt(String(item.set.reps)) || 0
              }
              await api.addPerformedSet(item.performedExerciseId, setData)
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
          const count = Math.max(1, typeof te.sets === 'number' ? te.sets : parseInt(String(te.sets)) || 1)
          init[te.id] = {
            isCompleted: false,
            sets: Array.from({ length: count }, (_, i) => ({
              id: i + 1,
              reps: String(getRandomFromRange(te.reps)),
              load: String(te.load || 0),
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
  const totalSetsPlanned = template.exercises.reduce((acc, te) => {
    const setsCount = typeof te.sets === 'number' ? te.sets : parseInt(String(te.sets)) || 1
    return acc + (exerciseStates[te.id]?.sets.length ?? setsCount)
  }, 0)
  const completedSetsCount = template.exercises.reduce((acc, te) => acc + (exerciseStates[te.id]?.sets.filter((s) => s.isCompleted).length ?? 0), 0)
  const progressValue = totalSetsPlanned > 0 ? (completedSetsCount / totalSetsPlanned) * 100 : 0

  const handleSetComplete = async (
    exerciseIndex: number,
    setData: { load: number; reps: string | number; kind: 'warmup' | 'recognition' | 'working' },
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

    // Convert string reps to number for API calls
    const apiSetData = {
      ...newSet,
      reps: typeof newSet.reps === 'number' ? newSet.reps : parseInt(String(newSet.reps)) || 0
    }

    try {
      await api.addPerformedSet(performedExerciseId, apiSetData)
    } catch {
      // Offline or API error: enqueue for background sync
      await enqueueSet({
        endpoint: '/offline/sets',
        payload: { performedExerciseId, set: apiSetData },
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
        // Load is optional, reps are required
        if (parsedReps > 0) {
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

  const handleDeleteSet = async (exerciseId: string, setId: number) => {
    // Don't allow deletion of the last set
    const currentSets = exerciseStates[exerciseId]?.sets || []
    if (currentSets.length <= 1) {
      toast.error('Não é possível deletar a última série')
      return
    }

    const confirmed = await modal.confirm({
      title: 'Deletar Série',
      description: 'Tem certeza que deseja deletar esta série? Esta ação não pode ser desfeita.',
      confirmText: 'Deletar',
      cancelText: 'Cancelar',
      variant: 'destructive',
    })

    if (!confirmed) return

    setExerciseStates((prev) => {
      const next = { ...prev }
      const st = { ...(next[exerciseId] ?? { sets: [], isCompleted: false }) }
      st.sets = st.sets.filter((s) => s.id !== setId)
      st.isCompleted = st.sets.length > 0 && st.sets.every((s) => s.isCompleted)
      next[exerciseId] = st
      return next
    })

    toast.success('Série deletada')
  }

  const handleDuplicateSet = (exerciseId: string, setId: number) => {
    setExerciseStates((prev) => {
      const next = { ...prev }
      const st = { ...(next[exerciseId] ?? { sets: [], isCompleted: false }) }
      const setToDuplicate = st.sets.find((s) => s.id === setId)
      if (!setToDuplicate) return next

      const nextId = st.sets.length > 0 ? Math.max(...st.sets.map((s) => s.id)) + 1 : 1
      const duplicatedSet = {
        ...setToDuplicate,
        id: nextId,
        isCompleted: false // Reset completion status for duplicated set
      }

      // Insert after the original set
      const originalIndex = st.sets.findIndex((s) => s.id === setId)
      st.sets = [
        ...st.sets.slice(0, originalIndex + 1),
        duplicatedSet,
        ...st.sets.slice(originalIndex + 1)
      ]

      st.isCompleted = false // Reset exercise completion since we added an incomplete set
      next[exerciseId] = st
      return next
    })

    const idx = template.exercises.findIndex((te) => te.id === exerciseId)
    setCompletedExercises((prev) => {
      const next = new Set(prev)
      if (idx !== -1) next.delete(idx)
      return next
    })

    toast.success('Série duplicada')
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
            const avgReps = sets.length > 0 ? Math.round(sets.reduce((s, x) => s + (typeof x.reps === 'number' ? x.reps : parseInt(String(x.reps)) || 0), 0) / sets.length) : (typeof te.reps === 'number' ? te.reps : parseInt(String(te.reps)) || 10)
            return { ...te, id: crypto.randomUUID(), load: avgLoad, reps: avgReps, sets: Math.max(sets.length, typeof te.sets === 'number' ? te.sets : parseInt(String(te.sets)) || 1) }
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col min-h-screen bg-background"
    >
      {/* Header */}
      <div className="sticky top-0 md:top-[73px] bg-background/95 backdrop-blur-md z-30 border-b border-border/50">
        <div className="flex items-center justify-between px-6 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCloseSession}
            className="h-10 w-10 rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>

          <div className="text-center flex-1">
            <h1 className="text-lg font-semibold text-foreground">{template.name}</h1>
            <div className="flex items-center justify-center gap-2 mt-1">
              <Timer className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-mono text-muted-foreground">
                {formatSeconds(elapsed)}
              </span>
            </div>
          </div>

          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Progress Bar */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {completedExercisesCount} de {template.exercises.length} concluídos
            </span>
            <span className="text-sm font-medium">
              {Math.round(progressValue)}%
            </span>
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>
      </div>

      {/* Exercise List */}
      <main className="flex-1 px-6 pt-8 pb-6 space-y-4">
        {template.exercises.map((te, idx) => {
          const exercise = exercises.find((e) => e.id === te.exerciseId)
          if (!exercise) return null

          const st = exerciseStates[te.id]
          const isExpanded = idx === expandedExerciseIndex
          const isCompleted = !!st?.isCompleted
          const completedSets = st?.sets.filter(s => s.isCompleted).length || 0
          const totalSets = st?.sets.length || 0

          return (
            <motion.div
              key={te.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-card rounded-2xl border border-border/50 shadow-sm"
            >
              <button
                type="button"
                onClick={() => handleExerciseToggle(idx)}
                className={cn(
                  "w-full p-6 text-left transition-all duration-200",
                  isExpanded
                    ? "rounded-t-2xl"
                    : "rounded-2xl hover:bg-muted/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                      isCompleted
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className={cn(
                        "font-semibold text-base transition-colors",
                        isCompleted ? "text-muted-foreground" : "text-foreground"
                      )}>
                        {exercise.name}
                      </h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-muted-foreground">
                          {Math.max(1, typeof te.sets === 'number' ? te.sets : parseInt(String(te.sets)) || 1)} séries
                        </span>
                        {te.reps && (
                          <span className="text-sm text-muted-foreground">
                            {te.reps} reps
                          </span>
                        )}
                        {te.restSec && (
                          <span className="text-sm text-muted-foreground">
                            {te.restSec}s descanso
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {totalSets > 0 && (
                    <div className="text-right mr-4">
                      <div className="text-sm font-medium text-foreground">
                        {completedSets}/{totalSets}
                      </div>
                    </div>
                  )}

                  <ChevronDown className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform duration-200",
                    isExpanded && "rotate-180"
                  )} />
                </div>
              </button>

              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-6 pb-6 space-y-4"
                >
                  <div className="grid grid-cols-4 gap-3 text-sm font-medium text-muted-foreground px-2">
                    <div className="text-center">Set</div>
                    <div className="text-center">Carga</div>
                    <div className="text-center">Reps</div>
                    <div className="text-center">✓</div>
                  </div>

                  <div className="space-y-3">
                    {st?.sets.map((s) => (
                      <SwipeableSet
                        key={s.id}
                        setId={s.id}
                        load={s.load}
                        reps={s.reps}
                        isCompleted={s.isCompleted}
                        onUpdate={(field, value) => handleSetUpdate(te.id, s.id, field, value)}
                        onToggleComplete={() => handleSetToggleComplete(te.id, s.id)}
                        onDelete={() => handleDeleteSet(te.id, s.id)}
                        onDuplicate={() => handleDuplicateSet(te.id, s.id)}
                      />
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => handleAddSet(te.id)}
                    className="w-full h-12 rounded-xl border-dashed"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Série
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )
        })}

        <Button
          variant="outline"
          onClick={addNewExerciseToSession}
          className="w-full h-16 rounded-2xl border-dashed border-2 text-muted-foreground hover:text-foreground hover:border-primary"
        >
          <Plus className="mr-3 h-5 w-5" />
          Adicionar Exercício
        </Button>
      </main>

      {/* Bottom Action */}
      {allSetsForCurrentExerciseCompleted && (
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-md border-t border-border/50 px-6 py-4">
          <Button
            onClick={() => {
              const currentIdx = expandedExerciseIndex
              const nextIdx = template.exercises.findIndex((_, idx) =>
                idx > currentIdx && !(exerciseStates[template.exercises[idx].id]?.isCompleted)
              )
              if (nextIdx !== -1) setExpandedExerciseIndex(nextIdx)
              else void handleFinishWorkout()
            }}
            className="w-full h-14 text-base font-medium rounded-2xl"
            size="lg"
          >
            {expandedExerciseIndex < template.exercises.length - 1
              ? 'Próximo Exercício'
              : 'Finalizar Treino'
            }
          </Button>
        </div>
      )}
    </motion.div>
  )
}