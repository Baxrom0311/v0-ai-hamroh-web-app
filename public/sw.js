const CACHE_NAME = "noskipai-v1"

const STATIC_ASSETS = [
  "/",
  "/login",
  "/register",
  "/dashboard",
  "/medications",
  "/chat",
  "/settings",
  "/manifest.json",
]

// Install — cache critical shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch — Network-first for API, Cache-first for static
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)

  // Skip non-GET and cross-origin
  if (event.request.method !== "GET") return
  if (url.origin !== self.location.origin) return

  // API calls — always network, no cache
  if (url.pathname.startsWith("/api/")) return

  // Static assets — stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => cached) // If network fails, return cache

      return cached || networkFetch
    })
  )
})
