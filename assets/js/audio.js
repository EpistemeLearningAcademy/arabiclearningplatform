// Audio: recorded files first (assets/audio/<id>.mp3, listed in content/audio/manifest.json), then the device voice.
// Never reports success it cannot confirm: a failed or missing file shows a message instead.
let files = {};
export async function loadAudioManifest() {
  try { const r = await fetch("content/audio/manifest.json"); if (r.ok) files = (await r.json()).files || {}; } catch { files = {}; }
}
export const audioSource = id => files[id] || null;      // "recorded" | "ai" | null
export const hasAudio = id => !!files[id];
export const audioIds = () => Object.keys(files);
export const audioPath = id => `assets/audio/${id}.mp3`;
export const hasArabicVoice = () => !!(window.speechSynthesis && speechSynthesis.getVoices().some(v => v.lang.startsWith("ar")));
let current = null;
export function playFile(id) {
  return new Promise((resolve, reject) => {
    if (current) current.pause();
    const a = (current = new Audio(audioPath(id)));
    a.addEventListener("error", () => reject(new Error("file")), { once: true });
    a.play().then(() => resolve(), reject);
  });
}
export function speakText(text) {
  if (!text || !window.speechSynthesis || !hasArabicVoice()) return false;
  const voices = speechSynthesis.getVoices().filter(v => /^ar(?:-|$)/i.test(v.lang));
  // Prefer a clear Modern Standard Arabic-capable voice when the device offers one.
  const v = voices.find(x => /^ar-SA/i.test(x.lang))
    || voices.find(x => /^ar-EG/i.test(x.lang))
    || voices.find(x => /^ar/i.test(x.lang));
  if (!v) return false;
  const u = new SpeechSynthesisUtterance(text);
  u.voice = v;
  u.lang = v.lang || "ar";
  u.rate = 0.86;
  u.pitch = 1;
  u.volume = 1;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
  return true;
}
// Returns "recorded" | "ai" | "device" on success, or null when nothing could play.
export async function play(id, text) {
  if (hasAudio(id)) { try { await playFile(id); return audioSource(id); } catch { /* fall through to the device voice */ } }
  return text && speakText(text) ? "device" : null;
}
