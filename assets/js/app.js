import { t, setLang, savedLang, lang } from "./i18n.js";
import * as S from "./storage.js";
import { POLICY, itemState, buildQuiz, buildLessonQuiz, buildPositionQuiz, letterForms, scoreQuiz, recordAnswers, touchStreak, revisionList } from "./engine.js";
import { evaluate } from "./gamification.js";
import { validateVocab, validateLetters, validateLessons, validateAchievements } from "./validators.js";

const app = document.getElementById("app");
let themes = [], catalog = [], lessons = [], lsFiles = {}, letters = [], lfiles = {}, files = {}, P = null, view = "home", ctx = {};
const vocabItems = () => themes.flatMap(th => th.items);
const allItems = () => [...letters, ...vocabItems()];

// Safe DOM builder: text only via textContent, never innerHTML.
function h(tag, a = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(a)) {
    if (k === "class") e.className = v; else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, ""); else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
}
const ar = (txt, cls = "") => h("span", { class: "ar " + cls, lang: "ar", dir: "rtl" }, txt);
const btn = (label, fn, cls = "") => h("button", { class: cls, type: "button", onclick: fn }, label);
const bar = pct => h("div", { class: "bar", role: "progressbar", "aria-valuenow": Math.round(pct), "aria-valuemin": 0, "aria-valuemax": 100 }, h("i", { style: `width:${pct}%` }));
const loc = o => (typeof o === "string" ? o : (o && (o[lang()] || o.en)) || "");
const lp = id => ((P.progress.lessons ||= {})[id] ||= {});
const title = th => (lang() === "ar" ? th.title.ar : th.title.en);

async function save() {
  try {
    const won = evaluate(P, catalog, { lessons, vocabIds: vocabItems().map(i => i.id), letterIds: letters.map(l => l.id) });
    if (won.length) { const pr = P.progress; pr.achievements ||= {}; for (const a of won) { pr.achievements[a.id] = Date.now(); pr.xp += a.xp; }
      flash("🏅 " + won.map(a => t("newBadge", { t: loc(a.title), n: a.xp })).join(" · ")); }
    await S.saveProfile(P);
  } catch { flash(t("storageError")); }
}
function flash(msg) { const s = document.getElementById("status"); s.textContent = msg; s.hidden = false; setTimeout(() => (s.hidden = true), 4000); }
function go(v, c = {}) { view = v; ctx = c; render(); window.scrollTo(0, 0); }

function shell(content) {
  const m = h("main", {}, content);
  const kids = [m];
  if (P) {
    const tab = (v, k) => h("button", { type: "button", "aria-current": view === v || (v === "home" && ["theme", "quiz", "result"].includes(view)) ? "page" : null, onclick: () => go(v) }, t(k));
    kids.push(h("nav", { class: "tabs", "aria-label": "Main" }, tab("home", "home"), tab("dashboard", "dashboard"), tab("settings", "settings")));
  }
  app.replaceChildren(...kids);
  document.body.classList.toggle("young", !!P && P.mode === "young");
  m.querySelector("h1,h2")?.setAttribute("tabindex", "-1");
}

const langToggle = () => btn(lang() === "ar" ? "English" : "العربية", async () => { await setLang(lang() === "ar" ? "en" : "ar"); render(); }, "");

// ---------- Profiles ----------
async function profilesView(creating) {
  const list = await S.allProfiles();
  if (creating || !list.length) {
    const name = h("input", { id: "n", maxlength: 40, autocomplete: "off" });
    const age = h("select", { id: "a" }, ["child", "teen", "adult"].map(k => h("option", { value: k }, t("age." + k))));
    const mode = h("select", { id: "m" }, ["young", "standard"].map(k => h("option", { value: k }, t("mode." + k))));
    return shell([h("h1", {}, t("newProfile")),
      h("label", { for: "n" }, t("name")), name, h("label", { for: "a" }, t("ageGroup")), age, h("label", { for: "m" }, t("mode")), mode,
      h("div", { class: "row", style: "margin-top:1rem" },
        btn(t("create"), async () => { const nm = name.value.trim(); if (!nm) return name.focus();
          P = S.newProfile({ name: nm, age: age.value, mode: mode.value }); await save(); S.setCurrentId(P.id); go("home"); }, "primary"),
        list.length ? btn(t("cancel"), () => go("profiles")) : null),
      h("p", { class: "note" }, t("localNote"))]);
  }
  shell([h("div", { class: "row sb" }, h("h1", {}, t("who")), langToggle()),
    list.map(p => h("button", { class: "card tile", style: "width:100%;flex-direction:row;justify-content:flex-start", type: "button",
      onclick: () => { P = p; S.setCurrentId(p.id); go("home"); } }, h("span", { class: "emoji" }, p.avatar), h("strong", {}, p.name))),
    btn("+ " + t("newProfile"), () => go("profiles", { creating: true }), "gold"), h("p", { class: "note" }, t("localNote"))]);
}

// ---------- Home / themes ----------
function homeView() {
  const pr = P.progress, tiles = themes.map(th => {
    const n = th.items.filter(i => pr.items[i.id]?.seen && pr.items[i.id].learned).length;
    return h("button", { class: "card tile", type: "button", onclick: () => go("theme", { th, i: 0, flip: false }) },
      h("span", { class: "emoji" }, th.emoji), ar(th.title.ar), lang() === "en" ? h("span", {}, th.title.en) : null,
      h("small", {}, t("learnedCount", { n, m: th.items.length })));
  });
  shell([h("h1", {}, `${P.avatar} ${P.name}`), h("h2", {}, t("level1")),
    h("button", { class: "card tile", style: "width:100%", type: "button", onclick: () => go("alphabet") }, h("span", { class: "ar big" }, "أ ب ت"), h("strong", {}, t("alphabet")), h("small", {}, t("letters"))),
    h("p", { class: "muted" }, t("themes")),
    h("div", { class: "grid" }, tiles), btn(t("practiceAll"), () => startQuiz(vocabItems()), "primary"),
    h("h2", {}, t("lessons")), P.progress.lastLesson && lessons.find(l => l.id === P.progress.lastLesson) ? btn("▶ " + t("resume"), () => go("lesson", { l: lessons.find(l => l.id === P.progress.lastLesson) }), "gold") : null,
    lessons.filter(l => l.level === "beginner").map(lessonRow),
    h("h2", {}, t("level2")), lessons.some(l => l.level === "intermediate") ? lessons.filter(l => l.level === "intermediate").map(lessonRow) : h("p", { class: "badge" }, t("soon")),
    h("h2", {}, t("level3")), h("p", { class: "badge" }, t("soon")),
    h("p", { class: "note" }, t("review.note"))]);
}

// ---------- Flashcards ----------
function speak(text) {
  const v = window.speechSynthesis && speechSynthesis.getVoices().find(x => x.lang.startsWith("ar"));
  if (!v) return flash(t("noVoice"));
  const u = new SpeechSynthesisUtterance(text); u.voice = v; u.lang = v.lang; speechSynthesis.cancel(); speechSynthesis.speak(u);
}
function themeView() {
  const { th } = ctx, it = th.items[ctx.i], r = P.progress.items[it.id] || {};
  const learned = !!r.learned;
  shell([h("div", { class: "row sb" }, btn("← " + t("back"), () => go("home")), h("span", {}, t("seen", { i: ctx.i + 1, n: th.items.length }))),
    h("h2", {}, title(th)), bar(((ctx.i + 1) / th.items.length) * 100),
    h("button", { class: "card flash", type: "button", "aria-label": t("tapFlip"), onclick: async () => { markSeen(it); ctx.flip = !ctx.flip; render(); } },
      h("span", { class: "emoji big", "aria-hidden": "true" }, it.emoji), ar(it.ar, "big"),
      ctx.flip ? h("strong", { dir: "ltr" }, it.en) : h("small", { class: "muted" }, t("tapFlip"))),
    h("div", { class: "row" }, btn("🔊 " + t("listen"), () => speak(it.ar)), btn(learned ? t("learnedDone") : "⭐ " + t("markLearned"), async () => {
      if (learned) return; markSeen(it); P.progress.items[it.id].learned = true; P.progress.xp += POLICY.xpLearn; touchStreak(P.progress); await save(); render(); }, learned ? "" : "gold")),
    h("small", { class: "muted" }, t("voiceNote")),
    h("div", { class: "row sb", style: "margin-top:1rem" },
      btn("← " + t("prev"), () => go("theme", { th, i: (ctx.i - 1 + th.items.length) % th.items.length, flip: false })),
      btn(t("next") + " →", () => go("theme", { th, i: (ctx.i + 1) % th.items.length, flip: false }), "primary")),
    h("div", { style: "margin-top:1rem" }, btn(t("practice"), () => startQuiz(th.items))) ]);
}
function markSeen(it) { const m = P.progress.items; (m[it.id] ||= { correct: 0, wrong: 0 }).seen = true; save(); }

// ---------- Alphabet ----------
const forms = letterForms;
function learnBtn(it) {
  const done = !!(P.progress.items[it.id] || {}).learned;
  return btn(done ? t("learnedDone") : "⭐ " + t("markLearned"), async () => { if (done) return; markSeen(it);
    P.progress.items[it.id].learned = true; P.progress.xp += POLICY.xpLearn; touchStreak(P.progress); await save(); render(); }, done ? "" : "gold");
}
function alphabetView() {
  shell([h("div", { class: "row sb" }, btn("← " + t("back"), () => go("home")), h("span", {}, t("letters"))), h("h2", {}, t("alphabet")),
    h("div", { class: "grid", style: "grid-template-columns:repeat(auto-fill,minmax(88px,1fr))" }, letters.map((l, i) =>
      h("button", { class: "card tile", style: "min-height:96px;margin:0", type: "button", onclick: () => go("letter", { i }) }, ar(l.ar, "big"), h("small", {}, l.en)))),
    h("div", { class: "row", style: "margin-top:1rem" }, btn(t("practice"), () => startQuiz(letters), "primary"), btn(t("positions"), () => go("quiz", { qs: buildPositionQuiz(letters, t, lang()), qi: 0, topic: "positions" }))), h("p", { class: "note" }, t("letterNote"))]);
}
function letterView() {
  const l = letters[ctx.i], n = letters.length;
  shell([h("div", { class: "row sb" }, btn("← " + t("back"), () => go("alphabet")), h("span", {}, t("seen", { i: ctx.i + 1, n }))),
    h("div", { class: "card flash" }, h("span", { style: "font-size:5rem", class: "ar", lang: "ar", dir: "rtl" }, l.ar), ar(l.nameAr), h("strong", { dir: "ltr" }, l.en)),
    h("h3", {}, t("forms")), h("div", { class: "grid", style: "grid-template-columns:repeat(auto-fill,minmax(110px,1fr))" },
      forms(l).map(([k, f]) => h("div", { class: "card tile", style: "min-height:90px;margin:0" }, ar(f, "big"), h("small", {}, t(k))))),
    l.joinsNext ? null : h("p", { class: "note" }, t("noJoin")), h("div", { class: "row" }, learnBtn(l)),
    h("div", { class: "row sb", style: "margin-top:1rem" }, btn("← " + t("prev"), () => go("letter", { i: (ctx.i - 1 + n) % n })), btn(t("next") + " →", () => go("letter", { i: (ctx.i + 1) % n }), "primary"))]);
}

// ---------- Lessons ----------
function lessonRow(l) {
  return h("button", { class: "card row sb", style: "width:100%", type: "button", onclick: () => go("lesson", { l }) }, h("span", {}, loc(l.title)),
    h("span", { class: "badge" }, lp(l.id).completed ? "✓" : lp(l.id).best != null ? lp(l.id).best + "%" : "•"));
}
function lessonView() {
  const l = ctx.l, i = lessons.indexOf(l), st = lp(l.id), P2 = P.progress;
  if (P2.lastLesson !== l.id) { P2.lastLesson = l.id; save(); }
  const book = (P2.bookmarks ||= []), marked = book.includes(l.id);
  const need = (l.prerequisites || []).filter(r => !lp(r).completed).map(r => lessons.find(x => x.id === r)).filter(Boolean);
  shell([h("div", { class: "row sb" }, btn("← " + t("back"), () => go("home")), h("span", {}, t("seen", { i: i + 1, n: lessons.length }))),
    h("h1", {}, loc(l.title)), h("span", { class: "badge" }, `${l.minutes} min`),
    need.length ? h("p", { class: "note" }, t("tryFirst", { t: need.map(x => loc(x.title)).join(", ") })) : null,
    h("h3", {}, t("objectives")), h("ul", {}, l.objectives.map(o => h("li", {}, loc(o)))),
    h("h3", {}, t("explanation")), l.explanation.map(p => h("p", {}, loc(p))),
    h("h3", {}, t("examples")), h("div", { class: "grid", style: "grid-template-columns:repeat(auto-fill,minmax(100px,1fr))" },
      l.examples.map(e => h("div", { class: "card tile", style: "min-height:90px;margin:0" }, ar(e.ar, "big"), h("strong", { dir: "ltr" }, e.tr), e.en !== "syllable" ? h("small", { dir: "ltr" }, e.en) : null))),
    h("p", {}, t("bestScore") + ": ", h("strong", {}, st.best != null ? st.best + "%" : t("noScore"))),
    h("div", { class: "row" }, btn(t("startPractice"), () => go("quiz", { qs: buildLessonQuiz(l, lang()), qi: 0, lessonId: l.id }), "primary"),
      btn(marked ? t("bookmarked") : "☆ " + t("bookmark"), async () => { marked ? book.splice(book.indexOf(l.id), 1) : book.push(l.id); await save(); render(); })),
    h("div", { class: "row", style: "margin-top:.7rem" }, btn(st.completed ? t("completed") : t("complete"), async () => { if (st.completed) return;
      st.completed = true; P2.xp += POLICY.xpLearn; touchStreak(P2); await save(); render(); }, st.completed ? "" : "gold")), h("small", { class: "muted" }, t("completeNote")),
    h("div", { class: "row sb", style: "margin-top:1rem" }, i > 0 ? btn("← " + t("prev"), () => go("lesson", { l: lessons[i - 1] })) : h("span"),
      i < lessons.length - 1 ? btn(t("next") + " →", () => go("lesson", { l: lessons[i + 1] }), "primary") : h("span"))]);
}

// ---------- Quiz ----------
function startQuiz(pool) { const qs = buildQuiz(pool, 5); if (!qs.length) return flash("Not enough words"); go("quiz", { qs, qi: 0, locked: false }); }
function quizView() {
  const { qs, qi } = ctx, q = qs[qi], answered = q.chosen !== undefined;
  const opts = q.options.map((o, i) => h("button", { type: "button", disabled: answered,
    class: answered ? (o.ok ? "ok" : i === q.chosen ? "no" : "") : "", onclick: () => answer(i) }, o.isAr ? ar(o.text) : h("span", { dir: "ltr" }, o.text)));
  const last = qi === qs.length - 1;
  shell([h("div", { class: "row sb" }, btn("← " + t("back"), () => go("home")), h("span", {}, t("q", { i: qi + 1, n: qs.length }))),
    bar((qi / qs.length) * 100), h("h2", {}, q.heading || t("question." + q.type)),
    q.promptKind === "none" ? null : h("div", { class: "card flash" }, q.promptKind === "emoji" ? h("span", { class: "emoji big", "aria-hidden": "true" }, q.emoji) : q.promptKind === "text" ? h("strong", { class: "big", dir: "ltr" }, q.en) : ar(q.ar, "big")),
    h("div", { class: "opts" }, opts),
    answered ? h("div", { role: "status" }, h("p", {}, q.options[q.chosen].ok ? "✅ " + t("correct") : "❌ " + t("wrong", { a: q.answer })), q.explanation ? h("p", { class: "note" }, q.explanation) : null,
      btn(last ? t("finish") : t("check"), () => (last ? finishQuiz() : go("quiz", { ...ctx, qi: qi + 1 })), "primary")) : null]);
}
function answer(i) { const q = ctx.qs[ctx.qi]; if (q.chosen !== undefined) return; q.chosen = i; render(); } // locks: second tap ignored
async function finishQuiz() {
  const res = scoreQuiz(ctx.qs), lid = ctx.lessonId, ls = lid ? lp(lid) : null, firstPass = ls && !ls.passed;
  if (!lid) recordAnswers(P.progress, ctx.qs); else { ls.best = Math.max(ls.best || 0, res.pct); ls.attempts = (ls.attempts || 0) + 1; if (res.passed) ls.passed = true; }
  const xp = lid && !firstPass ? 0 : res.correct * POLICY.xpPerCorrect; P.progress.xp += xp; touchStreak(P.progress);
  P.progress.attempts.push({ topic: lid || ctx.topic || "vocab", ts: Date.now(), correct: res.correct, total: res.total, pct: res.pct });
  await save(); go("result", { res, xp, qs: ctx.qs, lessonId: lid });
}
function resultView() {
  const { res, xp, qs, lessonId } = ctx, wrong = qs.filter(q => !q.options[q.chosen].ok);
  shell([h("h1", {}, t("result")), h("div", { class: "card" }, h("p", {}, t("score") + ": ", h("strong", {}, `${res.correct}/${res.total} (${res.pct}%)`)),
    h("p", {}, res.passed ? "🏆 " + t("passed") : t("keep")), h("p", { class: "muted" }, `${t("xpEarned")}: +${xp}`)),
    wrong.length ? [h("h3", {}, t("review")), wrong.map(q => h("div", { class: "card row" }, h("span", { class: "emoji" }, q.emoji), ar(q.ar || ""), h("span", { dir: "ltr" }, q.lesson || q.type === "position" ? q.answer : q.en)))] : null,
    h("div", { class: "row" }, lessonId ? btn(t("backLesson"), () => go("lesson", { l: lessons.find(x => x.id === lessonId) }), "primary") : btn(t("again"), () => go("home"), "primary"), btn(t("dashboard"), () => go("dashboard")))]);
}

// ---------- Dashboard ----------
function dashView() {
  const pr = P.progress, items = allItems(), mastered = items.filter(i => itemState(pr.items[i.id]) === "mastered").length;
  const learned = items.filter(i => pr.items[i.id]?.learned).length, rev = revisionList(pr, items);
  const stat = (v, k) => h("div", { class: "card tile" }, h("strong", { class: "big" }, v), h("small", {}, t(k)));
  shell([h("h1", {}, t("dashboard")),
    h("div", { class: "grid" }, stat(pr.xp, "xp"), stat(pr.streak.count, "streak"), stat(`${mastered}/${items.length}`, "mastered"), stat(pr.attempts.length, "attempts")),
    h("p", {}, t("lessonsDone", { n: lessons.filter(l => lp(l.id).completed).length, m: lessons.length })), h("p", {}, t("learnedCount", { n: learned, m: items.length })), bar((learned / items.length) * 100),
    h("h2", {}, t("revision")), rev.length ? rev.map(x => h("div", { class: "card row sb" }, h("span", {}, x.i.emoji + " ", ar(x.i.ar)), h("span", { class: "badge" }, t("state." + x.s)))) : h("p", { class: "muted" }, t("noRevision")),
    h("h2", {}, t("attempts")), pr.attempts.length ? [...pr.attempts].reverse().slice(0, 8).map(a => h("div", { class: "card row sb" }, h("span", {}, new Date(a.ts).toLocaleDateString()), h("strong", {}, `${a.correct}/${a.total} · ${a.pct}%`))) : h("p", { class: "muted" }, t("noAttempts")),
    h("h2", {}, t("achievements")), h("div", { class: "grid" }, catalog.map(a => { const got = (pr.achievements || {})[a.id];
      return h("div", { class: "card tile", style: "margin:0" + (got ? "" : ";opacity:.55") }, h("span", { class: "emoji" }, got ? a.icon : "🔒"), h("strong", {}, loc(a.title)), h("small", {}, loc(a.desc))); }))]);
}

// ---------- Settings ----------
function settingsView() {
  const sizeSel = h("select", { id: "sz", onchange: e => { setSize(e.target.value); } }, ["m", "l", "xl"].map(k => h("option", { value: k, selected: sizeNow() === k }, t("size." + k))));
  const file = h("input", { type: "file", accept: "application/json", hidden: true, onchange: async e => {
    const f = e.target.files[0]; if (!f) return; const p = S.parseImport(await f.text());
    if (!p) return flash(t("importFail")); await S.saveProfile(p); P = p; S.setCurrentId(p.id); flash(t("importOk")); go("home"); } });
  const modeSel = h("select", { id: "md", onchange: async e => { P.mode = e.target.value; await save(); render(); } }, ["young", "standard"].map(k => h("option", { value: k, selected: P.mode === k }, t("mode." + k))));
  const out = h("div", { role: "status" });
  shell([h("h1", {}, t("settings")), h("div", { class: "row sb" }, h("span", {}, t("language")), langToggle()),
    h("label", { for: "md" }, t("mode")), modeSel, h("label", { for: "sz" }, t("textSize")), sizeSel,
    h("div", { class: "row", style: "margin-top:1rem" },
      btn(t("switch"), () => { P = null; S.setCurrentId(null); go("profiles"); }),
      btn(t("export"), () => { const a = h("a", { href: URL.createObjectURL(new Blob([S.exportJSON(P)], { type: "application/json" })), download: `kalimati-${P.name}.json` }); a.click(); }),
      btn(t("import"), () => file.click()), file),
    h("div", { class: "row", style: "margin-top:1rem" }, btn(t("checkContent"), () => {
      const e = [...validateVocab(files), ...validateLetters(lfiles), ...validateLessons(lsFiles), ...validateAchievements(catalog)]; out.replaceChildren(e.length ? h("div", { class: "note" }, t("contentBad"), h("ul", {}, e.map(x => h("li", {}, x)))) : h("div", { class: "note" }, t("contentOk", { n: allItems().length }))); })), out,
    h("div", { style: "margin-top:2rem" }, btn(t("delete"), async () => { if (!confirm(t("confirmDelete"))) return; await S.deleteProfile(P.id); P = null; S.setCurrentId(null); go("profiles"); }, "danger")),
    h("p", { class: "note" }, t("localNote")), h("p", { class: "muted" }, t("org"))]);
}
const sizeNow = () => { try { return localStorage.getItem("kal.size") || "m"; } catch { return "m"; } };
function setSize(v) { try { localStorage.setItem("kal.size", v); } catch {} applySize(); }
function applySize() { document.body.classList.remove("size-l", "size-xl"); const s = sizeNow(); if (s !== "m") document.body.classList.add("size-" + s); }

// ---------- Router ----------
function render() {
  const views = { lesson: lessonView, alphabet: alphabetView, letter: letterView, profiles: () => profilesView(ctx.creating), home: homeView, theme: themeView, quiz: quizView, result: resultView, dashboard: dashView, settings: settingsView };
  if (!P && view !== "profiles") view = "profiles";
  views[view]();
}

async function boot() {
  try { await setLang(savedLang()); } catch { app.textContent = "Could not load interface strings."; return; }
  applySize();
  try {
    const idx = await (await fetch("content/index.json")).json();
    for (const f of idx.vocabulary) files[f] = await (await fetch("content/" + f)).json();
    themes = Object.values(files).flatMap(d => d.themes);
    for (const f of idx.alphabet || []) lfiles[f] = await (await fetch("content/" + f)).json();
    for (const f of idx.lessons || []) lsFiles[f] = await (await fetch("content/" + f)).json();
    if (idx.achievements) catalog = (await (await fetch("content/" + idx.achievements)).json()).achievements;
    lessons = Object.values(lsFiles).flatMap(d => d.lessons);
    letters = Object.values(lfiles).flatMap(d => d.letters).map(l => ({ ...l, kind: "letter", emoji: "" }));
  } catch { app.replaceChildren(h("main", {}, h("p", {}, "Could not load lesson content. Check your connection and reload."))); return; }
  try { const id = S.currentId(); P = id ? (await S.allProfiles()).find(p => p.id === id) || null : null; }
  catch { flash(t("storageError")); }
  view = P ? "home" : "profiles"; render();
}
const net = () => { const s = document.getElementById("status"); if (!navigator.onLine) { s.textContent = t("offline"); s.hidden = false; } else s.hidden = true; };
addEventListener("online", net); addEventListener("offline", net);
if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
boot().then(net);
