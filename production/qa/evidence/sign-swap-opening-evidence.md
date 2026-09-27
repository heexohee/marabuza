# Evidence: Story 007 — 오프닝 4장 간판 "마라부자" 교체

Story: `production/epics/shop-growth/story-007-sign-swap-cutscene.md` · Date: 2026-09-27 · local dev server, Chrome
Screenshot: `production/qa/evidence/sign-swap-opening/01-takeover-last-line.png`

| Criterion | Result | How observed |
|---|---|---|
| 4장 간판: 앞부분 "마라판다" → 마지막 줄 "마라부자" (준비중 → 영업중과 함께) | PASS | 새 게임으로 4장을 끝까지 진행: 1–7번째 줄 `scene-takeover`(갈색 간판), 마지막 줄 `scene-takeover-open`(핑크 "마라부자") |
| 마지막 줄 "{이름} 사장의 마라부자, 첫 영업 시작!" | PASS | "초아 사장의 마라부자, 첫 영업 시작!" |
| 1–3장과 4장 앞부분은 "마라판다" 그대로 | PASS | `scene-regular.png`·`scene-takeover.png` 파일이 바뀌지 않음(해시 동일) |
| 영업 단면 간판 0단계부터 "마라부자" | PASS | `interior-upgrades/00-day1-new-sign.png` |
| 기존 저장 이어하기에서는 다시 안 나옴 · 저장이 있어도 새 게임은 다시 1회 (1부 회귀 QA C-01–C-03, 2026-09-27) | PASS | 출시 빌드: 새 게임 → 4장 마지막 줄만 `scene-takeover-open` + "첫 영업 시작!" · 새로고침 → 이어서 하기 → 상점, 오프닝 없음 |

## Sign-off

| 역할 | 이름 | 날짜 | 승인 |
|---|---|---|---|
| 리드 (아트/디자인) | | | [ ] |
| QA | | | [ ] |

> 1부 회귀 QA 2026-09-27 (`production/qa/qa-plan-part1-2026-09-27.md`)에서 추가. 실제 확인·서명 전까지 체크하지 않음.
