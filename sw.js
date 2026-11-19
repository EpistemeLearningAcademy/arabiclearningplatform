
const CACHE = "kalimati-v2-8";

const PRECACHE = [
  "./",
  "index.html",
  "offline.html",
  "manifest.json",
  "assets/css/main.css",
  "assets/js/app.js",
  "assets/js/i18n.js",
  "assets/js/storage.js",
  "assets/js/engine.js",
  "assets/js/validators.js",
  "assets/js/gamification.js",
  "content/index.json",
  "content/translations/en.json",
  "content/translations/ar.json",
  "content/shared/achievements.json",
  "content/beginner/vocabulary/core.json",
  "content/beginner/alphabet/letters.json",
  "content/beginner/lessons/short-vowels.json",
  "content/beginner/lessons/long-vowels.json",
  "content/beginner/lessons/reading-signs.json",
  "content/beginner/lessons/letter-positions.json",
  "content/intermediate/lessons/nouns-pronouns.json",
  "content/intermediate/lessons/nouns-number.json",
  "content/intermediate/reading/graded-01.json",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(PRECACHE))
  );

  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (
    request.method !== "GET" ||
    new URL(request.url).origin !== self.location.origin
  ) return;

  const url = new URL(request.url);
  const isCode =
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css");

  if (request.mode === "navigate" || isCode) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then(cache =>
              cache.put(request, copy)
            );
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);

          if (cached) return cached;

          if (request.mode === "navigate") {
            return await caches.match("offline.html");
          }

          return Response.error();
        })
    );

    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();

          caches.open(CACHE).then(cache =>
            cache.put(request, copy)
          );
        }

        return response;
      });
    })
  );
});
