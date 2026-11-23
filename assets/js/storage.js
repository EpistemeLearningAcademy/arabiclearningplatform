// IndexedDB: one store "profiles"; each record holds a learner and their progress. Schema version in rec.v.
const DB = "kalimati", STORE = "profiles", KV = "kv", SCHEMA = 1;
let db;
const open = () => db ? Promise.resolve(db) : new Promise((res, rej) => {
  if (!window.indexedDB) return rej(new Error("IndexedDB unavailable"));
  const r = indexedDB.open(DB, 2);
  r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: "id" }); if (!d.objectStoreNames.contains(KV)) d.createObjectStore(KV); };
  r.onsuccess = () => { db = r.result; res(db); };
  r.onerror = () => rej(r.error);
});
const run = async (mode, fn) => { const d = await open(); return new Promise((res, rej) => {
  const tx = d.transaction(STORE, mode), out = fn(tx.objectStore(STORE));
  tx.oncomplete = () => res(out.result); tx.onerror = () => rej(tx.error); }); };
export const newProfile = p => ({ id: crypto.randomUUID(), v: SCHEMA, created: Date.now(), avatar: "🌱", ...p,
  progress: { items: {}, attempts: [], xp: 0, streak: { last: "", count: 0 }, lastTheme: "" } });
export const allProfiles = () => run("readonly", s => s.getAll());
export const saveProfile = p => run("readwrite", s => s.put(p));
export const deleteProfile = id => run("readwrite", s => s.delete(id));
export const currentId = () => { try { return localStorage.getItem("kal.profile"); } catch { return null; } };
export const setCurrentId = id => { try { id ? localStorage.setItem("kal.profile", id) : localStorage.removeItem("kal.profile"); } catch {} };
export const exportJSON = p => JSON.stringify({ app: "kalimati", ...p }, null, 1);
// Validate imported data; returns a clean new profile (fresh id) or null. Keeps every progress field the app uses.
const PROGRESS_OBJECTS = ["items", "lessons", "reading", "builder", "copy", "writing", "tracing", "achievements", "weekly", "certificates", "streak"];
export function parseImport(text) {
  try {
    const o = typeof text === "string" ? JSON.parse(text) : text, pr = o && o.progress;
    if (!o || o.app !== "kalimati" || typeof o.name !== "string" || !pr || typeof pr.items !== "object" || !Array.isArray(pr.attempts)) return null;
    const base = newProfile({ name: o.name.slice(0, 40), age: o.age, mode: o.mode === "young" ? "young" : "standard", avatar: String(o.avatar || "🌱").slice(0, 4) });
    const out = base.progress;
    for (const k of PROGRESS_OBJECTS) if (pr[k] && typeof pr[k] === "object" && !Array.isArray(pr[k])) out[k] = pr[k];
    out.attempts = pr.attempts.slice(-200); out.xp = +pr.xp || 0;
    for (const k of ["bookmarks", "days"]) if (Array.isArray(pr[k])) out[k] = pr[k].slice(-120);
    if (Array.isArray(pr.assignments)) out.assignments = pr.assignments.filter(a => a && typeof a.id === "string").slice(0, 100);
    if (typeof pr.lastLesson === "string") out.lastLesson = pr.lastLesson;
    if (!out.streak || typeof out.streak.count !== "number") out.streak = { last: "", count: 0 };
    return base;
  } catch { return null; }
}

// Key-value store: app settings, certificate branding images and vocabulary photos chosen on this device.
const kv = async (mode, fn) => { const d = await open(); return new Promise((res, rej) => { const tx = d.transaction(KV, mode), out = fn(tx.objectStore(KV)); tx.oncomplete = () => res(out && out.result); tx.onerror = () => rej(tx.error); }); };
export const kvGet = key => kv("readonly", s => s.get(key));
export const kvSet = (key, val) => kv("readwrite", s => s.put(val, key));
export const kvDel = key => kv("readwrite", s => s.delete(key));
export async function kvEntries(prefix = "") {
  const d = await open();
  return new Promise((res, rej) => { const out = [], tx = d.transaction(KV, "readonly"), c = tx.objectStore(KV).openCursor();
    c.onsuccess = () => { const cur = c.result; if (cur) { if (String(cur.key).startsWith(prefix)) out.push([cur.key, cur.value]); cur.continue(); } };
    tx.oncomplete = () => res(out); tx.onerror = () => rej(tx.error); });
}
