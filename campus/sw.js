// Service worker: permite instalar la web como app y usarla sin conexión.
// Estrategia "red primero": si hay internet siempre se ve la teoría más nueva;
// si no la hay, se usa la última copia guardada. No hace falta tocar este archivo al añadir temas.
const CACHE = 'campus-v3';
const BASE = [
  './', 'index.html', 'css/styles.css', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
  'js/app.js', 'js/data.js', 'js/md.js', 'js/progreso.js', 'js/recall.js', 'js/store.js', 'js/ui.js', 'js/quiz.js', 'js/vistas/test.js',
  'js/vistas/inicio.js', 'js/vistas/asignaturas.js', 'js/vistas/asignatura.js', 'js/vistas/repaso.js', 'js/vistas/temas.js',
  'js/vistas/fallos.js', 'js/vistas/historial.js', 'js/vistas/examenes.js', 'js/vistas/notas.js', 'js/vistas/ajustes.js',
  'data/asignaturas.json',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    // no-cache: pregunta siempre al servidor si hay versión nueva (si no la hay, responde 304 y no se descarga nada)
    (req.mode === 'navigate' ? fetch(req) : fetch(req.url, { cache: 'no-cache' }))
      .then(res => { if (res.ok) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(req, copia)); } return res; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});
