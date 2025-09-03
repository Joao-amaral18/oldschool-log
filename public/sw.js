/*
  Service Worker for OldSchool Log
  Handles background sync for training sessions and performed sets
*/

const CACHE_NAME = 'oldschool-log-v1'
const SYNC_TAG_SETS = 'sync-training-sets'
const SYNC_TAG_SESSION = 'sync-training-session'

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  // Skip waiting to activate immediately
  self.skipWaiting()
})

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  // Take control of all pages immediately
  event.waitUntil(self.clients.claim())
})

// Background Sync for training sets
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag)
  
  if (event.tag === SYNC_TAG_SETS) {
    event.waitUntil(syncTrainingSets())
  } else if (event.tag === SYNC_TAG_SESSION) {
    event.waitUntil(syncTrainingSession())
  }
})

// Sync training sets with Supabase
async function syncTrainingSets() {
  try {
    console.log('Starting training sets sync...')
    
    // Get queued sets from IndexedDB
    const queuedSets = await getQueuedPerformedSets()
    console.log('Found queued sets:', queuedSets.length)
    
    if (queuedSets.length === 0) {
      return
    }

    // Get auth session from IndexedDB
    const session = await getAuthSession()
    if (!session) {
      console.warn('No auth session found, cannot sync sets')
      return
    }

    let syncedCount = 0
    let failedCount = 0

    // Sync each set
    for (const item of queuedSets) {
      try {
        await syncPerformedSet(item, session)
        await removeQueuedSet(item.id)
        syncedCount++
      } catch (error) {
        console.error('Failed to sync set:', error)
        failedCount++
      }
    }

    console.log(`Sets sync completed: ${syncedCount} synced, ${failedCount} failed`)

    // Notify the main app about sync completion
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_SETS_COMPLETE',
        synced: syncedCount,
        failed: failedCount
      })
    })

  } catch (error) {
    console.error('Training sets sync failed:', error)
  }
}

// Sync training session state
async function syncTrainingSession() {
  try {
    console.log('Starting training session sync...')
    
    // Get session state from IndexedDB
    const sessionState = await getSessionState()
    if (!sessionState) {
      console.log('No session state to sync')
      return
    }

    const session = await getAuthSession()
    if (!session) {
      console.warn('No auth session found, cannot sync session state')
      return
    }

    // Save session state to Supabase (you can implement this endpoint)
    await syncSessionState(sessionState, session)
    
    console.log('Session state synced successfully')

    // Notify the main app
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_SESSION_COMPLETE'
      })
    })

  } catch (error) {
    console.error('Training session sync failed:', error)
  }
}

// Get queued performed sets from IndexedDB
async function getQueuedPerformedSets() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('oldschool-log-queue', 1)
    
    request.onerror = () => reject(request.error)
    
    request.onsuccess = () => {
      const db = request.result
      
      if (!db.objectStoreNames.contains('sets')) {
        resolve([])
        return
      }

      const transaction = db.transaction(['sets'], 'readonly')
      const store = transaction.objectStore('sets')
      const getAllRequest = store.getAll()
      
      getAllRequest.onsuccess = () => {
        const items = getAllRequest.result || []
        const formattedItems = items.map((raw, idx) => {
          const id = raw.id ?? idx
          if (raw?.type === 'performed-set' && raw.performedExerciseId && raw.set) {
            return { id, performedExerciseId: raw.performedExerciseId, set: raw.set }
          }
          if (raw?.payload?.performedExerciseId && raw?.payload?.set) {
            return { id, performedExerciseId: raw.payload.performedExerciseId, set: raw.payload.set }
          }
          return null
        }).filter(Boolean)
        
        resolve(formattedItems)
      }
      
      getAllRequest.onerror = () => reject(getAllRequest.error)
    }
  })
}

// Remove synced set from queue
async function removeQueuedSet(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('oldschool-log-queue', 1)
    
    request.onerror = () => reject(request.error)
    
    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(['sets'], 'readwrite')
      const store = transaction.objectStore('sets')
      const deleteRequest = store.delete(id)
      
      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => reject(deleteRequest.error)
    }
  })
}

// Get auth session from idb-keyval store
async function getAuthSession() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('keyval-store', 1)
    
    request.onerror = () => {
      // Try localStorage fallback
      try {
        const raw = localStorage.getItem('auth:session')
        if (raw) {
          const session = JSON.parse(raw)
          resolve(session)
        } else {
          resolve(null)
        }
      } catch {
        resolve(null)
      }
    }
    
    request.onsuccess = () => {
      const db = request.result
      
      if (!db.objectStoreNames.contains('keyval')) {
        // Try localStorage fallback
        try {
          const raw = localStorage.getItem('auth:session')
          if (raw) {
            const session = JSON.parse(raw)
            resolve(session)
          } else {
            resolve(null)
          }
        } catch {
          resolve(null)
        }
        return
      }

      const transaction = db.transaction(['keyval'], 'readonly')
      const store = transaction.objectStore('keyval')
      const getRequest = store.get('auth-session')
      
      getRequest.onsuccess = () => {
        if (getRequest.result) {
          resolve(getRequest.result)
        } else {
          // Try localStorage fallback
          try {
            const raw = localStorage.getItem('auth:session')
            if (raw) {
              const session = JSON.parse(raw)
              resolve(session)
            } else {
              resolve(null)
            }
          } catch {
            resolve(null)
          }
        }
      }
      
      getRequest.onerror = () => resolve(null)
    }
  })
}

// Get session state from IndexedDB
async function getSessionState() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('keyval-store', 1)
    
    request.onerror = () => resolve(null)
    
    request.onsuccess = () => {
      const db = request.result
      
      if (!db.objectStoreNames.contains('keyval')) {
        resolve(null)
        return
      }

      const transaction = db.transaction(['keyval'], 'readonly')
      const store = transaction.objectStore('keyval')
      
      // Try to find any training session keys
      const getAllRequest = store.getAll()
      
      getAllRequest.onsuccess = () => {
        const items = getAllRequest.result || []
        const sessionItem = items.find(item => 
          typeof item.key === 'string' && item.key.startsWith('training-session:')
        )
        
        resolve(sessionItem ? sessionItem.value : null)
      }
      
      getAllRequest.onerror = () => resolve(null)
    }
  })
}

// Sync performed set with Supabase
async function syncPerformedSet(item, session) {
  const { performedExerciseId, set } = item
  
  const response = await fetch(`${getSupabaseUrl()}/rest/v1/performed_sets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getSupabaseAnonKey()}`,
      'apikey': getSupabaseAnonKey(),
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      performed_exercise_id: performedExerciseId,
      reps: set.reps.toString(),
      load: set.load,
      kind: set.kind || 'working',
      done_at: new Date().toISOString()
    })
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
}

// Sync session state with Supabase (placeholder for future implementation)
async function syncSessionState(sessionState, session) {
  // This could be implemented to save session state to a sessions table
  // For now, we'll just log it
  console.log('Session state sync (placeholder):', sessionState)
}

// Get Supabase URL from environment or fallback
function getSupabaseUrl() {
  // Try multiple sources for environment variables
  const url = self.VITE_SUPABASE_URL ||
              process?.env?.VITE_SUPABASE_URL ||
              'https://your-project.supabase.co'

  if (url === 'https://your-project.supabase.co') {
    console.warn('Using fallback Supabase URL - environment variables not injected properly')
  }

  return url
}

// Get Supabase anon key
function getSupabaseAnonKey() {
  const key = self.VITE_SUPABASE_ANON_KEY ||
              process?.env?.VITE_SUPABASE_ANON_KEY ||
              'your-anon-key'

  if (key === 'your-anon-key') {
    console.warn('Using fallback Supabase key - environment variables not injected properly')
  }

  return key
}

// Handle messages from the main app
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data)
  
  if (event.data?.type === 'REGISTER_SYNC') {
    // Register background sync
    if (event.data.tag === SYNC_TAG_SETS) {
      self.registration.sync.register(SYNC_TAG_SETS).catch(console.error)
    } else if (event.data.tag === SYNC_TAG_SESSION) {
      self.registration.sync.register(SYNC_TAG_SESSION).catch(console.error)
    }
  }
})

console.log('Service Worker loaded successfully')
