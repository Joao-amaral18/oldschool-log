import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

type WeeklySummary = {
    sessionsThisWeek: number
    sessionsGoal?: number
    totalVolumeWeek: number
    totalDurationWeek: number // seconds
    prsThisMonth: number
    frequency7d: Array<{ day: string; trained: number }>
    muscleSplitWeek: Array<{ name: string; value: number }>
    lastWorkout?: { id: string; date: string; name: string | null }
}

const COLORS = ['#94a3b8', '#a1a1aa', '#d4d4d8', '#71717a', '#57534e', '#78716c']

export default function PerformanceDashboardPage() {
    const navigate = useNavigate()
    const [summary, setSummary] = useState<WeeklySummary | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true)
                // Aggregate client-side from histories as a first iteration
                const histories = await api.listHistories()
                const now = new Date()
                const startOfWeek = new Date(now)
                startOfWeek.setDate(now.getDate() - 6)
                startOfWeek.setHours(0, 0, 0, 0)

                const inWeek = histories.filter((h) => new Date(h.startedAt) >= startOfWeek)
                const sessionsThisWeek = inWeek.length
                const totalDurationWeek = inWeek.reduce((s, h) => s + (h.durationSec || 0), 0)

                // Frequency 7d
                const freq: Array<{ day: string; trained: number }> = []
                for (let i = 6; i >= 0; i--) {
                    const d = new Date(now)
                    d.setDate(now.getDate() - i)
                    const key = d.toLocaleDateString('pt-BR', { weekday: 'short' })
                    const count = histories.some((h) => new Date(h.startedAt).toDateString() === d.toDateString()) ? 1 : 0
                    freq.push({ day: key, trained: count })
                }

                // Last workout
                const last = histories[0]

                // Placeholder volume and muscle split (requires per-exercise detail to be precise)
                // For now, use totalSets as proxy for volume
                const totalVolumeWeek = inWeek.reduce((s, h) => s + (h.totalSets || 0), 0)
                const muscleSplitWeek = [
                    { name: 'Peito', value: Math.round(totalVolumeWeek * 0.4) },
                    { name: 'Pernas', value: Math.round(totalVolumeWeek * 0.3) },
                    { name: 'Costas', value: Math.round(totalVolumeWeek * 0.3) },
                ]

                const prsThisMonth = 0 // requires PR tracking; placeholder for now

                setSummary({
                    sessionsThisWeek,
                    sessionsGoal: 4,
                    totalVolumeWeek,
                    totalDurationWeek,
                    prsThisMonth,
                    frequency7d: freq,
                    muscleSplitWeek,
                    lastWorkout: last ? { id: last.id, date: new Date(last.startedAt).toLocaleDateString('pt-BR'), name: last.templateName } : undefined,
                })
            } catch (e: any) {
                toast.error(e?.message || 'Erro ao carregar dashboard')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    if (loading || !summary) {
        return (
            <div className="space-y-4">
                <Card className="surface"><CardContent className="p-4">Carregando…</CardContent></Card>
            </div>
        )
    }

    const durationH = Math.floor(summary.totalDurationWeek / 3600)
    const durationM = Math.floor((summary.totalDurationWeek % 3600) / 60)

    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="surface"><CardContent className="p-4 space-y-1"><div className="text-xs text-muted-foreground">Treinos (semana)</div><div className="text-2xl font-semibold">{summary.sessionsThisWeek}/{summary.sessionsGoal}</div></CardContent></Card>
                <Card className="surface"><CardContent className="p-4 space-y-1"><div className="text-xs text-muted-foreground">Volume Total</div><div className="text-2xl font-semibold">{summary.totalVolumeWeek}</div></CardContent></Card>
                <Card className="surface"><CardContent className="p-4 space-y-1"><div className="text-xs text-muted-foreground">Tempo Treinado</div><div className="text-2xl font-semibold">{durationH}h {durationM}m</div></CardContent></Card>
                <Card className="surface"><CardContent className="p-4 space-y-1"><div className="text-xs text-muted-foreground">PRs (mês)</div><div className="text-2xl font-semibold">{summary.prsThisMonth}</div></CardContent></Card>
            </div>

            {/* Frequência semanal */}
            <Card className="surface">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">Frequência (últimos 7 dias)</div>
                    </div>
                    <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={summary.frequency7d}>
                                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                                <YAxis allowDecimals={false} hide />
                                <Tooltip />
                                <Bar dataKey="trained" fill="#71717a" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Grupos musculares da semana */}
            <Card className="surface">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">Grupos musculares (semana)</div>
                    </div>
                    <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={summary.muscleSplitWeek} dataKey="value" nameKey="name" innerRadius={60} outerRadius={80} paddingAngle={2}>
                                    {summary.muscleSplitWeek.map((_, idx) => (
                                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Atalho rápido */}
            {summary.lastWorkout && (
                <Card className="surface">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <div className="text-sm text-muted-foreground">Seu último treino</div>
                            <div className="font-medium">{summary.lastWorkout.name || 'Treino'}</div>
                            <div className="text-xs text-muted-foreground">{summary.lastWorkout.date}</div>
                        </div>
                        <Button onClick={() => navigate(`/history`)} variant="outline">Ver histórico</Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}


