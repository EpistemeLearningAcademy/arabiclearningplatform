// Pure helpers for the guided-writing and copy-typing exercises. They check structure and spelling of
// typed text only; they cannot judge Arabic grammar.
const MARKS = /[\u064B-\u065F\u0670\u0640]/g;
const PUNCT = /[.,;:!?؟،؛"'«»()\u06D4\-–—]/g;
export const normalizeArabic = s => String(s).replace(MARKS, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي");
export const tokens = s => normalizeArabic(s).replace(PUNCT, " ").split(/\s+/).filter(Boolean);
export const sentenceCount = s => String(s).split(/[.؟?!\u06D4\n]+/).map(x => x.trim()).filter(x => tokens(x).length > 0).length;
// A token matches a required word if equal, or if it is that word with a leading و ("and") attached.
const matches = (w, o) => w === o || (w.length > o.length && w[0] === "و" && w.slice(1) === o);
export function checkWriting(text, prompt) {
  const tk = tokens(text), sc = sentenceCount(text), items = [{ key: "sentences", ok: sc >= prompt.minSentences, n: prompt.minSentences, c: sc }];
  for (const r of prompt.required || []) {
    const ok = r.pattern === "al" ? tk.some(w => w.startsWith("ال") && w.length > 3) : tk.some(w => (r.any || []).some(a => matches(w, normalizeArabic(a))));
    items.push({ label: r.label, ok });
  }
  return { items, sentences: sc, words: tk.length, ok: items.every(i => i.ok) };
}
export function compareCopy(typed, expected, strict) {
  const clean = s => String(s).normalize("NFC").replace(PUNCT, " ").replace(/\s+/g, " ").trim();
  return strict ? clean(typed) === clean(expected) : normalizeArabic(clean(typed)) === normalizeArabic(clean(expected));
}
