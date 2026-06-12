/* ============================================================
   VIDYA STEM – Service Worker
   sw.js  |  v3.0.0
   ============================================================ */

const CACHE = 'vidya-v7';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/config.js',
  './js/auth.js',
  './js/data.js',
  './js/swipe.js',
  './js/ui.js',
  './js/telegram.js',
  './js/export.js',
  './js/app.js',
  './data/users.json',
  './data/lab1items.json',
  './data/lab2items.json',
  './data/lab3items.json',
  './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Network first for JSON data, cache first for assets
  const url = new URL(e.request.url);
  if (url.pathname.endsWith('.json')) {
    e.respondWith(
      fetch(e.request).then(r => {
        const clone = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return r;
      }).catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request))
    );
  }
});
