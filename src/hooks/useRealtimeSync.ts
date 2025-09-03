/*
  Realtime synchronization hook for Supabase
  Handles real-time updates for training sessions
*/

import { useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

type RealtimeSyncOptions = {
  workoutId?: string
  onSessionUpdate?: (payload: any) => void
  onSetUpdate?: (payload: any) => void
  onConflictDetected?: (payload: any) => void
  disableConflictNotifications?: boolean
}

export function useRealtimeSync(options: RealtimeSyncOptions = {}) {
  const { session } = useAuth()
  const { workoutId, onSessionUpdate, onSetUpdate, onConflictDetected, disableConflictNotifications = false } = options

  // Generate unique device ID for this session
  const deviceId = useCallback(() => {
    let id = localStorage.getItem('device-id')
    if (!id) {
      id = `${session?.userId || 'anonymous'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('device-id', id)
    }
    return id
  }, [session?.userId])

  const handleRealtimeUpdate = useCallback((payload: any) => {
    console.log('Realtime update received:', payload)
    
    switch (payload.eventType) {
      case 'INSERT':
        if (payload.table === 'performed_sets') {
          onSetUpdate?.(payload)
          toast.info('Nova série sincronizada', { 
            description: 'Dados atualizados em tempo real'
          })
        }
        break
        
      case 'UPDATE':
        if (payload.table === 'workout_histories') {
          onSessionUpdate?.(payload)
        }
        break
        
      case 'DELETE':
        // Handle deletions if needed
        break
        
      default:
        console.log('Unhandled realtime event:', payload.eventType)
    }
  }, [onSessionUpdate, onSetUpdate])

  const handleConflict = useCallback((payload: any) => {
    console.warn('Realtime conflict detected:', payload)
    onConflictDetected?.(payload)

    // Only show toast if notifications are not disabled
    if (!disableConflictNotifications) {
      if (payload.type === 'multiple_users') {
        toast.warning('Múltiplos usuários detectados', {
          description: 'Outro usuário está editando este treino simultaneamente',
          duration: 8000
        })
      } else {
        toast.warning('Conflito de sincronização detectado', {
          description: 'Verifique se há outra sessão ativa',
          duration: 5000
        })
      }
    }
  }, [onConflictDetected, disableConflictNotifications])

  useEffect(() => {
    if (!session?.userId || !workoutId) return

    console.log('Setting up realtime sync for workout:', workoutId)

    let setsChannel: any = null
    let workoutChannel: any = null
    let presenceChannel: any = null

    const setupSubscriptions = async () => {
      try {
        // Subscribe to performed_sets changes for this workout
        setsChannel = supabase
          .channel(`workout-sets-${workoutId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'performed_sets',
              filter: `performed_exercise_id=in.(select id from performed_exercises where workout_id=eq.${workoutId})`
            },
            (payload: any) => {
              try {
                handleRealtimeUpdate({
                  ...payload,
                  table: 'performed_sets'
                })
              } catch (error) {
                console.error('Error handling realtime update:', error)
              }
            }
          )
          .subscribe((status: string) => {
            console.log('Sets channel status:', status)
          })

        // Subscribe to workout_histories changes
        workoutChannel = supabase
          .channel(`workout-${workoutId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'workout_histories',
              filter: `id=eq.${workoutId}`
            },
            (payload: any) => {
              try {
                handleRealtimeUpdate({
                  ...payload,
                  table: 'workout_histories'
                })
              } catch (error) {
                console.error('Error handling workout update:', error)
              }
            }
          )
          .subscribe((status: string) => {
            console.log('Workout channel status:', status)
          })

        // Subscribe to presence for conflict detection
        presenceChannel = supabase
          .channel(`workout-presence-${workoutId}`)
          .on('presence', { event: 'sync' }, () => {
            try {
              const state = presenceChannel.presenceState()
              console.log('Presence state:', state)

              // Get unique users (not counting multiple sessions from same user)
              const uniqueUsers = new Set()
              const userSessions = new Map()

              Object.entries(state).forEach(([, presenceData]: [string, any]) => {
                if (Array.isArray(presenceData) && presenceData.length > 0) {
                  const userData = presenceData[0] // Take first presence entry
                  if (userData.user_id) {
                    uniqueUsers.add(userData.user_id)

                    // Count sessions per user
                    const currentCount = userSessions.get(userData.user_id) || 0
                    userSessions.set(userData.user_id, currentCount + presenceData.length)
                  }
                }
              })

              // Only trigger conflict if there are different users (not just multiple sessions of same user)
              const uniqueUserIds = Array.from(uniqueUsers)
              if (uniqueUserIds.length > 1) {
                console.warn('Multiple users detected:', uniqueUserIds)
                handleConflict({
                  type: 'multiple_users',
                  users: uniqueUserIds,
                  userSessions: Object.fromEntries(userSessions),
                  workoutId
                })
              } else if (uniqueUserIds.length === 1) {
                // Check if same user has multiple sessions (tabs/windows)
                const userId = uniqueUserIds[0]
                const sessionCount = userSessions.get(userId) || 0
                if (sessionCount > 1) {
                  console.log(`User ${userId} has ${sessionCount} active sessions (tabs/windows)`)
                  // This is normal behavior, don't trigger conflict
                }
              }
            } catch (error) {
              console.error('Error handling presence sync:', error)
            }
          })
          .subscribe(async (status: string) => {
            console.log('Presence channel status:', status)
            if (status === 'SUBSCRIBED') {
              try {
                // Track this session's presence with device ID
                await presenceChannel.track({
                  user_id: session.userId,
                  username: session.username,
                  device_id: deviceId(),
                  online_at: new Date().toISOString(),
                  workout_id: workoutId
                })
                console.log('Presence tracked for user:', session.userId, 'device:', deviceId())
              } catch (error) {
                console.error('Error tracking presence:', error)
              }
            }
          })

      } catch (error) {
        console.error('Error setting up realtime subscriptions:', error)
      }
    }

    setupSubscriptions()

    return () => {
      console.log('Cleaning up realtime subscriptions')
      try {
        if (setsChannel) setsChannel.unsubscribe()
        if (workoutChannel) workoutChannel.unsubscribe()
        if (presenceChannel) presenceChannel.unsubscribe()
      } catch (error) {
        console.error('Error cleaning up subscriptions:', error)
      }
    }
  }, [session?.userId, workoutId, handleRealtimeUpdate, handleConflict])

  // Method to manually trigger sync
  const triggerSync = useCallback(async () => {
    if (!session?.userId) return

    try {
      // Trigger background sync via service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        registration.active?.postMessage({
          type: 'REGISTER_SYNC',
          tag: 'sync-training-sets'
        })
        
        registration.active?.postMessage({
          type: 'REGISTER_SYNC',
          tag: 'sync-training-session'
        })
      }
      
      toast.success('Sincronização iniciada')
    } catch (error) {
      console.error('Failed to trigger sync:', error)
      toast.error('Falha ao iniciar sincronização')
    }
  }, [session?.userId])

  // Method to manually clear presence state (for debugging)
  const clearPresence = useCallback(async () => {
    if (!workoutId) return

    try {
      const presenceChannel = supabase.channel(`workout-presence-${workoutId}`)
      await presenceChannel.subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          // Clear all presence state for this user
          await presenceChannel.untrack()
          console.log('Presence cleared for workout:', workoutId)
          toast.success('Estado de presença limpo')
        }
      })
    } catch (error) {
      console.error('Failed to clear presence:', error)
      toast.error('Falha ao limpar estado de presença')
    }
  }, [workoutId])

  return {
    triggerSync,
    clearPresence
  }
}
