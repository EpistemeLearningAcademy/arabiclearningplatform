// Audio: bundled recordings first, then the device's Arabic speech engine.
let files = {};
let current = null;
let voiceCache = [];

export async function loadAudioManifest() {
  try {
    const r = await fetch("content/audio/manifest.json");
    if (r.ok) files = (await r.json()).files || {};
  } catch { files = {}; }
  refreshVoices();
}
export const audioSource = id => files[id] || null;
export const hasAudio = id => !!files[id];
export const audioIds = () => Object.keys(files);
export const audioPath = id => `assets/audio/${id}.mp3`;

export function refreshVoices() {
  if (!("speechSynthesis" in window)) return [];
  voiceCache = speechSynthesis.getVoices() || [];
  return voiceCache.filter(v => /^ar(?:-|$)/i.test(v.lang));
}
export function availableArabicVoices() {
  return refreshVoices();
}
export const hasArabicVoice = () => availableArabicVoices().length > 0;

export function stopSpeech() {
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  if (current) { current.pause(); current = null; }
}
export function playFile(id) {
  return new Promise((resolve, reject) => {
    if (current) current.pause();
    const a = (current = new Audio(audioPath(id)));
    a.addEventListener("error", () => reject(new Error("file")), { once: true });
    a.play().then(() => resolve(), reject);
  });
}

// Call from a learner's tap/click so mobile browsers permit speech playback.
export function speakText(text, options = {}) {
  if (!text || !("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") return false;
  try {
    speechSynthesis.cancel();
    const voices = refreshVoices();
    const voice = voices.find(v => /^ar-SA/i.test(v.lang))
      || voices.find(v => /^ar-EG/i.test(v.lang))
      || voices.find(v => /^ar-(?:AE|KW|QA|BH|OM)/i.test(v.lang))
      || voices[0] || null;
    const utterance = new SpeechSynthesisUtterance(String(text));
    utterance.lang = voice?.lang || "ar-SA";
    if (voice) utterance.voice = voice;
    utterance.rate = options.rate ?? 0.82;
    utterance.pitch = options.pitch ?? 1;
    utterance.volume = 1;
    utterance.onerror = () => {};
    speechSynthesis.speak(utterance);
    if (speechSynthesis.paused) speechSynthesis.resume();
    return true;
  } catch { return false; }
}

// Returns "recorded" or "device" when playback is queued, otherwise null.
export async function play(id, text) {
  if (hasAudio(id)) {
    try { await playFile(id); return audioSource(id); }
    catch { /* Fall through to speech synthesis. */ }
  }
  return text && speakText(text) ? "device" : null;
}

if ("speechSynthesis" in window) {
  speechSynthesis.addEventListener?.("voiceschanged", refreshVoices);
}
