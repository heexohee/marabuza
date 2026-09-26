# Story 001: 사이드 메뉴 — 해금·주문·계산·자동 조리·재고

> **Epic**: side-menu (사이드 메뉴)
> **Status**: In Progress
> **Layer**: Feature
> **Type**: Integration
> **Estimate**: L
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-09-27
> **Performance**: 손님 생성·결제·서빙 때만 계산, 웍 표시는 상태 비교로만 갱신

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief — 사이드 메뉴 (2026-09-27), MVP 7
**ADR Governing Implementation / ADR Decision Summary / ADR Version**: N/A (minimal — no ADRs)
**Engine**: Web (vanilla HTML/CSS/JS, no `engine.name` in `project.yaml`) | **Risk**: NOT ASSESSED (no VERSION.md risk rating — no game engine)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)
**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md` (사이드 메뉴), scoped to this story:*

- [ ] 사이드가 영업일 기준으로 열린다: 중국음료 8일차, 달걀볶음밥 10일차, 꿔바로우 12일차. 여는 날 아침 알림과 첫 박스 10개(선물), 한 번만
- [ ] 열린 뒤 일부 손님(`SIDE_CHANCE`)이 열린 사이드 하나를 함께 주문하고, 말풍선·주문 칩에 보인다
- [ ] 정답 가격 = 메인 + 사이드 가격 (음료 3,000 · 볶음밥 8,000 · 꿔바로우 12,000). 빼먹으면 덜 받음, 정산 내역에 사이드 한 줄
- [ ] 결제하면 사이드 재고가 1 빠진다. 재고가 없으면 손님이 투덜대고 사이드 없이 주문
- [ ] 음료는 결제 시 바로 나감. 볶음밥·꿔바로우는 10일차부터 주방에 웍이 보이고, 그 주문이 냄비에서 끓는 동안 웍이 조리 중으로 보이며, 메인 서빙 때 함께 나간다
- [ ] 상점에서 열린 사이드 재료를 10개 묶음으로 발주, 안 열린 건 "N일차에 열림"
- [ ] 사이드 재고·선물 받은 여부가 저장·로드된다 (이전 세이브는 재고 0·선물 안 받음)
- [ ] 개발 모드 봇이 사이드까지 정확히 계산하고, 날 사이 사이드 재료도 보충한다
- [ ] 해금·주문·계산·재고·서빙·세이브가 통합 테스트로 검증된다

---

## Implementation Notes

- `SIDE_ITEMS` (가격·해금일·원가·조리 여부) + `SIDE_CHANCE`는 `src/js/self-serve/data.js` 한 곳.
- 사이드 재고는 창고 `stock`의 `side_*` 키 — 진열대에는 올라가지 않음.
- 해금 전에는 난수를 쓰지 않아 기존 결정적 테스트가 그대로.
- 웍은 `.shop-scene`의 DOM 요소 — 볶음밥이 열리면 보이고, 조리 중인 냄비 주문에 볶음밥·꿔바로우가 있으면 불이 켜진다.

---

## Out of Scope

- 웍 직접 조작(넣기·집기) — 자동으로 결정 (2026-09-27)
- 사이드 단가 조정 (고정)

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above.*

---

## Test Evidence

*At `qa.level: minimal` the evidence below is **waived** (advisory); the retained screenshot for anything visible is not.*

**Story Type**: Integration
**Required evidence**: `tests/integration/side-menu/side_menu_test.mjs` + 계산대·웍·상점 스크린샷 `production/qa/evidence/side-menu/`
**Status**: [x] `tests/integration/side-menu/side_menu_test.mjs` (14) + `production/qa/evidence/side-menu-evidence.md`

---

## Dependencies

- Depends on: economy E001 (정답 가격 경로), shop-growth 001 (단면 주방)
- Unlocks: None
