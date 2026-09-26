# Evidence: Story E001 — 메뉴 단가 두 가지 (상점 조정 → 계산기 반영)

Story: `production/epics/economy/story-001-menu-prices.md`
Date: 2026-09-27 · Build: local dev server (`tools/dev/serve.py`, port 8124), Chrome (chrome-devtools, isolated context)
Screenshots: `production/qa/evidence/menu-prices/`

## Screenshots

| File | State |
|---|---|
| `01-shop-two-prices.png` | 상점 "메뉴 가격" 섹션 — 마라탕 2,000원 · 샹궈 2,900원, 손님 방문 ×0.91 |
| `02-counter-adjusted-rate.png` | 다음 날 계산대 — `저울 (마라탕 2,000원/100g) 6,600원` (330g) |

## Acceptance criteria

| # | Criterion | Result | How observed |
|---|---|---|---|
| 1 | 상점에서 두 단가를 각각 −/+ 조정 (기본 1,800 / 3,000, 범위·간격 상수) | PASS | 실제 버튼 클릭: 1,800→2,000 (+2), 3,000→2,900 (−1). `MENU_PRICE` (step 100, 마라탕 1,200–2,600, 샹궈 2,000–4,400) |
| 2 | 계산대 영수증이 현재 모드의 조정된 단가 표시·적용 | PASS | 330g 그릇: 마라탕 모드 `2,000원/100g → 6,600원`, 샹궈로 바꾸면 `2,900원/100g → 9,600원` |
| 3 | 정답 가격도 같은 단가 | PASS | 통합 테스트 — 영수증 금액 그대로 받으면 정확 판정, 추가금은 고정 |
| 4 | 손님 수가 두 단가에 반응 (모드 비율 반영) | PASS | 상점 안내 ×0.91 (둘 중 마라탕 인상이 더 큼), 통합 테스트 — 비싸면 ↓·싸면 ↑, `SHANGUO_CHANCE` 가중 |
| 5 | 저장·로드, 이전 `pricePer100g` 세이브는 기본값, 범위 밖은 보정 | PASS | 이전 형식 세이브로 "이어하기" → 1,800 / 3,000으로 열림. 조정 후 새로고침해도 2,000 / 2,900 유지. 범위 밖 값은 경계로 보정(테스트) |
| 6 | 게임방법 창의 가격 안내 | N/A | 게임방법 창은 추가금만 보여 주고 100g 단가 숫자를 쓰지 않음 — 틀린 고정값이 없음 |
| 7 | 통합 테스트 | PASS | `tests/integration/economy/menu_prices_test.mjs` 16개. 전체 182개 통과 (단위 132 + 통합 50) |

## Notes

- 기존(사장이 담는) 흐름은 그대로: 공유 `checkoutBasePrice`/`checkoutBowlPrice`에 선택 인자만 추가, 기본값은 고정 단가 (테스트로 확인).
- 상점의 단가 조절을 업그레이드 카드 줄에서 빼서 별도 "메뉴 가격" 섹션으로 — 두 단가를 나란히, 손님 방문 안내는 그 아래 한 줄.
