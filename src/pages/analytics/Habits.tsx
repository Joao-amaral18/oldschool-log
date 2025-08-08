import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { api } from '@/lib/api'

export default function HabitsPage() {
    const [matrix, setMatrix] = useState<Record<string, number>>({})

    useEffect(() => {
        const load = async () => {
            try {
                const histories = await api.listHistories()
                const map: Record<string, number> = {}
                for (const h of histories) {
                    const d = new Date(h.startedAt)
                    const key = d.toISOString().slice(0, 10)
                    map[key] = (map[key] || 0) + 1
                }
                setMatrix(map)
            } catch (e: any) {
                toast.error(e?.message || 'Erro ao carregar hábitos')
            }
        }
        load()
    }, [])

    const days = useMemo(() => {
        const res: string[] = []
        const now = new Date()
        for (let i = 0; i < 180; i++) {
            const d = new Date(now)
            d.setDate(now.getDate() - i)
            res.push(d.toISOString().slice(0, 10))
        }
        return res.reverse()
    }, [])

    return (
        <div className="space-y-6">
            <Card className="surface">
                <CardContent className="p-4">
                    <div className="font-medium mb-3">Heatmap (últimos 6 meses)</div>
                    <div className="grid grid-cols-30 gap-1" style={{ gridTemplateColumns: 'repeat(30, minmax(0, 1fr))' }}>
                        {days.map((d) => {
                            const v = matrix[d] || 0
                            const color = v === 0 ? 'bg-muted/40' : v < 2 ? 'bg-zinc-500/50' : v < 3 ? 'bg-zinc-400/60' : 'bg-zinc-300/70'
                            return <div key={d} className={`h-4 rounded ${color}`} title={`${d}: ${v} treino(s)`} />
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}


