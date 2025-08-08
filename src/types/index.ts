export type UserSession = {
    userId: string
    username: string
}

export type Exercise = {
    id: string
    name: string
    muscleGroup: 'peito' | 'costas' | 'pernas' | 'ombros' | 'biceps' | 'triceps' | 'abdomen'
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
