# 에픽: economy (경제 레벨링)

> **단계**: minimal — `design/game-brief.md` "경제 레벨링" 섹션(2026-09-26)에서 만든 에픽
> **상태**: In Progress

## 목표

모든 가격을 하루 순이익 D의 배수로 맞춰 임대료·권리금·인테리어·업그레이드가 한 체계로 움직이게 한다. 메뉴 단가는 상점에서 마라탕·샹궈 각각 조정하고 계산기에 그대로 반영된다. 한 주는 월~토 영업 + 일요일 휴일, 일요일에 임대료(주세)를 낸다. 권리금은 4주 분할, 28일차 일요일이 1부 엔딩(2026-09-27, `design/quick-specs/part1-28-days-2026-09-27.md`).

## 스토리

| # | 스토리 | 유형 | 상태 | ADR |
|---|-------|------|--------|-----|
| E001 | 메뉴 단가 두 가지 — 상점 조정 → 계산기 반영 | Integration | In Progress | N/A (minimal) |
| E002 | 기준 D 측정 + 가격표 재정렬 | Logic | In Progress | N/A (minimal) |
| E003 | 주간 임대료 + 일요일 휴일 — 연체 1회, 2주 연속 폐업 | Integration | Ready | N/A (minimal) |
| E004 | 권리금 4주 분할 + 28일차 엔딩 "이제 네 가게구나" (2026-09-27 개정) | Integration | Ready | N/A (minimal) |
| B001 | 1부 밸런스 — 28일 봇 시뮬레이션으로 권리금 총액 확정 (`story-005-part1-balance.md`) | Config/Data | Ready | N/A (minimal) |

## Dependencies

E001 → E002 → E003 → E004 → B001 · E004 → part1-story N003 · E002 → shop-growth 005
