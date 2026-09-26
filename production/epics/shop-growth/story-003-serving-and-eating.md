# Story 003: 서빙 비행 + 식사

> **Epic**: shop-growth (영업 화면 — 가게 단면)
> **Status**: Ready
> **Layer**: Feature
> **Type**: Integration
> **Estimate**: M
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-09-26
> **Performance**: 그릇 1개 transform 애니메이션 + 식사 중 그릇 이미지 교체 — 가벼움

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief — 영업 화면 — 가게 단면 §서빙
**ADR Governing Implementation / ADR Decision Summary / ADR Version**: N/A (minimal — no ADRs)
**Engine**: Web (vanilla HTML/CSS/JS, no `engine.name` in `project.yaml`) | **Risk**: NOT ASSESSED (no VERSION.md risk rating — no game engine)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)
**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md` (영업 화면 — 가게 단면 §서빙), scoped to this story:*

- [ ] 주방 냄비를 집으면 김 나는 그릇이 들고 있는 표시로 따라다닌다 (커서 옆 또는 주방 위 표시)
- [ ] 같은 번호 식탁을 누르면 그릇이 포물선을 그리며 날아가 식탁에 내려앉는다
- [ ] 손님은 식사 시간 동안 먹고(그릇이 점점 비고 김), 그동안 식탁은 차 있다 — 식사 시간은 튜닝 상수(시작값 약 3초)
- [ ] 다 먹으면 하트(만족) 또는 동전(팁) 표시를 띄우고 Story 002의 퇴장으로 이어진다 — 팁·평판은 서빙 시점에 지금 규칙대로 계산
- [ ] 틀린 번호 식탁을 누르면 지금처럼 거부된다
- [ ] 식사 단계 전이와 식탁이 비는 시점이 통합 테스트로 검증된다
- [ ] 움직임 줄이기 설정이면 비행 없이 바로 식탁에 놓인다

---

## Implementation Notes

- `serveTable`은 즉시 식탁을 비우는 대신 `phase: eating` + 남은 식사 시간을 둔다 → 끝나면 walkOut.
- 하루 손님 처리량이 줄어드는 변화 — 식사 시간은 짧게 시작하고 플레이테스트로 조정(브리프).

---

## Out of Scope

- Story 002: 입장·퇴장 이동 자체
- 사운드 (브리프 Out of scope)

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above.*

---

## Test Evidence

*At `qa.level: minimal` the evidence below is **waived** (advisory); the retained screenshot for anything visible is not.*

**Story Type**: Integration
**Required evidence**: `tests/integration/self-serve/serving_eating_test.mjs` + 비행·식사 중 스크린샷
**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 002
- Unlocks: None
