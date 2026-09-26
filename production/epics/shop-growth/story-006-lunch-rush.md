# Story 006: 점심 러시 손님 곡선 + 창밖 대기줄

> **Epic**: shop-growth (영업 화면 — 가게 단면)
> **Status**: Ready
> **Layer**: Feature
> **Type**: Integration
> **Estimate**: M
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-09-26
> **Performance**: 등장 간격 계산은 순수 함수, 창밖 줄은 장식 층

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief — 영업 화면 — 가게 단면 §하루 시간대 — 점심 러시
**ADR Governing Implementation / ADR Decision Summary / ADR Version**: N/A (minimal — no ADRs)
**Engine**: Web (vanilla HTML/CSS/JS, no `engine.name` in `project.yaml`) | **Risk**: NOT ASSESSED (no VERSION.md risk rating — no game engine)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)
**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md` (영업 화면 — 가게 단면 §하루 시간대 — 점심 러시), scoped to this story:*

- [ ] 손님 등장 간격이 시간대에 따라 달라지고 점심 러시에 가장 짧다 (Story 004의 구간 사용)
- [ ] 등장 곡선은 튜닝 상수 한 곳 + 순수 함수로 통합 테스트된다
- [ ] 하루 전체 손님 수는 지금과 크게 다르지 않다 (몰릴 뿐 폭증하지 않음) — 테스트로 범위 확인
- [ ] 점심 러시 동안 창밖에 줄 선 손님 실루엣이 보이고 끝나면 사라진다
- [ ] 대기열 상한(`QUEUE_MAX`)과 인내심 규칙은 그대로다

---

## Implementation Notes

- 고정 `spawnTimer` 간격 → `spawnInterval(dayPhase, base)`.

---

## Out of Scope

- 알바 고용 (브리프 MVP 8)

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above.*

---

## Test Evidence

*At `qa.level: minimal` the evidence below is **waived** (advisory); the retained screenshot for anything visible is not.*

**Story Type**: Integration
**Required evidence**: `tests/integration/self-serve/lunch_rush_test.mjs` + 러시 중 창밖 스크린샷
**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 004
- Unlocks: None
