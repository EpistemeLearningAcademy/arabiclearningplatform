let dict = {}, cur = "en";
export const lang = () => cur;
export async function setLang(l) {
  cur = l === "ar" ? "ar" : "en";
  dict = await (await fetch(`content/translations/${cur}.json`)).json();
  document.documentElement.lang = cur;
  document.documentElement.dir = cur === "ar" ? "rtl" : "ltr";
  try { localStorage.setItem("kal.lang", cur); } catch {}
}
export const savedLang = () => { try { return localStorage.getItem("kal.lang") || ((navigator.language || "").startsWith("ar") ? "ar" : "en"); } catch { return "en"; } };
export function t(k, v = {}) {
  let s = dict[k]; if (s === undefined) return k;
  for (const x in v) s = s.replace(`{${x}}`, v[x]);
  return s;
}
