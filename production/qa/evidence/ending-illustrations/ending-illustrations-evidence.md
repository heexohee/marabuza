# 테스트 증거: 항목 6 — 전신 토끼 / 엔딩 삽화

> **Story**: 출시 전 QA 항목 6(전신 토끼 · 엔딩 삽화) — 관련 커밋 `4f24df0`, `4d21415`
> **Story Type**: Visual/Feel
> **Date**: 2026-09-28 캡처 / 2026-09-29 증거 문서 작성(세션 D)
> **Tester**: 원 캡처 기록 없음 — 서명은 아래 Sign-Off 표에서 개발자가 직접
> **Build / Commit**: `4f24df0` 전후 (정확한 캡처 커밋 미기록)

---

## What Was Tested

2부 예고의 전신 토끼 삽화와 엔딩 크레딧 삽화 미리보기 캡처다. 이 폴더에는 이미지만 있었고 원 검증 기록이 없어, 세션 D에서 이미지 목록과 서명란만 정리했다. 현재 빌드 기준 실제 게임 화면 검증은 `rabbit-hiring/rabbit-hiring-evidence.md`(2026-09-29, PASS WITH NOTES)에 있다.

**Acceptance criteria covered**: 전신 토끼 삽화, 크레딧 삽화 표시 (서명 시 판정)

---

## Acceptance Criteria Results

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| AC-1 | 2부 예고에 전신 토끼 삽화가 표시된다 | 서명 시 판정 | 현재 빌드 확인은 `rabbit-hiring/1280x720-01-rabbit.png` |
| AC-2 | 엔딩 크레딧에 삽화 + 크레딧 텍스트 + "29일차 준비 →" 가 표시된다 | 서명 시 판정 | |

---

## Screenshots / Video

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `rabbit-preview.png` | 가게 입구의 전신 토끼 + 초아 뒷모습 삽화, 이름표 "시험기간 토끼", 대사 "사장님, 저 여기서 일해도 돼요?" | AC-1 |
| 2 | `credits-preview.png` | 크레딧 — 왼쪽 삽화(토끼·너구리 식사, 창밖 판다), 오른쪽 "PART 01 · COMPLETE / 마라부자" 크레딧과 "29일차 준비 →" 버튼 | AC-2 |

---

## Test Conditions

- **Game state at start**: 미기록 (엔딩 이후 예고/크레딧)
- **Platform / hardware**: 로컬 브라우저 (세부 미기록)
- **Framerate during test**: 미기록
- **Any special setup required**: 미기록

---

## Observations

- `rabbit-preview.png` 의 이름표·대사("시험기간 토끼", "사장님, 저 여기서 일해도 돼요?")는 현재 빌드("대학생 토끼", "안녕하세요, 사장님. 저 여기서 일하고 싶어요!")와 다르다. 이전 미리보기로 보이며, 서명 시 현재 화면 증거(`rabbit-hiring/`)와 함께 판단할 것.

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
