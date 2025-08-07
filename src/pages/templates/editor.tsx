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
import { api } from '@/lib/api'

export default function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>()
  const { session } = useAuth()
  const navigate = useNavigate()
  const modal = useModal()
  const [template, setTemplate] = useState<WorkoutTemplate | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const t = await api.getTemplate(id!)
      if (!t) {
        navigate('/templates')
        return
      }
      setTemplate(t)
      const uniqueIds = Array.from(new Set(t.exercises.map((e) => e.exerciseId)))
      const ex = await api.getExercisesByIds(uniqueIds)
      setExercises(ex)
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

  if (!template) return null

  const setName = (name: string) => setTemplate({ ...template, name })

  const addExercise = () => {
    const item: TemplateExercise = {
      id: crypto.randomUUID(),
      exerciseId: exercises[0]?.id ?? '',
      sets: 3,
      reps: 10,
      load: 0,
      restSec: 60,
    }
    setTemplate({ ...template, exercises: [...template.exercises, item] })
  }

  const addNewExercise = async () => {
    const name = await modal.prompt({
      title: 'Novo Exercício',
      description: 'Digite o nome do novo exercício:',
      placeholder: 'Ex: Supino reto',
    })

    if (!name?.trim()) return

    const groups = [
      { value: 'chest', label: 'Peito', description: 'chest' },
      { value: 'back', label: 'Costas', description: 'back' },
      { value: 'legs', label: 'Pernas', description: 'legs' },
      { value: 'shoulders', label: 'Ombros', description: 'shoulders' },
      { value: 'biceps', label: 'Bíceps', description: 'biceps' },
      { value: 'triceps', label: 'Tríceps', description: 'triceps' },
      { value: 'glutes', label: 'Glúteos', description: 'glutes' },
      { value: 'core', label: 'Core/Abdômen', description: 'core' },
      { value: 'full-body', label: 'Corpo inteiro', description: 'full-body' },
      { value: 'other', label: 'Outro', description: 'other' },
    ]

    const group = await modal.select({
      title: 'Grupo Muscular',
      description: 'Selecione o grupo muscular principal:',
      options: groups,
    })

    if (!group) return

    try {
      const created = await api.createExercise({ name: name.trim(), muscleGroup: group as Exercise['muscleGroup'] })
      setExercises((prev) => [...prev, created])
      const item: TemplateExercise = {
        id: crypto.randomUUID(),
        exerciseId: created.id,
        sets: 3,
        reps: 10,
        load: 0,
        restSec: 60,
      }
      setTemplate({ ...template, exercises: [...template.exercises, item] })
      toast.success('Novo exercício adicionado!')
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao criar exercício')
    }
  }

  const updateExercise = (id: string, patch: Partial<TemplateExercise>) => {
    const list = template.exercises.map((e) => (e.id === id ? { ...e, ...patch } : e))
    setTemplate({ ...template, exercises: list })
  }

  const removeExercise = (id: string) => {
    setTemplate({ ...template, exercises: template.exercises.filter((e) => e.id !== id) })
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
      await api.saveTemplateFull(template)
      toast.success('Template salvo!')
      navigate('/templates')
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao salvar template')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Input className="max-w-md text-lg font-semibold" value={template.name} onChange={(e) => setName(e.target.value)} />
        <div className="flex items-center gap-2">
          <Button onClick={saveTemplate} disabled={loading}>Salvar</Button>
          <Button variant="outline" onClick={() => navigate('/templates')}>Voltar</Button>
        </div>
      </div>

      <div className="grid gap-3">
        {template.exercises.map((te, idx) => (
          <Card key={te.id}>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <select
                  className="rounded-md border px-3 py-2 text-sm"
                  value={te.exerciseId}
                  onChange={(e) => updateExercise(te.id, { exerciseId: e.target.value })}
                >
                  {exercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))}
                </select>
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

              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                <label className="text-sm space-y-1">
                  <span className="block text-muted-foreground">Séries</span>
                  <Input type="number" value={te.sets} onChange={(e) => updateExercise(te.id, { sets: Number(e.target.value) })} />
                </label>
                <label className="text-sm space-y-1">
                  <span className="block text-muted-foreground">Reps</span>
                  <Input type="number" value={te.reps} onChange={(e) => updateExercise(te.id, { reps: Number(e.target.value) })} />
                </label>
                <label className="text-sm space-y-1">
                  <span className="block text-muted-foreground">Carga</span>
                  <Input type="number" value={te.load} onChange={(e) => updateExercise(te.id, { load: Number(e.target.value) })} />
                </label>
                <label className="text-sm space-y-1">
                  <span className="block text-muted-foreground">Descanso (s)</span>
                  <Input type="number" value={te.restSec} onChange={(e) => updateExercise(te.id, { restSec: Number(e.target.value) })} />
                </label>
              </div>
            </CardContent>
          </Card>
        ))}
        <div className="flex gap-2">
          <Button onClick={addExercise} className="flex-1" variant="outline">
            <Plus className="mr-2" size={16} /> Adicionar exercício
          </Button>
          <Button onClick={addNewExercise} variant="outline">
            <Dumbbell className="mr-2" size={16} /> Novo exercício
          </Button>
        </div>
      </div>
    </div>
  )
}


