// Achievements: rules live in content/shared/achievements.json. Each badge is earned once per learner.
// Badges are based on learning evidence (completed lessons, learned/mastered items, quiz scores, streaks), never on XP.
import { itemState, localDay } from "./engine.js";
export function evaluate(P, catalog, c) {
  const pr = P.progress, got = pr.achievements || {}, L = pr.lessons || {};
  const done = c.lessons.filter(l => (L[l.id] || {}).completed), ids = s => (s === "letters" ? c.letterIds : c.vocabIds);
  const rules = {
    lessonsCompleted: r => done.length >= r.min,
    learned: r => ids(r.set).filter(id => (pr.items[id] || {}).learned).length >= r.min,
    mastered: r => ids(r.set).filter(id => itemState(pr.items[id]) === "mastered").length >= r.min,
    moduleComplete: r => { const m = c.lessons.filter(l => l.module === r.module); return m.length > 0 && m.every(l => (L[l.id] || {}).completed); },
    levelLessons: r => done.filter(l => l.level === r.level).length >= r.min,
    perfectQuiz: r => pr.attempts.some(a => a.total >= r.minQuestions && a.pct === 100),
    readingPassed: r => Object.values(pr.reading || {}).filter(x => x.passed).length >= r.min,
    listeningPassed: r => pr.attempts.filter(a => a.topic === "listening" && a.pct >= 70).length >= r.min,
    builderPassed: r => !!(pr.builder && pr.builder.passed) && r.min <= 1,
    tracingDone: r => Object.values(pr.tracing || {}).reduce((n, x) => n + (x.count || 0), 0) >= r.min,
    writingDone: r => Object.values(pr.writing || {}).filter(x => x.ok).length >= r.min,
    streak: r => pr.streak.count >= r.min };
  return catalog.filter(a => !got[a.id] && rules[a.rule.type] && rules[a.rule.type](a.rule));
}

// ---- Weekly challenges (weeks run Monday to Sunday, device-local time) ----
export const weekStart = (now = Date.now()) => { const d = new Date(now); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };
export const weekKey = ws => localDay(ws);
export function pickChallenges(all, ws) {
  if (!all.length) return [];
  const n = Math.floor(ws / 604800000);
  return [0, 1, 2].map(i => all[(n + i) % all.length]).filter((c, i, a) => a.indexOf(c) === i);
}
export function challengeProgress(P, c, ws) {
  const pr = P.progress, end = new Date(ws); end.setDate(end.getDate() + 7);
  const inW = t => t >= ws && t < end.getTime(), s0 = localDay(ws), e = new Date(ws); e.setDate(e.getDate() + 6); const s1 = localDay(e.getTime());
  const at = (pr.attempts || []).filter(a => inW(a.ts)), r = c.rule;
  switch (r.type) {
    case "lessonsCompleted": return Object.values(pr.lessons || {}).filter(x => x.completed && inW(x.completedAt || 0)).length;
    case "quizzesPassed": return at.filter(a => a.pct >= 70).length;
    case "daysActive": return (pr.days || []).filter(d => d >= s0 && d <= s1).length;
    case "perfectQuiz": return at.filter(a => a.pct === 100 && a.total >= (r.minQuestions || 5)).length;
    case "readingPassed": return at.filter(a => String(a.topic).startsWith("r-") && a.pct >= 70).length;
    case "builderPassed": return at.filter(a => a.topic === "builder" && a.pct >= 70).length;
    case "listeningPassed": return at.filter(a => a.topic === "listening" && a.pct >= 70).length;
    default: return 0;
  }
}
// ---- Certificates: every lesson in the listed modules completed AND its practice passed (70%+) ----
export function certProgress(P, cert, lessons) {
  const L = (P.progress.lessons || {}), ls = lessons.filter(l => cert.modules.includes(l.module));
  return { done: ls.filter(l => (L[l.id] || {}).completed && (L[l.id].best || 0) >= 70).length, total: ls.length };
}
export function certsEarned(P, certs, lessons) {
  const got = P.progress.certificates || {};
  return certs.filter(c => { if (got[c.id]) return false; const p = certProgress(P, c, lessons); return p.total > 0 && p.done === p.total; });
}
