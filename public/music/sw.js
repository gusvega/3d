const CACHE = "gus-music-offline-v1";
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll([
          "/music",
          "/music/icon.svg",
          "/music/manifest.webmanifest",
        ]),
      ),
  );
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener("message", (event) => {
  if (event.data?.type !== "CACHE_ASSETS" || !Array.isArray(event.data.assets))
    return;
  const urls = event.data.assets
    .filter(
      (url) =>
        typeof url === "string" &&
        url.startsWith(self.location.origin + "/_next/static/"),
    )
    .slice(0, 80);
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => Promise.allSettled(urls.map((url) => cache.add(url)))),
  );
});
self.addEventListener("fetch", (event) => {
  const req = event.request,
    url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  if (req.mode === "navigate" && url.pathname.replace(/\/$/, "") === "/music") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put("/music", copy));
          }
          return res;
        })
        .catch(() => caches.match("/music")),
    );
  } else if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname === "/music/icon.svg"
  ) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((cache) => cache.put(req, copy));
            }
            return res;
          }),
      ),
    );
  }
});
