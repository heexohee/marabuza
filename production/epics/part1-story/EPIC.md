# 에픽: part1-story (1부 "28일" 스토리)

> **단계**: minimal — `design/quick-specs/part1-28-days-2026-09-27.md`(Approved 2026-09-27)에서 만든 에픽
> **상태**: In Progress (N001 완료 2026-09-27)

## 목표

1–28일차를 한 편의 이야기로 완결한다. 날짜마다 다른 아침 한마디, 단골 셋(야근 너구리·시험기간 토끼·택배 곰)의 짧은 이야기, 29일차 2부 예고. 권리금·엔딩은 economy E004, 밸런스는 economy B001(story-005).

## 스토리

| # | 스토리 | 유형 | 상태 | ADR |
|---|-------|------|--------|-----|
| N001 | 날짜별 아침 한마디 (4–28일차) | Logic | Complete | N/A (minimal) |
| N002 | 단골 방문 — 너구리·토끼·곰 | Integration | Ready | N/A (minimal) |
| N003 | 2부 예고 — 29일차 아침 | Integration | Ready | N/A (minimal) |

## Dependencies

N001 → N002 (같은 날짜 테이블 방식) · economy E004 → N003
