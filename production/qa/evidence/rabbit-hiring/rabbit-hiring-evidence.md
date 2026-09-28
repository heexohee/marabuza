# 테스트 증거: 세션 B — 토끼 채용 결정(항목 11) + 전신 토끼 예고(항목 6)

> **Story**: 출시 전 QA 항목 11(토끼 채용 결정), 항목 6(전신 토끼 예고) — 테스트 케이스 `production/qa/test-cases/rabbit-hiring-cases.md`
> **Story Type**: UI + Integration (엔딩 → 2부 예고 → 크레딧 → 저장 → 29일차 연결)
> **Date**: 2026-09-29
> **Tester**: Claude (자동화 브라우저 확인) — 서명은 아래 Sign-Off 표에서 개발자가 직접
> **Build / Commit**: 브랜치 `chore/pre-release-qa`, HEAD `90da7c5` (대상 커밋 `bbca177` 포함)
> **결과**: **PASS WITH NOTES**

---

## What Was Tested

28일차 일요일 장부에서 엔딩 7비트를 지나 2부 예고(대학생 토끼 등장, 대형 프랜차이즈 현수막, 초아의 채용 결정 대사 + 채용 포즈 오버레이), 엔딩 크레딧, 29일차 준비, 저장/새로고침 후 이어하기, 29일차 영업 시작까지의 전체 흐름을 확인했다. 전신 토끼 삽화(항목 6)가 예고 장면에서 실제 게임 화면으로 표시되는지, 채용 포즈 오버레이가 기본 삽화와 정확히 겹치는지, 대화 상자 넘침·페이지 스크롤·콘솔 오류가 없는지를 함께 점검했다.

**Acceptance criteria covered**: AC-1 ~ AC-7 (아래 표)

---

## Acceptance Criteria Results

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| AC-1 | 28일차 일요일 장부 → 엔딩 7비트 → 2부 예고로 이어진다 | PASS | 개발 바 "엔딩 보기"로 진입 |
| AC-2 | 예고 첫 장면: 자막 "29일차, 월요일 아침." + `04-rabbit` 삽화, 대학생 토끼 "안녕하세요, 사장님. 저 여기서 일하고 싶어요!" | PASS | 전신 토끼 삽화 정상 표시 |
| AC-3 | `05-franchise` 삽화 + 현수막 "대형 마라탕 프랜차이즈 오픈 예정", 초아 "(문밖을 보며) …저기도 마라탕?" | PASS | |
| AC-4 | 초아 "좋아요. 우리, 같이 해 봐요!" 에서 `.hiring-pose` 오버레이(`06-hiring-pose-overlay.png`)가 기본 삽화와 정렬 | PASS | 위치 오프셋 0,0 / 크기 차이 0,0 |
| AC-5 | "엔딩 크레딧 →" → 크레딧 → "29일차 준비 →" → 28일차 상점(저장됨) | PASS | |
| AC-6 | 새로고침 → 이어서 하기 → 상점 39,200원 → "DAY 29 영업 시작!" → 29일차 벽 액자 "마라판다의 맛 · 전수증 / 완납" | PASS | |
| AC-7 | 대화 넘침 없음, 페이지 스크롤 없음, 콘솔 오류 없음 | PASS | 콘솔 오류는 `favicon.ico` 404 한 건뿐(게임 무관) |

---

## Screenshots / Video

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `1280x720-01-rabbit.png` | 2부 예고 — 전신 대학생 토끼 등장 장면 (`04-rabbit`) | AC-2 |
| 2 | `1280x720-02-franchise.png` | `05-franchise` + "대형 마라탕 프랜차이즈 오픈 예정" 현수막, 초아 대사 | AC-3 |
| 3 | `1280x720-03-hiring.png` | 채용 결정 대사 + `.hiring-pose` 오버레이 정렬 상태 | AC-4 |
| 4 | `1280x720-04-day29-certificate-frame.png` | 29일차 영업 화면, 벽 액자 "마라판다의 맛 · 전수증 / 완납" | AC-6 |

---

## Test Conditions

- **Game state at start**: 기존 진행 저장 → 개발 바 "엔딩 보기"로 28일차 일요일 장부 진입 (완납 분기)
- **Platform / hardware**: macOS, 로컬 개발 서버 `localhost:8124`, 창 1280×720
- **Framerate during test**: 측정하지 않음 (정적 대화 장면)
- **Any special setup required**: localhost 이므로 개발 바 노출, "엔딩 보기" 사용

---

## Observations

- **(a) 수락/거절 선택지 없음, 채용 결과 미저장** — 29일차에 토끼가 나오지 않는다. 사용자 확인 결과 **의도된 동작**: 토끼 채용은 2부(시즌 2) 스토리에서 본격 구현 예정.
- **(b) 크레딧 화면은 Enter로만 진행, Space는 무반응** — `main.js` `KEY_ACTIONS` 의 `credits: { Enter }` 매핑 때문. 엔딩/예고는 Enter·Space 모두 동작. 경미하며 사용자 판단으로 버그 등록하지 않음.
- **(c) 예고·크레딧 도중 새로고침 시 28일차 상점으로 복귀** — 예고 진입 시점에 `part2TeaserSeen` 이 저장되므로 예고는 다시 나오지 않는다. 테스트 케이스 문서의 저장 시점 설명과 일치.

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
