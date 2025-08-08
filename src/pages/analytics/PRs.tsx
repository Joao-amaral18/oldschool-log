import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { api } from '@/lib/api'
import { toast } from 'sonner'

type PRItem = {
    exercise: string
    type: 'load' | 'reps'
    value: number
    date: string
}

export default function PRsPage() {
    const [items, setItems] = useState<PRItem[]>([])

    useEffect(() => {
        const load = async () => {
            try {
                // Placeholder: gera PRs falsos a partir do histórico
                const hist = await api.listHistories()
                const mock: PRItem[] = hist.slice(0, 6).map((h, i) => ({
                    exercise: ['Supino', 'Agachamento', 'Remada'][i % 3],
                    type: i % 2 === 0 ? 'load' : 'reps',
                    value: 50 + i * 5,
                    date: new Date(h.startedAt).toLocaleDateString('pt-BR')
                }))
                setItems(mock)
            } catch (e: any) {
                toast.error(e?.message || 'Erro ao carregar PRs')
            }
        }
        load()
    }, [])

    return (
        <div className="space-y-4">
            {items.map((pr, idx) => (
                <Card key={idx} className="surface">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <div className="font-medium">{pr.exercise}</div>
                            <div className="text-xs text-muted-foreground">{pr.type === 'load' ? 'Recorde de Carga' : 'Recorde de Reps'}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xl font-semibold">{pr.value}{pr.type === 'load' ? ' kg' : ' reps'}</div>
                            <div className="text-xs text-muted-foreground">{pr.date}</div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}


