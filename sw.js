/* Service worker: deixa o jogo abrir sem internet depois da primeira visita (PWA).
   - index.html: tenta a rede primeiro (para receber atualizações) e usa a cópia guardada se estiver offline;
   - música, ícones e fontes: usa a cópia guardada; o que ainda não foi baixado é guardado na primeira vez.
   Ao publicar uma versão com mudanças em public/, troque o número de CACHE para descartar as cópias antigas. */
const CACHE = 'mistmatch-v3';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const FONTS = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === self.location.origin;
  if (!same && !FONTS.test(req.url)) return;
  if (req.mode === 'navigate'){
    e.respondWith(fetch(req).then(r => { if (r.ok){ const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return r; })
      .catch(() => caches.match(req, {ignoreSearch:true}).then(hit => hit || caches.match('index.html'))));
    return;
  }
  if (req.headers.has('range')) return; // pedaços de áudio: deixa o navegador buscar direto
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok || r.type === 'opaque'){ const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return r;
  })));
});
