/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'

declare let self: ServiceWorkerGlobalScope

// self.__WB_MANIFEST is injected by workbox at build time
// @ts-ignore
precacheAndRoute(self.__WB_MANIFEST ?? [])

const CACHE_VERSION = 'v1'
const APP_SHELL_CACHE = `app-shell-${CACHE_VERSION}`
const APP_SHELL_FILES = ['/', '/index.html', '/manifest.webmanifest', '/vite.svg']

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_FILES))
    )
    self.skipWaiting()
})

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== APP_SHELL_CACHE).map((k) => caches.delete(k))))
    )
    self.clients.claim()
})

self.addEventListener('message', (event) => {
    if ((event.data as any)?.type === 'SKIP_WAITING') {
        self.skipWaiting()
    }
})



self.addEventListener('sync', async (event: any) => {
    if (event.tag === 'sync-sets') {
        event.waitUntil(
            self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then((clients) => {
                clients.forEach((client) => client.postMessage({ type: 'SYNC_SETS' }))
            })
        )
    }
})

// Push notification handling
self.addEventListener('push', (event: PushEvent) => {
    if (event.data) {
        const data = event.data.json()
        const options = {
            body: data.body,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: data.primaryKey || '1'
            },
            actions: [
                {
                    action: 'view',
                    title: 'Ver',
                    icon: '/icons/icon-192.png'
                },
                {
                    action: 'dismiss',
                    title: 'Ignorar',
                    icon: '/icons/icon-192.png'
                }
            ]
        }

        event.waitUntil(
            self.registration.showNotification(data.title || 'Workout Online', options)
        )
    }
})

// Notification click handling
self.addEventListener('notificationclick', (event: NotificationEvent) => {
    event.notification.close()

    if (event.action === 'view') {
        // Open the app
        event.waitUntil(
            self.clients.openWindow('/')
        )
    } else if (event.action === 'dismiss') {
        // Just dismiss
    } else {
        // Default click action
        event.waitUntil(
            self.clients.openWindow('/')
        )
    }
})

// Better offline handling
self.addEventListener('fetch', (event: FetchEvent) => {
    const { request } = event
    const url = new URL(request.url)

    // Handle navigation requests
    if (request.mode === 'navigate') {
        event.respondWith((async (): Promise<Response> => {
            try {
                // Try network first
                const networkResponse = await fetch(request)
                return networkResponse
            } catch {
                // Fallback to cached index.html
                const cached = await caches.match('/index.html')
                if (cached) return cached as Response

                // Last resort - generate a basic offline page
                return new Response(`
                    <!DOCTYPE html>
                    <html lang="pt-BR">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Workout Online - Offline</title>
                        <style>
                            body { font-family: system-ui, sans-serif; text-align: center; padding: 2rem; background: #121212; color: white; }
                            .container { max-width: 400px; margin: 0 auto; }
                            h1 { color: #ffffff; margin-bottom: 1rem; }
                            p { color: #cccccc; margin-bottom: 2rem; }
                            .retry-btn { background: #333; color: white; border: none; padding: 1rem 2rem; border-radius: 8px; cursor: pointer; }
                            .retry-btn:hover { background: #555; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>🔄 Offline</h1>
                            <p>Você está offline. Verifique sua conexão com a internet e tente novamente.</p>
                            <button class="retry-btn" onclick="location.reload()">Tentar Novamente</button>
                        </div>
                    </body>
                    </html>
                `, {
                    headers: { 'Content-Type': 'text/html' }
                })
            }
        })())
        return
    }

    if (request.method !== 'GET') return

    // Enhanced API caching for Supabase
    if (/supabase\.co$/.test(url.hostname)) {
        event.respondWith((async (): Promise<Response> => {
            try {
                // Network-first for API calls
                const response = await fetch(request)
                const cache = await caches.open('api-cache-v1')
                cache.put(request, response.clone())
                return response
            } catch (error) {
                // Try cache if network fails
                const cached = await caches.match(request)
                if (cached) return cached as Response

                // Return offline indicator for critical API calls
                if (request.url.includes('/rest/v1/')) {
                    return new Response(JSON.stringify({
                        error: 'offline',
                        message: 'You are currently offline. Data will sync when connection is restored.'
                    }), {
                        status: 503,
                        headers: { 'Content-Type': 'application/json' }
                    })
                }

                throw error
            }
        })())
        return
    }

    // Cache-first for static assets
    event.respondWith((async (): Promise<Response> => {
        const cached = await caches.match(request)
        if (cached) return cached as Response

        try {
            const response = await fetch(request)
            if (response.ok) {
                const cache = await caches.open(APP_SHELL_CACHE)
                cache.put(request, response.clone())
            }
            return response
        } catch (error) {
            // For static assets, return a meaningful offline response
            if (request.destination === 'image') {
                return new Response('Image not available offline', {
                    status: 503,
                    headers: { 'Content-Type': 'text/plain' }
                })
            }
            throw error
        }
    })())
})


