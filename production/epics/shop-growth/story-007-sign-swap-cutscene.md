# Story 007: 오프닝 4장 — 간판 "마라부자" 교체

> **Epic**: shop-growth (영업 화면 — 가게 단면)
> **Status**: In Progress
> **Layer**: Presentation
> **Type**: Visual/Feel
> **Estimate**: M
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-09-26
> **Performance**: 컷씬 1장면 — 오프닝 시스템 재사용

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief — Story §오프닝 5장 ⑤ 간판 교체 (2026-09-26)
**ADR Governing Implementation / ADR Decision Summary / ADR Version**: N/A (minimal — no ADRs)
**Engine**: Web (vanilla HTML/CSS/JS, no `engine.name` in `project.yaml`) | **Risk**: NOT ASSESSED (no VERSION.md risk rating — no game engine)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)
**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md` (Story §오프닝 4장, 2026-09-27 개정 — 별도 5장 없이 4장 안에서), scoped to this story:*

- [x] 4장(인수 첫날 아침)의 벽 간판은 처음엔 갈색 "마라판다"이고, 마지막 줄에서 창의 준비중 → 영업중과 함께 핑크 "마라부자"로 바뀐다
- [x] 마지막 줄 대사는 "{이름} 사장의 마라부자, 첫 영업 시작!"
- [x] 오프닝 1–3장과 4장 앞부분의 간판은 "마라판다" 그대로
- [x] 이후 영업 단면의 간판은 0단계부터 "마라부자"다 (`scene_shop.py --all`)

---

## Implementation Notes

- `tools/art/scene_regular.py`의 `open` 배경(`scene-takeover-open.png`, 4장 마지막 줄 `bgAt`)에만 핑크 간판 — 2장 밤·4장 아침 배경은 그대로.
- 시안이던 별도 5장(간판 내리기 → 천 벗기기 → 타이틀 드롭)은 만들지 않음 (2026-09-27 사용자 결정).

---

## Out of Scope

- Story 005: 인테리어 단계
- economy E004: 엔딩(권리금 완납, 옛 간판 액자)

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above.*

---

## Test Evidence

*At `qa.level: minimal` the evidence below is **waived** (advisory); the retained screenshot for anything visible is not.*

**Story Type**: Visual/Feel
**Required evidence**: `production/qa/evidence/sign-swap-opening/` 스크린샷(간판 내림·점등·타이틀) + 기존 세이브에서 한 번만 나오는지 확인
**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: None
