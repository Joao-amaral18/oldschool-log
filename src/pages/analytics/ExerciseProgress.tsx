import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { Exercise } from '@/types'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'

type Metric = 'e1rm' | 'maxLoad' | 'volume' | 'maxReps'

export default function ExerciseProgressPage() {
    const [exercises, setExercises] = useState<Exercise[]>([])
    const [exerciseId, setExerciseId] = useState<string>('')
    const [metric, setMetric] = useState<Metric>('e1rm')
    const [range, setRange] = useState<'3m' | '6m' | '1y'>('3m')
    const [data, setData] = useState<Array<{ date: string; value: number }>>([])

    useEffect(() => {
        const load = async () => {
            try {
                const list = await api.listExercises()
                setExercises(list)
                if (list.length > 0) setExerciseId(list[0].id)
            } catch (e: any) {
                toast.error(e?.message || 'Erro ao carregar exercícios')
            }
        }
        load()
    }, [])

    useEffect(() => {
        const load = async () => {
            if (!exerciseId) return
            try {
                // Placeholder: gera dados falsos para visualização
                const now = new Date()
                const points: Array<{ date: string; value: number }> = []
                for (let i = 11; i >= 0; i--) {
                    const d = new Date(now)
                    d.setMonth(now.getMonth() - i)
                    points.push({ date: d.toLocaleDateString('pt-BR', { month: 'short' }), value: Math.round(50 + Math.random() * 50) })
                }
                setData(points)
            } catch (e: any) {
                toast.error(e?.message || 'Erro ao carregar dados')
            }
        }
        load()
    }, [exerciseId, metric, range])

    return (
        <div className="space-y-6">
            <Card className="surface">
                <CardContent className="p-4 grid md:grid-cols-3 gap-3">
                    <div>
                        <Label className="text-xs text-muted-foreground">Exercício</Label>
                        <select className="mt-1 w-full rounded-md border border-stone-700 px-3 py-2 text-sm" value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
                            {exercises.map((ex) => (
                                <option value={ex.id} key={ex.id}>{ex.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground">Métrica</Label>
                        <select className="mt-1 w-full rounded-md border border-stone-700 px-3 py-2 text-sm" value={metric} onChange={(e) => setMetric(e.target.value as Metric)}>
                            <option value="e1rm">1RM Estimado</option>
                            <option value="maxLoad">Maior Carga</option>
                            <option value="volume">Volume por Sessão</option>
                            <option value="maxReps">Máximo de Reps</option>
                        </select>
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground">Período</Label>
                        <select className="mt-1 w-full rounded-md border border-stone-700 px-3 py-2 text-sm" value={range} onChange={(e) => setRange(e.target.value as any)}>
                            <option value="3m">3 meses</option>
                            <option value="6m">6 meses</option>
                            <option value="1y">1 ano</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            <Card className="surface">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">Evolução</div>
                    </div>
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Line type="monotone" dataKey="value" stroke="#94a3b8" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}


