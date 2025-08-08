import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type { WorkoutTemplate } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Pencil, Copy, Trash2, Search, Layers, Dumbbell, Clock, Plus } from 'lucide-react'
import { api, fetchWorkoutTemplates } from '@/lib/api'
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
        if (!session) return
        try {
            setLoading(true)
            const data = await fetchWorkoutTemplates(session.userId)
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

    const createNew = () => {
        navigate(`/templates/editor/new`)
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
        const confirmed = await modal.confirm({
            title: 'Confirmar exclusão',
            description: 'Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita.',
            confirmText: 'Excluir',
            cancelText: 'Cancelar',
            variant: 'destructive'
        })

        if (confirmed) {
            try {
                await api.deleteTemplate(id)
                setTemplates((prev) =>
                    prev.filter((t) => t.id !== id)
                )
                toast.success('Template excluído com sucesso')
            } catch (e: any) {
                toast.error(
                    e?.message || 'Erro ao excluir template'
                )
            }
        }
    }

    const sortedTemplates = useMemo(() => {
        const filtered = templates.filter((t) =>
            t.name.toLowerCase().includes(query.toLowerCase())
        )
        if (sort === 'name') {
            return filtered.sort((a, b) => a.name.localeCompare(b.name))
        }
        // "recent" is the default, which is already sorted by created_at desc
        return filtered
    }, [templates, query, sort])

    if (loading) {
        return <TemplateListSkeleton />
    }

    return (
        <div className="container mx-auto p-4 md:p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight">
                    Meus Templates
                </h1>
                <Button onClick={createNew} className="w-full md:w-auto">
                    <Plus className="mr-2 h-4 w-4" /> Criar Novo Template
                </Button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar por nome..."
                        className="pl-9"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <div>
                    <select
                        value={sort}
                        onChange={(e) =>
                            setSort(e.target.value as 'recent' | 'name')
                        }
                        className="h-10 w-full md:w-auto rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                        <option value="recent">Mais Recentes</option>
                        <option value="name">Ordem Alfabética</option>
                    </select>
                </div>
            </div>

            {sortedTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedTemplates.map((template, idx) => (
                        <motion.div
                            key={template.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.05 }}
                        >
                            <Card className="h-full flex flex-col group transition-all hover:border-primary/60 hover:shadow-lg">
                                <CardContent className="p-5 flex-grow">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-lg text-foreground pr-2">
                                            {template.name}
                                        </h3>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() =>
                                                    duplicateTemplate(
                                                        template.id
                                                    )
                                                }
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                onClick={() =>
                                                    deleteTemplate(template.id)
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Dumbbell className="w-4 h-4" />
                                            <span>
                                                {template.exercises.length}{' '}
                                                exercícios
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Layers className="w-4 h-4" />
                                            <span>
                                                {template.exercises.reduce(
                                                    (acc, ex) => acc + ex.sets,
                                                    0
                                                )}{' '}
                                                séries totais
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            <span>
                                                Criado em{' '}
                                                {new Date(
                                                    template.created_at
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                                <div className="border-t p-3">
                                    <Link
                                        to={`/templates/editor/${template.id}`}
                                        className="w-full"
                                    >
                                        <Button
                                            variant="ghost"
                                            className="w-full"
                                        >
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Editar Template
                                        </Button>
                                    </Link>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center bg-card border border-dashed rounded-lg p-12">
                    <h4 className="text-lg font-medium">
                        Nenhum template encontrado
                    </h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {query
                            ? `Nenhum resultado para "${query}".`
                            : 'Crie seu primeiro template para começar!'}
                    </p>
                </div>
            )}
        </div>
    )
}
