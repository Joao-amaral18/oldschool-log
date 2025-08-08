import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type { WorkoutTemplate } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Pencil, Copy, Trash2, Search, Layers, Dumbbell, Clock } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { TemplateListSkeleton } from '@/components/skeletons'
import { Input } from '@/components/ui/input'
import { motion } from 'framer-motion'
import { useModal } from '@/hooks/useModal'

export default function TemplatesPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'recent' | 'name'>('recent')
  const modal = useModal()

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
      const baseName = 'Novo Template'
      const existingNames = new Set(templates.map((t) => t.name))

      // Find next available name: "Novo Template", "Novo Template (2)", "Novo Template (3)", ...
      let uniqueName = baseName
      if (existingNames.has(baseName)) {
        let n = 2
        while (existingNames.has(`${baseName} (${n})`)) n++
        uniqueName = `${baseName} (${n})`
      }

      const t = await api.createTemplate(uniqueName)
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
      const t = templates.find((x) => x.id === id)
      const confirmed = await modal.confirm({
        title: 'Excluir template',
        description: `Tem certeza que deseja excluir "${t?.name ?? 'Template'}"?`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        variant: 'destructive',
      })
      if (!confirmed) return
      await api.deleteTemplate(id)
      setTemplates((prev) => prev.filter((t) => t.id !== id))
      toast.success('Template excluído')
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao excluir template')
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = q ? templates.filter((t) => t.name.toLowerCase().includes(q)) : templates.slice()
    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [templates, query, sort])

  if (loading) {
    return <TemplateListSkeleton />
  }

  return (
    <div className="space-y-4">
      <div className="surface relative overflow-hidden p-5">
        <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-gradient-to-br from-zinc-600/20 to-zinc-300/10 blur-3xl" />
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Templates</h1>
            <p className="text-muted-foreground">Crie, edite e gerencie seus templates de treino</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar template..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
            </div>
            <select className="rounded-md border border-stone-800 px-3 py-2 text-sm" value={sort} onChange={(e) => setSort(e.target.value as any)}>
              <option value="recent">Mais recentes</option>
              <option value="name">A–Z</option>
            </select>
            <Button className="glow" onClick={createNew}>Novo Template</Button>
          </div>
        </div>
      </div>
      <div className="grid gap-3">
        {filtered.length === 0 && (
          <div className="surface p-8 text-center">
            <div className="mb-3 text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="mx-auto h-10 w-10 opacity-60">
                <path d="M6 3h12a1 1 0 0 1 1 1v5h-2V5H7v14h10v-4h2v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
                <path d="M14 11h-3v2h3v3l5-4-5-4v3z" />
              </svg>
              {templates.length === 0 ? (
                <>
                  <div className="font-medium">Você ainda não criou nenhum template.</div>
                  <div className="text-sm">Crie seu primeiro template para agilizar o registro dos seus treinos!</div>
                </>
              ) : (
                <div className="font-medium">Nenhum resultado para "{query}"</div>
              )}
            </div>
            <Button className="glow" onClick={createNew}>Novo Template</Button>
          </div>
        )}
        {filtered.map((t) => {
          const totalSets = t.exercises.reduce((s, e) => s + (e.sets || 0), 0)
          return (
            <motion.div key={t.id} whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
              <Card className="surface transition-colors duration-200 hover:border-zinc-500 hover:bg-accent/60 overflow-hidden">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 cursor-pointer" onClick={() => navigate(`/templates/${t.id}`)}>
                      <div className="font-medium flex items-center gap-2">
                        <Layers className="h-4 w-4 text-muted-foreground" />
                        {t.name}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1 rounded-md border border-stone-800 px-2 py-0.5"><Dumbbell className="h-3.5 w-3.5" /> {t.exercises.length} exer.</span>
                        <span className="inline-flex items-center gap-1 rounded-md border border-stone-800 px-2 py-0.5"><Clock className="h-3.5 w-3.5" /> {totalSets} séries</span>
                      </div>
                    </div>
                    <div className="bg-primary/10 rounded-full p-2">
                      <Dumbbell className="h-5 w-5 text-primary" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    {t.exercises.slice(0, 3).map((ex) => (
                      <div key={ex.id} className="text-xs text-muted-foreground">• {ex.sets} séries × {ex.reps} reps</div>
                    ))}
                    {t.exercises.length > 3 && (
                      <div className="text-xs text-muted-foreground">+ {t.exercises.length - 3} mais...</div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link to={`/session/${t.id}`} className="flex-1">
                      <Button className="w-full glow">
                        <Dumbbell className="mr-2 h-4 w-4" />
                        Iniciar
                      </Button>
                    </Link>
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
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}


