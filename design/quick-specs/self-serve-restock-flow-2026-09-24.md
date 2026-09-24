# Quick Design Spec: 셀프 담기 · 선결제 · 진열대 보충 흐름 전환

**Type**: New Small System (핵심 루프 전환 — 경계선)
**Scope**: 사장이 재료를 담는 흐름을 없애고, 브리프의 셀프 담기 → 계산대 확인 → 선결제 → 조리 → 번호표 서빙 흐름과 창고 → 진열대 보충(신선도 포함)을 구현한다. 땅콩소스, 조리 적정 구간(story-002), 사이드 메뉴는 범위 밖.
**설계 기준**: `design/game-brief.md` 핵심 루프 / MVP 1·2·6 — 기존 story-003을 포함하고 확장함
**Date**: 2026-09-24
**Estimated Implementation**: ~8–10h

## Overview

손님은 가게에 들어오면 진열대에서 원하는 재료를 오래된 묶음부터 직접 담고, 꼬치통에서 꼬치를 골라 계산대 줄에 선다. 사장은 줄 맨 앞 손님의 그릇을 뒤적여 숨은 고기·꼬치를 찾아내고, 손님이 말한 조리 방식·맵기로 주문표를 적은 뒤, POS 무게 금액에 추가금을 더해 선결제를 받는다. 결제한 손님은 번호표를 받고 테이블에 앉고, 주문은 주방 레일로 간다. 사장이 주문표를 빈 냄비에 넣고, 완성되면 냄비를 집어 번호가 맞는 테이블에 서빙한다. 그 사이 사장은 창고에서 진열대로 재료를 보충해야 하는데, 보충하는 동안은 손이 묶이고, 채소는 오래 두면 시들어서 폐기된다.

## Core Rules

### A. 재고 2단계
1. `stock` = 창고(상점에서 구매, 저장되는 값). `shelf` = 진열대(하루 단위, 저장 안 함), 재료마다 묶음 목록 `[{ qty, age }]`.
2. 영업 시작 시 해금된 재료마다 창고에서 1박스를 진열대로 옮겨 둔다(개점 준비). 창고가 부족하면 있는 만큼만.
3. 보충: 진열대 칸 클릭 → 창고에서 `min(BOX_SIZE, 창고 재고, 칸 용량 − 현재 수량)`만큼 새 묶음(age 0)으로 이동. 옮길 수 없으면 토스트만 뜨고 상태는 그대로.
4. 보충하면 사장이 `RESTOCK_BUSY_SEC` 동안 바쁨 상태가 된다. 바쁜 동안에는 계산대·조리·서빙·보충·뒤적이기 입력을 무시하고 "보충 중!" 토스트를 띄운다.
5. 신선도: `perishable` 재료(청경채·숙주·팽이·목이)의 묶음은 매 틱 age가 증가한다. `age ≥ WILT_SEC`이면 폐기되고, `stats.wasted`(개수)와 `stats.wasteCost`(원가)에 누적되며 토스트가 뜬다.
6. 마감 시 진열대에 남은(시들지 않은) 재료는 창고로 돌아간다.

### B. 손님 셀프 담기
1. 손님이 오면 희망 목록(해금 재료 3–5종 × 1–2개)과 주문 정보(모드: `SHANGUO_CHANCE` 확률로 샹궈, 아니면 마라탕 / 맵기 0–4)가 정해진다.
2. 희망 재료마다 진열대에서 오래된 묶음부터 `min(원하는 수, 진열대 수량)`만큼 가져간다.
3. 부족한 수량은 진열대에 남은 다른 재료로 대체한다(가능한 만큼).
4. 담은 총 개수가 `MIN_BOWL_ITEMS` 미만이면 줄을 서지 않고 바로 떠난다. 평판 `stockoutLeave`, `stats.left`+1.
5. 희망 재료 중 하나도 못 담은 종류가 있으면 종류당 평판 `grumble`.
6. 꼬치통(재고 무제한): `SKEWER_CHANCE` 확률로 꼬치 1–2개(종류 무작위). 새우는 2마리가 꼬치 1개. 고수는 `CILANTRO_CHANCE` 확률.
7. 소고기·양고기(해금된 경우)도 희망 목록에서 담긴다. 고기·꼬치는 숨은 항목으로 그릇 아래에 깔린다.
8. 계산대 줄은 최대 `QUEUE_MAX`명. 줄이 꽉 차면 스폰이 미뤄진다.

### C. 계산대 (줄 맨 앞 손님)
1. 말풍선: 실제 모드·맵기. 고수가 있으면 보이게 표시된다.
2. 그릇에는 채소류만 보인다. 뒤적이기를 누를 때마다 숨은 항목 하나가 드러나고(`DIG_BUSY_SEC` 바쁨), 더 없으면 "바닥까지 확인했어요"가 뜬다.
3. 사장이 주문표 모드·맵기를 고른다. 기본값은 마라탕·2단계.
4. POS 금액 = 무게(고기·꼬치 제외) × 주문표 모드 단가. 추가금 키(+1,000 / +3,000 / +4,000, 빼기, 초기화)는 기존과 같다.
5. 결제: 청구 금액이 즉시 입금된다. 정확 / 과다 / 과소는 실제 모드 기준 정답가와 비교해 기록한다. 빈 테이블이 없으면 결제되지 않는다.
6. 결제한 손님은 번호표(`ticketNo`, 하루 단위 1부터)를 받아 첫 빈 테이블에 앉는다. 주방 레일에 주문(주문표 값)이 추가된다.
7. 줄에 선 손님은 인내심이 줄고, 0이 되면 떠난다(`leave`).

### D. 조리
1. 레일의 주문표를 클릭하면 빈 냄비에 들어간다. 조리 시간은 기존 `cookTime`. 빈 냄비가 없으면 토스트.
2. 앉은 손님의 인내심은 `COOKING_PATIENCE_RATE`로 느리게 줄고, 0이 되면 환불을 받고 떠난다: 결제액만큼 돈 차감, 평판 `leave`, 해당 주문표·냄비는 제거.

### E. 서빙
1. 완성된 냄비를 클릭하면 집은 냄비(`heldPot`)가 된다. 다시 누르면 내려놓는다.
2. 냄비를 든 상태로 테이블 클릭: 번호가 다르면 평판 `wrongTable`, 냄비는 계속 들고 있음. 번호가 맞으면 서빙.
3. 주문표 모드·맵기가 손님 요청과 맞으면 팁 = `round100(정답가 × MAX_TIP_RATIO × 인내심비율)`, 평판 `serveGood`(빠르면 `fastBonus` 추가). 틀리면 팁 0, 평판 `serveWrong`.
4. 서빙한 손님은 테이블을 떠나고 `stats.served`+1.

### F. 하루 흐름
마감은 영업 시간이 끝났고 줄·테이블·레일이 모두 비었을 때. 정산에 폐기와 계산 정확/과다/과소를 추가한다. 결제 거부는 없어진다(선결제).

## Tuning Knobs

모두 `src/js/data.js`에 둔다(이 프로젝트의 데이터 파일 위치).

| Knob | Default | Range | Category | Rationale |
|---|---|---|---|---|
| `START_WAREHOUSE_STOCK` | 30 | 25–40 | gate | 기본 재료당 시작 창고 재고. 첫날 실측 출고 15–25개 + 1박스 여유. 10이면 영업 30–48초에 바닥남 (`warehouse-balance_test`) |
| `BOX_SIZE` | 5 | 3–10 | gate | 한 번 보충할 때 옮기는 양 |
| `SHELF_CAPACITY` | 12 | 6–20 | gate | 진열대 칸 최대치 |
| `RESTOCK_BUSY_SEC` | 1.2 | 0.5–3 | feel | 보충 중 계산대를 비우는 비용 |
| `DIG_BUSY_SEC` | 0.3 | 0–1 | feel | 뒤적이기 한 번에 드는 시간 |
| `WILT_SEC` | 55 | 30–120 | curve | 하루 절반쯤 지나면 시들어서 과다 보충이 손해가 됨 |
| `QUEUE_MAX` | 3 | 2–5 | gate | 계산대 줄 길이 |
| `MIN_BOWL_ITEMS` | 2 | 1–3 | gate | 이보다 적게 담기면 그냥 나감 |
| `SHANGUO_CHANCE` | 0.3 | 0–0.6 | curve | 샹궈 주문 비율 |
| `SKEWER_CHANCE` | 0.4 | 0–0.8 | curve | 꼬치 함정 빈도 |
| `CILANTRO_CHANCE` | 0.25 | 0–0.5 | curve | 고수 빈도 |
| `RATING_DELTA.grumble` | −0.05 | −0.15–0 | curve | 품절 한 종류당 |
| `RATING_DELTA.stockoutLeave` | −0.15 | −0.3–0 | curve | 담을 게 없어서 나감 |
| `RATING_DELTA.wrongTable` | −0.1 | −0.2–0 | feel | 테이블 착각 |
| `RATING_DELTA.serveGood` / `serveWrong` | +0.08 / −0.2 | — | curve | 주문표가 맞음 / 틀림 |

## Acceptance Criteria

- [ ] 새 손님의 그릇은 진열대에서 FIFO로 채워지고, 진열대 수량이 정확히 그만큼 줄어든다
- [ ] 진열대가 부족하면 대체재로 채우고, 총 개수가 `MIN_BOWL_ITEMS` 미만이면 손님이 즉시 떠나며 평판이 떨어진다
- [ ] 보충은 창고 → 진열대로 이동하되 칸 용량과 창고 재고를 넘지 않고, 보충 후 `RESTOCK_BUSY_SEC` 동안 다른 행동이 무시된다
- [ ] `perishable` 묶음은 `WILT_SEC` 후 폐기되고 `wasted`/`wasteCost`에 기록되며, 비부패 재료는 시들지 않는다
- [ ] 뒤적이기 전에는 고기·꼬치가 계산대에 보이지 않고, 한 번 누를 때마다 하나씩 드러난다
- [ ] POS 금액은 주문표 모드 기준이고, 정답가는 실제 모드 기준이다. 모드를 틀리게 고르면 과다/과소로 기록된다
- [ ] 결제하는 순간 돈이 들어오고 번호표·테이블·레일 주문이 생긴다. 빈 테이블이 없으면 결제되지 않는다
- [ ] 냄비를 번호가 맞는 테이블에 서빙하면 팁과 평판이 반영되고, 번호가 틀리면 서빙되지 않고 평판이 떨어진다
- [ ] 앉아서 기다리다 떠난 손님에게는 환불된다
- [ ] 마감 시 진열대 잔량이 창고로 돌아가고, 정산에 폐기가 표시된다
- [ ] 경험: 러시 때 "보충 vs 계산" 판단이 생긴다 (플레이테스트)
- [ ] 회귀: story-001 가격 공식 테스트가 그대로 통과하고, 저장/불러오기(창고 재고)가 유지된다

## Implementation (A/B variant)

This flow is built as a **separate variant** next to the original flow so both can be playtested and compared. It does not replace or modify the original.

| | Original flow (owner scoops) | This variant (self-serve) |
|---|---|---|
| Entry | `src/index.html` | `src/self-serve.html` |
| Logic | `src/js/logic.js` | `src/js/self-serve/logic.js`, `shelf.js` |
| Balance | `src/js/data.js` | `src/js/self-serve/data.js` (+ shared `../data.js` by import) |
| Save slot | `maratang-save-v1` | `maratang-selfserve-save-v1` |
| Tests | `tests/unit/logic.test.mjs`, `tests/unit/checkout/` | `tests/unit/self-serve/`, `tests/integration/self-serve/` |

Shared by import only (never edited from the variant): checkout pricing, shop actions, timing helpers, sprites, `styles.css`, shop screen.

## Systems Index

`design/gdd/systems-index.md` 없음 — quick spec으로 충분. 구현 후 `design/gdd/maratang-tycoon.md`의 핵심 루프를 갱신해야 함(별도 승인).
