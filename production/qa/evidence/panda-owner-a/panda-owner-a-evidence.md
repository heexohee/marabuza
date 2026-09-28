# 테스트 증거: 항목 3 — 판다 사장님 (A안)

> **Story**: 출시 전 QA 항목 3(판다 사장님 + 동물 대기열 초상화) — 관련 커밋 `09ed8fb`, `a74a6c8`
> **Story Type**: Visual/Feel
> **Date**: 2026-09-28 캡처 / 2026-09-29 증거 문서 작성(세션 D)
> **Tester**: 원 캡처 기록 없음 — 서명은 아래 Sign-Off 표에서 개발자가 직접
> **Build / Commit**: `09ed8fb` 이후 (정확한 캡처 커밋 미기록)

---

## What Was Tested

오프닝 장면에서 판다 사장님(A안) 전신 도트 스프라이트가 마라판다 가게 배경(셀프 재료 냉장고, 메뉴판, 밤 창문) 앞에 서 있고, 대화 상자에 "판다 사장님" 이름표와 대사가 표시되는 캡처다. 이 폴더에는 이미지만 있었고 원 검증 기록이 없어, 세션 D에서 이미지 목록과 서명란만 정리했다.

**Acceptance criteria covered**: 판다 사장님 스프라이트 표시 (서명 시 판정)

---

## Acceptance Criteria Results

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| AC-1 | 오프닝에서 판다 사장님 A안 스프라이트가 배경과 어울리게 표시된다 | 서명 시 판정 | 원 검증 기록 없음 |

---

## Screenshots / Video

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `opening.png` | 오프닝 1비트 — 판다 사장님(빨간 두건·앞치마) + 대사 "늦었네? 오늘도 3단계, 고수 듬뿍 맞지?", 1280×720 | AC-1 |

---

## Test Conditions

- **Game state at start**: 새 게임 오프닝 (개발 바 노출)
- **Platform / hardware**: 로컬 브라우저, 1280×720
- **Framerate during test**: 미기록
- **Any special setup required**: 미기록

---

## Observations

- 세션 D에서 기존 이미지 기반으로 사후 작성한 문서. 이후 오프닝 삽화가 `opening-approved/` 로 교체되었을 수 있으니 서명 전 현재 빌드와 대조 필요.

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
