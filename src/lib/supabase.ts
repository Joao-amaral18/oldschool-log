import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
})

export type Tables = {
    exercises: {
        Row: { id: string; user_id: string; name: string; muscle_group: string; created_at: string; updated_at: string }
        Insert: { id?: string; user_id?: string; name: string; muscle_group: string }
        Update: Partial<Tables['exercises']['Insert']>
    }
    templates: {
        Row: { id: string; user_id: string; name: string; created_at: string; updated_at: string }
        Insert: { id?: string; user_id?: string; name: string }
        Update: Partial<Tables['templates']['Insert']>
    }
    template_exercises: {
        Row: { id: string; user_id: string; template_id: string; exercise_id: string; position: number; sets: number; reps: number; load: number; rest_sec: number; created_at: string; updated_at: string }
        Insert: { id?: string; user_id?: string; template_id: string; exercise_id: string; position?: number; sets: number; reps: number; load: number; rest_sec: number }
        Update: Partial<Tables['template_exercises']['Insert']>
    }
    workout_histories: {
        Row: { id: string; user_id: string; template_id: string | null; started_at: string; finished_at: string | null; duration_sec: number | null; notes: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; user_id?: string; template_id?: string | null; started_at?: string; finished_at?: string | null; duration_sec?: number | null; notes?: string | null }
        Update: Partial<Tables['workout_histories']['Insert']>
    }
    performed_exercises: {
        Row: { id: string; user_id: string; workout_id: string; exercise_id: string; template_exercise_id: string | null; position: number; created_at: string; updated_at: string }
        Insert: { id?: string; user_id?: string; workout_id: string; exercise_id: string; template_exercise_id?: string | null; position?: number }
        Update: Partial<Tables['performed_exercises']['Insert']>
    }
    performed_sets: {
        Row: { id: string; user_id: string; performed_exercise_id: string; planned_reps: number | null; planned_load: number | null; reps: number; load: number; kind: 'warmup' | 'recognition' | 'working'; done_at: string; created_at: string; updated_at: string }
        Insert: { id?: string; user_id?: string; performed_exercise_id: string; planned_reps?: number | null; planned_load?: number | null; reps: number; load: number; kind?: 'warmup' | 'recognition' | 'working'; done_at?: string }
        Update: Partial<Tables['performed_sets']['Insert']>
    }
}
