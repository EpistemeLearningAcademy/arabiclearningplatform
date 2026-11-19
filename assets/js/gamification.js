// Achievements: rules live in content/shared/achievements.json. Each badge is earned once per learner.
// Badges are based on learning evidence (completed lessons, learned/mastered items, quiz scores, streaks), never on XP.
import { itemState } from "./engine.js";
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
    streak: r => pr.streak.count >= r.min };
  return catalog.filter(a => !got[a.id] && rules[a.rule.type] && rules[a.rule.type](a.rule));
}
