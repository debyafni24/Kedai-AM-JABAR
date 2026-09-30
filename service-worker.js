/* Kedai AM Jabar — Service Worker
   Naikkan VERSION setiap kali file website diubah supaya cache lama diganti. */
const VERSION = 'v6';
const CORE = 'am-core-' + VERSION;
const RUNTIME = 'am-runtime-' + VERSION;
const NAV_TIMEOUT = 4000; // koneksi lambat > 4 detik -> pakai salinan tersimpan

const PRECACHE = [
  "index.html",
  "manifest.json",
  "css/style.css",
  "js/script.js",
  "js/pwa.js",
  "img/logo.png",
  "img/mie-pedas.jpg",
  "img/mie-original.jpg",
  "icon-192.png",
  "icon-512.png",
  "apple-touch-icon.png",
  "img/menu/basreng-cobek.jpg",
  "img/menu/bola-bola-ubi.jpg",
  "img/menu/marimas.jpg",
  "img/menu/mie-jebew.jpg",
  "img/menu/nutrisari.jpg",
  "img/menu/pangsit-ayam-goreng.jpg",
  "img/menu/pisang-keju.jpg",
  "img/menu/pisang-krispi.jpg",
  "img/menu/pop-ice.jpg",
  "img/menu/seblak.jpg",
  "img/menu/siomay-mayo.jpg",
  "img/menu/tansuke.jpg",
  "img/menu/top-ice.jpg",
  "img/menu/wonton-goreng.jpg",
  "img/menu/wonton-rebus.jpg"
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CORE)
      .then(cache => Promise.all(PRECACHE.map(u => cache.add(new Request(u, {cache: 'reload'})).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('am-') && k !== CORE && k !== RUNTIME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Halaman: coba internet dulu, kalau gagal/lambat pakai salinan tersimpan
  if (req.mode === 'navigate') { event.respondWith(handleNavigate(req)); return; }

  // File milik website sendiri
  if (url.origin === self.location.origin) {
    if (req.destination === 'script' || req.destination === 'style' || url.pathname.endsWith('manifest.json')) {
      event.respondWith(networkFirst(req, CORE));      // kode selalu terbaru kalau online
    } else {
      event.respondWith(staleWhileRevalidate(event, req, CORE)); // gambar: cepat dari cache
    }
    return;
  }

  // Google Fonts
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(event, req, RUNTIME));
  }
  // Selain itu (wa.me dsb.) tidak disentuh service worker
});

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(r => { clearTimeout(t); resolve(r); }, e => { clearTimeout(t); reject(e); });
  });
}

async function handleNavigate(req) {
  const cache = await caches.open(CORE);
  const indexUrl = new URL('index.html', self.registration.scope).href;
  try {
    const res = await withTimeout(fetch(req), NAV_TIMEOUT);
    if (res && res.ok && res.type === 'basic' && !res.redirected) cache.put(indexUrl, res.clone());
    return res;
  } catch (err) {
    const cached = await cache.match(indexUrl);
    return cached || new Response(
      '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kedai AM Jabar</title>' +
      '<body style="font-family:sans-serif;text-align:center;padding:15vh 24px"><h1>Kedai AM Jabar</h1><p>Kamu sedang offline. Coba lagi saat internet tersambung.</p></body>',
      {status: 503, headers: {'Content-Type': 'text/html; charset=utf-8'}}
    );
  }
}

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await withTimeout(fetch(req), 3000);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    return (await cache.match(req, {ignoreSearch: true})) || Response.error();
  }
}

async function staleWhileRevalidate(event, req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const network = fetch(req).then(res => {
    if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
    return res;
  }).catch(() => null);
  if (cached) { event.waitUntil(network); return cached; }
  return (await network) || Response.error();
}
