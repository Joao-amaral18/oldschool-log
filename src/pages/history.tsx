import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { formatSeconds } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { HistorySkeleton } from '@/components/skeletons'

export default function HistoryPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState<Array<{ id: string; templateName: string | null; startedAt: string; finishedAt: string | null; durationSec: number | null; totalSets: number }>>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      setLoading(true)
      const data = await api.listHistories()
      setItems(data)
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao carregar histórico')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!session) {
      navigate('/login')
      return
    }
    load()
  }, [session])

  if (loading) {
    return <HistorySkeleton />
  }

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Histórico</h1>
      <div className="grid gap-3">
        {items.length === 0 && (
          <div className="text-sm text-[--color-muted-foreground]">Nenhum treino registrado ainda.</div>
        )}
        {items.map((h) => (
          <Card key={h.id} className="surface">
            <CardContent className="flex items-center justify-between">
              <div>
                <div className="font-medium">{h.templateName || 'Treino'}</div>
                <div className="text-xs text-muted-foreground">
                  Início: {new Date(h.startedAt).toLocaleString()} · Duração: {h.durationSec ? formatSeconds(h.durationSec) : '-'}
                </div>
              </div>
              <div className="text-sm">{h.totalSets} sets</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}


