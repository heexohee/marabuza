# 게임 흐름과 파일 구분

**결정 (2026-09-25)**: 사장님이 재료를 담는 흐름은 그만두고, **손님이 직접 재료를 담는 셀프 담기 흐름**으로 확정.
설계: [`design/quick-specs/self-serve-restock-flow-2026-09-24.md`](../design/quick-specs/self-serve-restock-flow-2026-09-24.md)

| 흐름 | 상태 | 진입 | 로컬 주소 |
|---|---|---|---|
| **셀프 담기** | 현재 게임 (개발 중) | `src/self-serve.html` → `src/js/self-serve/main.js` | `http://localhost:8124/self-serve.html` |
| 사장님 담기 | **레거시** — 데모로만 유지, 기능 추가 없음 | `src/index.html` → `src/js/main.js` | `http://localhost:8123/` |

## 파일 구분

### 레거시 전용 — 셀프 담기가 쓰지 않음
옛 흐름에서만 쓰는 파일. 고쳐도 셀프 담기에 영향이 없지만, 새 기능은 넣지 않는다.
- `src/index.html`
- `src/js/main.js`
- `src/js/save.js` (셀프 담기는 `src/js/self-serve/save.js`를 씀)
- `tests/unit/logic.test.mjs`, `tests/unit/save/save_test.mjs`, `tests/unit/checkout/pricing_test.mjs` — 레거시 규칙 테스트. 단, 공유 계산대 함수도 함께 검증하므로 계속 통과해야 함

### 공유 — 셀프 담기가 가져다 씀 ⚠️ 함부로 바꾸지 말 것
레거시 폴더(`src/js/`)에 있지만 셀프 담기가 임포트하는 파일. 동작을 바꾸면 셀프 담기에 바로 영향이 간다.
옮기거나 이름을 바꾸지 말고, 바꿔야 하면 셀프 담기 쪽과 먼저 맞춘다.

| 파일 | 셀프 담기가 쓰는 것 |
|---|---|
| `src/js/data.js` | 가격·재료·손님·업그레이드 상수 (`CHECKOUT_PRICE`, `INGREDIENTS`, `SKEWER_ITEMS`, `CHARGE_STEPS` 등) |
| `src/js/logic.js` | 계산대 가격 함수 (`checkoutBasePrice`, `checkoutBowlPrice`, `checkoutBowlWeight`, `checkoutOutcome`, `toCheckoutBowl`), `addToast`, `clamp`, `round100`, `cookTime`, `maxPatience`, `spawnInterval`, `isClosing`, `freePotIndex`, `unlockIngredient` |
| `src/js/sprites.js` | `spriteImg` (픽셀 스프라이트) |
| `src/js/ui.js` | `stars`, `won`, `chiliRow` — 불러오는 순간 `src/js/screens.js`도 함께 로드됨 |
| `src/js/screens.js` | 직접 쓰지는 않지만 `ui.js`를 통해 로드됨 |
| `src/styles.css` | `self-serve.html`이 `self-serve.css`와 함께 불러옴 |

### 셀프 담기 전용 — 다른 세션 담당
- `src/self-serve.html`, `src/self-serve.css`, `src/js/self-serve/*`
- `tests/unit/self-serve/*`, `tests/integration/self-serve/*`

### 흐름과 무관한 공용 모듈
- `src/js/cloud.js` — 카카오 로그인 + 클라우드 저장. 어떤 흐름 코드도 임포트하지 않고, 흐름마다 저장 검사 함수와 **저장 칸(slot)**을 넘겨받는다. 레거시는 `'legacy'`, 셀프 담기는 `'self-serve'`를 쓴다. 연결 방법: [`cloud-save-setup.md`](cloud-save-setup.md)
- `src/js/cloud-config.example.js`, `supabase/saves.sql`, `tests/unit/cloud/cloud_test.mjs`
