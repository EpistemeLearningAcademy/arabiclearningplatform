// Audio: bundled recordings first, then the device's speech engine.
// No learner or teacher recording is required for the built-in speech fallback.
let files = {};
let current = null;

export async function loadAudioManifest() {
  try {
    const r = await fetch("content/audio/manifest.json");
    if (r.ok) files = (await r.json()).files || {};
  } catch {
    files = {};
  }
}
export const audioSource = id => files[id] || null;
export const hasAudio = id => !!files[id];
export const audioIds = () => Object.keys(files);
export const audioPath = id => `assets/audio/${id}.mp3`;

export function availableArabicVoices() {
  if (!window.speechSynthesis) return [];
  return speechSynthesis.getVoices().filter(v => /^ar(?:-|$)/i.test(v.lang));
}
export const hasArabicVoice = () => availableArabicVoices().length > 0;

export function stopSpeech() {
  if (window.speechSynthesis) speechSynthesis.cancel();
}
export function playFile(id) {
  return new Promise((resolve, reject) => {
    if (current) current.pause();
    const a = (current = new Audio(audioPath(id)));
    a.addEventListener("error", () => reject(new Error("file")), { once: true });
    a.play().then(() => resolve(), reject);
  });
}

// The browser may expose voices asynchronously. Even when it does not list an
// Arabic voice yet, setting the utterance locale to ar-SA lets Android's
// installed speech service select an Arabic voice if one is available.
export function speakText(text, options = {}) {
  if (!text || !window.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") return false;
  const voices = availableArabicVoices();
  const voice = voices.find(v => /^ar-SA/i.test(v.lang))
    || voices.find(v => /^ar-EG/i.test(v.lang))
    || voices.find(v => /^ar-(?:AE|KW|QA|BH|OM)/i.test(v.lang))
    || voices[0]
    || null;

  const utterance = new SpeechSynthesisUtterance(String(text));
  utterance.lang = voice?.lang || "ar-SA";
  if (voice) utterance.voice = voice;
  utterance.rate = options.rate || 0.82;
  utterance.pitch = options.pitch || 1;
  utterance.volume = 1;
  speechSynthesis.cancel();
  try {
    speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

// Returns "recorded" or "device" when playback is started, otherwise null.
export async function play(id, text) {
  if (hasAudio(id)) {
    try {
      await playFile(id);
      return audioSource(id);
    } catch {
      // Fall through to speech synthesis.
    }
  }
  return text && speakText(text) ? "device" : null;
}
