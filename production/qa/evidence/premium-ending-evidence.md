# Test Evidence: 권리금 4주 분할 + 28일차 엔딩 (economy E004)

> **Story**: `production/epics/economy/story-004-premium-and-ending.md`
> **Story Type**: Integration (화면 포함)
> **Date**: 2026-09-27
> **Tester**: Claude (Chrome 1280×900, 셀프 담기 `?dev=0`)

## 자동 테스트
- `tests/integration/economy/premium_ending_test.mjs` 25개 + 전체 315개 통과

## 화면 확인 (스크린샷: `premium-ending/`)
| # | 파일 | 확인 |
|---|---|---|
| 1 | `01-day28-ledger.png` | 28일차 장부: 매출 · 임대료 완납 ✓ · 권리금 할부 완납 ✓ · 남은 돈 · 권리금 막대(남은 0원), 칸 안에 들어맞음(204/204px) |
| 2 | `02-ending-paid-frame.png` | 완납 엔딩 5번째 대사: 판다 사장님 등장, 창문 위 벽에 "마라판다" 액자 + 금색 "완납" 명패, 간판·인물과 안 겹침 |
| 3 | `03-ending-paid-last.png` | 마지막 자막 "마라부자 1부 — 끝" + "계속 영업하기 →" → 상점(권리금 막대 없음) → "DAY 29 영업 시작!", 저장 endingSeen·premiumPaidInFull |
| 4 | `04-ending-forgiven-frame.png` | 탕감 갈래: "장부 봤어. 조금 남았네." → "…한 그릇으로 받았다 치자. …이제 네 가게구나.", 액자 명패 없음 |
| 5 | `05-shop-premium-bar.png` | 8일차 상점 머리글 권리금 막대 25%, "남은 582,000원" |

또 확인: 7일차 돈 부족 → 권리금 줄 "이월 !" + 🐼 "괜찮아, 다음 주에 같이 줘.", 더 갚기 버튼(돈 0원이면 꺼짐).

## 남은 것
- 엔딩 뒤 **영업 화면 홀 벽**에 액자 계속 보이기 (지금은 엔딩 장면에서만) — 액자 도트 그림과 함께 `tools/art/scene_shop.py` 층으로
- 액자는 CSS 임시 그림 — 도트 그림으로 교체

## Sign-Off
| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer (implemented) | Claude | 2026-09-27 | [x] Approved |
| Designer / Art Lead | | | [ ] Approved |
| QA Lead | | | [ ] Approved |

## 2026-09-27 — 엔딩 배경 = 내 가게 + 작은 액자

- `06-ending-own-hall-stage4.png` — 인테리어 4단계 세이브의 28일차 엔딩: 배경이 그 사용자의 홀 그림, 마라판다·완납 액자가 마라부자 간판 아래 작게 (61×30px / 무대 692px)
- `07-hall-wall-frame-day29.png` — 엔딩 뒤 29일차 영업 화면: 홀 벽에 액자가 남고 영업중 팻말이 그 아래로 내려감 (겹침 없음: 액자 y90–126, 팻말 y143–185)
- 7단계 비교 시안: `design/art/ending-mockups/ending-stages-sheet.png`
