# Evidence — 사이드 메뉴 상점 해금 (#2) + 상점 장부 버튼 (#7), playtest 2026-09-27

Spec: design/quick-specs/playtest-2026-09-27.md #2 · #7

- `1-side-card-before.png` — 9일차 상점, 가격·사이드 탭: 중국음료(추가됨) · 달걀볶음밥 "🔓 메뉴 추가 48,500원" · 꿔바로우 "11일차 상점부터".
- `2-side-added-gift.png` — 메뉴 추가 클릭 후: 돈 600,000 → 551,500, 창고 10개(판다 선물), 토스트 "새 메뉴 🍳 달걀볶음밥 추가!".
- `3-ledger-popup.png` — 헤더 오른쪽 위 📒 → 임대료 194,000 (14일차 일요일 · D-5), 권리금 할부 242,500, 남은 권리금 970,000, 가진 돈, 판정.

Rules: 사이드는 저절로 열리지 않음 — 첫 영업일 전날 상점부터 `openCost`(0.3D·0.5D·0.8D = 29,100 / 48,500 / 77,600원)로 추가,
선물 10개 동봉. 웍은 조리 사이드가 추가된 뒤에만 보임. 장부 팝업은 상점에서만, Esc·아무 곳 클릭으로 닫힘.

Balance (tools/sim/part1_run.mjs, 봇이 사이드를 살 수 있으면 삼): clumsy 탕감 7/8·폐업 0 · normal 할부 제때 8/8·인테리어≥3 8/8·월세 연체 0
· good 21일차 완납 8/8 — §E 목표 유지.
Tests: tests/integration/side-menu/side_menu_test.mjs (재작성), tests/unit/self-serve/shop_ledger_test.mjs (6), shop_tabs_test.mjs — suite 365 pass.

## 엔딩 크레딧 (설정, 요청 2026-09-27)
- `4-credits.png` — 타이틀 → 설정 → 엔딩 크레딧: 고정 창 안에서 CREDITS가 위로 흐르며 반복 (4초 뒤 translateY −182px 측정),
  페이지 scrollHeight 720 = 창 높이 (스크롤 없음). 닫기·Esc → 설정으로 복귀. reduced-motion이면 정지 목록.
- Tests: tests/unit/self-serve/credits_test.mjs (2) — suite 367 pass.
