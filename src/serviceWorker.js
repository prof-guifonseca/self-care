/* serviceWorker.js • SelfCare PWA
   --------------------------------------------------
   • Escopo: pasta /src  (publish raiz no Netlify)
   • Estratégia:
       – Assets estáticos → cache-first
       – Chamadas /api/*   → network-first (cai p/ offline se falhar)
*/

const CACHE_NAME = 'selfcare-v1';
const STATIC_ASSETS = [
  './',                       // index.html
  './assets/styles.css',
  './script.js',
  './manifest.webmanifest',
  // ícones opcionalmente:
  // './assets/icons/icon-192.png',
  // './assets/icons/icon-512.png'

  './data/quotes.json',
  './data/selfcare-tips.json',];

/* Instalação: guarda assets essenciais */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

/* Limpa caches antigos ao atualizar a SW */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* Intercepta fetch */
self.addEventListener('fetch', event => {
  const { request } = event;

  /* Deixa POST/PUT etc. passarem direto */
  if (request.method !== 'GET') return;

  const isAPI = request.url.includes('/api/');

  /* Network-first para API; cache-first para estáticos */
  event.respondWith(
    (async () => {
      if (isAPI) {
        try {
          const netRes = await fetch(request.clone());
          /* Opcional: guarda resposta em cache se ok */
          if (netRes.ok) {
            const apiCache = await caches.open(CACHE_NAME);
            apiCache.put(request, netRes.clone());
          }
          return netRes;
        } catch (_) {
          const cacheRes = await caches.match(request);
          return cacheRes || new Response('{"error":"offline"}', { status: 503 });
        }
      } else {
        const cacheRes = await caches.match(request);
        return cacheRes || fetch(request);
      }
    })()
  );
});
