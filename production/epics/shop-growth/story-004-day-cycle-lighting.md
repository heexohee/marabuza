# Story 004: 하루 시간대 연출 (오전→점심 러시→노을→밤)

> **Epic**: shop-growth (영업 화면 — 가게 단면)
> **Status**: Ready
> **Layer**: Presentation
> **Type**: Visual/Feel
> **Estimate**: M
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-09-26
> **Performance**: 구간 전환 때만 클래스 변경 + CSS 트랜지션

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief — 영업 화면 — 가게 단면 §하루 시간대
**ADR Governing Implementation / ADR Decision Summary / ADR Version**: N/A (minimal — no ADRs)
**Engine**: Web (vanilla HTML/CSS/JS, no `engine.name` in `project.yaml`) | **Risk**: NOT ASSESSED (no VERSION.md risk rating — no game engine)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)
**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md` (영업 화면 — 가게 단면 §하루 시간대), scoped to this story:*

- [ ] 영업 시작부터 마감까지 4구간(오전 / 점심 러시 / 오후 노을 / 마감 직전 밤)이 순서대로 지나간다
- [ ] 구간 경계는 튜닝 상수 한 곳, 비율 → 구간 계산은 순수 함수로 단위 테스트된다
- [ ] 단면의 창밖이 구간에 맞게 바뀌고, 준비중 → 영업중 표시가 오전에 켜진다
- [ ] 옅은 시간대 색은 단면에만 얹히고 진열대·계산대 가독성은 모든 구간에서 유지된다
- [ ] 일시정지 중엔 멈추고, 움직임 줄이기 설정이면 즉시 전환된다

---

## Implementation Notes

- 창 영역만 바뀌는 층 — `tools/art/scene_regular.py`의 night/morning/open 모드 방식 참고.

---

## Out of Scope

- Story 006: 점심 러시 손님 곡선·창밖 대기줄

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above.*

---

## Test Evidence

*At `qa.level: minimal` the evidence below is **waived** (advisory); the retained screenshot for anything visible is not.*

**Story Type**: Visual/Feel
**Required evidence**: `production/qa/evidence/day-cycle-lighting/` 구간별 스크린샷 4장 + `dayPhase` 단위 테스트
**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 001
- Unlocks: Story 006
