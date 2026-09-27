# Story E003: 주간 임대료 + 일요일 휴일 — 연체 1회, 2주 연속 폐업

> **Epic**: economy (경제 레벨링)
> **Status**: In Progress
> **Layer**: Feature
> **Type**: Integration
> **Estimate**: M
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-09-27
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

- [x] 한 주 = 월~토 영업 6일 + 일요일 휴일, **달력 방식**: DAY는 매일 1씩 늘고 7의 배수(7·14·21·28…)가 일요일. 영업 화면·정산에 요일(예: "DAY 9 · 2주차 화요일")과 "임대료까지 N일"이 보인다
- [x] 토요일 정산 다음은 **일요일 정산 장면(장부)**: 영업 없이 장부 줄이 하나씩 넘어가며 도장 — 이번 주 매출(월~토 합) → 임대료 −2D → (E004) 권리금 할부 → 남은 돈. 그다음 상점(세 탭)을 거쳐 월요일 영업으로 간다. 월~금은 지금처럼 정산 → 상점 → 다음 날
- [x] 임대료는 일요일에 자동으로 빠지고 장부에 한 줄(도장)로 나온다. 빠지는 순서는 임대료 먼저
- [x] 돈이 모자라면 **연체**: 임대료 줄에 빨간 연체 도장 + 판다 사장님 한마디("이번 주는 봐줄게. 다음 주엔 꼭!"), 다음 주에 두 주 치를 낸다
- [x] 두 주 연속 못 내면 폐업 화면(게임 오버) — "새로 시작"만 고를 수 있고, 톤은 따뜻하게("다시 해 볼까?"). 평판 0 폐업도 같은 화면
- [x] 요일·연체 상태가 저장·로드된다 (요일은 DAY에서 계산, 이전 세이브는 연체 없음). 일요일 장면 중에 닫았다 열면 일요일 장면부터
- [x] 요일 계산·징수·연체·폐업·세이브가 통합 테스트로 검증된다

---

## Implementation Notes

- 요일은 `day`(달력 날짜)에서 계산 — 순수 함수 `weekOf(day) = ceil(day/7)`, `isSunday(day) = day % 7 === 0`. 저장하지 않음 (결정 2026-09-27: 달력 방식).
- 상태 `rentOverdue: 0|1` + `normalize`.
- 일요일 장면은 새 phase `sunday`: 토요일 정산 → `sunday` → 상점. 상점의 '영업 시작'은 일요일(DAY 7의 배수)을 건너뛰지 않도록 토요일 다음 DAY를 일요일로 두고, 일요일 다음 DAY가 월요일. 정산 화면 스타일 재사용 + 장부 줄 도장 연출.
- 인테리어 해금일(1/3/5/7/9/12)·사이드 해금일(8/10/12)은 달력 날짜 그대로 — 7일차 인테리어는 일요일 상점에서 산다. 개발 모드 '6일 자동'은 월~토를 돌고 토요일 정산에서 멈춘다.

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
**Status**: [x] `tests/integration/economy/weekly_rent_test.mjs` (18) + `production/qa/evidence/weekly-rent-evidence.md`

---

## Dependencies

- Depends on: Story E002
- Unlocks: Story E004
