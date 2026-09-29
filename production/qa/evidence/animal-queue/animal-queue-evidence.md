# 테스트 증거: 항목 3 — 동물 손님 대기열 초상화

> **Story**: 출시 전 QA 항목 3(판다 사장님 + 동물 대기열 초상화) — 관련 커밋 `09ed8fb`, `a74a6c8`
> **Story Type**: Visual/Feel
> **Date**: 2026-09-28 캡처 / 2026-09-29 증거 문서 작성(세션 D)
> **Tester**: 원 캡처 기록 없음 — 서명은 아래 Sign-Off 표에서 개발자가 직접
> **Build / Commit**: `09ed8fb` 이후 (정확한 캡처 커밋 미기록)

---

## What Was Tested

1일차 영업 화면에서 오른쪽 주문 패널 상단 대기열에 커스텀 동물 초상화(고양이, 쥐 등)가 표시되는지 보여 주는 캡처다. 이 폴더에는 이미지만 있었고 원 검증 기록이 없어, 세션 D에서 이미지 목록과 서명란만 정리했다.

**Acceptance criteria covered**: 대기열 초상화 표시 (서명 시 판정)

---

## Acceptance Criteria Results

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| AC-1 | 대기열에 동물별 커스텀 초상화가 표시된다 | 서명 시 판정 | 원 검증 기록 없음 |

---

## Screenshots / Video

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `queue.png` | DAY 1 영업 화면 — 주문 패널 상단 대기열의 고양이·쥐 초상화, 고양이 주문 말풍선 | AC-1 |

---

## Test Conditions

- **Game state at start**: 1일차 영업 중 (화면상 500,000원, 개발 바 노출)
- **Platform / hardware**: 로컬 브라우저 (세부 미기록)
- **Framerate during test**: 미기록
- **Any special setup required**: 미기록

---

## Observations

- 세션 D에서 기존 이미지 기반으로 사후 작성한 문서. 판다 사장님 쪽 증거는 `panda-owner-a/`, 착석 손님 얼굴은 `seated-customers/panda-owner-face.png` 참고.

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
