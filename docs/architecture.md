# Architecture
- `index.html` shell; `assets/js/app.js` screens and routing (safe DOM builder, no innerHTML).
- `i18n.js` loads `content/translations/<lang>.json`, sets `lang` and `dir`.
- `storage.js` IndexedDB (profiles store, schema v1); localStorage only for profile id, language, text size.
- `engine.js` quiz building, scoring, mastery policy, revision list, streak.
- `validators.js` content checks, run from Settings.
- `sw.js` precache + offline fallback; caches hold no learner data.
Concepts kept separate: XP (reward), test score (correct/total), item mastery (repeated accuracy), learning (the "learned" tap).
