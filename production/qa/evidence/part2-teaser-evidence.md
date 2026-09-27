# Evidence — N003 2부 예고 (29일차 아침)

Story: `production/epics/part1-story/story-003-part2-teaser.md` · 2026-09-27 · 1280×800, `?dev=0`

Setup: day-28 shop save after the ending (`endingSeen: true`, interior 3) → 이어하기 → "DAY 29 영업 시작!".

| # | File | Shows |
|---|------|-------|
| 1 | `part2-teaser/01-caption.png` | 자막 "29일차, 월요일 아침." — 내 가게 홀(인테리어 3단계), 벽에 마라판다 액자 |
| 2 | `part2-teaser/02-rabbit.png` | 🐰 시험기간 토끼가 "알바 구함" 전단을 들고 "사장님, 저 여기서 일해도 돼요?" |
| 4 | `part2-teaser/04-coming-soon-banner.png` | 오른쪽 창 너머 "대형 마라탕 프랜차이즈 오픈 예정" 현수막 + 자막 "마라부자 2부 — 준비 중" + "29일차 영업 시작 →" |

Beat 3 ("(문밖을 보며) …저기도 마라탕?", banner drops in) was checked in the browser pane; no separate file.

Observed: one click / Space = one beat (verified with a click log); the last beat opens DAY 29 business as usual.
Automated: `tests/integration/part1/part2_teaser_test.mjs` — 11 pass (once after the ending, not day 30, not without the ending, no replay after reload, old saves past day 28 count as seen, bot passes through).
