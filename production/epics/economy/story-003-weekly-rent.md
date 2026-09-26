# Story E003: 주간 임대료 + 일요일 휴일 — 연체 1회, 2주 연속 폐업

> **Epic**: economy (경제 레벨링)
> **Status**: Ready
> **Layer**: Feature
> **Type**: Integration
> **Estimate**: M
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-09-26
> **Performance**: 정산 화면에서만

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief — Player goal & fail state (주간 임대료) + 경제 레벨링 §한 주·임대료
**ADR Governing Implementation / ADR Decision Summary / ADR Version**: N/A (minimal — no ADRs)
**Engine**: Web (vanilla HTML/CSS/JS, no `engine.name` in `project.yaml`) | **Risk**: NOT ASSESSED (no VERSION.md risk rating — no game engine)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)
**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md` (Player goal & fail state + 경제 레벨링 §한 주·임대료), scoped to this story:*

- [ ] 한 주 = 월~토 영업 6일 + 일요일 휴일. 영업 화면·정산에 요일(예: "1주차 수요일")과 "임대료까지 N일"이 보인다
- [ ] 토요일 정산 다음은 **일요일 휴일 화면**: 영업 없이 이번 주 임대료(2D)와 권리금 최소 할부를 내고, 상점(인테리어·발주·업그레이드)을 이용한 뒤 월요일 영업으로 간다
- [ ] 임대료는 일요일에 자동으로 빠지고 휴일 화면에 한 줄로 나온다
- [ ] 돈이 모자라면 **연체**: 따뜻한 경고("이번 주는 봐줄게요, 다음 주엔 꼭!")와 함께 다음 주에 두 주 치를 낸다
- [ ] 두 주 연속 못 내면 폐업 화면(게임 오버) — "새로 시작"만 고를 수 있고, 톤은 따뜻하게("다시 해 볼까?"). 평판 0 폐업도 같은 화면
- [ ] 요일·연체 상태가 저장·로드된다 (이전 세이브는 현재 날짜로 요일 계산, 연체 없음)
- [ ] 요일 계산·징수·연체·폐업·세이브가 통합 테스트로 검증된다

---

## Implementation Notes

- 요일은 `day`(영업일 수)에서 계산 — 6영업일마다 일요일이 끼는 순수 함수 `weekOf(day)`/`weekdayOf(day)`. 저장하지 않음.
- 상태 `rentOverdue: 0|1` + `normalize`.
- 일요일 화면은 정산→상점 흐름 사이에 한 단계 추가, 정산 화면 스타일 재사용.
- 인테리어 해금일(shop-growth 005)은 영업일 기준.

---

## Out of Scope

- E004: 권리금 할부
- 임대료 인상

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above.*

---

## Test Evidence

*At `qa.level: minimal` the evidence below is **waived** (advisory); the retained screenshot for anything visible is not.*

**Story Type**: Integration
**Required evidence**: `tests/integration/economy/weekly_rent_test.mjs` + 일요일 휴일·연체·폐업 스크린샷
**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story E002
- Unlocks: Story E004
