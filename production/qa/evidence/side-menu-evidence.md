# Evidence: side-menu Story 001 — 사이드 메뉴

Story: `production/epics/side-menu/story-001-side-menu.md` · Date: 2026-09-27 · local dev server, Chrome
Screenshots: `production/qa/evidence/side-menu/`

| File | State |
|---|---|
| `01-counter-side-order.png` | 16일차 실제 영업 — 손님 "샹궈 3단계요!" 중국음료도 주세요!, 주방 오른쪽 위 웍 |
| `02-counter-side-chip.png` | 계산대 주문 칩 "꿔바로우" (색 대비 수정 후) |

| Criterion | Result | How observed |
|---|---|---|
| 해금 8/10/12일차, 여는 날 선물 박스 한 번 | PASS | 테스트. 실제: 15일차 이전 세이브 → 16일차 아침 세 가지 알림 + 선물(여는 날을 지나쳐도 첫날 한 번) |
| 일부 손님이 열린 사이드 주문, 말풍선·칩 | PASS | 01·02 |
| 정답 가격 = 메인 + 사이드 (3,000 / 8,000 / 12,000), 빼먹으면 덜 받음, 정산 내역 한 줄 | PASS | 테스트 |
| 결제 시 재고 −1, 없으면 투덜·사이드 없이 | PASS | 테스트 |
| 음료 바로, 볶음밥·꿔바로우는 웍 자동 조리 → 메인과 함께 서빙 | PASS | 테스트(냄비 주문에 사이드 · 서빙 시 `sides` +1, 🍖 표시), 01 웍 표시 |
| 상점 발주 10개 묶음, 안 열린 건 "N일차에 열림" | PASS | 상점 사이드 카드 3장 (가격·창고 수량·발주 버튼) |
| 세이브 (이전 세이브는 재고 0·선물 없음) | PASS | 테스트 |
| 개발 봇이 사이드 계산·보충 | PASS | 테스트 (12일차 봇 영업 `sides` > 0, 날 사이 재고 30 이상) |
| 통합 테스트 | PASS | `tests/integration/side-menu/side_menu_test.mjs` 14개, 전체 227 |

Notes: 좁은 화면(≤700px)에서는 주방이 단면 아래 띠로 내려가 웍 표시를 숨김.
