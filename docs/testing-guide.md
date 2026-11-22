# Testing guide
Automated checks already run (Node): quiz builds 5 distinct items with 4 unique options and one correct answer; score = 3/5 -> 60%; mastery needs 3+ correct at 85%+; en/ar translation keys match; every key used by app.js exists; every precached file exists; content validator passes.

Manual tests still to run on a phone after deploying:
1. Create two learners; mark words learned in one; switch; confirm the other is unchanged.
2. Refresh; confirm the selected learner persists.
3. Switch English <-> Arabic; confirm RTL/LTR and no missing text.
4. Take a quiz; confirm score % and XP are shown separately.
5. Export, delete, import a learner.
6. Open once online, go offline, reopen; confirm the app and Level 1 words load.
7. Settings -> Check lesson content shows a pass.
8. Install the app from the browser menu.

## Tests run in the build environment (desktop Chromium via Playwright, 390x800 touch viewport)
`tests/smoke.py` (needs a computer, Python, Playwright and `python3 -m http.server 8765` run in the project folder) and `tests/content-checks.mjs` (Node). They check: profile creation, 52 lessons listed, a lesson quiz with real score and separate XP, progress screen with badges, letter tracing and coverage feedback, Arabic switch (rtl + lang), no horizontal overflow on the Arabic home, progress persisting after reload, builder screen, service-worker registration, no console errors; and all content files, quizzes in English and Arabic, prerequisites, badge rules and the precache list.
Result: all passed at the time of delivery.

## NOT tested (please test on your phone)
Real Android devices and tablets, PWA install, offline reopening after first visit, cached lessons offline, update without losing progress, Arabic speech voices (Listening lab), touch tracing quality, import/export file round trip, profile deletion, multiple learner switching, text-size setting, screen-reader behaviour, and long-session performance.
