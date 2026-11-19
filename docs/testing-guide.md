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
