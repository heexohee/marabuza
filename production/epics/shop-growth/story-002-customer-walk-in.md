# Story 002: 손님 입장·착석·퇴장

> **Epic**: shop-growth (영업 화면 — 가게 단면)
> **Status**: Ready
> **Layer**: Feature
> **Type**: Integration
> **Estimate**: M
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-09-26
> **Performance**: 손님 수(최대 테이블 수) × transform 이동 — 레이아웃 재계산 없는 CSS transform

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief — 영업 화면 — 가게 단면 §손님 동선
**ADR Governing Implementation / ADR Decision Summary / ADR Version**: N/A (minimal — no ADRs)
**Engine**: Web (vanilla HTML/CSS/JS, no `engine.name` in `project.yaml`) | **Risk**: NOT ASSESSED (no VERSION.md risk rating — no game engine)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)
**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md` (영업 화면 — 가게 단면 §손님 동선), scoped to this story:*

- [ ] 결제한 손님은 문에서 나타나 자기 번호 식탁까지 바닥 위를 옆으로 이동한 뒤 앉는다
- [ ] 이동 중에는 서빙할 수 없고(식탁 클릭 무시), 앉은 뒤부터 기다린다 — 인내심은 앉은 뒤부터 줄어든다
- [ ] 기다리는 동안 머리 위에 인내심 바가 보인다 (지금 테이블 칸 게이지를 옮김)
- [ ] 인내심이 다하면 화난 표시를 띄우고 문으로 나간다 — 평판·통계 규칙은 지금과 같다
- [ ] 나가는 중인 손님의 식탁은 다음 손님에게 바로 비지 않는다 — 문에 도착하면 빈다 (또는 규칙을 테스트로 고정)
- [ ] 이동 시간(입장·퇴장)은 튜닝 상수 한 곳에 있고, 손님 상태 전이(걷는 중 → 앉음 → 나가는 중 → 없음)가 통합 테스트로 검증된다
- [ ] 움직임 줄이기 설정이면 이동 없이 바로 앉고 바로 사라진다

---

## Implementation Notes

- 테이블 상태에 `phase`(walkIn/seated/walkOut)와 진행 시간을 추가 — `tick`에서 진행, 기존 `patience`는 seated에서만 감소.
- 화면은 무대 좌표(문 x → 식탁 x)를 transform으로 보간.

---

## Out of Scope

- Story 003: 먹는 동작·그릇 비행 (이 스토리는 서빙 즉시 퇴장까지는 기존 규칙 유지)
- 길찾기·사장 이동 (브리프 Out of scope)

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above.*

---

## Test Evidence

*At `qa.level: minimal` the evidence below is **waived** (advisory); the retained screenshot for anything visible is not.*

**Story Type**: Integration
**Required evidence**: `tests/integration/self-serve/customer_walk_in_test.mjs` (상태 전이·인내심 시작 시점·식탁 비는 시점) + 이동 중·착석 스크린샷
**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 001
- Unlocks: Story 003
