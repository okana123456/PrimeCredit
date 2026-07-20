const CACHE_NAME = 'primecredit-shell-v8';
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
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if(requestUrl.origin !== self.location.origin) return;
  const isAppPage = event.request.mode === 'navigate' || requestUrl.pathname.endsWith('/') || requestUrl.pathname.endsWith('/index.html');
  event.respondWith(
    fetch(event.request, isAppPage ? {cache:'no-store'} : undefined)
      .then(response => {
        if(!response || !response.ok) return response;
        const copy = response.clone();
        if(!isAppPage) caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
  );
});
