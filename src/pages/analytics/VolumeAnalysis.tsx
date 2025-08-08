import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts'

export default function VolumeAnalysisPage() {
    const [bars, setBars] = useState<Array<{ label: string; value: number }>>([])
    const [pie, setPie] = useState<Array<{ name: string; value: number }>>([])

    useEffect(() => {
        const load = async () => {
            try {
                const histories = await api.listHistories()
                // Placeholder aggregation: por mês, usando totalSets como proxy
                const byMonth: Record<string, number> = {}
                for (const h of histories) {
                    const d = new Date(h.startedAt)
                    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                    byMonth[key] = (byMonth[key] || 0) + (h.totalSets || 0)
                }
                const arr = Object.entries(byMonth).slice(-6).map(([label, value]) => ({ label, value }))
                setBars(arr)
                // Pie fake
                setPie([
                    { name: 'Peito', value: Math.round((arr.at(-1)?.value || 0) * 0.4) },
                    { name: 'Pernas', value: Math.round((arr.at(-1)?.value || 0) * 0.3) },
                    { name: 'Costas', value: Math.round((arr.at(-1)?.value || 0) * 0.3) },
                ])
            } catch (e: any) {
                toast.error(e?.message || 'Erro ao carregar análise')
            }
        }
        load()
    }, [])

    return (
        <div className="space-y-6">
            <Card className="surface">
                <CardContent className="p-4">
                    <div className="font-medium mb-2">Volume agregado por mês</div>
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={bars}>
                                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#71717a" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card className="surface">
                <CardContent className="p-4">
                    <div className="font-medium mb-2">Distribuição por grupo muscular</div>
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pie} dataKey="value" nameKey="name" innerRadius={60} outerRadius={80} paddingAngle={2}>
                                    {pie.map((_, idx) => (
                                        <Cell key={idx} fill={["#94a3b8", "#a1a1aa", "#d4d4d8"][idx % 3]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}


