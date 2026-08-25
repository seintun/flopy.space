const CACHE_NAME = "flopy-space-v2";
const PRECACHE_ASSETS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icon.svg",
];

// 1. Install & Precache core app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 2. Activate & Purge stale caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// 3. Fetch Strategy:
// - Navigation (HTML): Network-First with Cache Fallback (prevents deployment desync)
// - Static /assets/ & Precached: Cache-First
// - Web Fonts: Stale-While-Revalidate with Opaque Support
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Ignore non-http(s) schemes (e.g. chrome-extension://)
  if (!url.protocol.startsWith("http")) return;

  // Strategy A: Navigation requests (HTML) -> Network-First (ensures fresh deployments, falls back to cache offline)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => caches.match("./") || caches.match("index.html"))
    );
    return;
  }

  // Strategy B: External Fonts -> Stale-While-Revalidate with opaque support
  if (url.origin === "https://fonts.googleapis.com" || url.origin === "https://fonts.gstatic.com") {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const networkFetch = fetch(event.request)
          .then((response) => {
            if (response && (response.status === 200 || response.type === "opaque")) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            }
            return response;
          })
          .catch(() => cached);

        return cached || networkFetch;
      })
    );
    return;
  }

  // Strategy C: Hashed Assets & Static App Shell -> Cache-First
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return networkResponse;
      });
    })
  );
});
