# Story E002: 기준 D 측정 + 가격표 재정렬

> **Epic**: economy (경제 레벨링)
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: M
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-09-26
> **Performance**: 오프라인 시뮬레이션 스크립트 — 게임 실행 영향 없음

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief — 경제 레벨링 §기준 D · 좌석 확장 · 업그레이드
**ADR Governing Implementation / ADR Decision Summary / ADR Version**: N/A (minimal — no ADRs)
**Engine**: Web (vanilla HTML/CSS/JS, no `engine.name` in `project.yaml`) | **Risk**: NOT ASSESSED (no VERSION.md risk rating — no game engine)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)
**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md` (경제 레벨링), scoped to this story:*

- [ ] 시뮬레이션 스크립트가 1주차 조건(식탁 2·냄비 1·기본 단가·기본 평판)에서 하루 순이익(매출 − 재료비)의 평균 D를 결정적으로 낸다 (고정 시드, 여러 날 평균)
- [ ] 가격표가 D 배수로 `data.js` 한 곳에 있다: 주간 임대료 2D, 권리금 30D·주 최소 0.5D, 인테리어 1/1.5/2/3/4/5D, 좌석 2/4D, 냄비·화력 1–6D
- [ ] 좌석 확장이 2개에서 최대 4개(구매 2회)로 바뀐다. 이전 세이브의 5석은 4로 보정
- [ ] 실제 원화 금액은 D × 배수를 100원 단위로 반올림한 값이다 (순수 함수, 단위 테스트)
- [ ] 측정한 D와 결과 가격표가 브리프 경제 레벨링에 기록된다

---

## Implementation Notes

- `tools/sim/baseline_day.mjs` — `logic.js`의 `tick`을 그대로 돌리고 사장 조작은 정확한 계산·즉시 서빙으로 가정(상한 추정)과 실수 20%(하한)를 둘 다 출력.
- 가격은 `priceOf(multiple, D)` 한 함수로 — 단가가 바뀌면 D만 다시 잰다.

---

## Out of Scope

- E003: 임대료 징수·일요일 휴일
- E004: 권리금
- shop-growth 005: 인테리어 구매 로직

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above.*

---

## Test Evidence

*At `qa.level: minimal` the evidence below is **waived** (advisory); the retained screenshot for anything visible is not.*

**Story Type**: Logic
**Required evidence**: `tests/unit/economy/price_table_test.mjs` + 시뮬레이션 출력 기록
**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story E001
- Unlocks: Story E003, shop-growth Story 005
