# Evidence: Story 007 — 오프닝 4장 간판 "마라부자" 교체

Story: `production/epics/shop-growth/story-007-sign-swap-cutscene.md` · Date: 2026-09-27 · local dev server, Chrome
Screenshot: `production/qa/evidence/sign-swap-opening/01-takeover-last-line.png`

| Criterion | Result | How observed |
|---|---|---|
| 4장 간판: 앞부분 "마라판다" → 마지막 줄 "마라부자" (준비중 → 영업중과 함께) | PASS | 새 게임으로 4장을 끝까지 진행: 1–7번째 줄 `scene-takeover`(갈색 간판), 마지막 줄 `scene-takeover-open`(핑크 "마라부자") |
| 마지막 줄 "{이름} 사장의 마라부자, 첫 영업 시작!" | PASS | "초아 사장의 마라부자, 첫 영업 시작!" |
| 1–3장과 4장 앞부분은 "마라판다" 그대로 | PASS | `scene-regular.png`·`scene-takeover.png` 파일이 바뀌지 않음(해시 동일) |
| 영업 단면 간판 0단계부터 "마라부자" | PASS | `interior-upgrades/00-day1-new-sign.png` |
