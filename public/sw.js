/* Em Dash Remover — conservative service worker.
 * Strategy:
 *   - Navigations (HTML documents): NETWORK-FIRST, falling back to cache, then
 *     to a precached offline page. Never serves stale HTML indefinitely.
 *   - Same-origin static assets (/_astro/*, fonts, images, css, js): CACHE-FIRST
 *     with lazy background population.
 *   - Cross-origin requests and any non-GET (e.g. POST): bypassed entirely —
 *     never cached, always go to the network.
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `edr-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline';
const PRECACHE = ['/', OFFLINE_URL];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Precache best-effort: tolerate a missing offline page so install never fails.
      await Promise.allSettled(PRECACHE.map((url) => cache.add(url)));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

// Heuristic: treat as a "static asset" worth caching cache-first.
function isStaticAsset(url) {
  if (url.pathname.startsWith('/_astro/')) return true;
  return /\.(?:css|js|mjs|woff2?|ttf|otf|eot|svg|png|jpe?g|gif|webp|avif|ico)$/i.test(
    url.pathname
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET; never touch POST/PUT/etc.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Only handle same-origin; never cache cross-origin.
  if (url.origin !== self.location.origin) return;

  // NETWORK-FIRST for navigations / HTML documents.
  if (
    request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html')
  ) {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          // Keep a fresh copy for offline fallback.
          if (networkResponse && networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          const cache = await caches.open(CACHE_NAME);
          const cached =
            (await cache.match(request)) ||
            (await cache.match('/')) ||
            (await cache.match(OFFLINE_URL));
          if (cached) return cached;
          throw err;
        }
      })()
    );
    return;
  }

  // CACHE-FIRST for same-origin static assets.
  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);
        if (cached) return cached;
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok) {
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      })()
    );
  }
  // Everything else: fall through to the network (no respondWith).
});
