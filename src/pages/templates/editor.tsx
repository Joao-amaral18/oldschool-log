import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useModal } from '@/hooks/useModal'
import type { Exercise, TemplateExercise, WorkoutTemplate } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { ChevronDown, ChevronUp, Plus, Trash2, Dumbbell } from 'lucide-react'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { TemplateEditorSkeleton } from '@/components/skeletons'

export default function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>()
  const { session } = useAuth()
  const navigate = useNavigate()
  const modal = useModal()
  const [template, setTemplate] = useState<WorkoutTemplate | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [setRowsByExercise, setSetRowsByExercise] = useState<Record<string, Array<{ reps: number; load: number; restSec: number }>>>({})

  const load = async () => {
    try {
      setLoading(true)
      const t = await api.getTemplate(id!)
      if (!t) {
        navigate('/templates')
        return
      }
      setTemplate(t)
      // Load all user's exercises for selection (not only those in the template)
      const ex = await api.listExercises()
      setExercises(ex)
      // Initialize set rows per exercise based on current aggregate fields
      const initial: Record<string, Array<{ reps: number; load: number; restSec: number }>> = {}
      for (const te of t.exercises) {
        const rows = Array.from({ length: Math.max(1, te.sets || 1) }, () => ({ reps: te.reps || 0, load: te.load || 0, restSec: te.restSec || 60 }))
        initial[te.id] = rows
      }
      setSetRowsByExercise(initial)
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao carregar template')
      navigate('/templates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!session) {
      navigate('/login')
      return
    }
    if (id) load()
  }, [session, id])

  if (loading || !template) {
    return <TemplateEditorSkeleton />
  }

  const setName = (name: string) => setTemplate({ ...template, name })

  // helper removed

  const addExerciseViaPicker = async () => {
    const picked = await modal.pickExercise({
      title: 'Selecionar exercício',
      description: 'Busque, filtre e selecione um exercício',
      exercises,
      allowCreate: true,
      onCreate: async ({ name, muscleGroup }) => {
        try {
          const created = await api.createExercise({ name, muscleGroup: muscleGroup as Exercise['muscleGroup'] })
          setExercises((prev) => [...prev, created])
          // Immediately add the newly created exercise
          const newItem: TemplateExercise = {
            id: crypto.randomUUID(),
            exerciseId: created.id,
            sets: 1,
            reps: 10,
            load: 0,
            restSec: 60,
          }
          setTemplate((prev) => prev ? { ...prev, exercises: [...prev.exercises, newItem] } : prev)
          setSetRowsByExercise((prev) => ({ ...prev, [newItem.id]: [{ reps: 10, load: 0, restSec: 60 }] }))
          toast.success('Exercício criado!')
        } catch (e: any) {
          toast.error(e?.message || 'Erro ao criar exercício')
        }
      },
    })
    if (picked) {
      const item: TemplateExercise = {
        id: crypto.randomUUID(),
        exerciseId: picked,
        sets: 1,
        reps: 10,
        load: 0,
        restSec: 60,
      }
      setTemplate({ ...template, exercises: [...template.exercises, item] })
      setSetRowsByExercise((prev) => ({ ...prev, [item.id]: [{ reps: 10, load: 0, restSec: 60 }] }))
    }
  }

  // removed legacy addNewExercise in favor of picker-driven flow

  const updateExercise = (id: string, patch: Partial<TemplateExercise>) => {
    const list = template.exercises.map((e) => (e.id === id ? { ...e, ...patch } : e))
    setTemplate({ ...template, exercises: list })
  }

  const removeExercise = (id: string) => {
    setTemplate({ ...template, exercises: template.exercises.filter((e) => e.id !== id) })
    setSetRowsByExercise((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const moveExercise = (id: string, dir: -1 | 1) => {
    const idx = template.exercises.findIndex((e) => e.id === id)
    if (idx === -1) return
    const nextIdx = idx + dir
    if (nextIdx < 0 || nextIdx >= template.exercises.length) return
    const next = [...template.exercises]
    const [item] = next.splice(idx, 1)
    next.splice(nextIdx, 0, item)
    setTemplate({ ...template, exercises: next })
  }

  const saveTemplate = async () => {
    try {
      // Validation guard: name, at least one exercise, exercise selected and at least one set row
      const nameTrimmed = template.name.trim()
      if (!nameTrimmed) {
        toast.error('Digite um nome para o template')
        return
      }
      if (template.exercises.length === 0) {
        toast.error('Adicione pelo menos 1 exercício')
        return
      }
      for (const e of template.exercises) {
        if (!e.exerciseId) {
          toast.error('Selecione um exercício para cada linha')
          return
        }
        const rows = setRowsByExercise[e.id]
        if (rows && rows.length === 0) {
          toast.error('Cada exercício deve ter pelo menos 1 série')
          return
        }
      }
      // Map set rows back to aggregate fields for persistence
      const mapped: WorkoutTemplate = {
        ...template,
        exercises: template.exercises.map((e) => {
          const rows = setRowsByExercise[e.id] && setRowsByExercise[e.id].length > 0
            ? setRowsByExercise[e.id]
            : [{ reps: e.reps ?? 10, load: e.load ?? 0, restSec: e.restSec ?? 60 }]
          return {
            ...e,
            sets: rows.length,
            reps: rows[0]?.reps ?? e.reps,
            load: rows[0]?.load ?? e.load,
            restSec: rows[0]?.restSec ?? e.restSec,
          }
        })
      }
      await api.saveTemplateFull(mapped)
      toast.success('Template salvo!')
      navigate('/templates')
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao salvar template')
    }
  }

  const addSetRow = (exerciseId: string) => {
    setSetRowsByExercise((prev) => {
      const rows = prev[exerciseId] ?? []
      const last = rows[rows.length - 1] ?? { reps: 10, load: 0, restSec: 60 }
      return { ...prev, [exerciseId]: [...rows, { ...last }] }
    })
  }

  const removeSetRow = (exerciseId: string, rowIndex: number) => {
    setSetRowsByExercise((prev) => {
      const rows = (prev[exerciseId] ?? []).slice()
      if (rows.length <= 1) return prev
      rows.splice(rowIndex, 1)
      return { ...prev, [exerciseId]: rows }
    })
  }

  const updateSetRow = (exerciseId: string, rowIndex: number, patch: Partial<{ reps: number; load: number; restSec: number }>) => {
    setSetRowsByExercise((prev) => {
      const rows = (prev[exerciseId] ?? []).slice()
      rows[rowIndex] = { ...rows[rowIndex], ...patch }
      return { ...prev, [exerciseId]: rows }
    })
  }

  return (
    <div className="space-y-4">
      {/* Sticky sub-header */}
      <div className="sticky top-2 z-10 surface relative overflow-hidden p-3 flex items-center justify-between gap-3">
        <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-br from-zinc-600/15 to-zinc-300/10 blur-3xl" />
        <Input className="max-w-md text-lg font-semibold" value={template.name} onChange={(e) => setName(e.target.value)} />
        <div className="flex items-center gap-2">
          <Button
            onClick={saveTemplate}
            disabled={
              loading ||
              !template.name.trim() ||
              template.exercises.length === 0 ||
              template.exercises.some((e) => !e.exerciseId || (setRowsByExercise[e.id]?.length === 0))
            }
            className="glow"
          >
            Salvar
          </Button>
          <Button variant="outline" onClick={() => navigate('/templates')}>Voltar</Button>
        </div>
      </div>

      <div className="grid gap-3">
        {template.exercises.length === 0 && (
          <div className="surface p-8 text-center text-muted-foreground rounded-xl">
            <Dumbbell className="h-10 w-10 mx-auto opacity-60 mb-2" />
            <div className="font-medium">Nenhum exercício adicionado ainda</div>
            <div className="text-sm">Use o botão abaixo para adicionar seu primeiro exercício</div>
          </div>
        )}
        {template.exercises.map((te, idx) => (
          <motion.div key={te.id} whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
            <Card className="surface overflow-hidden transition-colors duration-200 hover:border-zinc-500 hover:bg-accent/60">
              <CardContent className="space-y-3 p-4 md:p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-md border border-stone-800 px-2 py-0.5"><Dumbbell className="h-3.5 w-3.5" /> Exercício</span>
                  </div>
                <Button
                  variant="outline"
                  onClick={async () => {
                    const picked = await modal.pickExercise({
                      title: 'Selecionar exercício',
                      description: 'Busque, filtre e selecione um exercício',
                      exercises,
                      allowCreate: true,
                      onCreate: async ({ name, muscleGroup }) => {
                        try {
                          const created = await api.createExercise({ name, muscleGroup: muscleGroup as Exercise['muscleGroup'] })
                          setExercises((prev) => [...prev, created])
                          updateExercise(te.id, { exerciseId: created.id })
                          toast.success('Exercício criado!')
                        } catch (e: any) {
                          // If backend inserted but returned error, try to fetch latest by name and attach
                          try {
                            const latest = (await api.listExercises()).find((ex) => ex.name.toLowerCase() === name.toLowerCase())
                            if (latest) {
                              setExercises((prev) => (prev.find((e) => e.id === latest.id) ? prev : [...prev, latest]))
                              updateExercise(te.id, { exerciseId: latest.id })
                              toast.success('Exercício criado!')
                              return
                            }
                          } catch { }
                          toast.error(e?.message || 'Erro ao criar exercício')
                        }
                      },
                    })
                    if (picked) updateExercise(te.id, { exerciseId: picked })
                  }}
                >
                  {exercises.find((e) => e.id === te.exerciseId)?.name || 'Selecione exercício'}
                </Button>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => moveExercise(te.id, -1)} disabled={idx === 0}>
                    <ChevronUp size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveExercise(te.id, 1)}
                    disabled={idx === template.exercises.length - 1}
                  >
                    <ChevronDown size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => removeExercise(te.id)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>

              {/* Flexible set rows */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Séries</span>
                  <Button size="sm" variant="outline" onClick={() => addSetRow(te.id)}>
                    <Plus className="mr-2" size={14} /> Adicionar série
                  </Button>
                </div>
                <div className="grid gap-2">
                  {(setRowsByExercise[te.id] ?? [{ reps: te.reps, load: te.load, restSec: te.restSec }]).map((row, rowIdx) => (
                    <div key={rowIdx} className="grid grid-cols-12 items-end gap-2">
                      <div className="col-span-3">
                        <label className="text-sm space-y-1">
                          <span className="block text-muted-foreground">Reps</span>
                          <Input type="number" value={row.reps}
                            onChange={(e) => updateSetRow(te.id, rowIdx, { reps: Number(e.target.value) })}
                          />
                        </label>
                      </div>
                      <div className="col-span-3">
                        <label className="text-sm space-y-1">
                          <span className="block text-muted-foreground">Carga</span>
                          <Input type="number" value={row.load}
                            onChange={(e) => updateSetRow(te.id, rowIdx, { load: Number(e.target.value) })}
                          />
                        </label>
                      </div>
                      <div className="col-span-4">
                        <label className="text-sm space-y-1">
                          <span className="block text-muted-foreground">Descanso (s)</span>
                          <Input type="number" value={row.restSec}
                            onChange={(e) => updateSetRow(te.id, rowIdx, { restSec: Number(e.target.value) })}
                          />
                        </label>
                      </div>
                      <div className="col-span-2 flex items-end">
                        <Button variant="ghost" size="icon" onClick={() => removeSetRow(te.id, rowIdx)} disabled={(setRowsByExercise[te.id]?.length ?? 1) <= 1}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        <div className="flex">
          <Button onClick={addExerciseViaPicker} className="flex-1" variant="outline">
            <Plus className="mr-2" size={16} /> Adicionar exercício
          </Button>
        </div>
      </div>
    </div>
  )
}


