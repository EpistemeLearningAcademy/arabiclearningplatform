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
  if (!hasArabicVoice()) return false;
  const v = speechSynthesis.getVoices().find(x => x.lang.startsWith("ar")), u = new SpeechSynthesisUtterance(text);
  u.voice = v; u.lang = v.lang; speechSynthesis.cancel(); speechSynthesis.speak(u); return true;
}
// Returns "recorded" | "ai" | "device" on success, or null when nothing could play.
export async function play(id, text) {
  if (hasAudio(id)) { try { await playFile(id); return audioSource(id); } catch { /* fall through to the device voice */ } }
  return text && speakText(text) ? "device" : null;
}
