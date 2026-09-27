# BUG-001 — 사이드 메뉴를 추가하지 않아도 8·10·12일차 아침 대사가 "메뉴가 생겼다"고 말함

> **스토리 유형**: Logic (고정 대사 표 ↔ 상태 불일치) · **증거 위치**: `tests/unit/self-serve/` · **게이트**: BLOCKING (수정 시 회귀 테스트 필요)

## Bug Report

| 항목 | 값 |
|---|---|
| **ID** | BUG-001 |
| **제목** | 사이드 메뉴 미추가 상태에서도 8·10·12일차 사장 대사가 음료/웍/꿔바로우가 생긴 것처럼 말함 |
| **Severity** | S3 (Minor) — 제안값, qa-lead 확정 필요 |
| **Priority** | P2 — 출시 전 수정 |
| **Status** | Fixed — Verified 2026-09-27 |
| **Frequency** | Always (100%, 조건 충족 시) |
| **Build** | 출시 빌드 `dist/` — 브랜치 `feat/self-serve-flow`, 커밋 `7a44bc0` |
| **Platform** | macOS (Darwin 25.5), 브라우저 실행, 창 크기 1024×640 · 1280×720 에서 모두 재현 |
| **발견** | 2026-09-27, 1부 회귀 QA 세션 A-06 / A-07 (Claude 검증) |
| **보고 대상** | qa-lead → 디자이너(대사 방향 결정) → 개발 |

## 배경

플레이테스트 변경 #2 (`design/quick-specs/playtest-2026-09-27.md`) 이후 사이드 메뉴는 **자동으로 열리지 않는다.**
플레이어가 해당 일차 **전날 밤 상점**에서 "🔓 메뉴 추가"를 눌러야 추가되며, 첫 박스 10개는 판다 사장님 선물로 들어온다.

| 사이드 | 판매 시작 | 상점 추가 가능 | 추가 비용 | 조리 |
|---|---|---|---|---|
| 🥤 중국음료 (`drink`) | 8일차 | 7일차 밤 | 29,100원 | 아님 (카운터) |
| 🍳 달걀볶음밥 (`friedrice`) | 10일차 | 9일차 밤 | 48,500원 | 웍 |
| 🍖 꿔바로우 (`guobao`) | 12일차 | 11일차 밤 | 77,600원 | 웍 |

웍은 조리 사이드(`cooked: true`)가 하나 이상 추가된 경우에만 주방에 나타난다 (`hasWok(s)`).

그러나 하루 시작 사장 대사 표(`DAILY_LINES`)는 변경 #2 이전의 **자동 오픈 전제**로 작성되어 그대로 남아 있다.

## Steps to Reproduce

**Precondition**: 새 게임, 또는 7 / 9 / 11일차 밤 상점 세이브 중 해당 사이드를 아직 추가하지 않은 상태.

1. 새 게임을 시작해 7일차 밤 상점(또는 9 / 11일차 밤 상점)까지 진행한다.
2. 상점의 사이드 메뉴 카드에서 **"🔓 메뉴 추가"를 누르지 않는다.**
3. 다음 날(8 / 10 / 12일차) 영업을 시작한다.
4. 영업 시작 직후 표시되는 사장 말풍선과 화면(카운터·주방)을 확인한다.

## Expected Behavior

말풍선 대사가 플레이어가 실제로 한 행동과 일치한다. 예:
- 해당 사이드를 추가했으면 → 현재 대사(또는 그에 준하는 축하 대사).
- 추가하지 않았으면 → 존재하지 않는 음료/웍/꿔바로우를 언급하지 않거나, "오늘부터 음료를 팔 수 있어 — 상점에서 추가했나?" 같은 안내형 대사.

## Actual Behavior

해당 사이드가 추가되지 않았는데도 아래 고정 대사가 그대로 출력된다.

| 일차 | 출력되는 대사 | 화면 상태 |
|---|---|---|
| 8 | 판다 사장님이 음료 한 박스를 보내 주셨어! | 음료 재고 없음, 음료 주문 없음 |
| 10 | 웍이 생겼다! 볶음밥은 알아서 볶아져. 계산만 정확히! | **주방에 웍 없음** (A-06/A-07 에서 직접 관찰) |
| 12 | 꿔바로우까지! 이제 진짜 우리 가게 메뉴판이야. | 꿔바로우 없음 |

## Impact

- 서사가 화면과 모순된다 (플레이어가 "웍이 어디 있지?", "음료 박스를 받았나?"로 혼란).
- 8일차 대사는 "판다 선물 박스"를 이미 받은 것처럼 말해, 상점에서 추가해야 한다는 새 규칙을 오히려 가린다.
- 게임플레이·경제에는 영향 없음 (재고·매출·웍 로직은 `sideGifts` 기준으로 정상 동작).

## 영향 파일 / 라인

| 파일 | 라인 | 내용 |
|---|---|---|
| `src/js/self-serve/story.js` | 123 | `8: { who: 'me', text: '판다 사장님이 음료 한 박스를 보내 주셨어!' }` |
| `src/js/self-serve/story.js` | 125 | `10: { who: 'me', text: '웍이 생겼다! 볶음밥은 알아서 볶아져. 계산만 정확히!' }` |
| `src/js/self-serve/story.js` | 127 | `12: { who: 'me', text: '꿔바로우까지! 이제 진짜 우리 가게 메뉴판이야.' }` |
| `src/js/self-serve/story.js` | 179–183 | `dayStartLine(day)` — 인자가 `day` 뿐이라 상태를 볼 수 없음 (근본 원인) |
| `src/js/self-serve/logic.js` | 305 | `startDay(s)` 가 `dayStartLine(s.day)` 로 호출 — 상태 `s` 는 이 시점에 사용 가능 |

참고: 추가 여부는 `s.sideGifts` (id 배열), `openSides(s)`, `hasWok(s)` (`logic.js` 180·184) 로 이미 판별 가능하다.

## 수정 방향 제안 (디자이너 선택)

| 안 | 내용 | 장점 | 단점 |
|---|---|---|---|
| **A. 문구만 교체 (상태 무관)** | 세 대사를 추가 여부와 무관하게 참인 안내형 문구로 바꾼다. 예: 8일차 "오늘부터 음료를 팔 수 있어 — 상점에서 추가했나?" | 코드 변경 최소 (`DAILY_LINES` 텍스트만) | 추가한 플레이어에게는 축하 느낌이 약해짐 |
| **B. 상태 분기 대사** | `dayStartLine(day, s)` 로 상태를 받고, 8/10/12일차는 "추가함 / 안 함" 두 버전 중 선택 (예: 10일차는 `hasWok(s)` 기준) | 서사와 화면이 항상 일치, 기존 대사 재사용 가능 | 대사 2배, 함수 시그니처 변경 → `daily_lines_test.mjs` · `logic.js` 수정 필요 |
| **C. 미추가 시 일반 대사로 대체** | 해당 사이드 미추가면 해당 일차에 한해 `OWN_LINES` 순환 또는 중립 대사 사용 | 새 문구 작성량 적음 | 사이드 존재를 알려 주는 넛지가 사라짐 |

추가로 디자이너가 결정할 엣지 케이스 (현재 스펙에 없음):
1. 볶음밥은 건너뛰고 11일차 밤에 꿔바로우만 추가한 경우 — 12일차 "꿔바로우까지!"의 "까지"가 부자연스러움. 또한 웍이 처음 생기는 날이 12일차가 되는데 웍 안내 대사가 나오지 않음.
2. 7일차 밤엔 음료를 건너뛰고 9일차 밤 이후 추가한 경우 — 음료 선물 박스를 알려 주는 대사가 전혀 나오지 않음 (토스트 "새 메뉴 … 추가! 첫 박스 10개는 판다 사장님 선물 🎁" 만 존재).
3. 1부 이후(29일차+)엔 `OWN_LINES` 순환이라 영향 없음 — 확인만 필요.

## 회귀 테스트 제안 (수정 후)

`tests/unit/self-serve/daily_lines_test.mjs` 에 추가:
- `test_day10_without_cooked_side_line_does_not_mention_wok` — `sideGifts: []`, 10일차 → 대사에 "웍" 미포함.
- `test_day8_without_drink_line_does_not_claim_gift_box` — `sideGifts: []`, 8일차 → "보내 주셨어" 미포함.
- `test_day12_without_guobao_line_does_not_mention_guobao` — `sideGifts: ['drink','friedrice']`, 12일차 → "꿔바로우" 미포함.
- (안 B 채택 시) 추가한 경우 각 일차 축하 대사가 나오는지 양쪽 분기 모두 검증.
- 기존 검증 유지: 영업일 4–27 대사 존재, 일요일(7·14·21·28) 없음, 29일차 이후 `DAILY_LINES` 없음.

수동 확인: 1024×640 · 1280×720 에서 8 / 10 / 12일차 말풍선을 추가/미추가 두 경우 모두 스크린샷으로 `production/qa/evidence/` 에 보존.

## 관련 스토리 / 문서

- `production/epics/part1-story/story-001-daily-lines.md` — 매일 대사 (테스트: `tests/unit/self-serve/daily_lines_test.mjs`)
- `production/epics/side-menu/story-001-side-menu.md` — 사이드 메뉴
- `design/quick-specs/playtest-2026-09-27.md` — 변경 #2 (사이드 메뉴 상점 해금)
- `design/quick-specs/part1-28-days-2026-09-27.md` §B — 1부 일차별 대사 표 (원본 문구 출처, 함께 갱신 필요)
- QA 세션: 1부 회귀 A-06 / A-07 (`production/qa/test-cases/part1-A-balance-text-cases.md`, 증거 `production/qa/evidence/part1-regression/`)

## Fix & Verification (2026-09-27)

- 선택한 수정: **상태 따라 대사 분기** (안 B). `DAILY_LINES` 8·10·12일차에 `side` + `notAdded`, `dayStartLine(day, sideIds)`가
  그날 아침 메뉴에 없는 사이드면 `notAdded`를 말함, `startDay`가 `s.sideGifts`를 넘김 (`src/js/self-serve/story.js`, `logic.js`).
  - 8일차 안 넣음: "오늘부터 음료를 팔 수 있대. 상점에서 추가해 볼까?"
  - 10일차 안 넣음: "볶음밥도 팔 수 있대! 상점에서 추가하면 웍이 생겨."
  - 12일차 안 넣음: "꿔바로우도 팔 수 있대. 상점에서 메뉴판 채워 볼까?"
- 회귀 테스트: `tests/unit/self-serve/daily_lines_test.mjs` +3 (추가/미추가 분기, 표 대사 유지, startDay 상태 반영) — suite 377 pass.
- 출시 빌드 `dist/` 확인: 8·10·12일차 × 추가/미추가 × 1024×640·1280×720 = 12조합 모두 맞는 대사, 두 줄 이내·넘침 없음,
  웍은 볶음밥/꿔바로우 추가 때만. 스크린샷 `production/qa/evidence/part1-regression/BUG-001-day10-{not-added,added}.png`.
- 스펙 `design/quick-specs/part1-28-days-2026-09-27.md` §B 8·10·12일차 행도 같이 갱신.

