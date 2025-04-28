// GodCares ✝️ — Service Worker (v2.0.1, 2025-04-28)
const CACHE_NAME = 'godcares-v2.0';
const STATIC_ASSETS = [
  './',
  './assets/styles.css',
  './script.js',
  './manifest.webmanifest',
  './assets/locales/pt-br.json'
];

// Instalação: Caching de arquivos estáticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Ativação: Limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: Cache-first strategy
self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request)
      .then(cachedResponse => cachedResponse || fetch(request))
  );
});
