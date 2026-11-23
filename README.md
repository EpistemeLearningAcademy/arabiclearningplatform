# Kalimāti al-Ūlā 2.0 — كَلِمَاتِي الأُولَى
Bilingual (English/Arabic interface) Arabic learning PWA by Episteme Learning Academy. Static site, no backend, works offline after first visit.

**Working now:** multiple local learner profiles, lesson engine with 64 lessons across 3 levels (Intermediate nouns, number, verbs, adjectives/prepositions; Advanced case endings, roots/patterns, verb system, particles, moods, imperative, passive and derived forms), a Reading Library (8 passages), copy typing and guided writing practice, a Sentence builder, a device-voice Listening lab, a tracing Writing studio, weekly challenges, 6 completion certificates, a local parent & teacher centre (assignments and printable/CSV reports; no online accounts) and 22 badges (letter positions, short/long vowels, sukūn, shaddah, tanwīn), 28-letter alphabet (forms + recognition quiz), Level 1 vocabulary (36 words, 6 themes) with flashcards, quizzes with real scores, XP, streak, mastery states, revision suggestions, export/import, offline support.
**Admin, branding, audio and pictures:** see `docs/admin-guide.md`.

**Not built yet:** Levels 2-3, tracing, grammar, reading, audio recordings, badges, teacher portal. See `docs/known-limitations.md`.

Run locally: serve the folder with any static server (service workers need localhost or HTTPS). Deploy: `docs/deployment-guide.md`. Edit content: `docs/content-guide.md`. Original v1 code: `original/`.


## Recent learner-interface improvements
- Redesigned the 28-letter alphabet index and individual letter pages with colourful,
  responsive letter tiles and clearer sound controls.
- Added sentence playback controls to the sentence builder.
- Device speech now prefers an Arabic Saudi voice, then an Egyptian Arabic voice,
  where available, and speaks at a learner-friendly pace.
- Vocabulary photos can be bundled in `assets/images/vocab/` using the exact filenames
  listed in that folder's README. Recorded pronunciation can be bundled in `assets/audio/`.
