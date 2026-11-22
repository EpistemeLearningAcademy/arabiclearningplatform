# Adding vocabulary from the GitHub mobile website
1. Open `content/beginner/vocabulary/core.json`, tap the pencil (edit).
2. Add an item inside a theme's `items` list, copying an existing one:
   `{"id":"b-animals-7","ar":"حِصَانٌ","en":"Horse","emoji":"🐴"}`
   Ids must be unique. Keep Arabic vowelled and checked by a teacher.
3. To add a new theme, copy a whole theme block; give it a new `id`, `level`, `title.en`, `title.ar`, `emoji`.
4. To add a new file, create it in `content/beginner/vocabulary/` and list it in `content/index.json` and in `PRECACHE` in `sw.js`.
5. Bump `CACHE` in `sw.js` (e.g. `kalimati-v2-2`) so phones fetch the update.
6. Commit. Open the app -> Settings -> Check lesson content.

# Adding a translation string
Add the same key to both `content/translations/en.json` and `ar.json`, then use `t("key")` in code.

# Adding a lesson
1. Open `content/beginner/lessons/short-vowels.json` (or create a new file there and list it under `"lessons"` in `content/index.json` and in `PRECACHE` in `sw.js`).
2. Copy an existing lesson. Required: `id` (unique), `level`, `title.en`, `title.ar`, `objectives`, `explanation`, `examples` (`ar`, `tr`, `en`), `practice`.
3. Each practice question: `prompt` ({en, ar}), optional `promptAr`, `options` (list), `answer` (position of the correct option, starting at 0), `explanation`.
4. Text fields can be a plain string or `{"en": "...", "ar": "..."}`.
5. Bump `CACHE` in `sw.js`, commit, then run Settings -> Check lesson content.

# Adding a badge
Edit `content/shared/achievements.json`. Copy a badge and change `id`, `icon`, `title`, `desc` (both en and ar), `xp` and `rule`. Rule types: `lessonsCompleted` (min), `learned` (set: vocab|letters, min), `mastered` (set, min), `moduleComplete` (module), `levelLessons` (level, min), `perfectQuiz` (minQuestions), `streak` (min). New rule types need a small change in `assets/js/gamification.js`.

# Adding a reading passage
1. Open `content/intermediate/reading/graded-01.json` (or create a new file there, list it under `"reading"` in `content/index.json` and in `PRECACHE` in `sw.js`).
2. Copy a passage. Required: `id` (unique), `title` (en, ar), `lines` (each with `ar`, `tr`, `en`), `vocabulary`, `questions` (same format as lesson practice questions).
3. Use only words learners have met. For a Classical Arabic passage set `"classical": true` so the app labels it; include its meaning and how it differs from MSA in the line notes.
4. Bump `CACHE` in `sw.js`, commit, then run Settings -> Check lesson content.

# Adding sentence-builder sentences
Edit `content/intermediate/sentences/builder-01.json`. Each sentence needs `id`, `meaning` (English) and `answers`: a list of accepted word orders, each a list of fully vowelled Arabic words. All accepted orders must use the same words. Do not accept both orders of a two-word sentence (the checker rejects this, because any arrangement would then be correct).
