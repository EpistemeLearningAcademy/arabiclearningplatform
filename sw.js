// Bump CACHE when shipping new files. Learner data lives in IndexedDB/localStorage, never in caches,
// so deleting old caches cannot erase progress.
const CACHE = "kalimati-v2-10";
const PRECACHE = ["./","index.html","offline.html","manifest.json","assets/css/main.css",
  "assets/js/app.js","assets/js/i18n.js","assets/js/storage.js","assets/js/engine.js","assets/js/validators.js","assets/js/gamification.js","content/shared/achievements.json","content/intermediate/lessons/nouns-pronouns.json","content/intermediate/lessons/nouns-number.json","content/intermediate/reading/graded-01.json","content/intermediate/lessons/verbs-sentences.json","content/intermediate/sentences/builder-01.json","content/intermediate/lessons/adjectives-prepositions.json","content/advanced/lessons/case-morphology.json","content/advanced/lessons/verbs-particles.json","content/advanced/reading/graded-01.json",
  "content/index.json","content/translations/en.json","content/translations/ar.json",
  "content/beginner/vocabulary/core.json","content/beginner/alphabet/letters.json","content/beginner/lessons/short-vowels.json","content/beginner/lessons/long-vowels.json","content/beginner/lessons/reading-signs.json","content/beginner/lessons/letter-positions.json","assets/icons/icon-192.png","assets/icons/icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  if (r.mode === "navigate") {
    e.respondWith(fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then(x => x.put(r, c)); } return res; })
      .catch(() => caches.match(r).then(m => m || caches.match("index.html")).then(m => m || caches.match("offline.html"))));
    return;
  }
  e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then(x => x.put(r, c)); } return res; })));
});
