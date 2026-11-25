// Kalimāti al-Ūlā — reliable updates with offline fallback.
// Learner profiles and progress remain in IndexedDB/localStorage.
const CACHE = "kalimati-v2-21";
const PRECACHE = [
  "index.html", "offline.html", "manifest.json", "assets/css/main.css",
  "assets/js/app.js", "assets/js/i18n.js", "assets/js/storage.js", "assets/js/engine.js",
  "assets/js/validators.js", "assets/js/gamification.js", "assets/js/reports.js", "assets/js/writing.js",
  "assets/js/audio.js", "content/audio/manifest.json", "content/images/manifest.json", "content/shared/branding.json",
  "content/advanced/lessons/moods-passive.json", "content/advanced/lessons/sentence-structures.json", "content/intermediate/reading/graded-02.json", "content/advanced/reading/graded-02.json",
  "content/intermediate/writing/prompts.json", "content/advanced/writing/prompts.json", "content/shared/challenges.json", "content/shared/certificates.json",
  "content/shared/achievements.json", "content/intermediate/lessons/nouns-pronouns.json", "content/intermediate/lessons/nouns-number.json", "content/intermediate/reading/graded-01.json",
  "content/intermediate/lessons/verbs-sentences.json", "content/intermediate/sentences/builder-01.json", "content/intermediate/lessons/adjectives-prepositions.json", "content/advanced/lessons/case-morphology.json",
  "content/advanced/lessons/verbs-particles.json", "content/advanced/reading/graded-01.json", "content/index.json", "content/translations/en.json",
  "content/translations/ar.json", "content/beginner/vocabulary/core.json", "content/beginner/alphabet/letters.json", "content/beginner/lessons/short-vowels.json",
  "content/beginner/lessons/long-vowels.json", "content/beginner/lessons/reading-signs.json", "content/beginner/lessons/letter-positions.json", "assets/icons/icon-192.png",
  "assets/icons/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(PRECACHE);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith("kalimati-v2-") && name !== CACHE).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Cache external vocabulary photographs after first successful online load.
  if (request.destination === "image" && url.origin !== self.location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response.ok || response.type === "opaque") await cache.put(request, response.clone());
        return response;
      } catch {
        return new Response("", { status: 504, statusText: "Image unavailable offline" });
      }
    })());
    return;
  }

  if (url.origin !== self.location.origin) return;
  const isPage = request.mode === "navigate";
  const isCodeOrContent = /\.(?:js|mjs|css|json)$/i.test(url.pathname);

  // Fetch the newest app code/content first; fall back to this release's cache offline.
  if (isPage || isCodeOrContent) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch {
        return (await cache.match(request))
          || (isPage ? await cache.match("index.html") : null)
          || (isPage ? await cache.match("offline.html") : null)
          || new Response("Offline and this resource is not cached.", { status: 503 });
      }
    })());
    return;
  }

  if (request.headers.has("range")) {
    event.respondWith(serveRange(request));
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  })());
});

// Support byte-range requests from audio elements and retain offline playback.
async function serveRange(request) {
  const cache = await caches.open(CACHE);
  const key = new Request(request.url);
  let response = await cache.match(key);
  if (!response) {
    try {
      response = await fetch(key);
      if (!response.ok) return response;
      await cache.put(key, response.clone());
    } catch {
      return new Response("", { status: 504 });
    }
  }
  const buffer = await response.arrayBuffer();
  const match = /bytes=(\d+)-(\d*)/.exec(request.headers.get("range") || "");
  if (!match) return new Response(buffer, { status: 200, headers: response.headers });
  const start = Number(match[1]);
  const end = match[2] ? Math.min(Number(match[2]), buffer.byteLength - 1) : buffer.byteLength - 1;
  return new Response(buffer.slice(start, end + 1), {
    status: 206,
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "audio/mpeg",
      "Content-Range": `bytes ${start}-${end}/${buffer.byteLength}`,
      "Content-Length": String(end - start + 1)
    }
  });
}
