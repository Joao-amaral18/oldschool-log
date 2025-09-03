import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

import {
    Clock,
    Target,
    Dumbbell,

    Play,
    ArrowRight,
    Timer,
    Weight
} from 'lucide-react'
import { toNumber } from '@/lib/utils'

type WorkoutTemplate = {
    id: string
    name: string
    exercises: Array<{
        id: string
        exerciseId: string
        sets: string | number
        reps: string | number
        load: number
        restSec: string | number
    }>
    created_at: string
}

interface WorkoutPreviewModalProps {
    open: boolean
    onClose: () => void
    workout: WorkoutTemplate | null
    exercises: Array<{ id: string; name: string; muscleGroup: string }>
}

export function WorkoutPreviewModal({ open, onClose, workout, exercises }: WorkoutPreviewModalProps) {
    const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set())

    if (!workout) return null

    // Create a map for quick exercise lookup
    const exercisesMap = new Map(exercises.map(ex => [ex.id, ex]))

    const estimatedDuration = Math.round(workout.exercises.reduce((sum, ex) => sum + (toNumber(ex.sets) * toNumber(ex.restSec)), 0) / 60)
    const totalVolume = workout.exercises.reduce((sum, ex) => sum + (toNumber(ex.sets) * toNumber(ex.reps) * ex.load), 0)
    const totalSets = workout.exercises.reduce((sum, ex) => sum + toNumber(ex.sets), 0)





    const toggleExerciseExpansion = (exerciseId: string) => {
        const newExpanded = new Set(expandedExercises)
        if (newExpanded.has(exerciseId)) {
            newExpanded.delete(exerciseId)
        } else {
            newExpanded.add(exerciseId)
        }
        setExpandedExercises(newExpanded)
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl w-full p-0 overflow-hidden rounded-xl border border-stone-700 bg-background max-h-[90vh] overflow-y-auto">
                <div className="p-6 space-y-6">
                    <DialogHeader className="p-0">
                        <DialogTitle className="text-2xl font-bold tracking-tight flex items-center gap-3">
                            {workout.name}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Visualize todos os detalhes do treino antes de começar
                        </DialogDescription>
                    </DialogHeader>

                    {/* Workout Overview Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="bg-muted/30">
                            <CardContent className="p-4 text-center">
                                <Target className="h-6 w-6 mx-auto mb-2 text-primary" />
                                <div className="text-xl font-bold">{workout.exercises.length}</div>
                                <div className="text-xs text-muted-foreground">Exercícios</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-muted/30">
                            <CardContent className="p-4 text-center">
                                <Dumbbell className="h-6 w-6 mx-auto mb-2 text-primary" />
                                <div className="text-xl font-bold">{totalSets}</div>
                                <div className="text-xs text-muted-foreground">Séries Totais</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-muted/30">
                            <CardContent className="p-4 text-center">
                                <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
                                <div className="text-xl font-bold">~{estimatedDuration}min</div>
                                <div className="text-xs text-muted-foreground">Duração</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-muted/30">
                            <CardContent className="p-4 text-center">
                                <Weight className="h-6 w-6 mx-auto mb-2 text-primary" />
                                <div className="text-xl font-bold">{Math.round(totalVolume)}</div>
                                <div className="text-xs text-muted-foreground">Volume (kg)</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Exercises List */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Detalhes dos Exercícios</h3>
                        <div className="space-y-3">
                            {workout.exercises.map((exercise, idx) => {
                                const exerciseData = exercisesMap.get(exercise.exerciseId)
                                const exerciseName = exerciseData?.name || `Exercício ${idx + 1}`
                                const muscleGroup = exerciseData?.muscleGroup || 'other'

                                return (
                                    <Card key={exercise.id} className="bg-muted/20">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium">{exerciseName}</h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            {toNumber(exercise.sets)} séries × {exercise.reps} repetições
                                                            {muscleGroup !== 'other' && (
                                                                <span className="ml-2 px-2 py-0.5 bg-muted rounded text-xs">
                                                                    {muscleGroup}
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => toggleExerciseExpansion(exercise.id)}
                                                    className="text-muted-foreground hover:text-foreground"
                                                >
                                                    {expandedExercises.has(exercise.id) ? 'Recolher' : 'Ver Detalhes'}
                                                </Button>
                                            </div>

                                            {expandedExercises.has(exercise.id) && (
                                                <div className="mt-4 space-y-3 bg-background/50 rounded-lg p-3">
                                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                                        <div className="text-center">
                                                            <div className="font-medium text-primary">{exercise.reps}</div>
                                                            <div className="text-muted-foreground">Repetições</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="font-medium text-primary">{exercise.load || 0}kg</div>
                                                            <div className="text-muted-foreground">Carga</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="font-medium text-primary">{Math.round(toNumber(exercise.restSec) / 60)}min</div>
                                                            <div className="text-muted-foreground">Descanso</div>
                                                        </div>
                                                    </div>

                                                    <div className="pt-2 border-t border-border/50">
                                                        <p className="text-xs text-muted-foreground">
                                                            <Timer className="inline h-3 w-3 mr-1" />
                                                            {toNumber(exercise.sets)} séries de {exercise.reps} reps com {exercise.load || 0}kg
                                                            {toNumber(exercise.restSec) > 0 && `, ${Math.round(toNumber(exercise.restSec) / 60)}min de descanso entre séries`}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
                        <Button variant="outline" onClick={onClose} className="flex-1">
                            Fechar Preview
                        </Button>
                        <Link to={`/session/${workout.id}`} className="flex-1">
                            <Button className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                                <Play className="w-4 h-4 mr-2" />
                                Iniciar Treino
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
