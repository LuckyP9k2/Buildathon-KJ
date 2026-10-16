const CACHE = 'artlens-shell-v1';
const CORE = [
  '/',
  '/manifest.webmanifest',
  '/data/artworks.json',
  '/data/i18n.json',
  '/img/artlens-mark.svg',
  '/img/starry-night.svg',
  '/img/mona-lisa.svg',
  '/img/great-wave.svg',
  '/img/pearl-earring.svg',
  '/img/persistence-memory.svg',
  '/img/shakuntala.svg'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE.map(path => new Request(path, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('artlens-') && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok && (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/models/') || url.pathname.startsWith('/wasm/') || url.pathname.startsWith('/src/'))) {
        event.waitUntil(cache.put(request, response.clone()).catch(() => {}));
      }
      return response;
    } catch (error) {
      if (request.mode === 'navigate') return (await cache.match('/')) || Response.error();
      throw error;
    }
  })());
});
