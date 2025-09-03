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
}

export function useRealtimeSync(options: RealtimeSyncOptions = {}) {
  const { session } = useAuth()
  const { workoutId, onSessionUpdate, onSetUpdate, onConflictDetected } = options

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
    
    toast.warning('Conflito de sincronização detectado', {
      description: 'Verifique se há outra sessão ativa em outro dispositivo',
      duration: 5000
    })
  }, [onConflictDetected])

  useEffect(() => {
    if (!session?.userId || !workoutId) return

    console.log('Setting up realtime sync for workout:', workoutId)

    let setsChannel: any = null
    let workoutChannel: any = null
    let presenceChannel: any = null
    let isSubscribed = false

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
            if (status === 'SUBSCRIBED') {
              isSubscribed = true
            }
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
              const users = Object.keys(state)

              if (users.length > 1) {
                handleConflict({
                  type: 'multiple_sessions',
                  users: users,
                  workoutId
                })
              }
            } catch (error) {
              console.error('Error handling presence sync:', error)
            }
          })
          .subscribe(async (status: string) => {
            console.log('Presence channel status:', status)
            if (status === 'SUBSCRIBED') {
              try {
                // Track this session's presence
                await presenceChannel.track({
                  user_id: session.userId,
                  username: session.username,
                  online_at: new Date().toISOString(),
                  workout_id: workoutId
                })
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

  return {
    triggerSync
  }
}
