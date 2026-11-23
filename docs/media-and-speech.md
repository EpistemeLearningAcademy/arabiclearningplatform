# Beginner media and speech

## Vocabulary images

- `content/images/manifest.json` maps each Beginner vocabulary item ID to either a bundled WebP file or a remote photograph URL.
- Bundled images are in `assets/images/vocab/`.
- Remote photographs are loaded on first online use. The service worker caches successful remote image responses so previously viewed vocabulary cards can continue to display offline.
- If a remote image cannot load, the existing emoji remains as a fallback.

## Speech

- `assets/js/audio.js` plays a bundled MP3 when one is listed in `content/audio/manifest.json`.
- When no MP3 exists, it uses the browser/device Speech Synthesis engine with an Arabic locale (`ar-SA`) and prefers an installed Arabic voice.
- No teacher recording or paid API is required.
- Speech quality depends on the Arabic voice installed on the learner's device. On Android, install Arabic voice data under Settings → Text-to-speech output → Google Speech Services (menu names vary by device).

## Offline note

Bundled images work immediately offline. Remote images need to be viewed once while online before the service worker can cache them. Speech synthesis uses the device's installed voice and may require its voice data to be downloaded once.
