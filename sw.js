// Service worker DropTheBeat : installable + notifications cliquables.
// Ne met en cache que la coquille (index.html). Laisse passer Firebase/Deezer/gstatic.
const CACHE = "dtb-shell-v2";

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.add("./index.html")).then(() => self.skipWaiting())
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
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).catch(() => caches.match("./index.html")));
  }
});

// Clic sur une notification -> ramener l'app au premier plan (ou l'ouvrir).
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if ("focus" in w) {
          if ("navigate" in w) { try { w.navigate("./#dj"); } catch (err) {} }
          return w.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow("./#dj");
    })
  );
});
