import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { formatSeconds } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { HistorySkeleton } from '@/components/skeletons'
import { motion } from 'framer-motion'
import {
  Calendar,
  Clock,
  Dumbbell,
  Search,
  BarChart3,
  FileText,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Download,
  Target,
  Edit3
} from 'lucide-react'

type WorkoutHistory = {
  id: string
  templateName: string | null
  startedAt: string
  finishedAt: string | null
  durationSec: number | null
  totalSets: number
  totalVolume: number
  exercises: Array<{
    id: string
    name: string
    muscleGroup: string
    sets: Array<{
      reps: string
      load: number | null
      kind: 'warmup' | 'recognition' | 'working'
      doneAt: string
    }>
  }>
  notes?: string
}

export default function HistoryPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState<WorkoutHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filterBy, setFilterBy] = useState<'all' | 'week' | 'month' | 'template'>('all')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'duration' | 'volume' | 'sets'>('date')
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(new Set())
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesText, setNotesText] = useState('')

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

  // Get unique templates for filter
  const uniqueTemplates = useMemo(() => {
    const templates = new Set(items.map(item => item.templateName).filter((name): name is string => Boolean(name)))
    return Array.from(templates)
  }, [items])

  // Filter and sort workouts
  const filteredWorkouts = useMemo(() => {
    let filtered = items.filter(item => {
      // Text search
      if (query) {
        const searchTerm = query.toLowerCase()
        const matchesName = (item.templateName || '').toLowerCase().includes(searchTerm)
        const matchesExercises = item.exercises.some(ex =>
          ex.name.toLowerCase().includes(searchTerm)
        )
        if (!matchesName && !matchesExercises) return false
      }

      // Time filter
      if (filterBy === 'week') {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        if (new Date(item.startedAt) < weekAgo) return false
      } else if (filterBy === 'month') {
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        if (new Date(item.startedAt) < monthAgo) return false
      }

      // Template filter
      if (filterBy === 'template' && selectedTemplate !== 'all') {
        if (item.templateName !== selectedTemplate) return false
      }

      return true
    })

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'duration':
          return (b.durationSec || 0) - (a.durationSec || 0)
        case 'volume':
          return b.totalVolume - a.totalVolume
        case 'sets':
          return b.totalSets - a.totalSets
        case 'date':
        default:
          return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      }
    })

    return filtered
  }, [items, query, filterBy, selectedTemplate, sortBy])

  // Calculate stats
  const stats = useMemo(() => {
    if (filteredWorkouts.length === 0) return null

    const totalWorkouts = filteredWorkouts.length
    const totalDuration = filteredWorkouts.reduce((sum, w) => sum + (w.durationSec || 0), 0)
    const totalVolume = filteredWorkouts.reduce((sum, w) => sum + w.totalVolume, 0)
    const totalSets = filteredWorkouts.reduce((sum, w) => sum + w.totalSets, 0)
    const avgDuration = totalDuration / totalWorkouts
    const avgVolume = totalVolume / totalWorkouts

    return {
      totalWorkouts,
      totalDuration,
      totalVolume,
      totalSets,
      avgDuration,
      avgVolume
    }
  }, [filteredWorkouts])

  const toggleWorkoutExpansion = (workoutId: string) => {
    const newExpanded = new Set(expandedWorkouts)
    if (newExpanded.has(workoutId)) {
      newExpanded.delete(workoutId)
    } else {
      newExpanded.add(workoutId)
    }
    setExpandedWorkouts(newExpanded)
  }

  const exportWorkout = (workout: WorkoutHistory) => {
    const data = {
      date: new Date(workout.startedAt).toLocaleString(),
      template: workout.templateName || 'Treino Personalizado',
      duration: workout.durationSec ? formatSeconds(workout.durationSec) : '-',
      totalVolume: `${workout.totalVolume.toFixed(1)}kg`,
      notes: workout.notes || '',
      exercises: workout.exercises.map(ex => ({
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        sets: ex.sets.map(set => ({
          reps: set.reps,
          load: set.load ? `${set.load}kg` : '-',
          type: set.kind
        }))
      }))
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workout-${new Date(workout.startedAt).toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('Treino exportado!')
  }

  const startEditingNotes = (workoutId: string, currentNotes: string = '') => {
    setEditingNotes(workoutId)
    setNotesText(currentNotes)
  }

  const saveNotes = async () => {
    if (!editingNotes) return

    try {
      await api.updateWorkoutNotes(editingNotes, notesText)
      setItems(prev => prev.map(item =>
        item.id === editingNotes
          ? { ...item, notes: notesText }
          : item
      ))
      toast.success('Observações salvas!')
    } catch (error: any) {
      toast.error('Erro ao salvar observações')
    } finally {
      setEditingNotes(null)
      setNotesText('')
    }
  }

  const cancelEditingNotes = () => {
    setEditingNotes(null)
    setNotesText('')
  }

  if (loading) {
    return <HistorySkeleton />
  }

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
                  Histórico de Treinos
                </h1>
                <p className="text-muted-foreground text-lg">
                  Acompanhe seu progresso e performance
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={load} className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Atualizar
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
              <CardContent className="p-4 text-center">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{stats.totalWorkouts}</div>
                <div className="text-sm text-muted-foreground">Treinos</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">{Math.round(stats.avgDuration / 60)}min</div>
                <div className="text-sm text-muted-foreground">Média</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
              <CardContent className="p-4 text-center">
                <Dumbbell className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <div className="text-2xl font-bold">{Math.round(stats.avgVolume)}kg</div>
                <div className="text-sm text-muted-foreground">Volume Médio</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                <div className="text-2xl font-bold">{Math.round(stats.totalSets / stats.totalWorkouts)}</div>
                <div className="text-sm text-muted-foreground">Séries/Treino</div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Search and Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.2 }}
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
                onChange={(e) => setFilterBy(e.target.value as 'all' | 'week' | 'month' | 'template')}
                className="h-11 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="all">Todos</option>
                <option value="week">📅 Esta semana</option>
                <option value="month">📅 Este mês</option>
                <option value="template">📋 Por Template</option>
              </select>

              {filterBy === 'template' && uniqueTemplates.length > 0 && (
                <select
                  value={selectedTemplate}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedTemplate(e.target.value)}
                  className="h-11 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="all">Todos os templates</option>
                  {uniqueTemplates.map(template => (
                    <option key={template} value={template}>{template}</option>
                  ))}
                </select>
              )}

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'duration' | 'volume' | 'sets')}
                className="h-11 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="date">📅 Data</option>
                <option value="duration">⏱️ Duração</option>
                <option value="volume">💪 Volume</option>
                <option value="sets">🎯 Séries</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Workouts List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {filteredWorkouts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="relative mx-auto max-w-md">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 rounded-3xl blur-3xl" />
                <div className="relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-8 space-y-4">
                  <Calendar className="h-16 w-16 mx-auto text-muted-foreground/60" />
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">
                      {query || filterBy !== 'all' ? 'Nenhum resultado encontrado' : 'Nenhum treino ainda'}
                    </h3>
                    <p className="text-muted-foreground">
                      {query || filterBy !== 'all'
                        ? 'Tente ajustar os filtros ou a busca'
                        : 'Seus treinos completados aparecerão aqui'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {filteredWorkouts.map((workout, idx) => (
                <motion.div
                  key={workout.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.3) }}
                >
                  <Card className="group relative overflow-hidden bg-gradient-to-br from-card to-card/50 border-0 shadow-sm hover:shadow-lg transition-all duration-200">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                    <CardContent className="relative p-6 space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors truncate">
                              {workout.templateName || 'Treino Personalizado'}
                            </h3>
                            {workout.notes && <FileText className="h-4 w-4 text-blue-500" />}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(workout.startedAt).toLocaleDateString('pt-BR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {workout.durationSec ? formatSeconds(workout.durationSec) : '-'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleWorkoutExpansion(workout.id)}
                            className="h-8 w-8 hover:bg-primary/10"
                          >
                            {expandedWorkouts.has(workout.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => exportWorkout(workout)}
                            className="h-8 w-8 hover:bg-primary/10"
                            title="Exportar treino"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-muted/30 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Target className="w-3 h-3 text-primary" />
                            <span className="text-lg font-bold text-foreground">{workout.totalSets}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Séries</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Dumbbell className="w-3 h-3 text-primary" />
                            <span className="text-lg font-bold text-foreground">{workout.totalVolume.toFixed(0)}kg</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Volume</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <TrendingUp className="w-3 h-3 text-primary" />
                            <span className="text-lg font-bold text-foreground">{workout.exercises.length}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Exercícios</p>
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1">
                            <FileText className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            {editingNotes === workout.id ? (
                              <Textarea
                                value={notesText}
                                onChange={(e) => setNotesText(e.target.value)}
                                placeholder="Adicione observações sobre este treino..."
                                className="flex-1 min-h-[80px] text-sm bg-background/50"
                                autoFocus
                              />
                            ) : (
                              <div className="text-sm text-blue-900 dark:text-blue-100 flex-1">
                                {workout.notes || 'Sem observações'}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {editingNotes === workout.id ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={saveNotes}
                                  className="h-6 px-2 text-xs hover:bg-green-500/10 hover:text-green-600"
                                >
                                  Salvar
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={cancelEditingNotes}
                                  className="h-6 px-2 text-xs hover:bg-red-500/10 hover:text-red-600"
                                >
                                  Cancelar
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => startEditingNotes(workout.id, workout.notes || '')}
                                className="h-6 w-6 hover:bg-blue-500/10 hover:text-blue-600"
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expandable Exercise Details */}
                      {expandedWorkouts.has(workout.id) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-3 pt-4 border-t border-border/50"
                        >
                          <h4 className="font-semibold text-sm text-muted-foreground">Detalhes do Treino</h4>
                          <div className="space-y-3">
                            {workout.exercises.map((exercise) => (
                              <div key={exercise.id} className="bg-muted/20 rounded-lg p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{exercise.name}</span>
                                    <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted/50">
                                      {exercise.muscleGroup}
                                    </span>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {exercise.sets.length} séries
                                  </span>
                                </div>
                                <div className="grid gap-1">
                                  {exercise.sets.map((set, setIdx) => (
                                    <div key={setIdx} className="flex items-center justify-between text-xs bg-background/50 rounded px-2 py-1">
                                      <span className="flex items-center gap-2">
                                        <span className="text-muted-foreground">#{setIdx + 1}</span>
                                        <span className={`px-1.5 py-0.5 rounded text-xs ${set.kind === 'warmup' ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300' :
                                          set.kind === 'recognition' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300' :
                                            'bg-green-500/20 text-green-700 dark:text-green-300'
                                          }`}>
                                          {set.kind === 'warmup' ? 'Aquecimento' :
                                            set.kind === 'recognition' ? 'Reconhecimento' : 'Trabalho'}
                                        </span>
                                      </span>
                                      <span className="flex items-center gap-2">
                                        <span>{set.reps} reps</span>
                                        {set.load && <span>• {set.load}kg</span>}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}


