import type { Exercise, WorkoutTemplate, WorkoutHistory } from '@/types'

export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : fallback
    } catch {
      return fallback
    }
  },
  set<T>(key: string, value: T) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {}
  },
  remove(key: string) {
    try {
      localStorage.removeItem(key)
    } catch {}
  },
}

export function userKey(userId: string, domain: 'exercises' | 'templates' | 'history') {
  return `${domain}_${userId}`
}

export function bootstrapUserData(userId: string, defaultExercises: Exercise[]) {
  const exKey = userKey(userId, 'exercises')
  const templatesKey = userKey(userId, 'templates')
  const historyKey = userKey(userId, 'history')

  if (!localStorage.getItem(exKey)) storage.set<Exercise[]>(exKey, defaultExercises)
  if (!localStorage.getItem(templatesKey)) storage.set<WorkoutTemplate[]>(templatesKey, [])
  if (!localStorage.getItem(historyKey)) storage.set<WorkoutHistory[]>(historyKey, [])
}


