// Service Worker EDA Logística — v1 — cache básico offline-first para el shell
const CACHE = 'eda-logistica-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.add('./index.html')));
});

self.addEventListener('activate', e => {
  e.waitUntil(Promise.all([
    self.clients.claim(),
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
  ]));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.hostname.includes('googleapis.com') ||
      url.hostname.includes('firebase') ||
      url.hostname.includes('gstatic.com')) return;
  if (url.pathname.endsWith('.html') || url.pathname.endsWith('/') ||
      url.pathname === '' || url.pathname.endsWith('manifest.json')) {
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' })
        .then(r => {
          const copy = r.clone(); // clonar YA, antes de que el navegador lea el cuerpo de r
          if (r.ok) caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
          return r;
        })
        .catch(() => caches.match('./index.html'))
    ); return;
  }
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
});

self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });

// Nota: cuando quieras notificaciones push (ej. avisos de vencimiento de calibración,
// solicitudes con <48h), este es el lugar para agregar Firebase Messaging,
// siguiendo el mismo patrón que sw.js de SANTERRA.
