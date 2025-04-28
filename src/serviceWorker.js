/* serviceWorker.js • SelfCare PWA
   --------------------------------------------------
   Estratégia:
   • Assets estáticos → cache-first
   • Chamadas /api/*   → network-first com fallback offline
*/

const CACHE_NAME = 'selfcare-v1';
const STATIC_ASSETS = [
  './',
  './assets/styles.css',
  './script.js',
  './manifest.webmanifest',
  './data/quotes.json',
  './data/selfcare-tips.json',
];

/* Instala assets essenciais */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

/* Remove caches antigos */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

/* Intercepta requisições */
self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const isAPIRequest = request.url.includes('/api/');

  event.respondWith(
    (async () => {
      if (isAPIRequest) {
        try {
          const networkResponse = await fetch(request.clone());
          if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          const cachedResponse = await caches.match(request);
          return cachedResponse || new Response(JSON.stringify({ error: 'offline' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 503,
          });
        }
      } else {
        const cachedResponse = await caches.match(request);
        return cachedResponse || fetch(request);
      }
    })()
  );
});
