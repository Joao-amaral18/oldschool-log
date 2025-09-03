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
    sets: string | number
    reps: string | number
    load: number
    restSec: string | number
}

export type WorkoutTemplate = {
    id: string
    name: string
    exercises: TemplateExercise[]
    created_at: string
}

export type PerformedSet = {
    id: string
    reps: string | number
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

export type EnrichedWorkoutHistory = {
    id: string
    templateName: string | null
    startedAt: string
    finishedAt: string | null
    durationSec: number | null
    totalSets: number
    totalVolume: number
    exercises: Array<{
        id: string
        exerciseId?: string
        name: string
        muscleGroup: string
        sets: Array<{
            reps: string
            load: number | null
            weight?: number
            kind: 'warmup' | 'recognition' | 'working'
            doneAt: string
        }>
    }>
    notes?: string
}
