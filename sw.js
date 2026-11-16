// service worker

/* sw.js: offline support. Cache-first with background refresh for the app's own files.
   When you add or rename a script or stylesheet, add it to SHELL and change VERSION so users get the update. */
const VERSION = "lifeos-v3";
const SHELL = ["./", "./index.html", "./styles.css", "./manifest.webmanifest", "./icon.svg",
    "./store.js", "./core.js", "./vault.js", "./badges.js", "./sample.js", "./templates.js", "./coach.js",
    "./view-day.js", "./view-calendar.js", "./view-reports.js", "./view-habits.js",
    "./view-settings.js", "./view-badges.js", "./view-guide.js", "./ui.js", "./app.js", "./sync-core.js"];

self.addEventListener("install", e => {
    e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
    e.waitUntil(caches.keys()
        .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
        .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
    if (e.request.method !== "GET") return;
    if (new URL(e.request.url).origin !== self.location.origin) return; // fonts and other sites go straight to the network
    e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => {
        const net = fetch(e.request).then(res => {
            if (res.ok) caches.open(VERSION).then(c => c.put(e.request, res.clone()));
            return res;
        }).catch(() => hit);
        return hit || net;
    }));
});