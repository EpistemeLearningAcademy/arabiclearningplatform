# Recorded audio

Put one MP3 file per item in this folder. The file name is the item's id:

- Vocabulary word: `b-animals-1.mp3`, `b-fruits-3.mp3` …
- Letter: `b-letter-01.mp3` … `b-letter-28.mp3` (say the letter's name)
- Reading line: `r-home-01-1.mp3` (passage id, then the line number)

Then list each file in `content/audio/manifest.json`:

`{ "files": { "b-animals-1": "recorded", "b-animals-2": "ai" } }`

Use `"recorded"` for a human recording by a teacher or native speaker. Use `"ai"` for a computer-generated voice:
the app then tells the learner the voice is AI-generated and not checked by a teacher.
In the app, Settings → Admin → Audio → Check audio files builds this list for you to paste.
