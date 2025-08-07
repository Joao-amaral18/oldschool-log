export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'legs'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'glutes'
  | 'core'
  | 'full-body'
  | 'other'

export interface Exercise {
  id: string
  name: string
  muscleGroup: MuscleGroup
}

export interface TemplateExercise {
  id: string
  exerciseId: string
  sets: number
  reps: number
  load: number
  restSec: number
}

export interface WorkoutTemplate {
  id: string
  name: string
  exercises: TemplateExercise[]
}

export interface PerformedSet {
  id: string
  plannedReps?: number
  plannedLoad?: number
  reps: number
  load: number
  kind: SetKind
  doneAt: number
}

export interface PerformedExercise {
  templateExerciseId: string
  exerciseId: string
  sets: PerformedSet[]
}

export interface WorkoutHistory {
  id: string
  templateId: string
  startedAt: number
  finishedAt?: number
  durationSec?: number
  notes?: string
  exercises: PerformedExercise[]
}

export interface UserSession {
  userId: string
  username: string
}

export type StorageKeys =
  | `userId`
  | `username_${string}`
  | `exercises_${string}`
  | `templates_${string}`
  | `history_${string}`

export const defaults = {
  exercises: [
    { id: 'ex_pushup', name: 'Push-up', muscleGroup: 'chest' as MuscleGroup },
    { id: 'ex_squat', name: 'Bodyweight Squat', muscleGroup: 'legs' as MuscleGroup },
    { id: 'ex_row', name: 'Inverted Row', muscleGroup: 'back' as MuscleGroup },
  ] satisfies Exercise[],
}

export type SetKind = 'warmup' | 'recognition' | 'working'


