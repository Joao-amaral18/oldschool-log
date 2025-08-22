import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type { WorkoutTemplate } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Pencil, Copy, Trash2, Search, Layers, Dumbbell, Clock, Plus, Upload, Play, Heart, Star, Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { api, fetchWorkoutTemplates } from '@/lib/api'
import { toNumber } from '@/lib/utils'
import { toast } from 'sonner'
import { TemplateListSkeleton } from '@/components/skeletons'
import { Input } from '@/components/ui/input'
import { motion } from 'framer-motion'
import { useModal } from '@/hooks/useModal'
import ImportWorkoutModal from '@/components/modals/ImportWorkoutModal'

export default function TemplatesPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [exercises, setExercises] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'recent' | 'name' | 'favorites'>('recent')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [showImportModal, setShowImportModal] = useState(false)
  const [expandedPreviews, setExpandedPreviews] = useState<Set<string>>(new Set())
  const modal = useModal()

  const load = async () => {
    if (!session) return
    try {
      setLoading(true)
      const [templatesData, exercisesData] = await Promise.all([
        fetchWorkoutTemplates(session.userId),
        api.listExercises()
      ])
      setTemplates(templatesData)
      setExercises(exercisesData)

      // Load favorites from localStorage
      const savedFavorites = localStorage.getItem(`template-favorites-${session.userId}`)
      if (savedFavorites) {
        setFavorites(new Set(JSON.parse(savedFavorites)))
      }
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

  const handleImportTemplates = async (importedTemplates: WorkoutTemplate[]) => {
    try {
      const result = await api.importWorkoutTemplates(importedTemplates)
      const { templates: newTemplates, createdExercises } = result

      // Show success message with details about created exercises
      let successMessage = `${newTemplates.length} template(s) importado(s) com sucesso!`
      if (createdExercises.length > 0) {
        successMessage += ` ${createdExercises.length} exercício(s) criado(s) automaticamente: ${createdExercises.join(', ')}`
      }

      toast.success(successMessage)

      // Refresh the entire page data to ensure exercises are loaded correctly
      await load()
    } catch (e: any) {
      throw new Error(e?.message || 'Erro ao importar templates')
    }
  }

  const startWorkoutFromTemplate = async (templateId: string) => {
    try {
      const template = templates.find(t => t.id === templateId)
      if (!template) {
        toast.error('Template não encontrado')
        return
      }

      // Start workout from template
      const started = await api.startWorkout(template)
      navigate(`/session/${started.workoutId}`)
      toast.success(`Treino "${template.name}" iniciado!`)
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao iniciar treino do template')
    }
  }

  const toggleFavorite = (templateId: string) => {
    if (!session) return

    const newFavorites = new Set(favorites)
    if (newFavorites.has(templateId)) {
      newFavorites.delete(templateId)
    } else {
      newFavorites.add(templateId)
    }

    setFavorites(newFavorites)
    localStorage.setItem(`template-favorites-${session.userId}`, JSON.stringify([...newFavorites]))
  }

  const togglePreviewExpanded = (templateId: string) => {
    const newExpanded = new Set(expandedPreviews)
    if (newExpanded.has(templateId)) {
      newExpanded.delete(templateId)
    } else {
      newExpanded.add(templateId)
    }
    setExpandedPreviews(newExpanded)
  }

  const sortedTemplates = useMemo(() => {
    const filtered = templates.filter((t) =>
      t.name.toLowerCase().includes(query.toLowerCase())
    )

    if (sort === 'favorites') {
      return filtered.sort((a, b) => {
        const aIsFav = favorites.has(a.id)
        const bIsFav = favorites.has(b.id)
        if (aIsFav && !bIsFav) return -1
        if (!aIsFav && bIsFav) return 1
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
    }

    if (sort === 'name') {
      return filtered.sort((a, b) => a.name.localeCompare(b.name))
    }

    // "recent" is the default, which is already sorted by created_at desc
    return filtered
  }, [templates, query, sort, favorites])

  if (loading) {
    return <TemplateListSkeleton />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-4 md:p-6 space-y-8">
        {/* Header Section */}
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
                  Meus Templates
                </h1>
                <p className="text-muted-foreground text-lg">
                  Gerencie e organize seus treinos personalizados
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Button variant="outline" onClick={() => setShowImportModal(true)} className="w-full sm:w-auto">
                  <Upload className="mr-2 h-4 w-4" /> Importar
                </Button>
                <Button onClick={createNew} className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                  <Plus className="mr-2 h-4 w-4" /> Criar Template
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search and Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.2 }}
          className="flex flex-col md:flex-row gap-4 items-start md:items-center"
        >
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar templates..."
                className="pl-10 h-11 border-0 bg-muted/50 focus:bg-background transition-colors"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-11">
                <Filter className="mr-2 h-4 w-4" />
                Filtros
              </Button>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as 'recent' | 'name' | 'favorites')}
                className="h-11 px-4 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="recent">Mais Recentes</option>
                <option value="favorites">Favoritos Primeiro</option>
                <option value="name">Ordem Alfabética</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Templates Grid */}
        {sortedTemplates.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {sortedTemplates.map((template, idx) => {
              const totalSets = template.exercises.reduce((acc, ex) => acc + toNumber(ex.sets), 0)
              const totalExercises = template.exercises.length
              const totalReps = template.exercises.reduce((acc, ex) => acc + (toNumber(ex.reps) * toNumber(ex.sets)), 0)
              const avgWeight = template.exercises.length > 0
                ? Math.round(template.exercises.reduce((acc, ex) => acc + (ex.load || 0), 0) / template.exercises.length)
                : 0
              const estimatedDuration = template.exercises.reduce((acc, ex) => acc + (toNumber(ex.restSec) || 60) * toNumber(ex.sets), 0) / 60 // in minutes

              return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.3) }}
                  className="group"
                >
                  <Card className="h-full flex flex-col relative overflow-hidden bg-gradient-to-br from-card to-card/50 border-0 shadow-sm hover:shadow-lg transition-all duration-200 hover-lift">
                    {/* Subtle gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                    <CardContent className="relative p-6 flex-grow space-y-4">
                      {/* Header with title and quick actions */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors truncate">
                              {template.name}
                            </h3>
                            {favorites.has(template.id) && (
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Criado {new Date(template.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 ml-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-primary/10"
                            onClick={() => toggleFavorite(template.id)}
                          >
                            <Heart className={`h-4 w-4 ${favorites.has(template.id) ? 'text-red-500 fill-current' : 'text-muted-foreground'}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10"
                            onClick={() => duplicateTemplate(template.id)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => deleteTemplate(template.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Template Stats */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-muted/30 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Dumbbell className="w-3 h-3 text-primary" />
                            <span className="text-lg font-bold text-foreground">{totalExercises}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Exercícios</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Layers className="w-3 h-3 text-primary" />
                            <span className="text-lg font-bold text-foreground">{totalSets}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Séries</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Clock className="w-3 h-3 text-primary" />
                            <span className="text-lg font-bold text-foreground">{Math.round(estimatedDuration)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">min</p>
                        </div>
                      </div>

                      {/* Additional Stats */}
                      <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>Total: {totalReps} repetições</span>
                        {avgWeight > 0 && (
                          <span>Média: {avgWeight}kg</span>
                        )}
                      </div>

                      {/* Exercise Preview */}
                      {template.exercises.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-muted-foreground">Exercícios:</p>
                            {template.exercises.length > 3 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs hover:bg-primary/10"
                                onClick={() => togglePreviewExpanded(template.id)}
                              >
                                {expandedPreviews.has(template.id) ? (
                                  <>
                                    <ChevronUp className="h-3 w-3 mr-1" />
                                    Recolher
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-3 w-3 mr-1" />
                                    Ver Todos ({template.exercises.length})
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                          <div className={`space-y-1 ${expandedPreviews.has(template.id) ? 'max-h-40' : 'max-h-24'} overflow-hidden transition-all duration-200`}>
                            {(expandedPreviews.has(template.id) ? template.exercises : template.exercises.slice(0, 3)).map((exercise) => {
                              const exerciseName = exercise.exerciseId
                                ? exercises.find(e => e.id === exercise.exerciseId)?.name || 'Exercício'
                                : 'Exercício'
                              return (
                                <div key={exercise.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <div className="w-2 h-2 bg-primary rounded-full" />
                                  <span className="truncate">{exerciseName}</span>
                                  <span className="text-xs text-muted-foreground/60">
                                    {exercise.sets}×{exercise.reps}
                                  </span>
                                </div>
                              )
                            })}
                            {!expandedPreviews.has(template.id) && template.exercises.length > 3 && (
                              <div className="pt-1 border-t border-border/50">
                                <p className="text-xs text-muted-foreground pl-4">
                                  +{template.exercises.length - 3} exercícios restantes
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>

                    {/* Action Buttons */}
                    <div className="relative p-4 pt-0 space-y-2">
                      <Link to={`/templates/editor/${template.id}`} className="block">
                        <Button
                          variant="default"
                          className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 hover-scale"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar Template
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        className="w-full hover-scale"
                        onClick={() => startWorkoutFromTemplate(template.id)}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Iniciar Treino
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.2 }}
            className="text-center"
          >
            <div className="relative mx-auto max-w-md">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 rounded-3xl blur-3xl" />
              <div className="relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-12 space-y-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center">
                  <Dumbbell className="w-10 h-10 text-primary" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">
                    {query ? 'Nenhum resultado encontrado' : 'Comece criando seu primeiro template'}
                  </h3>
                  <p className="text-muted-foreground">
                    {query
                      ? `Não encontramos templates para "${query}". Tente uma busca diferente ou crie um novo template.`
                      : 'Crie templates personalizados para organizar seus treinos e acompanhar seu progresso.'}
                  </p>
                </div>

                {!query && (
                  <div className="space-y-3">
                    <Button onClick={createNew} className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Primeiro Template
                    </Button>
                    <Button variant="outline" onClick={() => setShowImportModal(true)} className="w-full">
                      <Upload className="mr-2 h-4 w-4" />
                      Importar Templates
                    </Button>
                  </div>
                )}

                {query && (
                  <Button variant="outline" onClick={() => setQuery('')} className="w-full">
                    Limpar Busca
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {showImportModal && (
          <ImportWorkoutModal
            onClose={() => setShowImportModal(false)}
            onImport={handleImportTemplates}
          />
        )}
      </div>
    </div>
  )
}
