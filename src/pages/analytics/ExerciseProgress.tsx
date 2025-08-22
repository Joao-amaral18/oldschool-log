import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { Exercise } from '@/types'
import { ResponsiveContainer, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts'
import { TrendingUp, TrendingDown, Target, Activity, Zap } from 'lucide-react'

type Metric = 'volume' | 'maxWeight' | 'totalReps' | 'bestSet'
type TimeRange = '1m' | '3m' | '6m' | '1y'

interface WorkoutHistory {
    id: string
    startedAt: string
    templateName?: string | null
    exercises?: Array<{
        exerciseId: string
        sets: Array<{
            weight?: number
            reps?: number
            restSec?: number
        }>
    }>
}

export default function ExerciseProgressPage() {
    const [exercises, setExercises] = useState<Exercise[]>([])
    const [exerciseId, setExerciseId] = useState<string>('')
    const [metric, setMetric] = useState<Metric>('volume')
    const [timeRange, setTimeRange] = useState<TimeRange>('3m')
    const [histories, setHistories] = useState<WorkoutHistory[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const [exercisesData, historyData] = await Promise.all([
                api.listExercises(),
                api.listHistories()
            ])
            setExercises(exercisesData)
            setHistories(historyData)
            if (exercisesData.length > 0) setExerciseId(exercisesData[0].id)
        } catch (error: any) {
            toast.error(error?.message || 'Erro ao carregar dados')
        } finally {
            setLoading(false)
        }
    }

    // Calculate exercise progress data based on selected parameters
    const progressData = useMemo(() => {
        if (!exerciseId || histories.length === 0) return null

        const now = new Date()
        const months = timeRange === '1m' ? 1 : timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : 12
        const startDate = new Date(now.getTime() - (months * 30 * 24 * 60 * 60 * 1000))

        // Filter workouts that include the selected exercise
        const relevantWorkouts = histories
            .filter(h => new Date(h.startedAt) >= startDate)
            .filter(h => h.exercises?.some(e => e.exerciseId === exerciseId))

        if (relevantWorkouts.length === 0) return null

        // Generate data points for each period
        const dataPoints: Array<{ date: string; value: number; label: string }> = []
        const periodDays = timeRange === '1m' ? 7 : 14

        for (let i = months - 1; i >= 0; i--) {
            const periodStart = new Date(now)
            periodStart.setDate(periodStart.getDate() - (i + 1) * periodDays)
            const periodEnd = new Date(now)
            periodEnd.setDate(periodEnd.getDate() - i * periodDays)

            const periodWorkouts = relevantWorkouts.filter(h => {
                const date = new Date(h.startedAt)
                return date >= periodStart && date < periodEnd
            })

            let value = 0
            switch (metric) {
                case 'volume':
                    value = periodWorkouts.reduce((sum, workout) => {
                        const exercise = workout.exercises?.find(e => e.exerciseId === exerciseId)
                        return sum + (exercise?.sets.reduce((setSum, set) =>
                            setSum + ((set.weight || 0) * (set.reps || 0)), 0) || 0)
                    }, 0)
                    break
                case 'maxWeight':
                    value = Math.max(...periodWorkouts.map(workout => {
                        const exercise = workout.exercises?.find(e => e.exerciseId === exerciseId)
                        return Math.max(...(exercise?.sets.map(set => set.weight || 0) || [0]))
                    }).filter(w => w > 0))
                    break
                case 'totalReps':
                    value = periodWorkouts.reduce((sum, workout) => {
                        const exercise = workout.exercises?.find(e => e.exerciseId === exerciseId)
                        return sum + (exercise?.sets.reduce((setSum, set) => setSum + (set.reps || 0), 0) || 0)
                    }, 0)
                    break
                case 'bestSet':
                    value = Math.max(...periodWorkouts.map(workout => {
                        const exercise = workout.exercises?.find(e => e.exerciseId === exerciseId)
                        return Math.max(...(exercise?.sets.map(set => (set.weight || 0) * (set.reps || 0)) || [0]))
                    }).filter(w => w > 0))
                    break
            }

            const label = timeRange === '1m'
                ? periodEnd.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })
                : timeRange === '3m' || timeRange === '6m'
                    ? periodEnd.toLocaleDateString('pt-BR', { month: 'short' })
                    : periodEnd.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })

            dataPoints.push({ date: label, value, label })
        }

        // Calculate current stats
        const currentValue = dataPoints[dataPoints.length - 1]?.value || 0
        const previousValue = dataPoints[dataPoints.length - 2]?.value || 0
        const trend = previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0

        const allTimeBest = Math.max(...dataPoints.map(p => p.value))
        const totalWorkouts = relevantWorkouts.length
        const avgValue = dataPoints.reduce((sum, p) => sum + p.value, 0) / dataPoints.length

        return {
            dataPoints,
            currentValue,
            trend,
            allTimeBest,
            totalWorkouts,
            avgValue
        }
    }, [exerciseId, metric, timeRange, histories])

    if (loading) {
        return (
            <div className="space-y-6">
                <Card className="surface">
                    <CardContent className="p-4">Carregando progresso...</CardContent>
                </Card>
            </div>
        )
    }

    const selectedExercise = exercises.find(ex => ex.id === exerciseId)

    return (
        <div className="space-y-6">
            {/* Header with controls */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Progresso por Exercício</h1>
                    <p className="text-muted-foreground">Acompanhe a evolução individual de cada exercício</p>
                </div>
            </div>

            {/* Controls */}
            <Card className="surface">
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Label className="text-xs text-muted-foreground">Exercício</Label>
                        <Select value={exerciseId} onValueChange={setExerciseId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um exercício" />
                            </SelectTrigger>
                            <SelectContent>
                                {exercises.map((ex) => (
                                    <SelectItem value={ex.id} key={ex.id}>{ex.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label className="text-xs text-muted-foreground">Métrica</Label>
                        <Select value={metric} onValueChange={(value: Metric) => setMetric(value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="volume">Volume Total</SelectItem>
                                <SelectItem value="maxWeight">Maior Carga</SelectItem>
                                <SelectItem value="totalReps">Total de Reps</SelectItem>
                                <SelectItem value="bestSet">Melhor Série</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label className="text-xs text-muted-foreground">Período</Label>
                        <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1m">1 mês</SelectItem>
                                <SelectItem value="3m">3 meses</SelectItem>
                                <SelectItem value="6m">6 meses</SelectItem>
                                <SelectItem value="1y">1 ano</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Current Stats */}
            {progressData && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Card className="surface">
                        <CardContent className="p-4 space-y-1">
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-muted-foreground">Valor Atual</div>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="text-2xl font-semibold">{progressData.currentValue}</div>
                            <div className="flex items-center gap-1">
                                {progressData.trend >= 0 ? (
                                    <TrendingUp className="h-3 w-3 text-green-500" />
                                ) : (
                                    <TrendingDown className="h-3 w-3 text-red-500" />
                                )}
                                <span className={`text-xs ${progressData.trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {Math.abs(progressData.trend).toFixed(1)}%
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="surface">
                        <CardContent className="p-4 space-y-1">
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-muted-foreground">Recorde</div>
                                <Target className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="text-2xl font-semibold">{progressData.allTimeBest}</div>
                            <div className="text-xs text-muted-foreground">
                                {selectedExercise?.name || 'Exercício'}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="surface">
                        <CardContent className="p-4 space-y-1">
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-muted-foreground">Treinos</div>
                                <Zap className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="text-2xl font-semibold">{progressData.totalWorkouts}</div>
                            <div className="text-xs text-muted-foreground">
                                com este exercício
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="surface">
                        <CardContent className="p-4 space-y-1">
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-muted-foreground">Média</div>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="text-2xl font-semibold">{Math.round(progressData.avgValue)}</div>
                            <div className="text-xs text-muted-foreground">
                                por período
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Progress Chart */}
            <Card className="surface">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Evolução de {selectedExercise?.name || 'Exercício'}
                    </CardTitle>
                    {progressData && (
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary">{timeRange.toUpperCase()}</Badge>
                            <Badge variant="outline">{metric}</Badge>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    {progressData ? (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={progressData.dataPoints}>
                                    <XAxis dataKey="date" tickLine={false} axisLine={false} />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip
                                        formatter={(value: any, name: string) => [
                                            `${value} ${metric === 'volume' || metric === 'bestSet' ? 'kg' : metric === 'totalReps' ? 'reps' : 'kg'}`,
                                            name === 'value' ? 'Valor' : name
                                        ]}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#71717a"
                                        fill="#71717a"
                                        fillOpacity={0.2}
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center">
                            <div className="text-center text-muted-foreground">
                                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Nenhum dado encontrado para este exercício</p>
                                <p className="text-sm">Complete treinos com este exercício para ver o progresso</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Additional Insights */}
            {progressData && progressData.dataPoints.length > 1 && (
                <Card className="surface">
                    <CardHeader>
                        <CardTitle>Insights de Progresso</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="text-sm font-medium">Tendência</div>
                                <div className="flex items-center gap-2">
                                    {progressData.trend > 5 ? (
                                        <>
                                            <TrendingUp className="h-4 w-4 text-green-500" />
                                            <span className="text-sm text-green-500">
                                                Excelente progresso (+{progressData.trend.toFixed(1)}%)
                                            </span>
                                        </>
                                    ) : progressData.trend > 0 ? (
                                        <>
                                            <TrendingUp className="h-4 w-4 text-green-500" />
                                            <span className="text-sm text-green-500">
                                                Progresso positivo (+{progressData.trend.toFixed(1)}%)
                                            </span>
                                        </>
                                    ) : progressData.trend > -5 ? (
                                        <>
                                            <TrendingDown className="h-4 w-4 text-yellow-500" />
                                            <span className="text-sm text-yellow-500">
                                                Estável ({progressData.trend.toFixed(1)}%)
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <TrendingDown className="h-4 w-4 text-red-500" />
                                            <span className="text-sm text-red-500">
                                                Declínio ({progressData.trend.toFixed(1)}%)
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-sm font-medium">Consistência</div>
                                <div className="flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                        {progressData.totalWorkouts} treinos em {timeRange === '1m' ? '1 mês' : timeRange === '3m' ? '3 meses' : timeRange === '6m' ? '6 meses' : '1 ano'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}


