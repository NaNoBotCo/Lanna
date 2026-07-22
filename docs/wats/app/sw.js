// sw.js — offline cache for the wat map.
// Shell: cache-first (the app is one self-contained file, so this is the app).
// Tiles: cache-first with network fill — every tile you view is kept, so a
// region browsed once stays available with no signal. Tiles are capped so the
// cache cannot grow without bound on a phone.
const SHELL = 'wats-shell-v5911109447';
const TILES = 'wats-tiles-v1';
const MAX_TILES = 1200;
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks =>
    Promise.all(ks.filter(k => k !== SHELL && k !== TILES).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

async function trimTiles() {
  const c = await caches.open(TILES);
  const keys = await c.keys();
  if (keys.length > MAX_TILES) for (const k of keys.slice(0, keys.length - MAX_TILES)) await c.delete(k);
}

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  const isTile = /tile\.openstreetmap\.org|\.png($|\?)/.test(url.href);
  const isPhoto = /upload\.wikimedia\.org/.test(url.hostname);
  if (isTile || isPhoto) {
    e.respondWith(caches.open(TILES).then(async c => {
      const hit = await c.match(e.request);
      if (hit) return hit;
      try {
        const res = await fetch(e.request);
        if (res && (res.ok || res.type === 'opaque')) { c.put(e.request, res.clone()); trimTiles(); }
        return res;
      } catch (err) {
        return hit || Response.error();
      }
    }));
    return;
  }
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).catch(() => caches.match('./index.html'))));
});
