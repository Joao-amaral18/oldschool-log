import { supabase, type Tables } from '@/lib/supabase'
import type { Exercise, TemplateExercise, WorkoutTemplate } from '@/types'

function mapExerciseRow(row: Tables['exercises']['Row']): Exercise {
    return { id: row.id, name: row.name, muscleGroup: row.muscle_group as Exercise['muscleGroup'] }
}

function mapTemplateExerciseRow(row: Tables['template_exercises']['Row']): TemplateExercise {
    return {
        id: row.id,
        exerciseId: row.exercise_id,
        sets: row.sets,
        reps: row.reps,
        load: Number(row.load) || 0,
        restSec: row.rest_sec,
    }
}

export const api = {
    // Profiles
    async upsertProfile(username: string) {
        const { data: user } = await supabase.auth.getUser()
        if (!user?.user) throw new Error('No auth user')
        const { error } = await supabase.from('profiles').upsert({ user_id: user.user.id, username }).eq('user_id', user.user.id)
        if (error) throw error
        return { userId: user.user.id, username }
    },
    async getProfile() {
        const { data: user } = await supabase.auth.getUser()
        if (!user?.user) return null
        const { data, error } = await supabase.from('profiles').select('*').eq('user_id', user.user.id).single()
        if (error) return null
        return { userId: user.user.id, username: data.username as string }
    },
    async findEmailByUsername(username: string): Promise<string | null> {
        // First find the user_id associated with this username
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('username', username)
            .single()
        if (error || !profile) return null

        // Get the email from auth.users - we need to call this via RPC since auth.users is not directly accessible
        const { data, error: rpcError } = await supabase.rpc('get_user_email_by_id', { user_id: profile.user_id })
        if (rpcError || !data) return null

        return data
    },

    // Seed default exercises if none
    async seedDefaultExercises(defaults: Exercise[]) {
        const { count, error } = await supabase.from('exercises').select('*', { count: 'exact', head: true })
        if (error) throw error
        if ((count || 0) === 0 && defaults.length > 0) {
            const payload = defaults.map((e) => ({ name: e.name, muscle_group: e.muscleGroup }))
            const { error: insErr } = await supabase.from('exercises').insert(payload)
            if (insErr) throw insErr
        }
    },

    // Exercises CRUD
    async listExercises(): Promise<Exercise[]> {
        const { data, error } = await supabase.from('exercises').select('*').order('name', { ascending: true })
        if (error) throw error
        return (data || []).map(mapExerciseRow)
    },
    async getExercisesByIds(ids: string[]): Promise<Exercise[]> {
        if (ids.length === 0) return []
        const { data, error } = await supabase.from('exercises').select('*').in('id', ids)
        if (error) throw error
        return (data || []).map(mapExerciseRow)
    },
    async createExercise(payload: Pick<Exercise, 'name' | 'muscleGroup'>): Promise<Exercise> {
        const { data, error } = await supabase
            .from('exercises')
            .insert({ name: payload.name, muscle_group: payload.muscleGroup })
            .select('*')
            .single()
        if (error) throw error
        return mapExerciseRow(data)
    },
    async updateExercise(id: string, patch: Partial<Pick<Exercise, 'name' | 'muscleGroup'>>): Promise<Exercise> {
        const { data, error } = await supabase
            .from('exercises')
            .update({
                ...(patch.name ? { name: patch.name } : {}),
                ...(patch.muscleGroup ? { muscle_group: patch.muscleGroup } : {}),
            })
            .eq('id', id)
            .select('*')
            .single()
        if (error) throw error
        return mapExerciseRow(data)
    },
    async deleteExercise(id: string) {
        const { error } = await supabase.from('exercises').delete().eq('id', id)
        if (error) throw error
    },

    // Templates
    async listTemplates(): Promise<WorkoutTemplate[]> {
        const { data: templates, error } = await supabase.from('templates').select('*').order('created_at', { ascending: false })
        if (error) throw error
        const ids = (templates || []).map((t) => t.id)
        if (ids.length === 0) return []
        const { data: tex, error: texErr } = await supabase
            .from('template_exercises')
            .select('*')
            .in('template_id', ids)
            .order('position', { ascending: true })
        if (texErr) throw texErr
        const grouped: Record<string, TemplateExercise[]> = {}
        for (const row of tex || []) {
            const item = mapTemplateExerciseRow(row)
                ; (grouped[row.template_id] ||= []).push(item)
        }
        return (templates || []).map((t) => ({ id: t.id, name: t.name, exercises: grouped[t.id] || [] }))
    },
    async getTemplate(id: string): Promise<WorkoutTemplate | null> {
        const { data: t, error } = await supabase.from('templates').select('*').eq('id', id).single()
        if (error) return null
        const { data: tex, error: texErr } = await supabase
            .from('template_exercises')
            .select('*')
            .eq('template_id', id)
            .order('position', { ascending: true })
        if (texErr) throw texErr
        return { id: t.id, name: t.name, exercises: (tex || []).map(mapTemplateExerciseRow) }
    },
    async createTemplate(name: string): Promise<WorkoutTemplate> {
        const { data, error } = await supabase.from('templates').insert({ name }).select('*').single()
        if (error) throw error
        return { id: data.id, name: data.name, exercises: [] }
    },
    async createTemplateWithExercises(name: string, exercises: TemplateExercise[]) {
        const t = await api.createTemplate(name)
        if (exercises.length > 0) {
            const payload = exercises.map((e, idx) => ({
                template_id: t.id,
                exercise_id: e.exerciseId,
                position: idx,
                sets: e.sets,
                reps: e.reps,
                load: e.load,
                rest_sec: e.restSec,
            }))
            const { error } = await supabase.from('template_exercises').insert(payload)
            if (error) throw error
            t.exercises = exercises
        }
        return t
    },
    async deleteTemplate(id: string) {
        const { error } = await supabase.from('templates').delete().eq('id', id)
        if (error) throw error
    },
    async duplicateTemplate(id: string): Promise<WorkoutTemplate | null> {
        const base = await api.getTemplate(id)
        if (!base) return null
        return api.createTemplateWithExercises(`${base.name} (cópia)`, base.exercises)
    },
    async saveTemplateFull(template: WorkoutTemplate) {
        // Update template name
        await supabase.from('templates').update({ name: template.name }).eq('id', template.id)
        // Fetch existing
        const { data: existing } = await supabase
            .from('template_exercises')
            .select('id')
            .eq('template_id', template.id)
        const existingIds = new Set((existing || []).map((r) => r.id))
        const newIds = new Set(template.exercises.map((e) => e.id))
        // Upsert/update
        const upserts = template.exercises.map((e, idx) => ({
            id: e.id,
            template_id: template.id,
            exercise_id: e.exerciseId,
            position: idx,
            sets: e.sets,
            reps: e.reps,
            load: e.load,
            rest_sec: e.restSec,
        }))
        if (upserts.length > 0) {
            const { error } = await supabase.from('template_exercises').upsert(upserts, { onConflict: 'id' })
            if (error) throw error
        }
        // Delete removed
        const toDelete = [...existingIds].filter((id) => !newIds.has(id))
        if (toDelete.length > 0) {
            const { error } = await supabase.from('template_exercises').delete().in('id', toDelete)
            if (error) throw error
        }
    },

    // Workout flow
    async startWorkout(template: WorkoutTemplate) {
        const { data: wh, error } = await supabase
            .from('workout_histories')
            .insert({ template_id: template.id })
            .select('*')
            .single()
        if (error) throw error
        // Pre-create performed_exercises for each template exercise
        const payload = template.exercises.map((te, idx) => ({
            workout_id: wh.id,
            exercise_id: te.exerciseId,
            template_exercise_id: te.id,
            position: idx,
        }))
        let mapping: Record<string, string> = {}
        if (payload.length > 0) {
            const { data: pes, error: peErr } = await supabase.from('performed_exercises').insert(payload).select('*')
            if (peErr) throw peErr
            mapping = Object.fromEntries((pes || []).map((row) => [row.template_exercise_id || '', row.id]))
        }
        return { workoutId: wh.id, performedMapByTemplateExerciseId: mapping, startedAt: wh.started_at }
    },
    async addPerformedExercise(workoutId: string, exerciseId: string, position: number, templateExerciseId?: string | null) {
        const { data, error } = await supabase
            .from('performed_exercises')
            .insert({ workout_id: workoutId, exercise_id: exerciseId, position, template_exercise_id: templateExerciseId ?? null })
            .select('*')
            .single()
        if (error) throw error
        return data.id
    },
    async addPerformedSet(performedExerciseId: string, setData: { reps: number; load: number; kind: 'warmup' | 'recognition' | 'working'; plannedReps?: number | null; plannedLoad?: number | null }) {
        const { error } = await supabase.from('performed_sets').insert({
            performed_exercise_id: performedExerciseId,
            reps: setData.reps,
            load: setData.load,
            kind: setData.kind,
            planned_reps: setData.plannedReps ?? null,
            planned_load: setData.plannedLoad ?? null,
        })
        if (error) throw error
    },
    async finishWorkout(workoutId: string, startedAt: number) {
        const finishedAt = new Date()
        const started = new Date(startedAt)
        const duration = Math.max(0, Math.floor((finishedAt.getTime() - started.getTime()) / 1000))
        const { error } = await supabase
            .from('workout_histories')
            .update({ finished_at: finishedAt.toISOString(), duration_sec: duration })
            .eq('id', workoutId)
        if (error) throw error
    },
    async purgeMyData() {
        const { error } = await supabase.rpc('purge_my_data')
        if (error) throw error
    },

    // Analytics helpers
    async getSetsForWorkouts(workoutIds: string[]): Promise<Array<{ workoutId: string; startedAt: string; exerciseId: string; reps: number; load: number }>> {
        if (workoutIds.length === 0) return []
        // Fetch performed_exercises for these workouts
        const { data: pes, error: peErr } = await supabase
            .from('performed_exercises')
            .select('id, workout_id, exercise_id')
            .in('workout_id', workoutIds)
        if (peErr) throw peErr
        const peIds = (pes || []).map((r) => r.id)
        if (peIds.length === 0) return []
        // Fetch performed_sets for these performed exercises
        const { data: psets, error: psErr } = await supabase
            .from('performed_sets')
            .select('performed_exercise_id, reps, load')
            .in('performed_exercise_id', peIds)
        if (psErr) throw psErr
        // Fetch workouts to get started_at
        const { data: workouts, error: wErr } = await supabase
            .from('workout_histories')
            .select('id, started_at')
            .in('id', workoutIds)
        if (wErr) throw wErr
        const startedByWorkout: Record<string, string> = {}
        for (const w of workouts || []) startedByWorkout[w.id] = w.started_at as unknown as string
        // Build results
        const byPe: Record<string, { workout_id: string; exercise_id: string }> = Object.fromEntries(
            (pes || []).map((r) => [r.id, { workout_id: r.workout_id, exercise_id: r.exercise_id }])
        )
        const result: Array<{ workoutId: string; startedAt: string; exerciseId: string; reps: number; load: number }> = []
        for (const s of psets || []) {
            const meta = byPe[s.performed_exercise_id]
            if (!meta) continue
            result.push({
                workoutId: meta.workout_id,
                startedAt: startedByWorkout[meta.workout_id],
                exerciseId: meta.exercise_id,
                reps: s.reps as number,
                load: Number(s.load) || 0,
            })
        }
        return result
    },

    async listExerciseSetsHistory(exerciseId: string): Promise<Array<{ date: string; workoutId: string; reps: number; load: number }>> {
        // All performed exercises with this exerciseId
        const { data: pes, error: peErr } = await supabase
            .from('performed_exercises')
            .select('id, workout_id')
            .eq('exercise_id', exerciseId)
        if (peErr) throw peErr
        const peIds = (pes || []).map((r) => r.id)
        if (peIds.length === 0) return []
        // Sets for these performed_exercises
        const { data: psets, error: psErr } = await supabase
            .from('performed_sets')
            .select('performed_exercise_id, reps, load')
            .in('performed_exercise_id', peIds)
        if (psErr) throw psErr
        // Fetch workouts to get date
        const workoutIds = Array.from(new Set((pes || []).map((r) => r.workout_id)))
        const { data: workouts, error: wErr } = await supabase
            .from('workout_histories')
            .select('id, started_at')
            .in('id', workoutIds)
        if (wErr) throw wErr
        const startedByWorkout: Record<string, string> = {}
        for (const w of workouts || []) startedByWorkout[w.id] = w.started_at as unknown as string
        const peToWorkout: Record<string, string> = Object.fromEntries((pes || []).map((r) => [r.id, r.workout_id]))
        return (psets || []).map((s) => ({
            workoutId: peToWorkout[s.performed_exercise_id],
            date: startedByWorkout[peToWorkout[s.performed_exercise_id]],
            reps: s.reps as number,
            load: Number(s.load) || 0,
        }))
    },
    // History
    async listHistories(): Promise<Array<{ id: string; templateName: string | null; startedAt: string; finishedAt: string | null; durationSec: number | null; totalSets: number }>> {
        const { data: histories, error } = await supabase
            .from('workout_histories')
            .select('id, template_id, started_at, finished_at, duration_sec')
            .order('started_at', { ascending: false })
        if (error) throw error
        const ids = (histories || []).map((h) => h.id)
        const templateIds = (histories || []).map((h) => h.template_id).filter(Boolean) as string[]

        // Fetch template names
        const templateNames: Record<string, string> = {}
        if (templateIds.length > 0) {
            const { data: trows } = await supabase.from('templates').select('id, name').in('id', templateIds)
            for (const t of trows || []) templateNames[t.id] = t.name
        }

        // Count sets per workout
        let counts: Record<string, number> = {}
        if (ids.length > 0) {
            const { data: pes } = await supabase
                .from('performed_exercises')
                .select('id, workout_id')
                .in('workout_id', ids)
            const peIds = (pes || []).map((r) => r.id)
            const peByWorkout: Record<string, string[]> = {}
            for (const r of pes || []) (peByWorkout[r.workout_id] ||= []).push(r.id)
            if (peIds.length > 0) {
                const { data: psets } = await supabase
                    .from('performed_sets')
                    .select('performed_exercise_id')
                    .in('performed_exercise_id', peIds)
                const counter: Record<string, number> = {}
                for (const s of psets || []) counter[s.performed_exercise_id] = (counter[s.performed_exercise_id] || 0) + 1
                counts = Object.fromEntries(
                    Object.entries(peByWorkout).map(([workoutId, list]) => [workoutId, list.reduce((acc, id) => acc + (counter[id] || 0), 0)])
                )
            }
        }

        return (histories || []).map((h) => ({
            id: h.id,
            templateName: h.template_id ? templateNames[h.template_id] || null : null,
            startedAt: h.started_at,
            finishedAt: h.finished_at,
            durationSec: h.duration_sec,
            totalSets: counts[h.id] || 0,
        }))
    },
}
