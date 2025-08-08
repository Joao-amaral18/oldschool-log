export type UserSession = {
    userId: string
    username: string
}

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

export type Exercise = {
    id: string
    name: string
    muscleGroup: MuscleGroup
}

export type TemplateExercise = {
    id: string
    exerciseId: string
    sets: number
    reps: number
    load: number
    restSec: number
}

export type WorkoutTemplate = {
    id: string
    name: string
    exercises: TemplateExercise[]
    created_at: string
}

export type PerformedSet = {
    id: string
    reps: number
    load: number
    kind: 'warmup' | 'recognition' | 'working'
}

export type PerformedExercise = {
    id: string
    exerciseId: string
    templateExerciseId: string | null
    sets: PerformedSet[]
}

export type WorkoutHistory = {
    id: string
    startedAt: string
    finishedAt: string | null
    durationSec: number | null
    exercises: PerformedExercise[]
}
