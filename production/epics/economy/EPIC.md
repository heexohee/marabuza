# 에픽: economy (경제 레벨링)

> **단계**: minimal — `design/game-brief.md` "경제 레벨링" 섹션(2026-09-26)에서 만든 에픽
> **상태**: In Progress

## 목표

모든 가격을 하루 순이익 D의 배수로 맞춰 임대료·권리금·인테리어·업그레이드가 한 체계로 움직이게 한다. 메뉴 단가는 상점에서 마라탕·샹궈 각각 조정하고 계산기에 그대로 반영된다. 한 주는 월~토 영업 + 일요일 휴일, 일요일에 임대료(주세)를 낸다. 권리금 완납이 엔딩.

## 스토리

| # | 스토리 | 유형 | 상태 | ADR |
|---|-------|------|--------|-----|
| E001 | 메뉴 단가 두 가지 — 상점 조정 → 계산기 반영 | Integration | In Progress | N/A (minimal) |
| E002 | 기준 D 측정 + 가격표 재정렬 | Logic | In Progress | N/A (minimal) |
| E003 | 주간 임대료 + 일요일 휴일 — 연체 1회, 2주 연속 폐업 | Integration | Ready | N/A (minimal) |
| E004 | 권리금 할부 + 엔딩 "이제 네 가게구나" | Integration | Ready | N/A (minimal) |

## Dependencies

E001 → E002 → E003 → E004 · E002 → shop-growth 005
