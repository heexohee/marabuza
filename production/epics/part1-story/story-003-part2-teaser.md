# Story N003: 2부 예고 — 29일차 아침

> **Epic**: part1-story
> **Status**: Ready
> **Layer**: Feature
> **Type**: Integration
> **Estimate**: S
> **Manifest Version**: N/A (minimal)
> **Last Updated**: 2026-09-27

## Context

**Design**: `design/quick-specs/part1-28-days-2026-09-27.md` §D 2부 예고 (결정: 알바 + 프랜차이즈)

## Acceptance Criteria

- [ ] 엔딩(E004)을 본 뒤 29일차 영업 시작 전에 짧은 장면이 **한 번만** 나온다 (`OPENING_SCENES` 방식)
  1. 자막 "29일차, 월요일 아침."
  2. 🐰 토끼가 "알바 구함" 전단을 들고: "사장님, 저 여기서 일해도 돼요?"
  3. 🙂 (문밖을 보며) "…저기도 마라탕?" — 맞은편 건물 대형 프랜차이즈 "오픈 예정" 현수막
  4. 자막 "마라부자 2부 — 준비 중"
- [ ] 장면이 끝나면 29일차 영업이 평소처럼 시작 (2부 콘텐츠 전까지 같은 루프)
- [ ] `part2TeaserSeen` 저장 — 새로고침·이어하기로 다시 나오지 않음
- [ ] 엔딩을 안 봤으면(개발 모드로 29일차 도달 등) 나오지 않음
- [ ] 통합 테스트: 엔딩 뒤 29일차 1회, 30일차 없음, 로드 후 없음

## Test Evidence
**Story Type**: Integration — `tests/integration/part1/part2_teaser_test.mjs` + 장면 스크린샷 `production/qa/evidence/part2-teaser/`
**Status**: [ ] Not yet created

## Dependencies
- Depends on: economy E004 (엔딩·`endingSeen`)
