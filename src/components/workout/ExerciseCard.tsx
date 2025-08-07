import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, ChevronDown, ChevronUp, Play, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { TemplateExercise, Exercise, PerformedSet } from '@/types'

interface ExerciseCardProps {
    templateExercise: TemplateExercise
    exercise: Exercise
    performedSets: PerformedSet[]
    isExpanded: boolean
    isCompleted: boolean
    onSetComplete: (setData: { load: number; reps: number; kind: 'warmup' | 'recognition' | 'working' }) => void
    onExerciseComplete: () => void
    onToggleExpand: () => void
}

export function ExerciseCard({
    templateExercise,
    exercise,
    performedSets,
    isExpanded,
    isCompleted,
    onSetComplete,
    onExerciseComplete,
    onToggleExpand
}: ExerciseCardProps) {
    const [activeLoad, setActiveLoad] = useState(templateExercise.load)
    const [activeReps, setActiveReps] = useState(templateExercise.reps)
    const [activeKind, setActiveKind] = useState<'warmup' | 'recognition' | 'working'>('working')
    const [restRemaining, setRestRemaining] = useState(0)
    const restTimerRef = useRef<number | null>(null)
    const cardRef = useRef<HTMLDivElement>(null)

    const completedSets = performedSets.length
    const plannedSets = templateExercise.sets
    const progressValue = plannedSets > 0 ? (completedSets / plannedSets) * 100 : 0
    const allSetsCompleted = completedSets >= plannedSets

    // Start rest timer when a set is completed
    useEffect(() => {
        if (restRemaining > 0) {
            restTimerRef.current = window.setInterval(() => {
                setRestRemaining((r) => {
                    if (r <= 1) {
                        if (restTimerRef.current) window.clearInterval(restTimerRef.current)
                        return 0
                    }
                    return r - 1
                })
            }, 1000)
        }

        return () => {
            if (restTimerRef.current) window.clearInterval(restTimerRef.current)
        }
    }, [restRemaining])

    // Scroll into view when expanded
    useEffect(() => {
        if (isExpanded && cardRef.current && !isCompleted) {
            const timer = setTimeout(() => {
                cardRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                })
            }, 300)
            return () => clearTimeout(timer)
        }
    }, [isExpanded, isCompleted])

    const handleSetComplete = () => {
        if (!activeLoad || !activeReps || activeLoad <= 0 || activeReps <= 0) return

        onSetComplete({
            load: activeLoad,
            reps: activeReps,
            kind: activeKind
        })

        // Start rest timer if not the last set
        if (completedSets + 1 < plannedSets) {
            setRestRemaining(templateExercise.restSec)
        }

        // Reset for next set
        setActiveLoad(templateExercise.load)
        setActiveReps(templateExercise.reps)
        setActiveKind('working')
    }

    const formatSeconds = (total: number) => {
        const m = Math.floor(total / 60)
        const s = total % 60
        return `${m}:${s.toString().padStart(2, '0')}`
    }

    return (
        <motion.div
            ref={cardRef}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
        >
            <Card
                className={cn(
                    "liquid-card liquid-morph cursor-pointer",
                    isCompleted
                        ? "border-zinc-500/30 bg-accent/20 liquid-pulse"
                        : isExpanded
                            ? "liquid-glass-enhanced border-zinc-500/40"
                            : "hover:border-zinc-500/30 hover:bg-accent/60"
                )}
                onClick={!isExpanded ? onToggleExpand : undefined}
            >
                <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            {isCompleted ? (
                                <Check className="h-5 w-5 text-primary" />
                            ) : isExpanded ? (
                                <Play className="h-5 w-5 text-primary" />
                            ) : (
                                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                            )}
                            <div>
                                <h3 className="font-semibold">{exercise.name}</h3>
                                <p className="text-xs text-muted-foreground capitalize">{exercise.muscleGroup}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {isCompleted ? (
                                <div className="text-xs text-primary font-medium">Concluído</div>
                            ) : (
                                <div className="text-xs text-muted-foreground">
                                    {completedSets}/{plannedSets} séries
                                </div>
                            )}
                            {!isCompleted && (
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                        <Progress value={progressValue} className="h-2" />
                        <div className="mt-1 text-xs text-muted-foreground">
                            {completedSets} de {plannedSets} séries concluídas
                        </div>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                        {isExpanded && !isCompleted && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                            >
                                <div className="space-y-4 pt-2">
                                    {/* Completed Sets */}
                                    <div className="space-y-2">
                                        {performedSets.map((set, idx) => (
                                            <div
                                                key={set.id}
                                                className="flex items-center justify-between rounded-lg border border-muted bg-muted/30 px-3 py-2 opacity-70"
                                            >
                                                <div className="text-sm text-muted-foreground">
                                                    <span className="font-medium">Set {idx + 1}:</span> {set.load}kg × {set.reps} reps
                                                    <span className="ml-2 text-xs">{set.kind}</span>
                                                </div>
                                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Rest Timer */}
                                    {restRemaining > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="flex items-center justify-between rounded-md border border-primary/20 bg-primary/5 p-3 text-sm"
                                        >
                                            <div>Descanso: {formatSeconds(restRemaining)}</div>
                                            <Button size="sm" variant="outline" onClick={() => setRestRemaining(0)} className="border-primary text-primary">
                                                Pular
                                            </Button>
                                        </motion.div>
                                    )}

                                    {/* Active Set or Exercise Complete */}
                                    {!allSetsCompleted ? (
                                        <div className="space-y-3 liquid-adaptive p-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">Set {completedSets + 1}</span>
                                                <select
                                                    className="text-xs bg-muted/50 border border-stone-800 rounded px-2 py-1"
                                                    value={activeKind}
                                                    onChange={(e) => setActiveKind(e.target.value as any)}
                                                >
                                                    <option value="warmup">Aquecimento</option>
                                                    <option value="recognition">Reconhecimento</option>
                                                    <option value="working">Trabalho</option>
                                                </select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs text-muted-foreground">Carga (kg)</label>
                                                    <Input
                                                        type="number"
                                                        value={activeLoad}
                                                        onChange={(e) => setActiveLoad(Number(e.target.value))}
                                                        className="h-12"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-muted-foreground">Reps</label>
                                                    <Input
                                                        type="number"
                                                        value={activeReps}
                                                        onChange={(e) => setActiveReps(Number(e.target.value))}
                                                        className="h-12"
                                                    />
                                                </div>
                                            </div>

                                            <Button
                                                onClick={handleSetComplete}
                                                className="w-full h-12"
                                                disabled={!activeLoad || !activeReps || activeLoad <= 0 || activeReps <= 0}
                                            >
                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                Concluir Set {completedSets + 1}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="text-center py-4">
                                                <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-2" />
                                                <p className="text-sm font-medium">Exercício concluído!</p>
                                                <p className="text-xs text-muted-foreground">Todas as séries foram finalizadas</p>
                                            </div>
                                            <Button
                                                onClick={onExerciseComplete}
                                                className="w-full h-12 glow"
                                                variant="default"
                                            >
                                                Finalizar Exercício
                                            </Button>
                                        </div>
                                    )}

                                    {/* Future Sets Preview */}
                                    {!allSetsCompleted && (
                                        <div className="space-y-2">
                                            {Array.from({ length: Math.max(0, plannedSets - completedSets - 1) }, (_, idx) => (
                                                <div key={idx} className="flex items-center justify-between rounded-lg border border-muted/50 bg-muted/10 px-3 py-2 opacity-50">
                                                    <div className="text-sm text-muted-foreground">
                                                        Set {completedSets + 2 + idx}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">Aguardando...</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>
        </motion.div>
    )
}
