// Content checks for vocabulary files. Returns an array of problem strings (empty = OK).
export function validateAchievements(cat) {
  const errs = [], ids = new Set(), TYPES = ["lessonsCompleted", "learned", "mastered", "moduleComplete", "levelLessons", "perfectQuiz", "streak", "readingPassed", "listeningPassed", "builderPassed", "tracingDone"];
  for (const a of cat || []) {
    if (!a.id || ids.has(a.id)) errs.push(`achievement id missing or duplicate (${a.id})`); else ids.add(a.id);
    if (!a.title || !a.title.en || !a.title.ar || !a.desc || !a.desc.en || !a.desc.ar) errs.push(`${a.id}: missing en/ar title or desc`);
    if (!a.rule || !TYPES.includes(a.rule.type)) errs.push(`${a.id}: unknown rule type`);
  }
  return errs;
}
export function validateReading(files) {
  const errs = [], ids = new Set();
  for (const [name, d] of Object.entries(files)) {
    if (!d || !Array.isArray(d.passages)) { errs.push(`${name}: missing "passages" array`); continue; }
    for (const p of d.passages) {
      const w = `${name}/${p.id || "?"}`;
      if (!p.id || ids.has(p.id)) errs.push(`${w}: id missing or duplicate`); else ids.add(p.id);
      if (!p.title || !p.title.en || !p.title.ar) errs.push(`${w}: missing en/ar title`);
      if (!Array.isArray(p.lines) || !p.lines.length || p.lines.some(l => !l.ar || !l.en)) errs.push(`${w}: lines need ar and en`);
      if (!Array.isArray(p.questions) || !p.questions.length) errs.push(`${w}: no comprehension questions`);
      for (const q of p.questions || []) {
        if (!Array.isArray(q.options) || q.options.length < 2 || !Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) errs.push(`${w}/${q.id}: bad options or answer index`);
        if (!q.explanation) errs.push(`${w}/${q.id}: missing explanation`);
      }
    }
  }
  return errs;
}
export function validateSentences(files) {
  const errs = [], ids = new Set();
  for (const [name, d] of Object.entries(files)) {
    if (!d || !Array.isArray(d.sentences)) { errs.push(`${name}: missing "sentences" array`); continue; }
    for (const s of d.sentences) {
      const w = `${name}/${s.id || "?"}`;
      if (!s.id || ids.has(s.id)) errs.push(`${w}: id missing or duplicate`); else ids.add(s.id);
      if (!s.meaning) errs.push(`${w}: missing meaning`);
      if (!Array.isArray(s.answers) || !s.answers.length || s.answers.some(a => !Array.isArray(a) || a.length < 2)) { errs.push(`${w}: answers must be lists of 2+ words`); continue; }
      const key = a => [...a].sort().join("|");
      if (s.answers[0].length === 2 && s.answers.length > 1) errs.push(`${w}: two-word sentence with both orders accepted is too easy (any order is correct)`);
      if (s.answers.some(a => key(a) !== key(s.answers[0]))) errs.push(`${w}: alternative answers must use the same words`);
    }
  }
  return errs;
}
export function validateLessons(files) {
  const errs = [], ids = new Set(), LV = ["beginner", "intermediate", "advanced"];
  for (const [name, d] of Object.entries(files)) {
    if (!d || !Array.isArray(d.lessons)) { errs.push(`${name}: missing "lessons" array`); continue; }
    for (const l of d.lessons) {
      const w = `${name}/${l.id || "?"}`;
      if (!l.id || ids.has(l.id)) errs.push(`${w}: id missing or duplicate`); else ids.add(l.id);
      if (!LV.includes(l.level)) errs.push(`${w}: invalid level`);
      if (!l.title || !l.title.en || !l.title.ar) errs.push(`${w}: missing en/ar title`);
      if (!Array.isArray(l.objectives) || !l.objectives.length) errs.push(`${w}: missing objectives`);
      if (!Array.isArray(l.explanation) || !l.explanation.length) errs.push(`${w}: missing explanation`);
      if (!Array.isArray(l.practice) || !l.practice.length) errs.push(`${w}: no practice questions`);
      for (const p of l.practice || []) {
        if (!Array.isArray(p.options) || p.options.length < 2) errs.push(`${w}/${p.id}: needs 2+ options`);
        else if (!Number.isInteger(p.answer) || p.answer < 0 || p.answer >= p.options.length) errs.push(`${w}/${p.id}: answer index out of range`);
        if (!p.explanation) errs.push(`${w}/${p.id}: missing explanation`);
      }
      for (const r of l.prerequisites || []) if (!d.lessons.some(x => x.id === r) && !ids.has(r)) errs.push(`${w}: unknown prerequisite ${r}`);
    }
  }
  return errs;
}
export function validateLetters(files) {
  const errs = [], ids = new Set();
  for (const [name, d] of Object.entries(files)) {
    if (!d || !Array.isArray(d.letters)) { errs.push(`${name}: missing "letters" array`); continue; }
    for (const l of d.letters) {
      if (!l.id || ids.has(l.id)) errs.push(`${name}: letter id missing or duplicate (${l.id})`); else ids.add(l.id);
      if (!l.ar || !l.en || !l.nameAr) errs.push(`${name}/${l.id}: missing ar, en or nameAr`);
    }
  }
  return errs;
}
export function validateVocab(files) {
  const errs = [], ids = new Set(), LEVELS = ["beginner", "intermediate", "advanced"];
  for (const [name, d] of Object.entries(files)) {
    if (!d || !Array.isArray(d.themes)) { errs.push(`${name}: missing "themes" array`); continue; }
    for (const th of d.themes) {
      const w = `${name}/${th.id || "?"}`;
      if (!th.id) errs.push(`${w}: theme has no id`);
      else if (ids.has(th.id)) errs.push(`${w}: duplicate id`); else ids.add(th.id);
      if (!LEVELS.includes(th.level)) errs.push(`${w}: invalid level "${th.level}"`);
      if (!th.title || !th.title.en || !th.title.ar) errs.push(`${w}: missing en/ar title`);
      if (!Array.isArray(th.items) || !th.items.length) errs.push(`${w}: no items`);
      for (const it of th.items || []) {
        if (!it.id || ids.has(it.id)) errs.push(`${w}: item id missing or duplicate (${it.id})`); else ids.add(it.id);
        if (!it.ar || !it.en) errs.push(`${w}/${it.id}: missing ar or en`);
      }
    }
  }
  return errs;
}
