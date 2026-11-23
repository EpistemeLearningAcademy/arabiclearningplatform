// Bump CACHE when shipping new files. Learner data lives in IndexedDB/localStorage, never in caches,
// so deleting old caches cannot erase progress.
const CACHE = "kalimati-v2-17";
const PRECACHE = ["./","index.html","offline.html","manifest.json","assets/css/main.css",
  "assets/js/app.js","assets/js/i18n.js","assets/js/storage.js","assets/js/engine.js","assets/js/validators.js","assets/js/gamification.js","assets/js/reports.js","assets/js/writing.js","assets/js/audio.js","content/audio/manifest.json","content/images/manifest.json","content/shared/branding.json","content/advanced/lessons/moods-passive.json","content/advanced/lessons/sentence-structures.json","content/intermediate/reading/graded-02.json","content/advanced/reading/graded-02.json","content/intermediate/writing/prompts.json","content/advanced/writing/prompts.json","content/shared/challenges.json","content/shared/certificates.json","content/shared/achievements.json","content/intermediate/lessons/nouns-pronouns.json","content/intermediate/lessons/nouns-number.json","content/intermediate/reading/graded-01.json","content/intermediate/lessons/verbs-sentences.json","content/intermediate/sentences/builder-01.json","content/intermediate/lessons/adjectives-prepositions.json","content/advanced/lessons/case-morphology.json","content/advanced/lessons/verbs-particles.json","content/advanced/reading/graded-01.json",
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
  if (r.headers.has("range")) { e.respondWith(ranged(r)); return; }
  e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then(x => x.put(r, c)); } return res; })));
});

// Media elements ask for byte ranges. Serve them from a cached full file (or fetch and cache the full file) so recorded audio also works offline.
async function ranged(req) {
  const cache = await caches.open(CACHE), key = new Request(req.url);
  let res = await cache.match(key);
  if (!res) { try { const full = await fetch(key); if (!full.ok) return full; cache.put(key, full.clone()); res = full; } catch { return new Response("", { status: 504 }); } }
  const buf = await res.arrayBuffer(), m = /bytes=(\d+)-(\d*)/.exec(req.headers.get("range") || "");
  if (!m) return new Response(buf, { status: 200, headers: res.headers });
  const start = +m[1], end = m[2] ? Math.min(+m[2], buf.byteLength - 1) : buf.byteLength - 1;
  return new Response(buf.slice(start, end + 1), { status: 206, headers: { "Content-Type": res.headers.get("Content-Type") || "audio/mpeg", "Content-Range": `bytes ${start}-${end}/${buf.byteLength}`, "Content-Length": String(end - start + 1) } });
}
