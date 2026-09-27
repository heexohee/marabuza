# Story N002: 단골 방문 — 야근 너구리 · 시험기간 토끼 · 택배 곰

> **Epic**: part1-story
> **Status**: Complete (2026-09-27)
> **Layer**: Feature
> **Type**: Integration
> **Estimate**: M
> **Manifest Version**: N/A (minimal)
> **Last Updated**: 2026-09-27

## Context

**Design**: `design/quick-specs/part1-28-days-2026-09-27.md` §B 날짜별 흐름 (단골 방문 열)

## Acceptance Criteria

- [x] 방문표(날짜 → 단골 → 한마디)대로 그날 손님 중 한 명이 단골 얼굴로 나온다: 🦝 4·11·18·25 · 🐰 9·16·24 · 🐻 13·20·23 · 27일차는 셋 다 ("내일 사장님 오신다면서요?")
- [x] 단골이 계산대 맨 앞에 오면 말풍선으로 한마디 (계산 조작은 일반 손님과 같음 — 셀프 담기·뒤적이기·계산)
- [x] 단골 얼굴은 일반 손님 얼굴과 구분된다 (이름표 또는 전용 스프라이트)
- [x] 단골은 그날 점심 러시 전에 한 번 나온다 (손님 수·경제에 영향 없음 — 일반 손님 한 명을 대신)
- [x] 방문표는 데이터 테이블 한 곳, 29일차 이후는 방문 없음(2부에서 확장)
- [x] 통합 테스트: 4일차에 너구리가 한 번 나오고 계산대에서 대사, 5일차에는 없음, 27일차 셋 다

## Test Evidence
**Story Type**: Integration — `tests/integration/part1/regulars_test.mjs` + 계산대 말풍선 스크린샷 `production/qa/evidence/regulars/`
**Status**: [x] `tests/integration/part1/regulars_test.mjs` 6개 통과 · 스크린샷 `production/qa/evidence/regulars/` (4일차 너구리 — 계산대 윗줄에 단골 얼굴·이름·대사, 단골 대사 12개 모두 말풍선 두 줄 안)

구현 메모: 단골은 그날 2번째 손님부터(`REGULAR_FROM_CUSTOMER`) 일반 손님 한 명 자리를 대신한다 — 담기·주문·계산은 같고 얼굴과 계산대 한마디만 다르다. 담을 게 없어 그냥 나가면 다음 손님으로 미뤄진다.

## Dependencies
- Depends on: N001 (날짜 테이블 방식)
