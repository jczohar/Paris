/* Service Worker – Paris Guide offline shell */
const CACHE = "paris-guide-v20261117";
const CORE = [
  "./",
  "./Paris_Guide.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Network-first for API / weather / open data; cache-first for app shell
  const isApi =
    /open-meteo|opendata\.paris|wikipedia\.org|tile\.openstreetmap|frankfurter\.app|exchangerate/.test(
      url.hostname
    );
  if (isApi) {
    e.respondWith(
      fetch(req)
        .then((r) => {
          const clone = r.clone();
          caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => {});
          return r;
        })
        .catch(() => caches.match(req))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then((cached) => {
      const net = fetch(req)
        .then((r) => {
          if (r && r.ok) {
            const clone = r.clone();
            caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => {});
          }
          return r;
        })
        .catch(() => cached);
      return cached || net;
    })
  );
});
