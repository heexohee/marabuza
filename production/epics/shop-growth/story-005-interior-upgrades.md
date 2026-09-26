# Story 005: 인테리어 1–4단계 구매 + 단면·효과 전환

> **Epic**: shop-growth (영업 화면 — 가게 단면)
> **Status**: Ready
> **Layer**: Feature
> **Type**: Integration
> **Estimate**: L
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-09-26
> **Performance**: 단계 변경 때 배경 층 교체만

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief — 영업 화면 — 가게 단면 §인테리어 4단계
**ADR Governing Implementation / ADR Decision Summary / ADR Version**: N/A (minimal — no ADRs)
**Engine**: Web (vanilla HTML/CSS/JS, no `engine.name` in `project.yaml`) | **Risk**: NOT ASSESSED (no VERSION.md risk rating — no game engine)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)
**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md` (영업 화면 — 가게 단면 §인테리어 4단계), scoped to this story:*

- [ ] 상점에 인테리어가 단계 순서대로 나오고, 이전 단계를 사야 다음이 열린다 (1 벽지·바닥 → 2 조명 → 3 좌석·진열대 → 4 간판)
- [ ] 돈이 모자라면 못 사고, 사면 차감되며 단계가 저장·로드된다 (이전 세이브는 0단계)
- [ ] 단면의 해당 층이 단계에 맞게 바뀐다 (0 갈색 노포 → 4 핑크 "마라부자")
- [ ] 효과가 반영된다: 1 평판 소폭 ↑, 2 인내심 소폭 ↑, 3 테이블 +1 (단면 식탁도 늘어남) — 수치는 튜닝 상수 한 곳
- [ ] 구매·잠금·효과·세이브가 통합 테스트로 검증된다
- [ ] 4단계 구매는 간판 교체 컷씬(Story 007)의 트리거 상태를 남긴다

---

## Implementation Notes

- 상태 `interior: 0–4`, `normalize`로 보정.
- 단면 층(벽·바닥 / 조명 / 식탁·의자·진열대 / 간판)을 `scene_shop.py` 모드로 생성 — Story 001의 층 구조 위에서 교체.

---

## Out of Scope

- Story 007: 간판 교체 컷씬
- 월세·권리금 (이 에픽 밖)

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above.*

---

## Test Evidence

*At `qa.level: minimal` the evidence below is **waived** (advisory); the retained screenshot for anything visible is not.*

**Story Type**: Integration
**Required evidence**: `tests/integration/self-serve/interior_upgrade_test.mjs` + 단계별 단면 스크린샷
**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 001
- Unlocks: Story 007
