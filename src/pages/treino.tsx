import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowRight, Plus, Search } from 'lucide-react'
import { fetchWorkoutTemplates } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/skeletons'

export default function TreinoPage() {
    const { session } = useAuth()
    const [query, setQuery] = useState('')

    const {
        data: templates,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['workout-templates', session?.userId],
        queryFn: () => fetchWorkoutTemplates(session?.userId || ''),
        enabled: !!session?.userId,
    })

    const filtered = useMemo(() => {
        if (!templates) return []
        return templates.filter((t) =>
            t.name.toLowerCase().includes(query.toLowerCase())
        )
    }, [templates, query])

    if (isLoading) return <Skeleton />
    if (isError || !templates)
        return (
            <div className="p-4 text-center">
                Ocorreu um erro ao carregar seus treinos.
            </div>
        )

    const nextWorkout = templates[0]

    return (
        <div className="container mx-auto p-4 md:p-6 space-y-8">
            {/* Hero: Próximo treino */}
            {nextWorkout ? (
                <div className="relative overflow-hidden rounded-xl border border-stone-700 border-primary/20 bg-card p-6 md:p-8">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 -z-10"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
                        <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-primary/10 blur-3xl"></div>
                    </div>
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-primary">
                            Seu próximo treino
                        </p>
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                            {nextWorkout.name}
                        </h2>
                        <p className="max-w-prose text-muted-foreground">
                            {nextWorkout.exercises.length} exercícios planejados.
                            Vamos lá!
                        </p>
                        <div className="pt-4">
                            <Link to={`/session/${nextWorkout.id}`}>
                                <Button size="lg" className="group">
                                    Iniciar Treino
                                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Lista de Templates */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <h3 className="text-2xl font-bold tracking-tight">
                        Todos os seus treinos
                    </h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Buscar treino..."
                            className="pl-9 w-full md:w-64"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="text-center bg-card border border-stone-700 border-dashed rounded-lg p-12">
                        <h4 className="text-lg font-medium">
                            Nenhum treino encontrado
                        </h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {templates.length === 0
                                ? 'Você ainda não criou nenhum treino.'
                                : `Nenhum resultado para "${query}".`}
                        </p>
                        <div className="mt-6">
                            <Link to="/templates/editor/new">
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Criar novo treino
                                </Button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map((template) => (
                            <Link
                                to={`/session/${template.id}`}
                                key={template.id}
                                className="group"
                            >
                                <div className="h-full rounded-lg border border-stone-700 border-stone-600 bg-card p-5 transition-all hover:border-primary/60 hover:shadow-lg">
                                    <h4 className="font-bold text-lg text-foreground">
                                        {template.name}
                                    </h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {template.exercises.length} exercícios
                                    </p>
                                    <div className="mt-4 text-sm font-medium text-primary flex items-center">
                                        Começar agora
                                        <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-1" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
