# Audit of original repository (v1)

Original files are preserved untouched in `original/`.

## Assets
index.html (all UI, data, logic in one file), README.md (one line), manifest.json, sw.js, 5 icons, 2 screenshots.

## Reusable content
36 vocabulary words in 6 themes (animals, fruits, colours, body, numbers, home), vowelled Arabic + English + emoji. Migrated unchanged to `content/beginner/vocabulary/core.json` (ids `b-<theme>-<n>`).

## Bugs found, and status
| Bug | Status |
|---|---|
| Progress only in memory | Fixed: IndexedDB per learner |
| Quiz score used accumulated stars | Fixed: score = correct/total; XP shown separately |
| Quiz only used "learned" words | Fixed: quiz draws from the whole pool |
| manifest.json malformed (missing comma, bad start_url) | Fixed: valid JSON, relative `start_url`/`scope` |
| sw.js referenced missing offline.html | Fixed: offline.html added; precache verified |
| `accept` header read without null check in sw.js | Fixed |
| Subtitle said children only | Fixed: all ages, two presentation modes |
| UI, data and logic coupled | Fixed: JSON content + modules |
| Tailwind, Lucide, Google Fonts from CDNs | Removed: no external dependencies |
| Content quirks: table and chair share 🪑; "head" uses 🗣️ | Kept, noted for review |

## Linguistic review
Original Arabic has not been reviewed by a scholar. No transliteration was added (none existed; none invented).
