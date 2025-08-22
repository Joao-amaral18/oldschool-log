import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { api } from '@/lib/api'

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    Area,
    AreaChart
} from 'recharts'
import {
    TrendingUp,
    TrendingDown,
    Target,
    Calendar,
    Activity,

    Clock,
    Dumbbell,
    Zap
} from 'lucide-react'

interface WorkoutHistory {
    id: string
    startedAt: string
    durationSec: number | null
    totalSets: number
    templateName?: string | null
    finishedAt?: string | null
}

interface Exercise {
    id: string
    name: string
    muscleGroup?: string
}

type TimeRange = '7d' | '30d' | '90d' | '1y'

const COLORS = ['#94a3b8', '#a1a1aa', '#d4d4d8', '#71717a', '#57534e', '#78716c', '#9ca3af', '#6b7280']

export default function AnalyticsPage() {
    const [activeTab, setActiveTab] = useState('overview')
    const [timeRange, setTimeRange] = useState<TimeRange>('30d')
    const [histories, setHistories] = useState<WorkoutHistory[]>([])
    const [exercises, setExercises] = useState<Exercise[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
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

    // Calculate analytics data based on selected time range
    const analyticsData = useMemo(() => {
        if (histories.length === 0) return null

        const now = new Date()
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365
        const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000))

        const filteredHistories = histories.filter(h =>
            new Date(h.startedAt) >= startDate
        )

        // Basic metrics
        const totalSessions = filteredHistories.length
        const totalDuration = filteredHistories.reduce((sum, h) => sum + (h.durationSec || 0), 0)
        const totalSets = filteredHistories.reduce((sum, h) => sum + (h.totalSets || 0), 0)
        const avgDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions / 60) : 0

        // Weekly frequency data
        const weeklyData = []
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now)
            date.setDate(date.getDate() - i)
            const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' })
            const sessionsOnDay = filteredHistories.filter(h =>
                new Date(h.startedAt).toDateString() === date.toDateString()
            ).length
            weeklyData.push({ day: dayName, sessions: sessionsOnDay })
        }

        // Volume trends (last 12 weeks/months)
        const periodData = []
        const periodDays = timeRange === '7d' ? 1 : timeRange === '30d' ? 7 : timeRange === '90d' ? 30 : 30
        const periods = timeRange === '7d' ? 7 : 12

        for (let i = periods - 1; i >= 0; i--) {
            const periodStart = new Date(now)
            periodStart.setDate(periodStart.getDate() - (i + 1) * periodDays)
            const periodEnd = new Date(now)
            periodEnd.setDate(periodEnd.getDate() - i * periodDays)

            const periodSessions = filteredHistories.filter(h => {
                const date = new Date(h.startedAt)
                return date >= periodStart && date < periodEnd
            })

            const periodVolume = periodSessions.reduce((sum, h) => sum + (h.totalSets || 0), 0)
            const periodDuration = periodSessions.reduce((sum, h) => sum + (h.durationSec || 0), 0)

            const label = timeRange === '7d'
                ? periodEnd.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })
                : timeRange === '30d'
                    ? `Sem ${periods - i}`
                    : periodEnd.toLocaleDateString('pt-BR', { month: 'short' })

            periodData.push({
                period: label,
                volume: periodVolume,
                duration: Math.round(periodDuration / 60),
                sessions: periodSessions.length
            })
        }

        // Muscle group distribution
        const muscleGroups = exercises.reduce((acc, ex) => {
            acc[ex.muscleGroup || 'Outros'] = (acc[ex.muscleGroup || 'Outros'] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        const muscleData = Object.entries(muscleGroups).map(([name, count]) => ({
            name,
            value: count,
            percentage: Math.round((count / exercises.length) * 100)
        }))

        // Recent sessions
        const recentSessions = filteredHistories
            .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
            .slice(0, 5)

        // Calculate trends
        const currentPeriodVolume = periodData[periodData.length - 1]?.volume || 0
        const previousPeriodVolume = periodData[periodData.length - 2]?.volume || 0
        const volumeTrend = previousPeriodVolume > 0
            ? ((currentPeriodVolume - previousPeriodVolume) / previousPeriodVolume) * 100
            : 0

        return {
            totalSessions,
            totalDuration,
            totalSets,
            avgDuration,
            weeklyData,
            periodData,
            muscleData,
            recentSessions,
            volumeTrend,
            avgSessionsPerPeriod: periods > 0 ? Math.round(totalSessions / periods * 10) / 10 : 0
        }
    }, [histories, exercises, timeRange])

    if (loading) {
        return (
            <div className="space-y-6">
                <Card className="surface">
                    <CardContent className="p-4">Carregando analytics...</CardContent>
                </Card>
            </div>
        )
    }

    if (!analyticsData) {
        return (
            <div className="space-y-6">
                <Card className="surface">
                    <CardContent className="p-4">Nenhum dado disponível</CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header with time range selector */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Analytics</h1>
                    <p className="text-muted-foreground">Acompanhe seu progresso e performance</p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
                        <SelectTrigger className="w-32">
                            <Calendar className="h-4 w-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">7 dias</SelectItem>
                            <SelectItem value="30d">30 dias</SelectItem>
                            <SelectItem value="90d">90 dias</SelectItem>
                            <SelectItem value="1y">1 ano</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="surface">
                    <CardContent className="p-4 space-y-1">
                        <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">Treinos</div>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-semibold">{analyticsData.totalSessions}</div>
                        <div className="text-xs text-muted-foreground">
                            {analyticsData.avgSessionsPerPeriod} por período
                        </div>
                    </CardContent>
                </Card>

                <Card className="surface">
                    <CardContent className="p-4 space-y-1">
                        <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">Volume Total</div>
                            <Dumbbell className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-semibold">{analyticsData.totalSets}</div>
                        <div className="flex items-center gap-1">
                            {analyticsData.volumeTrend >= 0 ? (
                                <TrendingUp className="h-3 w-3 text-green-500" />
                            ) : (
                                <TrendingDown className="h-3 w-3 text-red-500" />
                            )}
                            <span className={`text-xs ${analyticsData.volumeTrend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {Math.abs(analyticsData.volumeTrend).toFixed(1)}%
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="surface">
                    <CardContent className="p-4 space-y-1">
                        <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">Tempo Total</div>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-semibold">
                            {Math.floor(analyticsData.totalDuration / 3600)}h {Math.floor((analyticsData.totalDuration % 3600) / 60)}m
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {analyticsData.avgDuration}min por treino
                        </div>
                    </CardContent>
                </Card>

                <Card className="surface">
                    <CardContent className="p-4 space-y-1">
                        <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">Exercícios</div>
                            <Zap className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-semibold">{exercises.length}</div>
                        <div className="text-xs text-muted-foreground">
                            {analyticsData.muscleData.length} grupos musculares
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Analytics Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                    <TabsTrigger value="progress">Progresso</TabsTrigger>
                    <TabsTrigger value="habits">Hábitos</TabsTrigger>
                    <TabsTrigger value="analysis">Análise</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Weekly Frequency */}
                        <Card className="surface">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5" />
                                    Frequência Semanal
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analyticsData.weeklyData}>
                                            <XAxis dataKey="day" tickLine={false} axisLine={false} />
                                            <YAxis allowDecimals={false} hide />
                                            <Tooltip />
                                            <Bar dataKey="sessions" fill="#71717a" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Muscle Group Distribution */}
                        <Card className="surface">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="h-5 w-5" />
                                    Grupos Musculares
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={analyticsData.muscleData}
                                                dataKey="value"
                                                nameKey="name"
                                                innerRadius={40}
                                                outerRadius={80}
                                                paddingAngle={2}
                                            >
                                                {analyticsData.muscleData.map((_, idx) => (
                                                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Sessions */}
                    <Card className="surface">
                        <CardHeader>
                            <CardTitle>Treinos Recentes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {analyticsData.recentSessions.map((session) => (
                                    <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                        <div>
                                            <div className="font-medium">{session.templateName || 'Treino'}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {new Date(session.startedAt).toLocaleDateString('pt-BR')}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-medium">
                                                {session.totalSets} séries
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {session.durationSec ? `${Math.round(session.durationSec / 60)}min` : '--'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {analyticsData.recentSessions.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        Nenhum treino recente encontrado
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Progress Tab */}
                <TabsContent value="progress" className="space-y-6">
                    <Card className="surface">
                        <CardHeader>
                            <CardTitle>Evolução do Volume</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={analyticsData.periodData}>
                                        <XAxis dataKey="period" tickLine={false} axisLine={false} />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip />
                                        <Area
                                            type="monotone"
                                            dataKey="volume"
                                            stroke="#71717a"
                                            fill="#71717a"
                                            fillOpacity={0.2}
                                            strokeWidth={2}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="surface">
                        <CardHeader>
                            <CardTitle>Frequência de Treino</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={analyticsData.periodData}>
                                        <XAxis dataKey="period" tickLine={false} axisLine={false} />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip />
                                        <Line
                                            type="monotone"
                                            dataKey="sessions"
                                            stroke="#94a3b8"
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Habits Tab */}
                <TabsContent value="habits" className="space-y-6">
                    <Card className="surface">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Heatmap de Hábitos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-muted-foreground">
                                        Visualização dos últimos {timeRange === '7d' ? '7 dias' : timeRange === '30d' ? '30 dias' : timeRange === '90d' ? '90 dias' : '365 dias'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 bg-muted rounded-sm"></div>
                                            <span className="text-xs text-muted-foreground">Sem treino</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 bg-zinc-500/50 rounded-sm"></div>
                                            <span className="text-xs text-muted-foreground">1 treino</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 bg-zinc-400/60 rounded-sm"></div>
                                            <span className="text-xs text-muted-foreground">2+ treinos</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Simple heatmap grid - in a real implementation you'd want a proper calendar heatmap */}
                                <div className="grid grid-cols-7 gap-1">
                                    {Array.from({ length: timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365 }, (_, i) => {
                                        const date = new Date()
                                        date.setDate(date.getDate() - i)
                                        const sessionsOnDay = histories.filter(h =>
                                            new Date(h.startedAt).toDateString() === date.toDateString()
                                        ).length
                                        const color = sessionsOnDay === 0
                                            ? 'bg-muted/40'
                                            : sessionsOnDay === 1
                                                ? 'bg-zinc-500/50'
                                                : 'bg-zinc-400/60'

                                        return (
                                            <div
                                                key={i}
                                                className={`h-4 rounded ${color}`}
                                                title={`${date.toLocaleDateString('pt-BR')}: ${sessionsOnDay} treino(s)`}
                                            />
                                        )
                                    }).reverse()}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Analysis Tab */}
                <TabsContent value="analysis" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="surface">
                            <CardHeader>
                                <CardTitle>Distribuição por Dia</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, idx) => {
                                        const daySessions = histories.filter(h => {
                                            const date = new Date(h.startedAt)
                                            return date.getDay() === idx
                                        }).length
                                        const percentage = histories.length > 0 ? Math.round((daySessions / histories.length) * 100) : 0

                                        return (
                                            <div key={day} className="flex items-center justify-between">
                                                <span className="text-sm">{day}</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 bg-muted rounded-full h-2">
                                                        <div
                                                            className="bg-primary h-2 rounded-full"
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-muted-foreground w-8">{percentage}%</span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="surface">
                            <CardHeader>
                                <CardTitle>Resumo de Performance</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Taxa de consistência</span>
                                        <Badge variant="secondary">
                                            {timeRange === '7d' ? '7' : timeRange === '30d' ? '30' : timeRange === '90d' ? '90' : '365'} dias
                                        </Badge>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Dias com treino</span>
                                            <span>{analyticsData.totalSessions} dias</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Dias sem treino</span>
                                            <span>{(timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365) - analyticsData.totalSessions} dias</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-medium">
                                            <span>Consistência</span>
                                            <span>
                                                {Math.round((analyticsData.totalSessions / (timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365)) * 100)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
