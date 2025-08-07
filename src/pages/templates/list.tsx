import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type { WorkoutTemplate } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Pencil, Copy, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export default function TemplatesPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const data = await api.listTemplates()
      setTemplates(data)
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao carregar templates')
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

  const createNew = async () => {
    try {
      const t = await api.createTemplate('Novo Template')
      navigate(`/templates/${t.id}`)
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao criar template')
    }
  }

  const duplicateTemplate = async (id: string) => {
    try {
      const copy = await api.duplicateTemplate(id)
      if (copy) setTemplates((prev) => [copy, ...prev])
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao duplicar template')
    }
  }

  const deleteTemplate = async (id: string) => {
    try {
      await api.deleteTemplate(id)
      setTemplates((prev) => prev.filter((t) => t.id !== id))
      toast.success('Template excluído')
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao excluir template')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Templates</h1>
        <Button className="glow" onClick={createNew} disabled={loading}>Novo Template</Button>
      </div>
      <div className="grid gap-3">
        {templates.length === 0 && !loading && (
          <div className="surface p-8 text-center">
            <div className="mb-3 text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="mx-auto h-10 w-10 opacity-60">
                <path d="M6 3h12a1 1 0 0 1 1 1v5h-2V5H7v14h10v-4h2v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
                <path d="M14 11h-3v2h3v3l5-4-5-4v3z" />
              </svg>
              <div className="font-medium">Você ainda não criou nenhum template.</div>
              <div className="text-sm">Crie seu primeiro template para agilizar o registro dos seus treinos!</div>
            </div>
            <Button className="glow" onClick={createNew}>Novo Template</Button>
          </div>
        )}
        {templates.map((t) => (
          <Card key={t.id} className="surface transition-all duration-200 hover:border-zinc-500 hover:bg-accent/60">
            <CardContent className="flex items-center justify-between">
              <div
                className="flex-1 cursor-pointer"
                onClick={() => navigate(`/templates/${t.id}`)}
              >
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.exercises.length} exercícios</div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  title="Editar"
                  onClick={() => navigate(`/templates/${t.id}`)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" title="Duplicar" onClick={() => duplicateTemplate(t.id)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" title="Excluir" onClick={() => deleteTemplate(t.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}


