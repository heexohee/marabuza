# Story N001: 날짜별 아침 한마디 (4–28일차)

> **Epic**: part1-story
> **Status**: Complete (2026-09-27)
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: S
> **Manifest Version**: N/A (minimal)
> **Last Updated**: 2026-09-27

## Context

**Design**: `design/quick-specs/part1-28-days-2026-09-27.md` §B 날짜별 흐름 (아침 한마디 열)
**Code**: `src/js/self-serve/story.js` — `TIPS`(1–3일차 판다), `OWN_LINES`(4줄 돌림), `dayStartLine`, `dayStartSpeaker`

## Acceptance Criteria

- [x] 1–3일차는 기존 판다 팁 그대로
- [x] 4–28일차 영업일은 설계 문서 표의 대사가 날짜마다 고정으로 나온다 (4줄 돌림을 대체). 일요일(7·14·21·28)은 영업이 없으므로 해당 없음
- [x] 화자가 표대로 — 🐼 판다(18·22일차 "(메시지)") / 🙂 나. 판다 대사는 카운터에 판다 얼굴(기존 `ownerLineWho` 방식)
- [x] 29일차 이후는 기존 `OWN_LINES` 돌림
- [x] 대사는 날짜 → { who, text } 테이블 한 곳 (번역 대비 문자열이 흩어지지 않게)
- [x] 두 줄 말풍선을 넘지 않는다 (가장 긴 대사로 스크린샷 확인)
- [x] 유닛 테스트: 1·3·4·18·22·27·29·35일차 대사와 화자

## Test Evidence
**Story Type**: Logic — `tests/unit/self-serve/daily_lines_test.mjs`
**Status**: [x] `tests/unit/self-serve/daily_lines_test.mjs` 5개 통과 · 스크린샷 `production/qa/evidence/daily-lines/` (18일차 판다 메시지, 27일차 가장 긴 대사 — 말풍선 두 줄, 단어 단위 줄바꿈)

## Dependencies
- Depends on: None
