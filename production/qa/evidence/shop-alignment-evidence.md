# Test Evidence: 상점 카드·버튼 정렬

> **Story**: 스토리 문서 없음 — 2026-09-24 세션 사용자 요청 (케이스: `production/qa/test-cases/shop-alignment-cases.md`)
> **Story Type**: UI
> **Date**: 2026-09-25
> **Tester**: Claude (앱 내 브라우저에서 실행) · 판정: 사용자
> **Build / Commit**: 미커밋 작업 트리 (브랜치 `feat/self-serve-flow`, 기준 `7ed2c3e`)

---

## What Was Tested

상점의 가게 업그레이드·재료 사기 카드에서 구매 버튼이 줄마다 같은 높이에 맞는지, 버튼 글자가 잘리지 않는지, 100g당 가격 박스의 −/+ 버튼이 박스 안에 있는지, 돈이 부족할 때 비활성·최대 레벨일 때 MAX가 뜨는지를 1200px과 375px에서 확인했다.

**Acceptance criteria covered**: 케이스 문서 TC 전체 (10개)

---

## Acceptance Criteria Results

| # | 기준 | Result | Notes |
|---|------|--------|-------|
| 1 | 1200px: 업그레이드 버튼이 같은 높이 | PASS | 줄 어긋남 0 |
| 2 | 1200px: 재료 구매 버튼이 줄마다 같은 높이 | PASS | 줄 어긋남 0 |
| 3 | 버튼 글자 잘림 없음 (두 줄: "+10개" / 가격, "🔓 해금" / 가격) | PASS | 잘린 요소 0 |
| 4 | −/+ 버튼이 노란 가격 박스 안 | PASS | 1200px·375px 모두 |
| 5 | 돈이 부족한 버튼 비활성 | PASS | 4,000원 상태에서 비활성 4개 |
| 6 | 최대 레벨 업그레이드는 MAX | PASS | 화력 강화 3레벨 |
| 7 | 375px: 줄 어긋남·글자 잘림 없음 | PASS | |
| 8 | 375px: 가로 스크롤 없음 | PASS | |
| 9 | 하단 "타이틀" / "DAY N 영업 시작!" 버튼 | PASS | |
| 10 | 가격 박스: 금액 윗줄, −/+ 아랫줄 | PASS | |

---

## Screenshots / Video

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `shop-alignment-2026-09-24.png` | 1200px 상점 화면 (정렬 수정 후 최종본) | 1–6, 9, 10 |

이번 실행 도구(앱 내 브라우저)는 스크린샷을 파일로 저장하지 못해, 같은 빌드에서 앞서 저장한 위 파일을 증거로 사용한다. 375px 화면은 확인했으나 이미지 파일로는 남기지 못했다.

---

## Test Conditions

- **Game state at start**: 새 게임 + 화력 강화 최대 + 돈 4,000원 (비활성·MAX 확인용)
- **Platform / hardware**: macOS, Claude 데스크톱 앱 내 브라우저, 1200×800 / 375×812
- **Framerate during test**: 해당 없음 (정적 화면)
- **Any special setup required**: 하루를 끝까지 돌리는 대신 실제 `shopHtml()`로 상점 화면을 렌더링해서 측정

---

## Observations

- 375px에서 업그레이드 카드가 한 줄에 하나씩 쌓여 스크롤이 길다. 정렬 문제는 아니며, 모바일 다듬기 후보 (사용자 판정: PASS WITH NOTES).

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer (implemented) | Claude | 2026-09-25 | [x] Approved |
| Designer / Art Lead / UX Lead | 사용자 (세션 내 판정: PASS WITH NOTES) | 2026-09-25 | [x] Approved |
| QA Lead | qa-lead (sign-off: qa-signoff-adhoc-2026-09-25.md) | 2026-09-25 | [x] Approved |

---

*Template: `.claude/docs/templates/test-evidence.md`*
