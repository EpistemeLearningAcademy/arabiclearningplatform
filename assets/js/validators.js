// Content checks for vocabulary files. Returns an array of problem strings (empty = OK).
export function validateAchievements(cat) {
  const errs = [], ids = new Set(), TYPES = ["lessonsCompleted", "learned", "mastered", "moduleComplete", "levelLessons", "perfectQuiz", "streak"];
  for (const a of cat || []) {
    if (!a.id || ids.has(a.id)) errs.push(`achievement id missing or duplicate (${a.id})`); else ids.add(a.id);
    if (!a.title || !a.title.en || !a.title.ar || !a.desc || !a.desc.en || !a.desc.ar) errs.push(`${a.id}: missing en/ar title or desc`);
    if (!a.rule || !TYPES.includes(a.rule.type)) errs.push(`${a.id}: unknown rule type`);
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
