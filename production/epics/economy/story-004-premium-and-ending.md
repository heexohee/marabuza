# Story E004: 권리금 할부 + 엔딩 "이제 네 가게구나"

> **Epic**: economy (경제 레벨링)
> **Status**: Ready
> **Layer**: Feature
> **Type**: Integration
> **Estimate**: L
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-09-26
> **Performance**: 정산·상점·엔딩 컷씬에서만

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief — Story §빚 세 가지(권리금) · §엔딩 + 경제 레벨링 §권리금
**ADR Governing Implementation / ADR Decision Summary / ADR Version**: N/A (minimal — no ADRs)
**Engine**: Web (vanilla HTML/CSS/JS, no `engine.name` in `project.yaml`) | **Risk**: NOT ASSESSED (no VERSION.md risk rating — no game engine)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)
**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md` (Story §권리금·엔딩 + 경제 레벨링), scoped to this story:*

- [ ] 권리금 총액(30D)과 남은 금액이 진행 막대로 상점·정산에 보인다
- [ ] 일요일 납부 때 최소 할부(0.5D)가 임대료와 함께 빠진다 — 모자라면 임대료와 같은 연체 규칙(1회 연체, 2주 연속 폐업)
- [ ] 일요일(과 상점)에서 원하는 만큼 더 갚을 수 있다 (남은 금액 이하, 돈 이하)
- [ ] 완납하는 순간 엔딩 컷씬: 판다 사장님이 가게에 와서 "이제 네 가게구나." → 옛 "마라판다" 간판이 가게 안 액자로 걸린다 → 크레딧 한 줄
- [ ] 엔딩 뒤에도 "마라부자"로 계속 영업할 수 있고, 단면 벽에 옛 간판 액자가 남는다
- [ ] 남은 권리금·엔딩 본 여부가 저장·로드된다
- [ ] 할부·추가 상환·완납·엔딩 트리거·세이브가 통합 테스트로 검증된다

---

## Implementation Notes

- 상태 `premiumLeft`, `endingSeen` + `normalize`.
- 엔딩 컷씬은 `OPENING_SCENES` 방식 재사용, 액자는 `scene_shop.py`의 층으로 추가.

---

## Out of Scope

- shop-growth 007: 오프닝 간판 교체
- 엔딩 후 새 목표(2회차 등)

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above.*

---

## Test Evidence

*At `qa.level: minimal` the evidence below is **waived** (advisory); the retained screenshot for anything visible is not.*

**Story Type**: Integration
**Required evidence**: `tests/integration/economy/premium_ending_test.mjs` + 엔딩 컷씬 스크린샷 `production/qa/evidence/premium-ending/`
**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story E003
- Unlocks: None
