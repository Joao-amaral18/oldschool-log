import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useModal } from '@/hooks/useModal'
import type { Exercise } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { SettingsSkeleton } from '@/components/skeletons'

export default function SettingsPage() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()
  const modalApi = useModal()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; item?: Exercise } | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      setLoading(true)
      const data = await api.listExercises()
      setExercises(data)
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao carregar exercícios')
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

  const onSubmitExercise = async (data: { name: string; muscleGroup: Exercise['muscleGroup'] }) => {
    try {
      if (modal?.mode === 'create') {
        const item = await api.createExercise({ name: data.name, muscleGroup: data.muscleGroup })
        setExercises((prev) => [...prev, item])
        toast.success('Exercício adicionado')
      } else if (modal?.mode === 'edit' && modal.item) {
        const item = await api.updateExercise(modal.item.id, data)
        setExercises((prev) => prev.map((e) => (e.id === item.id ? item : e)))
        toast.success('Exercício atualizado')
      }
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao salvar exercício')
    } finally {
      setModal(null)
    }
  }

  const deleteExercise = async (id: string) => {
    try {
      const ex = exercises.find((e) => e.id === id)
      const confirmed = await modalApi.confirm({
        title: 'Excluir exercício',
        description: `Tem certeza que deseja excluir "${ex?.name ?? 'Exercício'}"? Esta ação não pode ser desfeita.`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        variant: 'destructive',
      })
      if (!confirmed) return
      await api.deleteExercise(id)
      setExercises((prev) => prev.filter((e) => e.id !== id))
      toast.success('Exercício excluído')
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao excluir exercício')
    }
  }

  const dangerPurge = async () => {
    if (!session) return

    const confirmed = await modalApi.confirm({
      title: 'Apagar Todos os Dados',
      description: 'Esta ação não pode ser desfeita. Todos os seus templates, histórico e exercícios serão perdidos permanentemente.',
      confirmText: 'Apagar Tudo',
      cancelText: 'Cancelar',
      variant: 'destructive',
    })

    if (!confirmed) return

    const verification = await modalApi.prompt({
      title: 'Confirmação Final',
      description: 'Digite "APAGAR" para confirmar que deseja apagar todos os dados:',
      placeholder: 'APAGAR',
    })

    if (verification !== 'APAGAR') {
      await modalApi.alert({
        title: 'Cancelado',
        description: 'Ação cancelada. Seus dados estão seguros.',
        variant: 'default',
      })
      return
    }

    try {
      await api.purgeMyData()
      toast.success('Todos os dados foram apagados')
      await logout()
      navigate('/login')
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao apagar dados')
    }
  }

  if (loading) {
    return <SettingsSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Configurações</h1>
        <Button
          variant="outline"
          onClick={async () => {
            await logout()
            navigate('/login')
          }}
        >
          Logout
        </Button>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Exercícios</h2>
          <Button variant="outline" onClick={() => setModal({ mode: 'create' })}>
            Adicionar
          </Button>
        </div>
        <div className="grid gap-2">
          {exercises.map((ex) => (
            <Card key={ex.id} className="surface">
              <CardContent className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{ex.name}</div>
                  <div className="text-xs text-muted-foreground">{ex.muscleGroup}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setModal({ mode: 'edit', item: ex })}>
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => deleteExercise(ex.id)}>
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {exercises.length === 0 && <div className="text-sm text-muted-foreground">Nenhum exercício cadastrado.</div>}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-red-600">Zona de Perigo</h2>
        <Button variant="outline" onClick={dangerPurge}>
          Apagar Todos os Dados
        </Button>
      </section>

      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <Card className="w-full max-w-sm surface">
            <CardContent className="pt-6">
              <div className="mb-3 text-lg font-semibold">
                {modal.mode === 'create' ? 'Adicionar Exercício' : 'Editar Exercício'}
              </div>
              <ExerciseForm
                initial={{ name: modal.item?.name ?? '', muscleGroup: modal.item?.muscleGroup ?? 'other' }}
                onCancel={() => setModal(null)}
                onSubmit={onSubmitExercise}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function ExerciseForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: { name: string; muscleGroup: Exercise['muscleGroup'] }
  onSubmit: (data: { name: string; muscleGroup: Exercise['muscleGroup'] }) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial.name)
  const [group, setGroup] = useState<Exercise['muscleGroup']>(initial.muscleGroup)
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!name.trim()) return
        onSubmit({ name: name.trim(), muscleGroup: group })
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="ex-name">Nome</Label>
        <Input id="ex-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ex-group">Grupo muscular</Label>
        <select
          id="ex-group"
          className="mt-1 w-full rounded-md border border-stone-800 px-3 py-2 text-sm"
          value={group}
          onChange={(e) => setGroup(e.target.value as Exercise['muscleGroup'])}
        >
          {['chest', 'back', 'legs', 'shoulders', 'biceps', 'triceps', 'glutes', 'core', 'full-body', 'other'].map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  )
}


