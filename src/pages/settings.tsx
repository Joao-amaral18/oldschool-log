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
import { notificationUtils } from '@/lib/notifications'
import { Bell, Wifi, WifiOff, Dumbbell, Shield, User, Settings2, Trash2, Smartphone, LogOut } from 'lucide-react'

export default function SettingsPage() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()
  const modalApi = useModal()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; item?: Exercise } | null>(null)
  const [loading, setLoading] = useState(true)
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>('default')
  const [isOnline, setIsOnline] = useState(navigator.onLine)

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

    // Update notification status
    if (notificationUtils.isSupported()) {
      setNotificationStatus(notificationUtils.getPermission())
    }

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
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

  const testNotification = async () => {
    const success = await notificationUtils.sendTestNotification()
    if (success) {
      setNotificationStatus('granted')
    } else {
      setNotificationStatus('denied')
    }
  }

  const requestNotificationPermission = async () => {
    const permission = await notificationUtils.requestPermission()
    setNotificationStatus(permission)
    if (permission === 'granted') {
      toast.success('Permissão de notificação concedida!')
    } else {
      toast.error('Permissão de notificação negada.')
    }
  }

  const testOffline = async () => {
    if (!isOnline) {
      toast.info('Você já está offline! Teste concluído.')
      return
    }

    toast.info('Desconecte-se da internet para testar o modo offline')

    // Simulate going offline after a delay
    setTimeout(() => {
      if (navigator.onLine) {
        toast.info('Desconecte-se da internet e recarregue a página para ver o modo offline em ação')
      }
    }, 2000)
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
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Configurações</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas preferências e dados</p>
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            await logout()
            navigate('/login')
          }}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>

      {/* Profile Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Perfil</h2>
            <p className="text-sm text-muted-foreground">Informações da conta</p>
          </div>
        </div>
        <Card className="border border-border/40 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">{session?.username}</p>
                <p className="text-sm text-muted-foreground">Usuário ativo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Exercises Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Exercícios</h2>
              <p className="text-sm text-muted-foreground">Gerencie sua biblioteca de exercícios</p>
            </div>
          </div>
          <Button
            onClick={() => setModal({ mode: 'create' })}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Dumbbell className="h-4 w-4" />
            Adicionar
          </Button>
        </div>

        {exercises.length > 0 ? (
          <div className="grid gap-3">
            {exercises.map((ex) => (
              <Card key={ex.id} className="border border-border/40 bg-card/50 backdrop-blur-sm hover:shadow-sm transition-shadow duration-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-lg flex items-center justify-center">
                        <Dumbbell className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{ex.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{ex.muscleGroup}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setModal({ mode: 'edit', item: ex })}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteExercise(ex.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border border-dashed border-border/40 bg-muted/20">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-muted/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Dumbbell className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground mb-2">Nenhum exercício cadastrado</h3>
              <p className="text-sm text-muted-foreground mb-4">Comece adicionando seu primeiro exercício</p>
              <Button onClick={() => setModal({ mode: 'create' })} className="gap-2">
                <Dumbbell className="h-4 w-4" />
                Adicionar primeiro exercício
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Notifications Section */}
      {notificationUtils.isSupported() && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
              <Bell className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Notificações</h2>
              <p className="text-sm text-muted-foreground">Configure lembretes e alertas</p>
            </div>
          </div>

          <Card className="border border-border/40 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    notificationStatus === 'granted'
                      ? 'bg-green-500/10'
                      : notificationStatus === 'denied'
                      ? 'bg-red-500/10'
                      : 'bg-muted/30'
                  }`}>
                    <Bell className={`h-5 w-5 ${
                      notificationStatus === 'granted'
                        ? 'text-green-600'
                        : notificationStatus === 'denied'
                        ? 'text-red-600'
                        : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Status das Notificações</p>
                    <p className="text-sm text-muted-foreground">
                      {notificationStatus === 'granted' && 'Ativadas'}
                      {notificationStatus === 'denied' && 'Negadas'}
                      {notificationStatus === 'default' && 'Não solicitadas'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                {notificationStatus !== 'granted' && (
                  <Button
                    variant="outline"
                    onClick={requestNotificationPermission}
                    className="flex-1 gap-2 border-green-200 text-green-700 hover:bg-green-50"
                  >
                    <Bell className="h-4 w-4" />
                    Ativar
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={testNotification}
                  className="flex-1 gap-2"
                >
                  <Bell className="h-4 w-4" />
                  Testar
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Offline Features Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
            <Smartphone className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Modo Offline</h2>
            <p className="text-sm text-muted-foreground">Funcionalidades sem internet</p>
          </div>
        </div>

        <Card className="border border-border/40 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isOnline ? 'bg-green-500/10' : 'bg-red-500/10'
                }`}>
                  {isOnline ? (
                    <Wifi className="h-5 w-5 text-green-600" />
                  ) : (
                    <WifiOff className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">Status da Conexão</p>
                  <p className="text-sm text-muted-foreground">
                    {isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={testOffline}
              className="w-full gap-2"
            >
              <WifiOff className="h-4 w-4" />
              Testar Modo Offline
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Desconecte-se da internet e recarregue para testar
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Danger Zone */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
            <Shield className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Zona de Perigo</h2>
            <p className="text-sm text-muted-foreground">Ações irreversíveis</p>
          </div>
        </div>

        <Card className="border border-red-200/50 bg-red-50/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Apagar Todos os Dados</p>
                  <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={dangerPurge}
                className="gap-2 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
              >
                <Trash2 className="h-4 w-4" />
                Apagar Tudo
              </Button>
            </div>
          </CardContent>
        </Card>
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
          className="mt-1 w-full rounded-md border border-stone-700 px-3 py-2 text-sm"
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


