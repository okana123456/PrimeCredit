const CACHE_NAME = 'primecredit-cache-v5';
const APP_SHELL = [
  './manifest.webmanifest',
  './assets/primecredit-icon.svg',
  './assets/primecredit-icon-192.png',
  './assets/primecredit-icon-512.png',
  './assets/primecredit-icon-512-maskable.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith('primecredit-') && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if(requestUrl.origin !== self.location.origin) return;
  if(requestUrl.pathname.includes('/auth/') || requestUrl.pathname.includes('/rest/') || requestUrl.pathname.includes('/functions/')) return;

  if(event.request.mode === 'navigate'){
    event.respondWith(
      fetch(event.request, {cache:'no-store'})
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkRequest = fetch(event.request)
        .then(response => {
          if(response && response.ok){
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkRequest;
    })
  );
});
