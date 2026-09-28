# 테스트 증거: 항목 12 — 세로로 긴 창에서 밤 타이틀

> **Story**: 출시 전 QA 항목 12(세로 창 타이틀 잘림) — 수정 커밋 `90da7c5`
> **Story Type**: UI
> **Date**: 2026-09-29
> **Tester**: Claude — 서명은 아래 Sign-Off 표에서 개발자가 직접
> **Build / Commit**: `90da7c5` (fix: 출시 빌드에서 삽화 초안 제외 + 세로 창 타이틀 잘림 수정)
> **결과**: PASS

---

## What Was Tested

600×1200 세로 창에서 밤 타이틀 화면이 잘리지 않는지 확인했다. 지붕 간판 "마라부자" 전체, 메뉴(새 게임 / 이어서 하기 / 불러오기 / 설정), 비 효과가 모두 보이고, 남는 위아래 공간은 그림 가장자리 색으로 채운 레터박스로 처리된다.

**Acceptance criteria covered**: AC-1, AC-2

---

## Acceptance Criteria Results

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| AC-1 | 600×1200 에서 지붕 간판 전체, 메뉴, 비 효과가 잘리지 않고 보인다 | PASS | |
| AC-2 | 위/아래 남는 영역이 그림 가장자리 색의 레터박스로 채워진다 | PASS | 위: 밤하늘 남색, 아래: 보도 어두운 보라 |

---

## Screenshots / Video

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `night-600x1200.png` | 세로 창 밤 타이틀 — 간판·메뉴·비 전체 표시, 위아래 레터박스 | AC-1, AC-2 |

---

## Test Conditions

- **Game state at start**: 타이틀 화면 (밤)
- **Platform / hardware**: 로컬 브라우저, 창 600×1200
- **Framerate during test**: 미측정
- **Any special setup required**: 없음

---

## Observations

- 캡처 파일 실제 픽셀은 1200×1492 (배율/캡처 영역 차이로 보임). 화면 구성 판정에는 영향 없음.

---

## Sign-Off

모든 역할이 서명해야 `/story-done` 으로 스토리를 COMPLETE 처리할 수 있다.
Visual/Feel 스토리는 디자이너 또는 아트 리드, UI 스토리는 UX 리드 또는 디자이너 서명이 필요하다.

**1인 개발자**: 모든 역할을 같은 사람이 서명해도 된다. 목적은 완료 처리 전에
누군가 증거를 의도적으로 검토하는 것이지, 세 사람이 따로 참여하는 것이 아니다.

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer (implemented) | | | [ ] Approved |
| Designer / Art Lead / UX Lead | | | [ ] Approved |
| QA Lead | | | [ ] Approved |

**어떤 서명이든 "Deferred — [사유]"** 로 표시할 수 있다. 보류된 서명은 스프린트 리뷰를
넘어가기 전에 해결해야 한다.

---

*Template: `.claude/docs/templates/test-evidence.md`*
*Used for: Visual/Feel and UI story type evidence records*
*Location: `production/qa/evidence/[story-slug]-evidence.md`*
