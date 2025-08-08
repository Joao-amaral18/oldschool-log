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

self.addEventListener('fetch', (event: FetchEvent) => {
    const { request } = event
    const url = new URL(request.url)

    if (request.mode === 'navigate') {
        event.respondWith((async (): Promise<Response> => {
            const cached = await caches.match('/index.html')
            if (cached) return cached as Response
            return fetch(request)
        })())
        return
    }

    if (request.method !== 'GET') return

    // Network-first for Supabase
    if (/supabase\.co$/.test(url.hostname)) {
        event.respondWith((async (): Promise<Response> => {
            try {
                return await fetch(request)
            } catch {
                const cached = await caches.match(request)
                if (cached) return cached as Response
                // fallback to a generic offline page or index
                const html = await caches.match('/index.html')
                return (html as Response) || new Response('Offline', { status: 503 })
            }
        })())
        return
    }

    // Cache-first for app shell/static
    event.respondWith((async (): Promise<Response> => {
        const cached = await caches.match(request)
        if (cached) return cached as Response
        const res = await fetch(request)
        const copy = res.clone()
        caches.open(APP_SHELL_CACHE).then((cache) => cache.put(request, copy))
        return res
    })())
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


