"use strict";
// Change VERSION whenever any shipped file changes.
const VERSION = "v1.0.3";
const PREFIX = "funkelpfad-" + new URL(self.registration.scope).pathname + "-";
const CACHE = PREFIX + VERSION;
const FILES = [
  "./",
  "index.html",
  "style.css",
  "core.js",
  "app.js",
  "manifest.json",
  "assets/fox.svg",
  "assets/chest.svg",
  "assets/world-0.svg",
  "assets/world-1.svg",
  "assets/world-2.svg",
  "assets/world-3.svg",
  "assets/world-4.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
];
self.addEventListener("install", (event) =>
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES))),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith(PREFIX) && k !== CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== "GET" ||
    url.origin !== self.location.origin ||
    !url.href.startsWith(self.registration.scope)
  )
    return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(event.request, { ignoreSearch: true });
      if (cached) return cached;
      if (event.request.mode === "navigate")
        return await cache.match("index.html");
      return fetch(event.request);
    }),
  );
});
