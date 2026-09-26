# Evidence: Story 005 — 인테리어 1–6단계 (+ economy E002 가격표)

Stories: `production/epics/shop-growth/story-005-interior-upgrades.md`, `production/epics/economy/story-002-baseline-and-price-table.md`
Date: 2026-09-27 · Build: local dev server (port 8124), Chrome (chrome-devtools, isolated context), 개발 모드 바(돈 추가·자동 영업)로 진행
Screenshots: `production/qa/evidence/interior-upgrades/`

| File | State |
|---|---|
| `00-day1-new-sign.png` | 새 게임 1일차 — 갈색 노포(0단계) + 핑크 "마라부자" 간판 |
| `01-shop-day9-stage5.png` | 9일차 상점 — 인테리어 1–5 완료, 6 주방 "12일차에 열림", 업그레이드 3종(냄비·화력·좌석 2→4) D 배수 가격 |
| `02-day10-stage5-scene.png` | 10일차 영업 — 핑크 벽지·바닥·펜던트·문·네온 하트, 민트 의자·흰 식탁 |
| `03-day16-stage6-scene.png` | 16일차 영업 — 6단계 주방(핑크 타일·후드·수납장) |

## Story 005 acceptance criteria

| # | Criterion | Result | How observed |
|---|---|---|---|
| 1 | 6단계 순서대로, 앞 단계를 사야 다음 | PASS | 상점에서 연속 구매 1→5, 테스트 |
| 2 | 해금일 전엔 잠김 + "N일차에 열림" | PASS | 9일차에 6단계 "12일차에 열림", 16일차에 구매 가능. 테스트(2일차에 바닥 불가 → 3일차 가능) |
| 3 | 돈 부족 시 못 삼, 사면 D 배수만큼 차감 | PASS | 테스트 |
| 4 | 저장·로드, 이전 세이브 0, 옛 "인테리어 +15%" 버림 | PASS | 새로고침 후 `interior` 5·6 유지, 테스트(옛 세이브 interior 3 → 0, 좌석 5 → 4) |
| 5 | 단면 배경이 단계에 맞게 | PASS | 02·03, `scene-shop-1..6.png` (`scene_shop.py --stage N`) |
| 6 | 효과 6개 (튜닝 상수 `INTERIOR_EFFECT`) | PASS | 테스트: 아침 평판 +0.1 · 인내심 ×1.1 · 팁 ×1.15 · 손님 도착 간격 ÷1.1 · 서빙 평판 ×1.25 · 시듦 ×0.8 |
| 7 | 테이블 수·조리 속도는 안 바뀜 | PASS | 인테리어 6단계 후에도 식탁 2개(02·03) |
| 8 | 통합 테스트 | PASS | `tests/integration/shop-growth/interior_upgrades_test.mjs` 14개, 전체 213 통과 |

## Economy E002 (가격표)

- D = 97,000원 (`tools/sim/baseline_day.mjs`, 40일, 계산 실수 포함 봇) — 브리프 §경제 레벨링 측정값에 기록
- 가격은 `priceOf(배수)` 한 함수 (100원 반올림), 좌석 2→4, 냄비·화력 D 배수, 옛 인테리어 업그레이드 제거 — `tests/unit/economy/price_table_test.mjs` 6개

## Notes

- 간판: 영업 배경은 0단계부터 "마라부자" (`00-day1-new-sign.png`, 2026-09-27 피드백 — 인수 첫날 오프닝에서 바꾸므로 영업은 늘 새 간판). 01–03은 그 전 스크린샷이라 "마라판다"로 보임. 간판을 바꾸는 오프닝 5장 장면 자체는 Story 007.
- 효과 크기는 첫 값 — 플레이테스트로 조정.
