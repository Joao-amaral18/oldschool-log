import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type { WorkoutTemplate } from '@/types'
import { Button } from '@/components/ui/button'
import { Plus, Dumbbell, Zap, Target, Pencil, List } from 'lucide-react'
import { api } from '@/lib/api'
// import { toast } from 'sonner'
import { TreinoPageSkeleton } from '@/components/skeletons'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'

export default function TreinoPage() {
    const { session } = useAuth()
    const navigate = useNavigate()
    const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [query] = useState('')

    // legacy load function removed in favor of React Query

    const { data: qTemplates, isFetching } = useQuery({
        queryKey: queryKeys.templates(),
        queryFn: api.listTemplates,
        enabled: !!session,
    })

    useEffect(() => {
        if (!session) {
            navigate('/login')
            return
        }
        if (qTemplates) setTemplates(qTemplates)
        setLoading(isFetching)
    }, [session, qTemplates, isFetching])

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        let list = q
            ? templates.filter((t) => t.name.toLowerCase().includes(q))
            : templates.slice()
        // recent already comes ordered by created_at desc from API
        return list
    }, [templates, query])

    if (loading) {
        return <TreinoPageSkeleton />
    }

    return (
        <div className="space-y-6">
            {/* Hero: Próximo treino */}
            <div className="surface relative overflow-hidden p-5">
                <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gradient-to-br from-zinc-600/20 to-zinc-300/10 blur-3xl" />
                <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">Seu próximo treino</div>
                    {templates.length > 0 ? (
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                                    {templates[0].name}
                                </h2>
                                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                    <span className="inline-flex items-center gap-1 rounded-full border border-stone-800 px-2 py-1">
                                        <Dumbbell className="h-3.5 w-3.5" /> {templates[0].exercises.length} exercícios
                                    </span>
                                    {/* Tags opcionais (exibir se existir meta no template no futuro) */}
                                    <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-stone-800 px-2 py-1">
                                        <Zap className="h-3.5 w-3.5" /> advanced
                                    </span>
                                    <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-stone-800 px-2 py-1">
                                        <Target className="h-3.5 w-3.5" /> hypertrophy
                                    </span>
                                </div>
                            </div>
                            <Link to={`/session/${templates[0].id}`}>
                                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white">
                                    Iniciar Treino
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Nenhum template</h2>
                                <div className="mt-2 text-sm text-muted-foreground">Crie um template para começar</div>
                            </div>
                            <Link to="/templates">
                                <Button className="glow">
                                    <Plus className="mr-2 h-4 w-4" /> Criar Template
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="surface p-8 text-center">
                    <div className="text-muted-foreground mb-4">
                        <Plus className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        {templates.length === 0 ? (
                            <>
                                <p>Você ainda não tem templates de treino</p>
                                <p className="text-sm mt-1">Crie seu primeiro template para começar</p>
                            </>
                        ) : (
                            <p>Nenhum resultado para "{query}"</p>
                        )}
                    </div>
                    <Link to="/templates">
                        <Button className="glow">
                            <Plus className="mr-2 h-4 w-4" />
                            Criar Template
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    <h2 className="text-lg font-semibold">Seus Templates</h2>
                    <div className="grid gap-3">
                        {filtered.map((template) => {
                            const totalSets = template.exercises.reduce((s, e) => s + (e.sets || 0), 0)
                            return (
                                <motion.div key={template.id} whileHover={{ y: -1 }}>
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/session/${template.id}`)}
                                        className="surface w-full text-left p-4 flex items-center justify-between rounded-xl border transition-colors hover:border-zinc-500 hover:bg-accent/60"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-md bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                                                <List className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <div className="font-medium">{template.name}</div>
                                                <div className="text-xs text-muted-foreground">{template.exercises.length} exercícios • {totalSets} séries</div>
                                            </div>
                                        </div>
                                        <Link to={`/templates/${template.id}`} onClick={(e) => e.stopPropagation()}>
                                            <Button variant="outline" size="icon" className="h-8 w-8">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </button>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            )}

            <div className="flex justify-center">
                <Link to="/templates" className="w-full">
                    <Button variant="outline" className="w-full">
                        Ver todos os templates
                    </Button>
                </Link>
            </div>
        </div>
    )
}
