// IndexedDB: one store "profiles"; each record holds a learner and their progress. Schema version in rec.v.
const DB = "kalimati", STORE = "profiles", SCHEMA = 1;
let db;
const open = () => db ? Promise.resolve(db) : new Promise((res, rej) => {
  if (!window.indexedDB) return rej(new Error("IndexedDB unavailable"));
  const r = indexedDB.open(DB, 1);
  r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: "id" });
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
// Validate imported data; returns a clean new profile (fresh id) or null.
export function parseImport(text) {
  try {
    const o = JSON.parse(text), pr = o && o.progress;
    if (!o || o.app !== "kalimati" || typeof o.name !== "string" || !pr || typeof pr.items !== "object" || !Array.isArray(pr.attempts)) return null;
    const base = newProfile({ name: o.name.slice(0, 40), age: o.age, mode: o.mode === "young" ? "young" : "standard", avatar: String(o.avatar || "🌱").slice(0, 4) });
    base.progress = { items: pr.items, attempts: pr.attempts.slice(-200), xp: +pr.xp || 0, streak: pr.streak || base.progress.streak, lastTheme: "" };
    return base;
  } catch { return null; }
}
