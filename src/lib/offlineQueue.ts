/*
  Minimal IndexedDB queue for offline performed sets
*/

import type { PerformedSet } from '@/types'

type QueueItem = {
    endpoint?: string
    payload?: unknown
    type?: 'performed-set'
    performedExerciseId?: string
    set?: PerformedSet
}

function openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open('oldschool-log-queue', 1)
        req.onupgradeneeded = () => {
            const db = req.result
            if (!db.objectStoreNames.contains('sets')) db.createObjectStore('sets', { keyPath: 'id', autoIncrement: true })
        }
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
    })
}

export async function enqueueSet(item: QueueItem) {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('sets', 'readwrite')
        const store = tx.objectStore('sets')
        store.add(item)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
    })
}

export async function registerSync() {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
        try {
            const reg = await navigator.serviceWorker.ready
            await reg.sync.register('sync-sets')
        } catch {
            // no-op
        }
    }
}

export async function listQueuedPerformedSets(): Promise<Array<{ id: number; performedExerciseId: string; set: PerformedSet }>> {
    const db = await openDb()
    return await new Promise((resolve, reject) => {
        const tx = db.transaction('sets', 'readonly')
        const store = tx.objectStore('sets')
        const req = store.getAll()
        req.onsuccess = () => {
            const list = (req.result as Array<any>).map((raw: any, idx: number) => {
                const id = raw.id ?? idx
                if (raw?.type === 'performed-set' && raw.performedExerciseId && raw.set) {
                    return { id, performedExerciseId: raw.performedExerciseId as string, set: raw.set as PerformedSet }
                }
                if (raw?.payload?.performedExerciseId && raw?.payload?.set) {
                    return { id, performedExerciseId: raw.payload.performedExerciseId as string, set: raw.payload.set as PerformedSet }
                }
                return null
            }).filter(Boolean)
            resolve(list as Array<{ id: number; performedExerciseId: string; set: PerformedSet }>)
        }
        req.onerror = () => reject(req.error)
    })
}

export async function removeQueuedItem(id: number): Promise<void> {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('sets', 'readwrite')
        const store = tx.objectStore('sets')
        const del = store.delete(id)
        del.onsuccess = () => resolve()
        del.onerror = () => reject(del.error)
    })
}


