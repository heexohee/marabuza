# Story N003: 2부 예고 — 29일차 아침

> **Epic**: part1-story
> **Status**: Complete (2026-09-27)
> **Layer**: Feature
> **Type**: Integration
> **Estimate**: S
> **Manifest Version**: N/A (minimal)
> **Last Updated**: 2026-09-27

## Context

**Design**: `design/quick-specs/part1-28-days-2026-09-27.md` §D 2부 예고 (결정: 알바 + 프랜차이즈)

## Acceptance Criteria

- [x] 엔딩(E004)을 본 뒤 29일차 영업 시작 전에 짧은 장면이 **한 번만** 나온다 (`OPENING_SCENES` 방식)
  1. 자막 "29일차, 월요일 아침."
  2. 🐰 토끼가 "알바 구함" 전단을 들고: "사장님, 저 여기서 일해도 돼요?"
  3. 🙂 (문밖을 보며) "…저기도 마라탕?" — 맞은편 건물 대형 프랜차이즈 "오픈 예정" 현수막
  4. 자막 "마라부자 2부 — 준비 중"
- [x] 장면이 끝나면 29일차 영업이 평소처럼 시작 (2부 콘텐츠 전까지 같은 루프)
- [x] `part2TeaserSeen` 저장 — 새로고침·이어하기로 다시 나오지 않음
- [x] 엔딩을 안 봤으면(개발 모드로 29일차 도달 등) 나오지 않음
- [x] 통합 테스트: 엔딩 뒤 29일차 1회, 30일차 없음, 로드 후 없음

## Test Evidence
**Story Type**: Integration — `tests/integration/part1/part2_teaser_test.mjs` + 장면 스크린샷 `production/qa/evidence/part2-teaser/`
**Status**: [x] `tests/integration/part1/part2_teaser_test.mjs` 11개 통과 · 스크린샷 `production/qa/evidence/part2-teaser/` (`part2-teaser-evidence.md`)

구현 메모: 예고는 28일차 번호 그대로 `teaser` 단계로 재생되고 들어갈 때 `part2TeaserSeen`을 저장한다 — 장면 도중 새로고침해도 다시 나오지 않고, 마지막 장면에서 29일차 영업이 열린다. 현수막은 오른쪽 창 너머(맞은편 건물)에 CSS로 그림.

## Dependencies
- Depends on: economy E004 (엔딩·`endingSeen`)

## 변경 (2026-09-28, 사용자 결정)
순서를 **엔딩 → 예고 → 엔딩 크레딧 → 28일차 상점 → 29일차 영업**으로 바꿈. 엔딩 마지막 버튼 "계속 →", 예고 마지막 버튼 "엔딩 크레딧 →", 크레딧(설정의 것과 같은 화면) 버튼 "29일차 준비 →"(→ 28일차 상점). 예고는 들어갈 때 `part2TeaserSeen` 저장 — 그 뒤 새로고침하면 상점부터(크레딧은 설정에서 다시 볼 수 있음). 이 순서 전의 저장(28일차 상점, 예고 안 봄)은 다음 날 시작 때 예고 → 크레딧 → 상점을 한 번 거친다. 테스트: `part2_teaser_test.mjs` 13개. 증거: `production/qa/evidence/ending-scene/`
