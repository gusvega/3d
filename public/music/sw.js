// Retire the old origin's offline composer after its move to gusvega.dev.
// Keep localStorage intact so /music/transfer can recover saved projects.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await caches.delete("gus-music-offline-v1");
      await self.clients.claim();
      await self.registration.unregister();
    })(),
  );
});
