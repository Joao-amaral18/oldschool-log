import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Award, TrendingUp, Calendar, Target } from 'lucide-react'

interface WorkoutHistory {
    id: string
    startedAt: string
    exercises?: Array<{
        exerciseId: string
        sets: Array<{
            weight?: number
            reps?: number
            restSec?: number
        }>
    }>
}

interface Exercise {
    id: string
    name: string
    muscleGroup?: string
}

interface PersonalRecord {
    exerciseId: string
    exerciseName: string
    muscleGroup?: string
    type: 'maxWeight' | 'maxVolume' | 'maxReps'
    value: number
    achievedDate: string
    workoutId: string
    previousRecord?: number
    improvement?: number
}

export default function PRsPage() {
    const [histories, setHistories] = useState<WorkoutHistory[]>([])
    const [exercises, setExercises] = useState<Exercise[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true)
                const [historyData, exercisesData] = await Promise.all([
                    api.listHistories(),
                    api.listExercises()
                ])
                setHistories(historyData)
                setExercises(exercisesData)
            } catch (error: any) {
                toast.error(error?.message || 'Erro ao carregar dados')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    // Calculate personal records from workout history
    const personalRecords = useMemo(() => {
        if (histories.length === 0 || exercises.length === 0) return []

        const records: Map<string, PersonalRecord> = new Map()

        // Process each workout to find personal records
        histories.forEach(workout => {
            if (!workout.exercises) return

            workout.exercises.forEach(exerciseData => {
                const exercise = exercises.find(e => e.id === exerciseData.exerciseId)
                if (!exercise || exerciseData.sets.length === 0) return

                const workoutDate = new Date(workout.startedAt).toISOString().split('T')[0]

                // Calculate metrics for this exercise in this workout
                let maxWeight = 0
                let maxVolume = 0
                let maxReps = 0
                let totalVolume = 0

                exerciseData.sets.forEach(set => {
                    const weight = set.weight || 0
                    const reps = set.reps || 0
                    const volume = weight * reps

                    maxWeight = Math.max(maxWeight, weight)
                    maxVolume = Math.max(maxVolume, volume)
                    maxReps = Math.max(maxReps, reps)
                    totalVolume += volume
                })

                // Check for new personal records
                const exerciseKey = exercise.id

                // Max Weight PR
                const weightKey = `${exerciseKey}_maxWeight`
                const existingWeightPR = records.get(weightKey)
                if (!existingWeightPR || maxWeight > existingWeightPR.value) {
                    records.set(weightKey, {
                        exerciseId: exercise.id,
                        exerciseName: exercise.name,
                        muscleGroup: exercise.muscleGroup,
                        type: 'maxWeight',
                        value: maxWeight,
                        achievedDate: workoutDate,
                        workoutId: workout.id,
                        previousRecord: existingWeightPR?.value,
                        improvement: existingWeightPR ? ((maxWeight - existingWeightPR.value) / existingWeightPR.value) * 100 : undefined
                    })
                }

                // Max Volume PR
                const volumeKey = `${exerciseKey}_maxVolume`
                const existingVolumePR = records.get(volumeKey)
                if (!existingVolumePR || maxVolume > existingVolumePR.value) {
                    records.set(volumeKey, {
                        exerciseId: exercise.id,
                        exerciseName: exercise.name,
                        muscleGroup: exercise.muscleGroup,
                        type: 'maxVolume',
                        value: maxVolume,
                        achievedDate: workoutDate,
                        workoutId: workout.id,
                        previousRecord: existingVolumePR?.value,
                        improvement: existingVolumePR ? ((maxVolume - existingVolumePR.value) / existingVolumePR.value) * 100 : undefined
                    })
                }

                // Max Reps PR
                const repsKey = `${exerciseKey}_maxReps`
                const existingRepsPR = records.get(repsKey)
                if (!existingRepsPR || maxReps > existingRepsPR.value) {
                    records.set(repsKey, {
                        exerciseId: exercise.id,
                        exerciseName: exercise.name,
                        muscleGroup: exercise.muscleGroup,
                        type: 'maxReps',
                        value: maxReps,
                        achievedDate: workoutDate,
                        workoutId: workout.id,
                        previousRecord: existingRepsPR?.value,
                        improvement: existingRepsPR ? ((maxReps - existingRepsPR.value) / existingRepsPR.value) * 100 : undefined
                    })
                }
            })
        })

        // Convert to array and sort by improvement percentage (newest/most significant first)
        return Array.from(records.values())
            .sort((a, b) => {
                // Sort by most recent first, then by improvement percentage
                const dateA = new Date(a.achievedDate).getTime()
                const dateB = new Date(b.achievedDate).getTime()

                if (dateA !== dateB) return dateB - dateA

                const improvementA = a.improvement || 0
                const improvementB = b.improvement || 0
                return improvementB - improvementA
            })
    }, [histories, exercises])

    // Group PRs by exercise for better organization
    const prsByExercise = useMemo(() => {
        const grouped = new Map<string, PersonalRecord[]>()

        personalRecords.forEach(pr => {
            if (!grouped.has(pr.exerciseId)) {
                grouped.set(pr.exerciseId, [])
            }
            grouped.get(pr.exerciseId)!.push(pr)
        })

        return grouped
    }, [personalRecords])

    if (loading) {
        return (
            <div className="space-y-6">
                <Card className="surface">
                    <CardContent className="p-4">Carregando recordes pessoais...</CardContent>
                </Card>
            </div>
        )
    }

    const getPRTypeLabel = (type: string) => {
        switch (type) {
            case 'maxWeight': return 'Maior Carga'
            case 'maxVolume': return 'Maior Volume'
            case 'maxReps': return 'Máximo de Reps'
            default: return type
        }
    }

    const getPRValueUnit = (type: string) => {
        switch (type) {
            case 'maxWeight': return 'kg'
            case 'maxVolume': return 'kg'
            case 'maxReps': return 'reps'
            default: return ''
        }
    }

    const getImprovementColor = (improvement?: number) => {
        if (!improvement) return 'text-muted-foreground'
        if (improvement > 10) return 'text-green-500'
        if (improvement > 0) return 'text-blue-500'
        return 'text-muted-foreground'
    }

    return (
        <div className="space-y-6">
            {/* Header with summary */}
            <div className="flex items-center justify-between">
                        <div>
                    <h1 className="text-2xl font-bold">Recordes Pessoais</h1>
                    <p className="text-muted-foreground">Seus melhores desempenhos em cada exercício</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary">{personalRecords.length} recordes</Badge>
                </div>
            </div>

            {/* Summary Cards */}
            {personalRecords.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Card className="surface">
                        <CardContent className="p-4 space-y-1">
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-muted-foreground">Total de PRs</div>
                                <Award className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="text-2xl font-semibold">{personalRecords.length}</div>
                            <div className="text-xs text-muted-foreground">
                                {prsByExercise.size} exercícios
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="surface">
                        <CardContent className="p-4 space-y-1">
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-muted-foreground">Melhoria Média</div>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="text-2xl font-semibold">
                                {personalRecords.length > 0
                                    ? Math.round(personalRecords
                                        .filter(pr => pr.improvement !== undefined)
                                        .reduce((sum, pr) => sum + (pr.improvement || 0), 0) /
                                        Math.max(1, personalRecords.filter(pr => pr.improvement !== undefined).length)
                                    )
                                    : 0}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                                em recordes batidos
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="surface">
                        <CardContent className="p-4 space-y-1">
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-muted-foreground">Recorde Mais Recente</div>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="text-2xl font-semibold">
                                {personalRecords.length > 0
                                    ? new Date(personalRecords[0].achievedDate).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })
                                    : '--'
                                }
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {personalRecords.length > 0 ? personalRecords[0].exerciseName : ''}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="surface">
                        <CardContent className="p-4 space-y-1">
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-muted-foreground">Maior Melhoria</div>
                                <Target className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="text-2xl font-semibold">
                                {personalRecords.length > 0
                                    ? Math.max(...personalRecords.map(pr => pr.improvement || 0))
                                    : 0}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                                melhor desempenho
                        </div>
                        </CardContent>
                    </Card>
                        </div>
            )}

            {/* Personal Records List */}
            {personalRecords.length === 0 ? (
                <Card className="surface">
                    <CardContent className="p-8 text-center">
                        <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium mb-2">Nenhum recorde pessoal ainda</h3>
                        <p className="text-muted-foreground">
                            Complete alguns treinos para começar a rastrear seus recordes pessoais
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {/* Group by exercise */}
                    {Array.from(prsByExercise.entries()).map(([exerciseId, exercisePRs]) => {
                        const exercise = exercises.find(e => e.id === exerciseId)
                        if (!exercise) return null

                        return (
                            <Card key={exerciseId} className="surface">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Award className="h-5 w-5 text-primary" />
                                            {exercise.name}
                                        </div>
                                        {exercise.muscleGroup && (
                                            <Badge variant="outline">{exercise.muscleGroup}</Badge>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {exercisePRs.map((pr) => (
                                            <div key={`${pr.exerciseId}_${pr.type}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                                    <div>
                                                        <div className="font-medium">{getPRTypeLabel(pr.type)}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {new Date(pr.achievedDate).toLocaleDateString('pt-BR')}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xl font-semibold">
                                                        {pr.value} {getPRValueUnit(pr.type)}
                                                    </div>
                                                    {pr.improvement !== undefined && pr.improvement > 0 && (
                                                        <div className={`text-xs flex items-center gap-1 ${getImprovementColor(pr.improvement)}`}>
                                                            <TrendingUp className="h-3 w-3" />
                                                            +{pr.improvement.toFixed(1)}%
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}


