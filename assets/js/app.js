import { t, setLang, savedLang, lang } from "./i18n.js";
import * as S from "./storage.js";
import { POLICY, itemState, buildQuiz, buildLessonQuiz, buildPositionQuiz, buildListeningQuiz, scramble, checkOrder, shuffle, traceStats, letterForms, scoreQuiz, recordAnswers, touchStreak, revisionList } from "./engine.js";
import { evaluate, weekStart, weekKey, pickChallenges, challengeProgress, certProgress, certsEarned } from "./gamification.js";
import { summarize, assignmentDone, toCSV } from "./reports.js";
import { checkWriting, compareCopy } from "./writing.js";
import { validateVocab, validateLetters, validateLessons, validateAchievements, validateReading, validateSentences, validateChallenges, validateCertificates, validateWriting } from "./validators.js";

const app = document.getElementById("app");
let themes = [], wprompts = [], wfiles = {}, challenges = [], certs = [], sentences = [], sfiles = {}, passages = [], rdFiles = {}, catalog = [], lessons = [], lsFiles = {}, letters = [], lfiles = {}, files = {}, P = null, view = "home", ctx = {};
const vocabItems = () => themes.flatMap(th => th.items);
const allItems = () => [...letters, ...vocabItems()];

// Safe DOM builder: text only via textContent, never innerHTML.
function h(tag, a = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(a)) {
    if (k === "class") e.className = v; else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, ""); else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (const c of kids.flat(Infinity)) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
}
const ar = (txt, cls = "") => h("span", { class: "ar " + cls, lang: "ar", dir: "rtl" }, txt);
const btn = (label, fn, cls = "") => h("button", { class: cls, type: "button", onclick: fn }, label);
const bar = pct => h("div", { class: "bar", role: "progressbar", "aria-valuenow": Math.round(pct), "aria-valuemin": 0, "aria-valuemax": 100 }, h("i", { style: `width:${pct}%` }));
const loc = o => (typeof o === "string" ? o : (o && (o[lang()] || o.en)) || "");
const lq = id => (P.progress.lessons || {})[id] || {};
const rq = id => (P.progress.reading || {})[id] || {};
const rp = id => ((P.progress.reading ||= {})[id] ||= {});
const lp = id => ((P.progress.lessons ||= {})[id] ||= {});
const title = th => (lang() === "ar" ? th.title.ar : th.title.en);

async function save() {
  try {
    const msgs = [], pr = P.progress;
    const won = evaluate(P, catalog, { lessons, vocabIds: vocabItems().map(i => i.id), letterIds: letters.map(l => l.id) });
    if (won.length) { pr.achievements ||= {}; for (const a of won) { pr.achievements[a.id] = Date.now(); pr.xp += a.xp; msgs.push(t("newBadge", { t: loc(a.title), n: a.xp })); } }
    const ws = weekStart(), wk = weekKey(ws);
    if (!pr.weekly || pr.weekly.week !== wk) pr.weekly = { week: wk, claimed: {} };
    for (const c of pickChallenges(challenges, ws)) if (!pr.weekly.claimed[c.id] && challengeProgress(P, c, ws) >= c.target) { pr.weekly.claimed[c.id] = Date.now(); pr.xp += c.xp; msgs.push(t("newChallenge", { t: loc(c.title), n: c.xp })); }
    for (const c of certsEarned(P, certs, lessons)) { (pr.certificates ||= {})[c.id] = Date.now(); msgs.push(t("newCert", { t: loc(c.title) })); }
    if (msgs.length) flash("🏅 " + msgs.join(" · "));
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
    h("div", { class: "row" }, btn("+ " + t("newProfile"), () => go("profiles", { creating: true }), "gold"), btn(t("centre"), openCentre)), h("p", { class: "note" }, t("localNote"))]);
}

// ---------- Home / themes ----------
function homeView() {
  const pr = P.progress, tiles = themes.map(th => {
    const n = th.items.filter(i => pr.items[i.id]?.seen && pr.items[i.id].learned).length;
    return h("button", { class: "card tile", type: "button", onclick: () => go("theme", { th, i: 0, flip: false }) },
      h("span", { class: "emoji" }, th.emoji), ar(th.title.ar), lang() === "en" ? h("span", {}, th.title.en) : null,
      h("small", {}, t("learnedCount", { n, m: th.items.length })));
  });
  shell([h("h1", {}, `${P.avatar} ${P.name}`), assignedBlock(), h("h2", {}, t("level1")),
    h("button", { class: "card tile", style: "width:100%", type: "button", onclick: () => go("alphabet") }, h("span", { class: "ar big" }, "أ ب ت"), h("strong", {}, t("alphabet")), h("small", {}, t("letters"))),
    h("button", { class: "card tile", style: "width:100%", type: "button", onclick: () => go("library") }, h("span", { class: "emoji" }, "📚"), h("strong", {}, t("library")), h("small", {}, t("libraryIntro"))),
    h("div", { class: "grid" },
      h("button", { class: "card tile", style: "margin:0", type: "button", onclick: startBuilder }, h("span", { class: "emoji" }, "🧩"), h("strong", {}, t("builder")), h("small", {}, t("builderIntro"))),
      h("button", { class: "card tile", style: "margin:0", type: "button", onclick: () => go("listening") }, h("span", { class: "emoji" }, "🎧"), h("strong", {}, t("listening")), h("small", {}, t("listeningIntro"))),
      h("button", { class: "card tile", style: "margin:0", type: "button", onclick: () => go("writing") }, h("span", { class: "emoji" }, "✍️"), h("strong", {}, t("writing")), h("small", {}, t("writingIntro")))),
    h("p", { class: "muted" }, t("themes")),
    h("div", { class: "grid" }, tiles), btn(t("practiceAll"), () => startQuiz(vocabItems()), "primary"),
    h("h2", {}, t("lessons")), P.progress.lastLesson && lessons.find(l => l.id === P.progress.lastLesson) ? btn("▶ " + t("resume"), () => go("lesson", { l: lessons.find(l => l.id === P.progress.lastLesson) }), "gold") : null,
    lessons.filter(l => l.level === "beginner").map(lessonRow),
    h("h2", {}, t("level2")), lessons.some(l => l.level === "intermediate") ? lessons.filter(l => l.level === "intermediate").map(lessonRow) : h("p", { class: "badge" }, t("soon")),
    h("h2", {}, t("level3")), lessons.some(l => l.level === "advanced") ? lessons.filter(l => l.level === "advanced").map(lessonRow) : h("p", { class: "badge" }, t("soon")),
    h("p", { class: "note" }, t("review.note"))]);
}

// ---------- Flashcards ----------
const hasArabicVoice = () => !!(window.speechSynthesis && speechSynthesis.getVoices().some(v => v.lang.startsWith("ar")));
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
    h("small", { class: "muted" }, t("voiceNote")), h("div", { class: "row", style: "margin-top:.6rem" }, btn("✍️ " + t("traceLetter"), () => go("trace", { texts: [{ label: it.en, text: it.ar }], k: 0, back: "theme", backCtx: { th, i: ctx.i, flip: false } }))),
    h("div", { class: "row sb", style: "margin-top:1rem" },
      btn("← " + t("prev"), () => go("theme", { th, i: (ctx.i - 1 + th.items.length) % th.items.length, flip: false })),
      btn(t("next") + " →", () => go("theme", { th, i: (ctx.i + 1) % th.items.length, flip: false }), "primary")),
    h("div", { style: "margin-top:1rem" }, btn(t("practice"), () => startQuiz(th.items))) ]);
}
function markSeen(it) { const m = P.progress.items; (m[it.id] ||= { correct: 0, wrong: 0 }).seen = true; save(); }

// ---------- Writing studio (tracing) ----------
const letterTexts = l => letterForms(l).map(([k, f]) => ({ label: t(k), text: f }));
function writingView() {
  shell([h("div", { class: "row sb" }, btn("← " + t("back"), () => go("home"))), h("h1", {}, t("writing")), h("p", { class: "muted" }, t("writingIntro")), h("h3", {}, t("writingLetters")),
    h("div", { class: "grid", style: "grid-template-columns:repeat(auto-fill,minmax(70px,1fr))" }, letters.map(l => h("button", { class: "card tile", style: "min-height:76px;margin:0", type: "button", onclick: () => go("trace", { texts: letterTexts(l), k: 0, back: "writing", backCtx: {} }) }, ar(l.ar, "big")))),
    h("h3", {}, t("writingWords")), h("div", { class: "grid" }, vocabItems().map(it => h("button", { class: "card tile", style: "min-height:76px;margin:0", type: "button", onclick: () => go("trace", { texts: [{ label: it.en, text: it.ar }], k: 0, back: "writing", backCtx: {} }) }, ar(it.ar), h("small", { dir: "ltr" }, it.en)))),
    h("h3", {}, t("copyTyping")), h("p", { class: "muted" }, t("copyIntro")), btn(t("copyTyping"), startCopy, "primary"),
    h("h3", {}, t("guidedWriting")), wprompts.map(w => h("button", { class: "card row sb", style: "width:100%", type: "button", onclick: () => go("prompt", { w, show: false }) }, h("span", {}, loc(w.title)),
      h("span", { class: "badge" }, ((P.progress.writing || {})[w.id] || {}).ok ? "✓" : "•"))),
    h("p", { class: "note" }, t("traceNote"))]);
}
function traceView() {
  const c = ctx, cur = c.texts[c.k], W = 600, H = 360, mk = () => { const x = document.createElement("canvas"); x.width = W; x.height = H; return x; };
  const canvas = h("canvas", { width: W, height: H, role: "img", "aria-label": t("traceCanvas"), style: "width:100%;touch-action:none;background:#fff;border:2px solid var(--line);border-radius:14px" });
  const ink = mk(), mask = mk(), g = canvas.getContext("2d"), ig = ink.getContext("2d"), mg = mask.getContext("2d"), out = h("div", { role: "status" });
  let show = true, drawing = false, last = null;
  const paint = (x, color) => { x.save(); x.fillStyle = color; x.textAlign = "center"; x.textBaseline = "middle"; x.direction = "rtl";
    const f = s => `${s}px "Noto Naskh Arabic","Amiri","Geeza Pro",serif`; let s = 240; x.font = f(s); const w = x.measureText(cur.text).width;
    if (w > W - 40) { s = Math.floor((s * (W - 40)) / w); x.font = f(s); } x.fillText(cur.text, W / 2, H / 2); x.restore(); };
  const draw = () => { g.clearRect(0, 0, W, H); if (show) paint(g, "#E6E0CC"); g.drawImage(ink, 0, 0); };
  paint(mg, "#000"); ig.lineWidth = 12; ig.lineCap = "round"; ig.lineJoin = "round"; ig.strokeStyle = "#0B3D2E";
  const pt = e => { const r = canvas.getBoundingClientRect(); return [((e.clientX - r.left) * W) / r.width, ((e.clientY - r.top) * H) / r.height]; };
  canvas.addEventListener("pointerdown", e => { drawing = true; canvas.setPointerCapture(e.pointerId); last = pt(e); ig.beginPath(); ig.moveTo(...last); ig.lineTo(last[0] + 0.1, last[1]); ig.stroke(); draw(); e.preventDefault(); });
  canvas.addEventListener("pointermove", e => { if (!drawing) return; const p = pt(e); ig.beginPath(); ig.moveTo(...last); ig.lineTo(...p); ig.stroke(); last = p; draw(); });
  for (const ev of ["pointerup", "pointercancel"]) canvas.addEventListener(ev, () => { drawing = false; });
  const guideBtn = btn(t("hideGuide"), () => { show = !show; guideBtn.textContent = show ? t("hideGuide") : t("showGuide"); draw(); });
  const check = async () => {
    const st = traceStats(mg.getImageData(0, 0, W, H).data, ig.getImageData(0, 0, W, H).data);
    if (!st) return out.replaceChildren(h("p", { class: "note" }, t("traceFirst")));
    out.replaceChildren(h("p", {}, t("coverage", { n: st.covered })), h("p", {}, t("onLetter", { n: st.onLetter })));
    const tr = (P.progress.tracing ||= {}), e = (tr[cur.text] ||= { count: 0 }); e.count++; e.last = Date.now(); touchStreak(P.progress); await save();
  };
  shell([h("div", { class: "row sb" }, btn("← " + t("back"), () => go(c.back, c.backCtx || {})), h("strong", {}, cur.label)),
    c.texts.length > 1 ? h("div", { class: "row" }, c.texts.map((x, i) => h("button", { type: "button", class: i === c.k ? "primary" : "", onclick: () => go("trace", { ...c, k: i }) }, x.label))) : null,
    canvas, h("div", { class: "row", style: "margin-top:.6rem" }, guideBtn, btn(t("clearInk"), () => { ig.clearRect(0, 0, W, H); out.replaceChildren(); draw(); }), btn(t("checkTrace"), check, "primary")), out, h("p", { class: "note" }, t("traceNote"))]);
  draw();
}

// ---------- Copy typing & guided writing ----------
function startCopy() {
  const pool = [...sentences.map(s => ({ ar: s.answers[0].join(" ") + ".", en: s.meaning })), ...passages.flatMap(p => p.lines.map(l => ({ ar: l.ar, en: l.en })))];
  go("copy", { set: shuffle(pool).slice(0, 6), i: 0, strict: false, checked: false, ok: [], typed: "" });
}
function copyView() {
  const { set, i } = ctx, it = set[i], last = i === set.length - 1;
  const input = h("input", { id: "cp", type: "text", dir: "rtl", lang: "ar", autocomplete: "off", autocapitalize: "off", spellcheck: "false", placeholder: t("typeHere"), value: ctx.typed, disabled: ctx.checked });
  const strict = h("input", { type: "checkbox", id: "st", checked: ctx.strict, disabled: ctx.checked, style: "width:auto;min-height:auto", onchange: e => { ctx.strict = e.target.checked; } });
  shell([h("div", { class: "row sb" }, btn("← " + t("back"), () => go("writing")), h("span", {}, t("q", { i: i + 1, n: set.length }))), bar((i / set.length) * 100),
    h("h2", {}, t("copyTyping")), h("p", { class: "muted" }, t("copyIntro")), h("div", { class: "card flash" }, ar(it.ar, "big"), h("small", { dir: "ltr", class: "muted" }, it.en)),
    input, h("label", { for: "st", class: "row" }, strict, t("vowelsToo")),
    h("div", { class: "row", style: "margin-top:.6rem" }, btn(t("checkAnswer"), () => { ctx.typed = input.value; ctx.ok[i] = compareCopy(input.value, it.ar, ctx.strict); ctx.checked = true; render(); }, "primary")),
    ctx.checked ? h("div", { role: "status" }, h("p", {}, ctx.ok[i] ? "✅ " + t("correct") : "❌ " + t("copyWrong", { s: it.ar })),
      btn(last ? t("finish") : t("nextSentence"), () => (last ? finishCopy() : go("copy", { ...ctx, i: i + 1, checked: false, typed: "" })), "primary")) : null]);
  if (ctx.checked) for (const b of app.querySelectorAll("button.primary")) if (b.textContent === t("checkAnswer")) b.disabled = true;
}
async function finishCopy() {
  const { set, ok } = ctx, correct = ok.filter(Boolean).length, total = set.length, pct = Math.round((correct / total) * 100), passed = pct >= POLICY.pass;
  const b = ((P.progress.copy ||= {})), first = !b.passed; b.best = Math.max(b.best || 0, pct); b.attempts = (b.attempts || 0) + 1; if (passed) b.passed = true;
  const xp = first ? correct * POLICY.xpPerCorrect : 0; P.progress.xp += xp; touchStreak(P.progress);
  P.progress.attempts.push({ topic: "writing", ts: Date.now(), correct, total, pct }); await save(); go("result", { res: { correct, total, pct, passed }, xp, qs: [] });
}
function promptView() {
  const w = ctx.w, saved = (P.progress.writing || {})[w.id] || {};
  const area = h("textarea", { id: "wt", dir: "rtl", lang: "ar", rows: 7, "aria-label": t("writeHere"), placeholder: t("writeHere"), style: "width:100%;font:inherit;padding:.7rem;border:2px solid var(--line);border-radius:12px" }, saved.text || "");
  const out = h("div", { role: "status" });
  const check = async () => {
    const res = checkWriting(area.value, w), items = res.items.map(i => i.key === "sentences" ? { ok: i.ok, text: t("chkSentences", { n: i.n, c: i.c }) } : { ok: i.ok, text: loc(i.label) });
    out.replaceChildren(h("h3", {}, t("checklist")), h("ul", { style: "list-style:none;padding:0" }, items.map(i => h("li", {}, (i.ok ? "✅ " : "⬜ ") + i.text))), h("p", {}, t("wordsN", { n: res.words })), h("p", { class: "muted" }, t("draftSaved")));
    const rec = ((P.progress.writing ||= {})[w.id] ||= {}); rec.text = area.value.slice(0, 4000); rec.ts = Date.now(); rec.ok = rec.ok || res.ok; rec.words = res.words; touchStreak(P.progress); await save();
  };
  shell([h("div", { class: "row sb" }, btn("← " + t("back"), () => go("writing"))), h("h1", {}, loc(w.title)), h("p", {}, loc(w.instruction)),
    w.wordBank.length ? [h("h3", {}, t("wordBank")), h("div", { class: "row" }, w.wordBank.map(b => h("span", { class: "badge" }, ar(b.ar), ` ${b.en}`)))] : null,
    w.frames.length ? [h("h3", {}, t("frames")), h("div", {}, w.frames.map(f => h("p", {}, ar(f))))] : null,
    area, h("div", { class: "row", style: "margin-top:.6rem" }, btn(t("checkWriting"), check, "primary"), btn(ctx.show ? t("hideModel") : t("showModel"), () => { ctx.show = !ctx.show; saved.text = area.value; (P.progress.writing ||= {})[w.id] = { ...((P.progress.writing || {})[w.id] || {}), text: area.value.slice(0, 4000) }; render(); })), out,
    ctx.show ? h("div", { class: "card" }, h("h3", {}, t("modelAnswer")), w.model.ar.map((l, k) => h("div", {}, ar(l), h("small", { dir: "ltr", class: "muted", style: "display:block" }, w.model.en[k])))) : null,
    h("p", { class: "note" }, t("writingNote"))]);
}

// ---------- Listening lab ----------
function listeningView() {
  shell([h("div", { class: "row sb" }, btn("← " + t("back"), () => go("home"))), h("h1", {}, t("listening")), h("p", { class: "muted" }, t("listeningIntro")),
    hasArabicVoice() ? btn(t("startListening"), () => go("quiz", { qs: buildListeningQuiz(vocabItems(), t), qi: 0, topic: "listening" }), "primary") : h("p", { class: "note" }, t("noVoice")),
    h("p", { class: "note" }, t("listenNote"))]);
}

// ---------- Sentence builder ----------
function startBuilder() { go("builder", { set: shuffle(sentences).slice(0, 6), i: 0, picked: [], pool: null, checked: false, ok: [] }); }
function builderView() {
  const { set, i } = ctx, s = set[i]; ctx.pool ||= scramble(s.answers);
  const words = ctx.picked.map(k => ctx.pool[k]), full = ctx.picked.length === ctx.pool.length, good = ctx.checked && ctx.ok[i], last = i === set.length - 1;
  const chip = (k, fn) => h("button", { type: "button", lang: "ar", dir: "rtl", class: "ar", disabled: ctx.checked, onclick: fn }, ctx.pool[k]);
  shell([h("div", { class: "row sb" }, btn("← " + t("back"), () => go("home")), h("span", {}, t("q", { i: i + 1, n: set.length }))), bar((i / set.length) * 100),
    h("h2", {}, t("builder")), h("p", {}, t("builderPrompt", { s: s.meaning })), h("p", { class: "muted" }, t("builderIntro")),
    h("div", { class: "card row", dir: "rtl", style: "min-height:76px" }, ctx.picked.map(k => chip(k, () => { ctx.picked.splice(ctx.picked.indexOf(k), 1); render(); }))),
    h("div", { class: "row", dir: "rtl" }, ctx.pool.map((_, k) => ctx.picked.includes(k) ? null : chip(k, () => { ctx.picked.push(k); render(); }))),
    h("div", { class: "row", style: "margin-top:.8rem" }, btn(t("checkAnswer"), () => { ctx.checked = true; ctx.ok[i] = checkOrder(s.answers, words); render(); }, "primary"), btn(t("clear"), () => { ctx.picked = []; render(); })),
    ctx.checked ? h("div", { role: "status" }, h("p", {}, good ? "✅ " + t("correct") : "❌ " + t("builderWrong", { s: s.answers[0].join(" ") })), s.answers.length > 1 ? h("p", { class: "note" }, t("alsoOk")) : null,
      btn(last ? t("finish") : t("nextSentence"), () => (last ? finishBuilder() : go("builder", { ...ctx, i: i + 1, picked: [], pool: null, checked: false })), "primary")) : null]);
  if (!full || ctx.checked) for (const b of app.querySelectorAll("button.primary")) if (b.textContent === t("checkAnswer")) b.disabled = true;
}
async function finishBuilder() {
  const { set, ok } = ctx, correct = ok.filter(Boolean).length, total = set.length, pct = Math.round((correct / total) * 100), passed = pct >= POLICY.pass;
  const b = (P.progress.builder ||= {}), first = !b.passed; b.best = Math.max(b.best || 0, pct); b.attempts = (b.attempts || 0) + 1; if (passed) b.passed = true;
  const xp = first ? correct * POLICY.xpPerCorrect : 0; P.progress.xp += xp; touchStreak(P.progress);
  P.progress.attempts.push({ topic: "builder", ts: Date.now(), correct, total, pct }); await save(); go("result", { res: { correct, total, pct, passed }, xp, qs: [] });
}

// ---------- Reading library ----------
function libraryView() {
  shell([h("div", { class: "row sb" }, btn("← " + t("back"), () => go("home"))), h("h1", {}, t("library")), h("p", { class: "muted" }, t("libraryIntro")),
    passages.map(p => h("button", { class: "card row sb", style: "width:100%", type: "button", onclick: () => go("passage", { p, show: false }) }, h("span", {}, loc(p.title)),
      h("span", { class: "badge" }, rq(p.id).passed ? "✓" : rq(p.id).best != null ? rq(p.id).best + "%" : "•")))]);
}
function passageView() {
  const p = ctx.p, r = rp(p.id);
  shell([h("div", { class: "row sb" }, btn("← " + t("back"), () => go("library")), p.classical ? h("span", { class: "badge" }, t("classical")) : null), h("h1", {}, loc(p.title)),
    p.lines.map(l => h("div", { class: "card" }, h("div", { class: "row sb" }, ar(l.ar, "big"), h("button", { type: "button", "aria-label": t("listen"), onclick: () => speak(l.ar) }, "🔊")),
      h("div", { dir: "ltr", class: "muted" }, l.tr), ctx.show ? h("div", { dir: "ltr" }, l.en) : null)),
    btn(ctx.show ? t("hideTrans") : t("showTrans"), () => { ctx.show = !ctx.show; render(); }),
    h("h3", {}, t("support")), p.vocabulary.map(v => h("div", { class: "row sb card" }, ar(v.ar), h("span", { dir: "ltr" }, `${v.tr} · ${v.en}`))),
    h("p", {}, t("readBest") + ": ", h("strong", {}, r.best != null ? r.best + "%" : t("noScore"))),
    btn(t("answerQs"), () => go("quiz", { qs: buildLessonQuiz({ id: p.id, practice: p.questions }, lang()), qi: 0, passageId: p.id }), "primary"), h("p", { class: "muted" }, t("voiceNote"))]);
}

// ---------- Weekly challenges, certificates ----------
function challengeBlock() {
  const ws = weekStart(), wk = P.progress.weekly && P.progress.weekly.week === weekKey(ws) ? P.progress.weekly : { claimed: {} };
  return [h("h2", {}, t("challenges")), pickChallenges(challenges, ws).map(c => { const n = Math.min(challengeProgress(P, c, ws), c.target), done = !!wk.claimed[c.id];
    return h("div", { class: "card" }, h("div", { class: "row sb" }, h("strong", {}, loc(c.title)), h("span", { class: "badge" }, done ? t("challengeClaimed") : t("challengeXp", { n: c.xp }))),
      h("p", { class: "muted" }, loc(c.desc)), bar((n / c.target) * 100), h("small", {}, t("challengeProgress", { n, m: c.target }))); })];
}
function certsView() {
  const got = P.progress.certificates || {};
  shell([h("div", { class: "row sb" }, btn("← " + t("back"), () => go("dashboard"))), h("h1", {}, t("certificates")), h("p", { class: "muted" }, t("certIntro")),
    certs.map(c => { const pg = certProgress(P, c, lessons);
      return h("div", { class: "card" }, h("strong", {}, loc(c.title)), got[c.id] ? [h("p", {}, t("certEarned", { d: new Date(got[c.id]).toLocaleDateString() })), btn(t("viewCert"), () => go("cert", { c }), "primary")]
        : [h("p", { class: "muted" }, t("certLocked")), bar(pg.total ? (pg.done / pg.total) * 100 : 0), h("small", {}, `${pg.done} / ${pg.total}`), h("p", {}, h("small", {}, t("requirement", { m: c.modules.join(", ") })))]); })]);
}
function certView() {
  const c = ctx.c, when = (P.progress.certificates || {})[c.id];
  shell([h("div", { class: "row sb" }, btn("← " + t("back"), () => go("certs")), btn("🖨 " + t("printBtn"), () => window.print(), "primary")),
    h("div", { class: "card cert", style: "text-align:center;border:4px double var(--gold);padding:2rem 1rem" }, h("small", {}, t("org")), h("h1", {}, t("certTitleLine")), h("p", {}, t("certThat")), h("h2", {}, P.name),
      h("p", {}, t("certCompleted")), h("h2", {}, loc(c.title)), h("p", {}, t("dateLine", { d: when ? new Date(when).toLocaleDateString() : "" })), h("small", { class: "muted" }, t("certFoot")))]);
}

// ---------- Parent & teacher centre (local to this device) ----------
async function openCentre() {
  try { const list = await S.allProfiles(); go("centre", { profiles: list.map(p => (P && p.id === P.id ? P : p)) }); } catch { flash(t("storageError")); }
}
const dayLabel = ms => (ms ? new Date(ms).toLocaleDateString() : t("never"));
function centreView() {
  const list = ctx.profiles || [];
  shell([h("div", { class: "row sb" }, btn("← " + t("back"), () => go(P ? "settings" : "profiles"))), h("h1", {}, t("centre")), h("p", { class: "note" }, t("centreIntro")), h("h2", {}, t("learnersHere")),
    list.length ? list.map(p => { const s = summarize(p, lessons);
      return h("div", { class: "card" }, h("strong", {}, `${p.avatar} ${p.name}`), h("p", { class: "muted" }, t("summaryLine", { n: s.done, m: s.total, x: s.xp, d: dayLabel(s.last) })),
        btn(t("openLearner"), () => go("centreLearner", { p }), "primary")); }) : h("p", { class: "muted" }, t("noLearners"))]);
}
function assignInfo(a) {
  if (a.type === "lesson") { const l = lessons.find(x => x.id === a.target); return { title: l ? loc(l.title) : a.target, open: () => l && go("lesson", { l }) }; }
  if (a.type === "passage") { const p = passages.find(x => x.id === a.target); return { title: p ? loc(p.title) : a.target, open: () => p && go("passage", { p, show: false }) }; }
  return { title: t("builder"), open: startBuilder };
}
const isOverdue = a => !!a.due && a.due < weekKey(Date.now());
function assignedBlock() {
  const open = (P.progress.assignments || []).filter(a => !assignmentDone(P, a)); if (!open.length) return null;
  return h("div", {}, h("h2", {}, t("assignedToYou")), open.map(a => { const info = assignInfo(a);
    return h("button", { class: "card row sb", style: "width:100%", type: "button", onclick: info.open }, h("span", {}, info.title, a.note ? h("small", { class: "muted", style: "display:block" }, a.note) : null),
      a.due ? h("span", { class: "badge" }, isOverdue(a) ? t("overdue") : t("due", { d: a.due })) : null); }));
}
function centreLearnerView() {
  const p = ctx.p, s = summarize(p, lessons), asg = p.progress.assignments || [];
  const type = h("select", { id: "at" }, ["lesson", "passage", "builder"].map(k => h("option", { value: k }, t("type." + k)))), target = h("select", { id: "ag" });
  const fill = () => target.replaceChildren(...(type.value === "lesson" ? lessons.map(l => h("option", { value: l.id }, loc(l.title))) : type.value === "passage" ? passages.map(x => h("option", { value: x.id }, loc(x.title))) : [h("option", { value: "builder" }, t("builder"))]));
  type.addEventListener("change", fill); fill();
  const due = h("input", { type: "date", id: "ad" }), note = h("input", { id: "an", maxlength: 120 });
  const stat = (v, k) => h("div", { class: "card tile", style: "margin:0;min-height:80px" }, h("strong", { class: "big" }, v), h("small", {}, t(k)));
  shell([h("div", { class: "row sb" }, btn("← " + t("back"), () => openCentre())), h("h1", {}, `${p.avatar} ${p.name}`),
    h("div", { class: "grid" }, stat(`${s.done}/${s.total}`, "lessonsDoneN"), stat(s.xp, "xp"), stat(s.avg == null ? "–" : s.avg + "%", "avgScore"), stat(s.streak, "streakDays")),
    h("div", { class: "row", style: "margin-top:.6rem" }, btn("📄 " + t("report"), () => go("report", { p }), "primary")),
    h("h2", {}, t("assignments")), asg.length ? asg.map(a => { const info = assignInfo(a), d = assignmentDone(p, a);
      return h("div", { class: "card row sb" }, h("span", {}, info.title, a.due ? h("small", { class: "muted", style: "display:block" }, t("due", { d: a.due })) : null),
        h("span", { class: "row" }, h("span", { class: "badge" }, d ? t("done") : isOverdue(a) ? t("overdue") : t("status.open")),
          btn(t("removeAssign"), async () => { p.progress.assignments = asg.filter(x => x.id !== a.id); await S.saveProfile(p); go("centreLearner", { p }); }, "danger"))); }) : h("p", { class: "muted" }, t("noAssignments")),
    h("h3", {}, t("assignNew")), h("label", { for: "at" }, t("assignType")), type, h("label", { for: "ag" }, t("assignTarget")), target, h("label", { for: "ad" }, t("assignDue")), due, h("label", { for: "an" }, t("assignNote")), note,
    h("div", { style: "margin-top:1rem" }, btn(t("assignBtn"), async () => { (p.progress.assignments ||= []).push({ id: crypto.randomUUID(), type: type.value, target: target.value, due: due.value || "", note: note.value.trim().slice(0, 120), created: Date.now() });
      await S.saveProfile(p); go("centreLearner", { p }); }, "gold"))]);
}
function reportView() {
  const p = ctx.p, s = summarize(p, lessons), L = p.progress.lessons || {}, att = [...(p.progress.attempts || [])].reverse().slice(0, 10);
  const row = (a, b) => h("tr", {}, h("th", { scope: "row" }, a), h("td", {}, b));
  shell([h("div", { class: "row sb" }, btn("← " + t("back"), () => go("centreLearner", { p })), h("span", { class: "row" }, btn("🖨 " + t("printBtn"), () => window.print(), "primary"),
      btn(t("exportCsv"), () => { const a = h("a", { href: URL.createObjectURL(new Blob([toCSV(p, lessons)], { type: "text/csv" })), download: `kalimati-report-${p.name}.csv` }); a.click(); }))),
    h("h1", {}, `${t("report")}: ${p.name}`), h("p", { class: "muted" }, new Date().toLocaleDateString()),
    h("table", {}, h("tbody", {}, row(t("lessonsDoneN"), `${s.done} / ${s.total}`), row(t("xp"), s.xp), row(t("avgScore"), s.avg == null ? "–" : s.avg + "%"), row(t("quizAttempts"), s.attempts), row(t("streakDays"), s.streak), row(t("badgesN"), s.badges), row(t("certsN"), s.certs), row(t("recentAttempts"), att.length ? att.map(a => `${new Date(a.ts).toLocaleDateString()} ${a.topic || ""} ${a.correct}/${a.total}`).join(" · ") : t("none")))),
    h("h3", {}, t("weakLessons")), h("p", {}, s.weak.length ? s.weak.map(l => `${loc(l.title)} (${L[l.id].best}%)`).join("; ") : t("none")),
    h("h3", {}, t("lessonsStatus")), h("table", {}, h("tbody", {}, lessons.map(l => row(loc(l.title), L[l.id] ? (L[l.id].completed ? t("status.completed") : t("status.open")) + (L[l.id].best != null ? ` · ${L[l.id].best}%` : "") : t("state.notStarted"))))),
    h("h3", {}, t("assignments")), h("p", {}, (p.progress.assignments || []).length ? p.progress.assignments.map(a => `${assignInfo(a).title}: ${assignmentDone(p, a) ? t("done") : t("status.open")}${a.note ? " (" + a.note + ")" : ""}`).join("; ") : t("none")),
    h("p", { class: "note" }, t("reportNote"))]);
}

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
    l.joinsNext ? null : h("p", { class: "note" }, t("noJoin")), h("div", { class: "row" }, learnBtn(l), btn("✍️ " + t("traceLetter"), () => go("trace", { texts: letterTexts(l), k: 0, back: "letter", backCtx: { i: ctx.i } }))),
    h("div", { class: "row sb", style: "margin-top:1rem" }, btn("← " + t("prev"), () => go("letter", { i: (ctx.i - 1 + n) % n })), btn(t("next") + " →", () => go("letter", { i: (ctx.i + 1) % n }), "primary"))]);
}

// ---------- Lessons ----------
function lessonRow(l) {
  return h("button", { class: "card row sb", style: "width:100%", type: "button", onclick: () => go("lesson", { l }) }, h("span", {}, loc(l.title)),
    h("span", { class: "badge" }, lq(l.id).completed ? "✓" : lq(l.id).best != null ? lq(l.id).best + "%" : "•"));
}
function lessonView() {
  const l = ctx.l, i = lessons.indexOf(l), st = lp(l.id), P2 = P.progress;
  if (P2.lastLesson !== l.id) { P2.lastLesson = l.id; save(); }
  const book = (P2.bookmarks ||= []), marked = book.includes(l.id);
  const need = (l.prerequisites || []).filter(r => !lq(r).completed).map(r => lessons.find(x => x.id === r)).filter(Boolean);
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
      st.completed = true; st.completedAt = Date.now(); P2.xp += POLICY.xpLearn; touchStreak(P2); await save(); render(); }, st.completed ? "" : "gold")), h("small", { class: "muted" }, t("completeNote")),
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
    q.promptKind === "none" ? null : h("div", { class: "card flash" }, q.promptKind === "listen" ? h("button", { type: "button", class: "gold", style: "min-height:88px;font-size:2.4rem", "aria-label": t("listen"), onclick: () => speak(q.ar) }, "🔊") : q.promptKind === "emoji" ? h("span", { class: "emoji big", "aria-hidden": "true" }, q.emoji) : q.promptKind === "text" ? h("strong", { class: "big", dir: "ltr" }, q.en) : ar(q.ar, "big")),
    h("div", { class: "opts" }, opts),
    answered ? h("div", { role: "status" }, h("p", {}, q.options[q.chosen].ok ? "✅ " + t("correct") : "❌ " + t("wrong", { a: q.answer })), q.explanation ? h("p", { class: "note" }, q.explanation) : null,
      btn(last ? t("finish") : t("check"), () => (last ? finishQuiz() : go("quiz", { ...ctx, qi: qi + 1 })), "primary")) : null]);
}
function answer(i) { const q = ctx.qs[ctx.qi]; if (q.chosen !== undefined) return; q.chosen = i; render(); } // locks: second tap ignored
async function finishQuiz() {
  const res = scoreQuiz(ctx.qs), lid = ctx.lessonId || ctx.passageId, ls = ctx.lessonId ? lp(lid) : ctx.passageId ? rp(lid) : null, firstPass = ls && !ls.passed;
  if (!lid) recordAnswers(P.progress, ctx.qs); else { ls.best = Math.max(ls.best || 0, res.pct); ls.attempts = (ls.attempts || 0) + 1; if (res.passed) ls.passed = true; }
  const xp = lid && !firstPass ? 0 : res.correct * POLICY.xpPerCorrect; P.progress.xp += xp; touchStreak(P.progress);
  P.progress.attempts.push({ topic: lid || ctx.topic || "vocab", ts: Date.now(), correct: res.correct, total: res.total, pct: res.pct });
  await save(); go("result", { res, xp, qs: ctx.qs, lessonId: ctx.lessonId, passageId: ctx.passageId });
}
function resultView() {
  const { res, xp, qs, lessonId, passageId } = ctx, wrong = qs.filter(q => !q.options[q.chosen].ok);
  shell([h("h1", {}, t("result")), h("div", { class: "card" }, h("p", {}, t("score") + ": ", h("strong", {}, `${res.correct}/${res.total} (${res.pct}%)`)),
    h("p", {}, res.passed ? "🏆 " + t("passed") : t("keep")), h("p", { class: "muted" }, `${t("xpEarned")}: +${xp}`)),
    wrong.length ? [h("h3", {}, t("review")), wrong.map(q => h("div", { class: "card row" }, h("span", { class: "emoji" }, q.emoji), ar(q.ar || ""), h("span", { dir: "ltr" }, q.lesson || q.type === "position" ? q.answer : q.en)))] : null,
    h("div", { class: "row" }, passageId ? btn(t("backPassage"), () => go("passage", { p: passages.find(x => x.id === passageId), show: false }), "primary") : lessonId ? btn(t("backLesson"), () => go("lesson", { l: lessons.find(x => x.id === lessonId) }), "primary") : btn(t("again"), () => go("home"), "primary"), btn(t("dashboard"), () => go("dashboard")))]);
}

// ---------- Dashboard ----------
function dashView() {
  const pr = P.progress, items = allItems(), mastered = items.filter(i => itemState(pr.items[i.id]) === "mastered").length;
  const learned = items.filter(i => pr.items[i.id]?.learned).length, rev = revisionList(pr, items);
  const stat = (v, k) => h("div", { class: "card tile" }, h("strong", { class: "big" }, v), h("small", {}, t(k)));
  shell([h("h1", {}, t("dashboard")),
    h("div", { class: "grid" }, stat(pr.xp, "xp"), stat(pr.streak.count, "streak"), stat(`${mastered}/${items.length}`, "mastered"), stat(pr.attempts.length, "attempts")),
    h("p", {}, t("passagesRead", { n: passages.filter(p => rq(p.id).passed).length, m: passages.length })), h("p", {}, t("lessonsDone", { n: lessons.filter(l => lq(l.id).completed).length, m: lessons.length })), h("p", {}, t("learnedCount", { n: learned, m: items.length })), bar((learned / items.length) * 100),
    h("h2", {}, t("revision")), rev.length ? rev.map(x => h("div", { class: "card row sb" }, h("span", {}, x.i.emoji + " ", ar(x.i.ar)), h("span", { class: "badge" }, t("state." + x.s)))) : h("p", { class: "muted" }, t("noRevision")),
    h("h2", {}, t("attempts")), pr.attempts.length ? [...pr.attempts].reverse().slice(0, 8).map(a => h("div", { class: "card row sb" }, h("span", {}, new Date(a.ts).toLocaleDateString()), h("strong", {}, `${a.correct}/${a.total} · ${a.pct}%`))) : h("p", { class: "muted" }, t("noAttempts")),
    h("h2", {}, t("achievements")), h("div", { class: "grid" }, catalog.map(a => { const got = (pr.achievements || {})[a.id];
      return h("div", { class: "card tile", style: "margin:0" + (got ? "" : ";opacity:.55") }, h("span", { class: "emoji" }, got ? a.icon : "🔒"), h("strong", {}, loc(a.title)), h("small", {}, loc(a.desc))); })),
    challengeBlock(), h("h2", {}, t("certificates")), btn("🎓 " + t("certificates"), () => go("certs"))]);
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
      btn(t("centre"), openCentre), btn(t("switch"), () => { P = null; S.setCurrentId(null); go("profiles"); }),
      btn(t("export"), () => { const a = h("a", { href: URL.createObjectURL(new Blob([S.exportJSON(P)], { type: "application/json" })), download: `kalimati-${P.name}.json` }); a.click(); }),
      btn(t("import"), () => file.click()), file),
    h("div", { class: "row", style: "margin-top:1rem" }, btn(t("checkContent"), () => {
      const e = [...validateVocab(files), ...validateLetters(lfiles), ...validateLessons(lsFiles), ...validateAchievements(catalog), ...validateReading(rdFiles), ...validateSentences(sfiles), ...validateChallenges(challenges), ...validateCertificates(certs, lessons), ...validateWriting(wfiles)]; out.replaceChildren(e.length ? h("div", { class: "note" }, t("contentBad"), h("ul", {}, e.map(x => h("li", {}, x)))) : h("div", { class: "note" }, t("contentOk", { n: allItems().length }))); })), out,
    h("div", { style: "margin-top:2rem" }, btn(t("delete"), async () => { if (!confirm(t("confirmDelete"))) return; await S.deleteProfile(P.id); P = null; S.setCurrentId(null); go("profiles"); }, "danger")),
    h("p", { class: "note" }, t("localNote")), h("p", { class: "muted" }, t("org"))]);
}
const sizeNow = () => { try { return localStorage.getItem("kal.size") || "m"; } catch { return "m"; } };
function setSize(v) { try { localStorage.setItem("kal.size", v); } catch {} applySize(); }
function applySize() { document.body.classList.remove("size-l", "size-xl"); const s = sizeNow(); if (s !== "m") document.body.classList.add("size-" + s); }

// ---------- Router ----------
function render() {
  const views = { copy: copyView, prompt: promptView, centre: centreView, centreLearner: centreLearnerView, report: reportView, certs: certsView, cert: certView, trace: traceView, writing: writingView, builder: builderView, listening: listeningView, library: libraryView, passage: passageView, lesson: lessonView, alphabet: alphabetView, letter: letterView, profiles: () => profilesView(ctx.creating), home: homeView, theme: themeView, quiz: quizView, result: resultView, dashboard: dashView, settings: settingsView };
  if (!P && !["profiles", "centre", "centreLearner", "report"].includes(view)) view = "profiles";
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
    for (const f of idx.reading || []) rdFiles[f] = await (await fetch("content/" + f)).json();
    passages = Object.values(rdFiles).flatMap(d => d.passages);
    for (const f of idx.sentences || []) sfiles[f] = await (await fetch("content/" + f)).json();
    sentences = Object.values(sfiles).flatMap(d => d.sentences);
    for (const f of idx.writing || []) wfiles[f] = await (await fetch("content/" + f)).json();
    wprompts = Object.values(wfiles).flatMap(d => d.prompts);
    if (idx.challenges) challenges = (await (await fetch("content/" + idx.challenges)).json()).challenges;
    if (idx.certificates) certs = (await (await fetch("content/" + idx.certificates)).json()).certificates;
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
if (window.speechSynthesis && speechSynthesis.addEventListener) speechSynthesis.addEventListener("voiceschanged", () => { if (view === "listening") render(); });
boot().then(net);
