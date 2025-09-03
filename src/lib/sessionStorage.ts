/*
  Session state management with IndexedDB for training sessions
  Replaces localStorage with more robust IndexedDB storage
*/

import { get, set, del, clear } from 'idb-keyval'

export type SessionState = {
  workoutId: string
  templateId: string
  exerciseStates: Record<string, ExerciseLocalState>
  startedAt: number
  elapsed: number
  timestamp: number
  performedExerciseIds: string[]
  activeRestTimers?: Record<string, { remaining: number; total: number; wasInterrupted?: boolean }>
}

export type ExerciseLocalState = {
  sets: LocalSet[]
  isCompleted: boolean
}

export type LocalSet = {
  id: number
  reps: string
  load: string
  isCompleted: boolean
}

const SESSION_KEY_PREFIX = 'training-session:'
const BACKUP_KEY_PREFIX = 'session-backup:'

export class SessionStorageManager {
  private static instance: SessionStorageManager | null = null
  private currentWorkoutId: string | null = null
  private isSaving: boolean = false
  private saveQueue: SessionState[] = []

  static getInstance(): SessionStorageManager {
    if (!SessionStorageManager.instance) {
      SessionStorageManager.instance = new SessionStorageManager()
    }
    return SessionStorageManager.instance
  }

  // Reset instance for testing or cleanup
  static resetInstance(): void {
    SessionStorageManager.instance = null
  }

  private getSessionKey(workoutId: string): string {
    return `${SESSION_KEY_PREFIX}${workoutId}`
  }

  private getBackupKey(workoutId: string): string {
    return `${BACKUP_KEY_PREFIX}${workoutId}`
  }

  /**
   * Save current session state to IndexedDB with queuing to prevent race conditions
   */
  async saveSession(state: SessionState): Promise<void> {
    // Add to queue if currently saving
    if (this.isSaving) {
      this.saveQueue.push(state)
      return
    }

    this.isSaving = true

    try {
      await this._performSave(state)

      // Process any queued saves
      while (this.saveQueue.length > 0) {
        const queuedState = this.saveQueue.shift()!
        await this._performSave(queuedState)
      }
    } catch (error) {
      console.error('Failed to save session to IndexedDB:', error)
      // Fallback to localStorage
      this.saveToLocalStorageFallback(state)
    } finally {
      this.isSaving = false
    }
  }

  private async _performSave(state: SessionState): Promise<void> {
    const sessionKey = this.getSessionKey(state.workoutId)
    await set(sessionKey, {
      ...state,
      timestamp: Date.now()
    })

    // Also create a backup
    const backupKey = this.getBackupKey(state.workoutId)
    await set(backupKey, {
      ...state,
      timestamp: Date.now(),
      isBackup: true
    })

    this.currentWorkoutId = state.workoutId

    console.log('Session saved to IndexedDB:', state.workoutId)
  }

  /**
   * Load session state from IndexedDB
   */
  async loadSession(workoutId: string): Promise<SessionState | null> {
    try {
      const sessionKey = this.getSessionKey(workoutId)
      const state = await get<SessionState>(sessionKey)
      
      if (state && this.validateSessionState(state)) {
        console.log('Session loaded from IndexedDB:', workoutId)
        return state
      }

      // Try backup if main session is invalid
      const backupKey = this.getBackupKey(workoutId)
      const backupState = await get<SessionState>(backupKey)
      
      if (backupState && this.validateSessionState(backupState)) {
        console.log('Session loaded from backup in IndexedDB:', workoutId)
        return backupState
      }

      return null
    } catch (error) {
      console.error('Failed to load session from IndexedDB:', error)
      // Fallback to localStorage
      return this.loadFromLocalStorageFallback(workoutId)
    }
  }

  /**
   * Clear session data from IndexedDB
   */
  async clearSession(workoutId: string): Promise<void> {
    try {
      const sessionKey = this.getSessionKey(workoutId)
      const backupKey = this.getBackupKey(workoutId)
      
      await Promise.all([
        del(sessionKey),
        del(backupKey)
      ])
      
      // Also clear localStorage fallbacks
      try {
        localStorage.removeItem(`session-draft:${workoutId}`)
        localStorage.removeItem(`session-backup:${workoutId}`)
      } catch {}
      
      if (this.currentWorkoutId === workoutId) {
        this.currentWorkoutId = null
      }
      
      console.log('Session cleared from IndexedDB:', workoutId)
    } catch (error) {
      console.error('Failed to clear session from IndexedDB:', error)
    }
  }

  /**
   * Clear all session data (for cleanup)
   */
  async clearAllSessions(): Promise<void> {
    try {
      await clear()
      
      // Also clear localStorage fallbacks
      const keys = Object.keys(localStorage)
      for (const key of keys) {
        if (key.startsWith('session-draft:') || key.startsWith('session-backup:')) {
          localStorage.removeItem(key)
        }
      }
      
      this.currentWorkoutId = null
      console.log('All sessions cleared from IndexedDB')
    } catch (error) {
      console.error('Failed to clear all sessions:', error)
    }
  }

  /**
   * Create emergency backup before page unload
   */
  async createEmergencyBackup(state: SessionState): Promise<void> {
    try {
      const emergencyKey = `emergency-backup:${state.workoutId}`
      await set(emergencyKey, {
        ...state,
        timestamp: Date.now(),
        isEmergency: true
      })
      console.log('Emergency backup created:', state.workoutId)
    } catch (error) {
      console.error('Failed to create emergency backup:', error)
      // Fallback to localStorage
      try {
        const backupKey = `session-backup:${state.workoutId}`
        localStorage.setItem(backupKey, JSON.stringify({
          states: state.exerciseStates,
          startedAt: state.startedAt,
          timestamp: Date.now(),
          elapsed: state.elapsed,
          templateId: state.templateId,
          interrupted: true
        }))
      } catch {}
    }
  }

  /**
   * Recover from emergency backup
   */
  async recoverFromEmergencyBackup(workoutId: string): Promise<SessionState | null> {
    try {
      const emergencyKey = `emergency-backup:${workoutId}`
      const backup = await get<SessionState>(emergencyKey)
      
      if (backup && this.validateSessionState(backup)) {
        // Clean up emergency backup after recovery
        await del(emergencyKey)
        console.log('Recovered from emergency backup:', workoutId)
        return backup
      }
      
      return null
    } catch (error) {
      console.error('Failed to recover from emergency backup:', error)
      return null
    }
  }

  /**
   * Get list of active sessions (for cleanup)
   */
  async getActiveSessions(): Promise<string[]> {
    try {
      // This is a simplified approach - in a full implementation,
      // you might want to iterate through IndexedDB keys
      return this.currentWorkoutId ? [this.currentWorkoutId] : []
    } catch (error) {
      console.error('Failed to get active sessions:', error)
      return []
    }
  }

  /**
   * Validate session state structure
   */
  private validateSessionState(state: SessionState): boolean {
    if (!state || typeof state !== 'object') return false
    if (!state.workoutId || !state.templateId) return false
    if (typeof state.startedAt !== 'number') return false
    if (!state.exerciseStates || typeof state.exerciseStates !== 'object') return false
    if (!Array.isArray(state.performedExerciseIds)) return false
    
    // Validate exercise states structure
    return Object.values(state.exerciseStates).every(exerciseState => {
      if (!exerciseState || typeof exerciseState !== 'object') return false
      if (typeof exerciseState.isCompleted !== 'boolean') return false
      if (!Array.isArray(exerciseState.sets)) return false
      
      return exerciseState.sets.every(set => {
        if (!set || typeof set !== 'object') return false
        if (typeof set.id !== 'number') return false
        if (typeof set.reps !== 'string') return false
        if (typeof set.load !== 'string') return false
        if (typeof set.isCompleted !== 'boolean') return false
        return true
      })
    })
  }

  /**
   * Fallback to localStorage for compatibility
   */
  private saveToLocalStorageFallback(state: SessionState): void {
    try {
      const key = `session-draft:${state.workoutId}`
      localStorage.setItem(key, JSON.stringify(state.exerciseStates))
    } catch (error) {
      console.warn('Failed to save to localStorage fallback:', error)
    }
  }

  /**
   * Load from localStorage fallback
   */
  private loadFromLocalStorageFallback(workoutId: string): SessionState | null {
    try {
      const key = `session-draft:${workoutId}`
      const raw = localStorage.getItem(key)
      if (raw) {
        const exerciseStates = JSON.parse(raw)
        return {
          workoutId,
          templateId: '',
          exerciseStates,
          startedAt: Date.now(),
          elapsed: 0,
          timestamp: Date.now(),
          performedExerciseIds: []
        }
      }
    } catch (error) {
      console.warn('Failed to load from localStorage fallback:', error)
    }
    return null
  }
}

export const sessionStorage = SessionStorageManager.getInstance()
