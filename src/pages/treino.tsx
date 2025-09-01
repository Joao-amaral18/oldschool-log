import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import {
    ArrowRight,
    Plus,
    Search,
    Dumbbell,
    Clock,
    Target,
    TrendingUp,
    Zap,
    Flame,
    Heart,
    Star,
    BarChart3,
    Play,
    Settings,
    Eye
} from 'lucide-react'
import { fetchWorkoutTemplates, api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/skeletons'
import { motion } from 'framer-motion'
import { toNumber } from '@/lib/utils'
import { WorkoutPreviewModal } from '@/components/modals/WorkoutPreviewModal'

type WorkoutTemplate = {
    id: string
    name: string
    exercises: Array<{
        id: string
        exerciseId: string
        sets: string | number
        reps: string | number
        load: number
        restSec: string | number
    }>
    created_at: string
}

export default function TreinoPage() {
    const { session } = useAuth()
    const navigate = useNavigate()
    const [query, setQuery] = useState('')
    const [sortBy, setSortBy] = useState<'recent' | 'name' | 'exercises' | 'difficulty'>('recent')
    const [filterBy, setFilterBy] = useState<'all' | 'favorites'>('all')
    const [favorites, setFavorites] = useState<Set<string>>(new Set())
    const [showMotivation, setShowMotivation] = useState(true)
    const [previewWorkout, setPreviewWorkout] = useState<WorkoutTemplate | null>(null)
    const [showPreviewModal, setShowPreviewModal] = useState(false)

    const {
        data: templates,
        isLoading: templatesLoading,
        isError: templatesError,
    } = useQuery({
        queryKey: ['workout-templates', session?.userId],
        queryFn: () => fetchWorkoutTemplates(session?.userId || ''),
        enabled: !!session?.userId,
    })

    const {
        data: exercises,
        isLoading: exercisesLoading,
        isError: exercisesError,
    } = useQuery({
        queryKey: ['exercises', session?.userId],
        queryFn: () => api.listExercises(),
        enabled: !!session?.userId,
    })

    const isLoading = templatesLoading || exercisesLoading
    const isError = templatesError || exercisesError

    // Load favorites from localStorage
    useMemo(() => {
        if (session?.userId) {
            const saved = localStorage.getItem(`workout-favorites-${session.userId}`)
            if (saved) {
                setFavorites(new Set(JSON.parse(saved)))
            }
        }
    }, [session?.userId])

    const filteredAndSorted = useMemo(() => {
        if (!templates) return []

        let filtered = templates.filter((t) =>
            t.name.toLowerCase().includes(query.toLowerCase())
        )

        // Apply filters
        if (filterBy === 'favorites') {
            filtered = filtered.filter(t => favorites.has(t.id))
        }

        // Sort
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name)
                case 'exercises':
                    return b.exercises.length - a.exercises.length
                case 'difficulty':
                    // Calculate difficulty based on total volume
                    const aVolume = a.exercises.reduce((sum, ex) =>
                        sum + (toNumber(ex.sets) * toNumber(ex.reps) * ex.load), 0)
                    const bVolume = b.exercises.reduce((sum, ex) =>
                        sum + (toNumber(ex.sets) * toNumber(ex.reps) * ex.load), 0)
                    return bVolume - aVolume
                case 'recent':
                default:
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            }
        })

        return filtered
    }, [templates, query, sortBy, filterBy, favorites])

    const workoutStats = useMemo(() => {
        if (!filteredAndSorted.length) return null

        const totalWorkouts = filteredAndSorted.length
        const totalExercises = filteredAndSorted.reduce((sum, t) => sum + t.exercises.length, 0)
        const avgExercises = Math.round(totalExercises / totalWorkouts)

        const totalVolume = filteredAndSorted.reduce((sum, t) =>
            sum + t.exercises.reduce((exSum, ex) =>
                exSum + (toNumber(ex.sets) * toNumber(ex.reps) * ex.load), 0), 0)

        const avgDuration = Math.round(filteredAndSorted.reduce((sum, t) =>
            sum + t.exercises.reduce((exSum, ex) =>
                exSum + (toNumber(ex.sets) * toNumber(ex.restSec)), 0), 0) / totalWorkouts / 60)

        return {
            totalWorkouts,
            avgExercises,
            totalVolume: Math.round(totalVolume),
            avgDuration
        }
    }, [filteredAndSorted])

    const toggleFavorite = (workoutId: string) => {
        if (!session?.userId) return

        const newFavorites = new Set(favorites)
        if (newFavorites.has(workoutId)) {
            newFavorites.delete(workoutId)
        } else {
            newFavorites.add(workoutId)
        }
        setFavorites(newFavorites)
        localStorage.setItem(`workout-favorites-${session.userId}`, JSON.stringify([...newFavorites]))
    }

    const openPreview = (workout: WorkoutTemplate) => {
        setPreviewWorkout(workout)
        setShowPreviewModal(true)
    }

    const closePreview = () => {
        setShowPreviewModal(false)
        setPreviewWorkout(null)
    }

    const calculateWorkoutDifficulty = (template: WorkoutTemplate) => {
        const totalVolume = template.exercises.reduce((sum, ex) =>
            sum + (toNumber(ex.sets) * toNumber(ex.reps) * ex.load), 0)
        const avgRest = template.exercises.reduce((sum, ex) => sum + toNumber(ex.restSec), 0) / template.exercises.length

        if (totalVolume > 10000 || avgRest < 60) return 'hard'
        if (totalVolume > 5000 || avgRest < 120) return 'medium'
        return 'easy'
    }

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'hard': return 'from-red-500 to-red-600'
            case 'medium': return 'from-yellow-500 to-yellow-600'
            case 'easy': return 'from-green-500 to-green-600'
            default: return 'from-gray-500 to-gray-600'
        }
    }

    const getDifficultyIcon = (difficulty: string) => {
        switch (difficulty) {
            case 'hard': return Flame
            case 'medium': return Zap
            case 'easy': return Heart
            default: return Target
        }
    }

    if (isLoading) return <Skeleton />
    if (isError || !templates)
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
                <div className="container mx-auto p-4 md:p-6">
                    <div className="text-center py-12">
                        <div className="relative mx-auto max-w-md">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 rounded-3xl blur-3xl" />
                            <div className="relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-8 space-y-4">
                                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-2xl flex items-center justify-center">
                                    <BarChart3 className="h-8 w-8 text-red-500" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-semibold">Erro ao carregar treinos</h3>
                                    <p className="text-muted-foreground">
                                        Ocorreu um erro ao carregar seus treinos. Tente novamente.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )

    const nextWorkout = filteredAndSorted[0]
    const quickTemplates = [
        { id: 'quick-strength', name: 'Treino Rápido - Força', exercises: 3, duration: 20, color: 'from-purple-500 to-purple-600', icon: Zap },
        { id: 'quick-cardio', name: 'Treino Rápido - Cardio', exercises: 2, duration: 15, color: 'from-orange-500 to-orange-600', icon: Flame },
        { id: 'quick-fullbody', name: 'Treino Rápido - Completo', exercises: 4, duration: 25, color: 'from-blue-500 to-blue-600', icon: Dumbbell }
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            <div className="container mx-auto p-4 md:p-6 space-y-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="relative"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-3xl blur-3xl" />
                    <div className="relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 md:p-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                            <div className="space-y-2">
                                <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                                    Seus Treinos
                                </h1>
                                <p className="text-muted-foreground text-lg">
                                    Escolha seu treino e comece a jornada fitness
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button variant="outline" onClick={() => navigate('/templates')}>
                                    <Settings className="h-4 w-4 mr-2" />
                                    Gerenciar
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Hero: Próximo treino */}
                {nextWorkout ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, duration: 0.2 }}
                        className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card to-card/50 p-6 md:p-8"
                    >
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 -z-10"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
                            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-primary/10 blur-3xl"></div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Star className="h-5 w-5 text-yellow-500 fill-current" />
                                <p className="text-sm font-medium text-primary">
                                    Treino Recomendado
                                </p>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                                {nextWorkout.name}
                            </h2>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Target className="h-4 w-4" />
                                    {nextWorkout.exercises.length} exercícios
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    ~{Math.round(nextWorkout.exercises.reduce((sum, ex) => sum + (toNumber(ex.sets) * toNumber(ex.restSec)), 0) / 60)} min
                                </span>
                                <span className="flex items-center gap-1">
                                    <Dumbbell className="h-4 w-4" />
                                    Volume estimado: {nextWorkout.exercises.reduce((sum, ex) => sum + (toNumber(ex.sets) * toNumber(ex.reps) * ex.load), 0).toLocaleString()}kg
                                </span>
                            </div>
                            <div className="pt-4 flex flex-col sm:flex-row gap-3">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={() => openPreview(nextWorkout)}
                                    className="flex-1 sm:flex-none"
                                >
                                    <Eye className="w-5 h-5 mr-2" />
                                    Visualizar
                                </Button>
                                <Link to={`/session/${nextWorkout.id}`} className="flex-1">
                                    <Button size="lg" className="w-full group bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                                        <Play className="w-5 h-5 mr-2" />
                                        Iniciar Treino
                                        <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    /* Quick Start Templates */
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, duration: 0.2 }}
                        className="space-y-4"
                    >
                        <h3 className="text-xl font-semibold">Treinos Rápidos</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {quickTemplates.map((template) => {
                                const Icon = template.icon
                                return (
                                    <Card key={template.id} className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50">
                                        <CardContent className="p-4 space-y-3">
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                                                <Icon className="h-6 w-6 text-white" />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="font-semibold text-sm">{template.name}</h4>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Target className="h-3 w-3" />
                                                        {template.exercises} ex
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {template.duration} min
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    </motion.div>
                )}

                {/* Search and Filter Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.2 }}
                    className="flex flex-col md:flex-row gap-4 items-start md:items-center"
                >
                    <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Buscar treinos..."
                                className="pl-10 h-11 border-0 bg-muted/50 focus:bg-background transition-colors"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <select
                                value={filterBy}
                                onChange={(e) => setFilterBy(e.target.value as any)}
                                className="h-11 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            >
                                <option value="all">Todos</option>
                                <option value="favorites">⭐ Favoritos</option>
                            </select>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="h-11 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            >
                                <option value="recent">📅 Mais Recentes</option>
                                <option value="name">🔤 Ordem Alfabética</option>
                                <option value="exercises">💪 N° Exercícios</option>
                            </select>
                        </div>
                    </div>
                </motion.div>

                {/* Workouts Grid */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="space-y-6"
                >
                    {filteredAndSorted.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-12"
                        >
                            <div className="relative mx-auto max-w-md">
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 rounded-3xl blur-3xl" />
                                <div className="relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-8 space-y-4">
                                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center">
                                        <Dumbbell className="h-8 w-8 text-primary" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-semibold">
                                            {query || filterBy !== 'all' ? 'Nenhum resultado encontrado' : 'Comece seus treinos'}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {query || filterBy !== 'all'
                                                ? 'Tente ajustar os filtros ou a busca'
                                                : 'Crie seu primeiro template de treino para começar'}
                                        </p>
                                    </div>
                                    <div className="space-y-3">
                                        <Link to="/templates">
                                            <Button className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                                                <Plus className="mr-2 h-4 w-4" />
                                                Criar Primeiro Treino
                                            </Button>
                                        </Link>
                                        <Link to="/templates">
                                            <Button variant="outline" className="w-full">
                                                <Search className="mr-2 h-4 w-4" />
                                                Explorar Templates
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredAndSorted.map((template, idx) => {
                                const difficulty = calculateWorkoutDifficulty(template)
                                const DifficultyIcon = getDifficultyIcon(difficulty)
                                const estimatedDuration = Math.round(template.exercises.reduce((sum, ex) => sum + (toNumber(ex.sets) * toNumber(ex.restSec)), 0) / 60)
                                const totalVolume = template.exercises.reduce((sum, ex) => sum + (toNumber(ex.sets) * toNumber(ex.reps) * ex.load), 0)

                                return (
                                    <motion.div
                                        key={template.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.3) }}
                                        className="group"
                                    >
                                        <Card className="relative h-full overflow-hidden bg-gradient-to-br from-card to-card/50 border-0 shadow-sm hover:shadow-lg transition-all duration-200 hover-lift">
                                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                                            <CardContent className="relative p-6 space-y-4">
                                                {/* Header with favorite button */}
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors truncate">
                                                            {template.name}
                                                        </h4>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            Criado {new Date(template.created_at).toLocaleDateString('pt-BR')}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 hover:bg-primary/10 flex-shrink-0"
                                                        onClick={() => toggleFavorite(template.id)}
                                                    >
                                                        <Star className={`h-4 w-4 ${favorites.has(template.id) ? 'text-yellow-500 fill-current' : 'text-muted-foreground'}`} />
                                                    </Button>
                                                </div>

                                                {/* Stats Grid */}
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="bg-muted/30 rounded-lg p-3 text-center">
                                                        <div className="flex items-center justify-center gap-1 mb-1">
                                                            <Target className="w-3 h-3 text-primary" />
                                                            <span className="text-lg font-bold text-foreground">{template.exercises.length}</span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">Exercícios</p>
                                                    </div>
                                                    <div className="bg-muted/30 rounded-lg p-3 text-center">
                                                        <div className="flex items-center justify-center gap-1 mb-1">
                                                            <Clock className="w-3 h-3 text-primary" />
                                                            <span className="text-lg font-bold text-foreground">{estimatedDuration}</span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">min</p>
                                                    </div>
                                                    <div className="bg-muted/30 rounded-lg p-3 text-center">
                                                        <div className="flex items-center justify-center gap-1 mb-1">
                                                            <Dumbbell className="w-3 h-3 text-primary" />
                                                            <span className="text-lg font-bold text-foreground">{Math.round(totalVolume)}</span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">kg</p>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="space-y-2">
                                                    <Button
                                                        variant="outline"
                                                        className="w-full hover:bg-primary/10 hover:border-primary/50"
                                                        onClick={() => openPreview(template)}
                                                    >
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        Visualizar Treino
                                                    </Button>
                                                    <Link to={`/session/${template.id}`} className="block">
                                                        <Button className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 group/btn">
                                                            <Play className="w-4 h-4 mr-2" />
                                                            Iniciar Treino
                                                            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
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
                </motion.div>
            </div>

            {/* Workout Preview Modal */}
            {showPreviewModal && (
                <WorkoutPreviewModal
                    open={showPreviewModal}
                    onClose={closePreview}
                    workout={previewWorkout}
                    exercises={exercises || []}
                />
            )}
        </div>
    )
}
