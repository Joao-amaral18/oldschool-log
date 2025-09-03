/*
  Debug component for troubleshooting sync issues
  Remove this component after debugging is complete
*/

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface SyncDebuggerProps {
  workoutId?: string
}

export function SyncDebugger({ workoutId }: SyncDebuggerProps) {
  const { session } = useAuth()
  const [presenceState, setPresenceState] = useState<any>(null)
  const [isDebugMode, setIsDebugMode] = useState(false)

  const { clearPresence, triggerSync } = useRealtimeSync({
    workoutId,
    disableConflictNotifications: true,
    onConflictDetected: (payload) => {
      console.log('Conflict detected:', payload)
      toast.info(`Conflito detectado: ${payload.type}`)
    }
  })

  const checkPresenceState = async () => {
    if (!workoutId) return

    try {
      const channel = supabase.channel(`workout-presence-${workoutId}`)
      await channel.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          const state = channel.presenceState()
          setPresenceState(state)
          console.log('Current presence state:', state)

          // Count unique users vs sessions
          const uniqueUsers = new Set()
          const userSessions = new Map()

          Object.entries(state).forEach(([, presenceData]: [string, any]) => {
            if (Array.isArray(presenceData) && presenceData.length > 0) {
              const userData = presenceData[0]
              if (userData.user_id) {
                uniqueUsers.add(userData.user_id)
                const currentCount = userSessions.get(userData.user_id) || 0
                userSessions.set(userData.user_id, currentCount + presenceData.length)
              }
            }
          })

          toast.info(`Usuários únicos: ${uniqueUsers.size}, Sessões totais: ${Object.values(state).flat().length}`)
        }
      })
    } catch (error) {
      console.error('Failed to check presence:', error)
      toast.error('Erro ao verificar presença')
    }
  }

  const clearLocalStorage = () => {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.includes('session') || key.includes('device') || key.includes('sync')) {
          localStorage.removeItem(key)
        }
      })
      toast.success('LocalStorage de sessão limpo')
    } catch (error) {
      toast.error('Erro ao limpar localStorage')
    }
  }

  const cleanupDatabase = async () => {
    try {
      const [sessionCleanup, operationsCleanup] = await Promise.all([
        api.cleanupOldSessionStates(),
        api.cleanupProcessedOperations()
      ])
      toast.success(`Limpeza concluída: ${sessionCleanup} sessões, ${operationsCleanup} operações`)
    } catch (error) {
      console.error('Failed to cleanup database:', error)
      toast.error('Erro ao limpar banco de dados')
    }
  }

  if (!isDebugMode) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsDebugMode(true)}
        className="fixed bottom-4 right-4 z-50"
      >
        🐛 Debug
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 z-50 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Sync Debugger</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsDebugMode(false)}>
            ✕
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" onClick={checkPresenceState} disabled={!workoutId}>
            Check Presence
          </Button>
          <Button size="sm" onClick={clearPresence} disabled={!workoutId}>
            Clear Presence
          </Button>
          <Button size="sm" onClick={triggerSync}>
            Trigger Sync
          </Button>
          <Button size="sm" onClick={clearLocalStorage} variant="destructive">
            Clear Local
          </Button>
          <Button size="sm" onClick={cleanupDatabase} variant="outline">
            Cleanup DB
          </Button>
        </div>

        <div className="text-xs space-y-1">
          <div>User: <Badge variant="outline">{session?.userId || 'none'}</Badge></div>
          <div>Workout: <Badge variant="outline">{workoutId || 'none'}</Badge></div>
          {presenceState && (
            <div>
              Presence: {Object.keys(presenceState).length} keys,
              {Object.values(presenceState).flat().length} sessions
            </div>
          )}
        </div>

        {presenceState && (
          <details className="text-xs">
            <summary>Presence Details</summary>
            <pre className="mt-1 p-1 bg-muted rounded text-xs overflow-auto max-h-32">
              {JSON.stringify(presenceState, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  )
}
