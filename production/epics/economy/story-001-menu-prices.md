# Story E001: 메뉴 단가 두 가지 — 상점 조정 → 계산기 반영

> **Epic**: economy (경제 레벨링)
> **Status**: In Progress
> **Layer**: Core
> **Type**: Integration
> **Estimate**: M
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-09-27
> **Performance**: 정산·상점 화면에서만 계산 — 영업 루프 영향 없음

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief — 경제 레벨링 §메뉴 단가 (2026-09-26)
**ADR Governing Implementation / ADR Decision Summary / ADR Version**: N/A (minimal — no ADRs)
**Engine**: Web (vanilla HTML/CSS/JS, no `engine.name` in `project.yaml`) | **Risk**: NOT ASSESSED (no VERSION.md risk rating — no game engine)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)
**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md` (경제 레벨링 §메뉴 단가 + Core loop 가격 공식), scoped to this story:*

- [ ] 상점에서 마라탕·샹궈 100g 단가를 각각 −/+로 조정한다 (기본 1,800 / 3,000원, 범위·간격은 `data.js` 상수)
- [ ] 계산대 저울 영수증이 현재 모드의 조정된 단가를 표시·적용한다 (`저울 (마라탕 N원/100g)`)
- [ ] 정답 가격(과다·과소 청구 판정)도 조정된 단가로 계산된다 — 영수증과 판정이 항상 같은 단가
- [ ] 손님 수(수요)가 두 단가에 반응한다: 기본보다 비싸면 손님이 줄고, 싸면 늘어난다 (모드 비율 반영)
- [ ] 단가가 저장·로드된다. 이전 세이브의 단일 `pricePer100g`는 기본 단가로 바꾸고 범위 밖 값은 보정
- [ ] 게임방법 창의 가격 안내도 현재 단가를 보여 준다
- [ ] 단가 → 영수증·판정·수요·세이브가 통합 테스트로 검증된다

---

## Implementation Notes

- 상태 `prices: { maratang, shanguo }`, 기존 `pricePer100g` 대체. `CHECKOUT_PRICE.ratePer100g`는 기본값으로만 남김.
- `checkoutBowlPrice`/`counterPrice`/`chargeBreakdown`이 상태의 단가를 받도록 (순수 함수 인자).
- `demandFactor`는 모드별 (단가 / 기본 단가) 가중 평균으로.
- 현재 불일치: 상점 가격(2,200)은 수요에만, 계산기는 고정 1,800/3,000 — 이 스토리로 해소.

---

## Out of Scope

- E002: D 측정 (기본 단가 기준)
- 고기·꼬치·고수 추가금 조정 (고정 유지)

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above.*

---

## Test Evidence

*At `qa.level: minimal` the evidence below is **waived** (advisory); the retained screenshot for anything visible is not.*

**Story Type**: Integration
**Required evidence**: `tests/integration/economy/menu_prices_test.mjs` + 상점·계산대 스크린샷
**Status**: [x] `tests/integration/economy/menu_prices_test.mjs` (16) + `production/qa/evidence/menu-prices-evidence.md`

---

## Dependencies

- Depends on: None
- Unlocks: Story E002
