# Story B001: 1부 밸런스 — 28일 봇 시뮬레이션으로 권리금 총액 확정

> **Epic**: economy (경제 레벨링)
> **Status**: Complete (2026-09-27)
> **Layer**: Feature
> **Type**: Config/Data
> **Estimate**: M
> **Manifest Version**: N/A (minimal)
> **Last Updated**: 2026-09-27

## Context

**Design**: `design/quick-specs/part1-28-days-2026-09-27.md` §E 밸런스 목표 (Approved 2026-09-27)
**Tools**: `tools/sim/baseline_day.mjs`(기준 D), `src/js/self-serve/autoplay.js`(봇, `BOT_MISTAKES`)

## Acceptance Criteria

- [x] `tools/sim/part1_run.mjs`: 새 게임 → 28일(엔딩까지)을 봇으로 돌려 주별 매출·임대료·권리금 납부·이월·인테리어 단계·폐업 여부를 표로 출력. 봇 실력 3단계(서툰 / 보통 / 잘하는 — 실수율·더 갚기 성향)와 시드 여러 개
- [x] 목표를 만족하는 `PREMIUM_TOTAL_D` 확정 (시작 8):
  - 보통 봇: 권리금 4회 모두 제때 납부 + 인테리어 3단계 이상, 임대료 연체 0회
  - 서툰 봇: 권리금 일부 이월 → 28일차 탕감 엔딩, 폐업 없음
  - 잘하는 봇: 3주차(21일차) 안에 완납 가능
- [x] 목표를 못 맞추면 인테리어 가격·해금일 조정안을 함께 제시 (사용자 결정)
- [x] 결과 표와 확정값을 `design/game-brief.md` 경제 레벨링과 설계 문서 §E에 기록
- [x] 확정값 회귀 테스트: 시드 고정 보통 봇이 목표를 만족하는지 `tests/integration/economy/part1_balance_test.mjs`

## Out of Scope
- 2부 경제, 알바 인건비

## Test Evidence
**Story Type**: Config/Data — smoke check + 위 회귀 테스트
**Status**: [x] `tests/integration/economy/part1_balance_test.mjs` 4개 통과 · 시뮬 `node tools/sim/part1_run.mjs --seeds=8`

결과: P = 10D, 시작 자본금 500,000원(`SELF_START_MONEY`), 손님 증가 0.1초/일(`SPAWN_PER_DAY`) — 표는 `design/game-brief.md` 경제 레벨링. 봇에 사람 속도(`BOT_PACE_SEC`)를 넣지 않으면 봇이 하루 30명을 받아 경제가 3배로 부풀어 보였다. 인테리어 가격·해금일은 바꾸지 않음(목표 충족).

## Dependencies
- Depends on: E004 (4주 분할·엔딩·봇 할부 처리)
