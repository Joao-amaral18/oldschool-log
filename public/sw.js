/*
  Service Worker for Oldschool Log
  - App shell caching (offline-first for static assets)
  - Background Sync queue for performed sets (tag: 'sync-sets')
*/

const CACHE_VERSION = "v1";
const APP_SHELL_CACHE = `app-shell-${CACHE_VERSION}`;
const APP_SHELL_FILES = [
    "/",
    "/index.html",
    "/manifest.webmanifest",
    "/vite.svg",
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(APP_SHELL_CACHE)
            .then((cache) => cache.addAll(APP_SHELL_FILES))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((k) => k !== APP_SHELL_CACHE)
                        .map((k) => caches.delete(k))
                )
            )
    );
    self.clients.claim();
});

// Network-first for API calls, cache-first for others
self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Bypass non-GET
    if (request.method !== "GET") return;

    // API/network-first strategy (Supabase or our endpoints)
    if (/supabase\.co/.test(url.hostname)) {
        event.respondWith(
            fetch(request)
                .then((res) => {
                    return res;
                })
                .catch(() => caches.match(request))
        );
        return;
    }

    // App shell cache-first
    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;
            return fetch(request).then((res) => {
                const copy = res.clone();
                caches
                    .open(APP_SHELL_CACHE)
                    .then((cache) => cache.put(request, copy));
                return res;
            });
        })
    );
});

// Background Sync handler
self.addEventListener("sync", async (event) => {
    if (event.tag === "sync-sets") {
        event.waitUntil(
            self.clients
                .matchAll({ includeUncontrolled: true, type: "window" })
                .then((clients) => {
                    clients.forEach((client) =>
                        client.postMessage({ type: "SYNC_SETS" })
                    );
                })
        );
    }
});

function openQueueDb() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open("oldschool-log-queue", 1);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains("sets"))
                db.createObjectStore("sets", {
                    keyPath: "id",
                    autoIncrement: true,
                });
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}
