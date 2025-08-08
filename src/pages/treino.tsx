import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type { WorkoutTemplate } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Settings, Plus, Search, Dumbbell, Clock } from 'lucide-react'
import { api } from '@/lib/api'
// import { toast } from 'sonner'
import { TreinoPageSkeleton } from '@/components/skeletons'
import { Input } from '@/components/ui/input'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'

export default function TreinoPage() {
    const { session } = useAuth()
    const navigate = useNavigate()
    const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [query, setQuery] = useState('')
    const [sort, setSort] = useState<'recent' | 'name'>('recent')

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
        if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name))
        // recent already comes ordered by created_at desc from API
        return list
    }, [templates, query, sort])

    if (loading) {
        return <TreinoPageSkeleton />
    }

    return (
        <div className="space-y-6">
            {/* Hero / Controls */}
            <div className="surface relative overflow-hidden p-5">
                <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gradient-to-br from-zinc-600/20 to-zinc-300/10 blur-3xl" />
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Treino</h1>
                        <p className="text-muted-foreground">Escolha um template para iniciar sua sessão</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar template..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <select
                            className="rounded-md border border-stone-800 px-3 py-2 text-sm"
                            value={sort}
                            onChange={(e) => setSort(e.target.value as 'recent' | 'name')}
                        >
                            <option value="recent">Mais recentes</option>
                            <option value="name">A–Z</option>
                        </select>
                    </div>
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
                <div className="grid gap-4 md:grid-cols-2">
                    {filtered.map((template) => {
                        const totalSets = template.exercises.reduce((s, e) => s + (e.sets || 0), 0)
                        return (
                            <motion.div key={template.id} whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                                <Card className="surface overflow-hidden transition-colors duration-200 hover:border-zinc-500 hover:bg-accent/60">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-lg mb-1">{template.name}</h3>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span className="inline-flex items-center gap-1 rounded-md border border-stone-800 px-2 py-0.5"><Dumbbell className="h-3.5 w-3.5" /> {template.exercises.length} exer.</span>
                                                    <span className="inline-flex items-center gap-1 rounded-md border border-stone-800 px-2 py-0.5"><Clock className="h-3.5 w-3.5" /> {totalSets} séries</span>
                                                </div>
                                            </div>
                                            <div className="bg-primary/10 rounded-full p-2">
                                                <Dumbbell className="h-5 w-5 text-primary" />
                                            </div>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            {template.exercises.slice(0, 3).map((exercise) => (
                                                <div key={exercise.id} className="text-xs text-muted-foreground">
                                                    • {exercise.sets} séries × {exercise.reps} reps
                                                </div>
                                            ))}
                                            {template.exercises.length > 3 && (
                                                <div className="text-xs text-muted-foreground">
                                                    + {template.exercises.length - 3} mais...
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <Link to={`/session/${template.id}`} className="flex-1">
                                                <Button className="w-full glow">
                                                    <Dumbbell className="mr-2 h-4 w-4" />
                                                    Iniciar
                                                </Button>
                                            </Link>
                                            <Link to={`/templates/${template.id}`}>
                                                <Button variant="outline" size="icon">
                                                    <Settings className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )
                    })}
                </div>
            )}

            <div className="flex justify-center">
                <Link to="/templates">
                    <Button variant="outline">
                        <Settings className="mr-2 h-4 w-4" />
                        Gerenciar Templates
                    </Button>
                </Link>
            </div>
        </div>
    )
}
