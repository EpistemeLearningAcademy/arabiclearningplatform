// Local learner summaries, assignment status and CSV export. Everything is computed from data on this device.
export const lastActive = p => {
  const pr = p.progress, t = [...(pr.attempts || []).map(a => a.ts), ...Object.values(pr.lessons || {}).map(x => x.completedAt || 0)];
  return Math.max(0, ...t) || null;
};
export function summarize(p, lessons) {
  const pr = p.progress, L = pr.lessons || {}, at = pr.attempts || [], recent = at.slice(-20);
  return { name: p.name, xp: pr.xp || 0, done: lessons.filter(l => (L[l.id] || {}).completed).length, total: lessons.length, attempts: at.length,
    avg: recent.length ? Math.round(recent.reduce((s, a) => s + a.pct, 0) / recent.length) : null, streak: (pr.streak || {}).count || 0, last: lastActive(p),
    weak: lessons.filter(l => L[l.id] && L[l.id].best != null && L[l.id].best < 70), badges: Object.keys(pr.achievements || {}).length, certs: Object.keys(pr.certificates || {}).length };
}
export function assignmentDone(p, a) {
  const pr = p.progress;
  if (a.type === "lesson") return !!((pr.lessons || {})[a.target] || {}).completed;
  if (a.type === "passage") return !!((pr.reading || {})[a.target] || {}).passed;
  if (a.type === "builder") return !!(pr.builder || {}).passed;
  return false;
}
// CSV cells starting with = + - @ are prefixed so spreadsheets do not treat learner names as formulas.
const cell = v => { let s = String(v ?? ""); if (/^[=+\-@]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
export function toCSV(p, lessons) {
  const pr = p.progress, L = pr.lessons || {}, d = ms => (ms ? new Date(ms).toISOString().slice(0, 10) : ""), rows = [["section", "id", "detail", "date", "correct", "total", "percent"]];
  rows.push(["learner", p.id, p.name, "", "", "", ""], ["xp", "", pr.xp || 0, "", "", "", ""]);
  for (const l of lessons) { const x = L[l.id]; if (x) rows.push(["lesson", l.id, x.completed ? "completed" : "started", d(x.completedAt), "", "", x.best ?? ""]); }
  for (const a of pr.attempts || []) rows.push(["attempt", a.topic || "", "", d(a.ts), a.correct, a.total, a.pct]);
  for (const a of pr.assignments || []) rows.push(["assignment", a.id, a.type + ":" + a.target, a.due || "", "", "", assignmentDone(p, a) ? "done" : "open"]);
  return rows.map(r => r.map(cell).join(",")).join("\n");
}
