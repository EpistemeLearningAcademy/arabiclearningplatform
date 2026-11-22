// Quiz + mastery. Keeps XP (reward), test score, item mastery and lesson completion separate.
export const POLICY = { revise: 50, developing: 70, mastery: 85, minAnswers: 3, pass: 70, xpLearn: 10, xpPerCorrect: 2 };
export const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// record = {seen:bool, correct:n, wrong:n, last:ts}. Mastery needs repeated success, never one tap.
export function itemState(r) {
  if (!r || !r.seen) return "notStarted";
  const n = (r.correct || 0) + (r.wrong || 0);
  if (!n) return "introduced";
  const acc = (r.correct / n) * 100;
  if (r.correct >= POLICY.minAnswers && acc >= POLICY.mastery) return "mastered";
  if (n >= 2 && acc < POLICY.revise) return "needsRevision";
  return acc >= POLICY.developing ? "practising" : "developing";
}

// Distinct items per attempt; alternates picture→Arabic and Arabic→English questions.
export function buildQuiz(pool, count = 5) {
  if (pool.length < 4) return [];
  return shuffle(pool).slice(0, Math.min(count, pool.length)).map((it, i) => {
    const first = i % 2 === 0, letter = it.kind === "letter", key = first ? "ar" : "en";
    const type = letter ? (first ? "lname" : "lletter") : (first ? "pic" : "meaning");
    const promptKind = type === "pic" ? "emoji" : type === "lname" ? "text" : "ar";
    const wrong = shuffle(pool.filter(o => o.id !== it.id && o[key] !== it[key])).slice(0, 3);
    return { itemId: it.id, type, promptKind, emoji: it.emoji, ar: it.ar, en: it.en, answer: it[key],
      options: shuffle([it, ...wrong]).map(o => ({ text: o[key], isAr: key === "ar", ok: o.id === it.id })) };
  });
}

const loc = (o, l) => (typeof o === "string" ? o : (o && (o[l] || o.en)) || "");
// Lesson practice -> same question shape the quiz view already renders.
export const buildLessonQuiz = (les, l) => shuffle(les.practice).map(p => ({ itemId: les.id + ":" + p.id, type: "lesson", lesson: true,
  heading: loc(p.prompt, l), promptKind: p.promptAr ? "ar" : "none", ar: p.promptAr || "", en: "", emoji: "", answer: loc(p.options[p.answer].text, l),
  explanation: loc(p.explanation, l), options: shuffle(p.options.map((o, i) => ({ text: loc(o.text, l), isAr: !!o.ar, ok: i === p.answer }))) }));
export const letterForms = l => l.joinsNext ? [["isolated", l.ar], ["initial", l.ar + "ـ"], ["medial", "ـ" + l.ar + "ـ"], ["final", "ـ" + l.ar]] : [["isolated", l.ar], ["final", "ـ" + l.ar]];
// Position drill for letters that join forward. Alternates "pick the form" and "name the letter from its form".
export function buildPositionQuiz(pool, tr, lg, count = 6) {
  const J = pool.filter(l => l.joinsNext), nm = l => (lg === "ar" ? l.nameAr : l.en);
  return shuffle(J).slice(0, count).map((it, i) => {
    const pos = ["initial", "medial", "final"][Math.floor(Math.random() * 3)], f = Object.fromEntries(letterForms(it));
    const base = { itemId: it.id + ":pos", type: "position", emoji: "", en: "" };
    if (i % 2 === 0) return { ...base, heading: tr("posQ1", { pos: tr("posName." + pos), name: nm(it) }), promptKind: "none", ar: "", answer: f[pos],
      options: shuffle(["isolated", "initial", "medial", "final"].map(k => ({ text: f[k], isAr: true, ok: k === pos }))) };
    const wrong = shuffle(J.filter(o => o.id !== it.id)).slice(0, 3);
    return { ...base, heading: tr("posQ2"), promptKind: "ar", ar: f[pos], answer: nm(it),
      options: shuffle([it, ...wrong].map(o => ({ text: nm(o), isAr: lg === "ar", ok: o.id === it.id }))) };
  });
}
export function buildListeningQuiz(pool, tr, count = 6) {
  if (pool.length < 4) return [];
  return shuffle(pool).slice(0, count).map(it => ({ itemId: it.id + ":listen", type: "listen", heading: tr("listenQ"), promptKind: "listen", ar: it.ar, en: "", emoji: "", answer: it.ar,
    options: shuffle([it, ...shuffle(pool.filter(o => o.id !== it.id && o.ar !== it.ar)).slice(0, 3)]).map(o => ({ text: o.ar, isAr: true, ok: o.id === it.id })) }));
}
// Sentence builder helpers: tiles are shuffled so they never already form a correct answer.
export const checkOrder = (answers, picked) => answers.some(a => a.length === picked.length && a.every((w, i) => w === picked[i]));
export function scramble(answers) {
  const tokens = answers[0];
  for (let k = 0; k < 20; k++) { const s = shuffle(tokens); if (s.length < 2 || !checkOrder(answers, s)) return s; }
  return shuffle(tokens);
}
// Tracing feedback from two RGBA pixel buffers (same size): the guide mask and the learner's ink.
// Measures coverage only; it cannot judge stroke order or shape.
export function traceStats(mask, ink) {
  let m = 0, cov = 0, k = 0;
  for (let i = 3; i < mask.length; i += 4) {
    const a = mask[i] > 40, b = ink[i] > 40;
    if (a) m++; if (b) k++; if (a && b) cov++;
  }
  return k === 0 ? null : { covered: m ? Math.round((cov / m) * 100) : 0, onLetter: Math.round((cov / k) * 100) };
}
export const scoreQuiz = qs => {
  const correct = qs.filter(q => q.chosen !== undefined && q.options[q.chosen].ok).length;
  const pct = qs.length ? Math.round((correct / qs.length) * 100) : 0;
  return { correct, total: qs.length, pct, passed: pct >= POLICY.pass };
};

export function recordAnswers(progress, qs) {
  const now = Date.now();
  for (const q of qs) {
    const r = progress.items[q.itemId] || (progress.items[q.itemId] = { seen: true, correct: 0, wrong: 0 });
    r.seen = true; r.last = now;
    q.options[q.chosen].ok ? r.correct++ : r.wrong++;
  }
}

export function touchStreak(progress) {
  const today = new Date().toISOString().slice(0, 10), s = progress.streak;
  if (s.last === today) return;
  const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  s.count = s.last === y ? s.count + 1 : 1; s.last = today;
}

// Revision list: weakest states first, then oldest practice.
export function revisionList(progress, items) {
  const rank = { needsRevision: 0, developing: 1, practising: 2 };
  return items.map(i => ({ i, s: itemState(progress.items[i.id]), last: (progress.items[i.id] || {}).last || 0 }))
    .filter(x => x.s in rank).sort((a, b) => rank[a.s] - rank[b.s] || a.last - b.last).slice(0, 6);
}
