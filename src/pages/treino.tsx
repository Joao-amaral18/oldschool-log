import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type { WorkoutTemplate } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Play, Settings, Plus } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { TreinoPageSkeleton } from '@/components/skeletons'

export default function TreinoPage() {
    const { session } = useAuth()
    const navigate = useNavigate()
    const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
    const [loading, setLoading] = useState(true)

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

    if (loading) {
        return <TreinoPageSkeleton />
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold tracking-tight">Treino</h1>
                <p className="text-muted-foreground mt-2">Escolha um template para iniciar sua sessão</p>
            </div>

            {templates.length === 0 ? (
                <div className="surface p-8 text-center">
                    <div className="text-muted-foreground mb-4">
                        <Plus className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Você ainda não tem templates de treino</p>
                        <p className="text-sm mt-1">Crie seu primeiro template para começar</p>
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
                    {templates.map((template) => (
                        <Card key={template.id} className="surface overflow-hidden transition-all duration-200 hover:border-zinc-500 hover:bg-accent/60">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-1">{template.name}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {template.exercises.length} exercício{template.exercises.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <div className="bg-primary/10 rounded-full p-2">
                                        <Play className="h-5 w-5 text-primary" />
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
                                            <Play className="mr-2 h-4 w-4" />
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
                    ))}
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
