# Story E004: 권리금 4주 분할 + 28일차 엔딩 "이제 네 가게구나"

> **Epic**: economy (경제 레벨링)
> **Status**: In Progress (규칙·저장·봇·화면·홀 벽 액자 완료 2026-09-27 — 남은 것: 액자 도트 그림)
> **Layer**: Feature
> **Type**: Integration
> **Estimate**: L
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-09-27 (1부 28일 결정으로 전면 개정 — 이전 "최소 0.5D 할부, 6–8주" 대체)
> **Performance**: 정산·상점·엔딩 컷씬에서만

## Context

**Design**: `design/quick-specs/part1-28-days-2026-09-27.md` §A 권리금 4주 분할, §C 28일차 엔딩 (Approved 2026-09-27) · `design/game-brief.md` Story §빚 세 가지 · 경제 레벨링 §권리금
**ADR**: N/A (minimal — no ADRs)
**Engine**: Web (vanilla HTML/CSS/JS) | **Risk**: NOT ASSESSED (no game engine)

---

## Acceptance Criteria

- [ ] 권리금 총액 `P = PREMIUM_TOTAL_D × BASELINE_D`(시작 8D), 주 할부 `P / PREMIUM_WEEKS`(4). 값은 `src/js/self-serve/data.js` 한 곳
- [ ] 일요일(7·14·21·28일차) 장부에서 임대료 다음 줄로 할부(+이월분)가 빠진다. 권리금 줄에서 판다 사장님 한마디 — 주차별 대사: 7 "첫 할부 잘 받았어. 천천히 해~" · 14 "반 왔네. 가게 냄새가 좋아졌다던데?" · 21 "하나 남았다. 무리하지 말고." · 28 없음(엔딩으로)
- [ ] 돈이 모자라면 낼 수 있는 만큼만 빠지고 나머지는 다음 주로 **이월** — 권리금 줄에 연체 도장 + 판다 "괜찮아, 다음 주에 같이 줘". **권리금으로는 폐업하지 않는다** (폐업은 임대료 두 주 연속만)
- [ ] 장부 끝 **더 갚기**(+1만 / +5만 / 가능한 만큼, 남은 권리금·가진 돈 이하)로 일찍 갚을 수 있다. 다 갚은 뒤 일요일 권리금 줄은 "완납 ✓" + 판다 "벌써? 28일에 보자."
- [ ] 남은 권리금 막대가 일요일 장부와 상점에 보인다
- [ ] **28일차** 장부 뒤 엔딩 컷씬(`OPENING_SCENES` 방식, 배경 = 사용자의 인테리어 단계 홀 그림 `scene-shop(-N).png`, 0–6단계 — 시안 `design/art/ending-mockups/`):
  - 완납: 🐼 "장부 봤어. …다 갚았네." → 🙂 "사장님 덕분이에요." → 🐼 "아니. 이제 네 가게구나." → 🐼 "이건 가져가려다 말았어. 여기 두는 게 맞겠다." → 옛 "마라판다" 간판 액자 + 금색 "완납" 명패 → 🙂 "{name} 사장의 마라부자. 내일도 한 그릇씩!" → 자막 "마라부자 1부 — 끝"
  - 미완납: 2–4줄이 🐼 "장부 봤어. 조금 남았네." → 🙂 "죄송해요… 조금만 더 시간을 주시면—" → 🐼 "됐어. 나머지는 그동안 손님들한테 내준 한 그릇으로 받았다 치자. …이제 네 가게구나." 로 바뀌고 명패 없음, 남은 권리금 0
- [ ] 엔딩은 28일차에만 나온다 (일찍 완납해도). 엔딩 뒤 상점 → 29일차, 권리금 줄 없음(임대료만)
- [ ] 엔딩 뒤 단면 벽에 액자(완납이면 명패)가 계속 보인다
- [ ] `premiumLeft`, `premiumCarry`, `premiumPaidInFull`, `endingSeen`이 저장·로드된다 (예전 세이브는 normalize로 새 규칙에 맞춤)
- [ ] 봇(`autoplay.js`)이 할부·더 갚기를 처리해 28일을 끝까지 돌 수 있다 (B001 밸런스의 전제)
- [ ] 할부·이월·폐업 없음·더 갚기·일찍 완납·28일 엔딩 두 갈래·세이브가 통합 테스트로 검증된다

---

## Implementation Notes

- 일요일 장부는 E003(주간 임대료)의 흐름에 줄 하나를 더하는 구조. 빠지는 순서: 임대료 → 권리금.
- 판다 대사는 `story.js`에 날짜 → 대사 테이블로 (N001과 같은 방식).
- 엔딩 배경·액자는 `tools/art/`의 장면 생성기에 층으로 추가 (`scene_shop.py`에 액자 층, 엔딩 장면은 기존 일요일 배경 기반).

---

## Out of Scope

- 2부 예고 장면 (N003)
- 권리금 총액 확정 (B001)
- 도전과제

---

## Test Evidence

**Story Type**: Integration
**Required evidence**: `tests/integration/economy/premium_ending_test.mjs` + 엔딩 두 갈래 스크린샷 `production/qa/evidence/premium-ending/`
**Status**: [x] `tests/integration/economy/premium_ending_test.mjs` 25개 통과 · 스크린샷 `production/qa/evidence/premium-ending/` + `premium-ending-evidence.md`

---

## Dependencies

- Depends on: E003 (주간 임대료·일요일 장부)
- Unlocks: N003 (2부 예고), B001 (1부 밸런스)
