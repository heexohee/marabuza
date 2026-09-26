# Story 005: 인테리어 1–6단계 — 해금일·구매·단면·분위기 효과

> **Epic**: shop-growth (영업 화면 — 가게 단면)
> **Status**: In Progress
> **Layer**: Feature
> **Type**: Integration
> **Estimate**: L
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-09-26
> **Performance**: 단계 변경 때 배경 층 교체만

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief — 영업 화면 — 가게 단면 §인테리어 6단계 (2026-09-26 개정) + 경제 레벨링 §인테리어
**ADR Governing Implementation / ADR Decision Summary / ADR Version**: N/A (minimal — no ADRs)
**Engine**: Web (vanilla HTML/CSS/JS, no `engine.name` in `project.yaml`) | **Risk**: NOT ASSESSED (no VERSION.md risk rating — no game engine)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)
**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md` (영업 화면 §인테리어 6단계 + 경제 레벨링), scoped to this story:*

- [ ] 상점에 인테리어 6단계가 순서대로 나온다: 1 벽지 → 2 바닥 → 3 조명 → 4 문·포토존 → 5 의자·식탁 → 6 주방. 앞 단계를 사야 다음이 열린다
- [ ] 각 단계는 해금일(1 / 3 / 5 / 7 / 9 / 12일차) 전엔 잠겨 있고 "N일차에 열림"이 보인다
- [ ] 돈이 모자라면 못 사고, 사면 가격(D 배수, `data.js` 한 곳)만큼 차감된다
- [ ] 단계가 저장·로드된다 (`interior` 0–6, 이전 세이브는 0, 기존 "인테리어 +15%" 업그레이드 레벨은 버리고 0부터)
- [ ] 단면 배경이 단계에 맞게 바뀐다 (`tools/art/scene_shop.py --stage N`, 시안 `design/art/interior-mockups/`)
- [ ] 효과(분위기만, 수치는 튜닝 상수): 1 평판 소폭 ↑ · 2 손님 인내심 소폭 ↑ · 3 식사 후 팁 ↑ · 4 손님 방문 ↑ · 5 식사 후 평판 상승폭 ↑ · 6 채소 시듦 느리게
- [ ] 테이블 수·조리 속도는 바뀌지 않는다 (좌석 확장·화력 담당)
- [ ] 구매·잠금(순서·해금일·돈)·효과·세이브가 통합 테스트로 검증된다

---

## Implementation Notes

- 상태 `interior: 0–6` + `normalize` 보정. 기존 `UPGRADES`의 `interior` 항목 제거.
- 가격·해금일·효과 크기는 한 테이블(`INTERIOR_STAGES`)에 — 가격은 economy Story E002의 D 배수.
- 배경은 단계별 PNG(`scene-shop-N.png`)를 미리 생성해 `.shop-stage` 배경만 교체.
- 의자·식탁 색(5단계)은 DOM이므로 CSS 변수로 전환.

---

## Out of Scope

- Story 007: 간판 교체(오프닝 5장)
- economy E002: D 측정과 가격표
- 좌석 확장·냄비·화력 업그레이드

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above.*

---

## Test Evidence

*At `qa.level: minimal` the evidence below is **waived** (advisory); the retained screenshot for anything visible is not.*

**Story Type**: Integration
**Required evidence**: `tests/integration/shop-growth/interior_upgrades_test.mjs` + 단계별 단면 스크린샷 `production/qa/evidence/interior-upgrades/`
**Status**: [x] `tests/integration/shop-growth/interior_upgrades_test.mjs` (14) + `production/qa/evidence/interior-upgrades-evidence.md`

---

## Dependencies

- Depends on: Story 001, economy Story E002
- Unlocks: None
