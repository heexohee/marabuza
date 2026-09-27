# QA 사인오프 리포트 — 셀프 담기 흐름 1부 (1~28일) 회귀 사이클

**날짜**: 2026-09-27 · **작성**: qa-lead
**빌드**: 브랜치 `feat/self-serve-flow`, 커밋 `7a44bc0`, 출시 빌드 `dist/`
**범위**: 셀프 담기 흐름 1부(1~28일). 레거시 "사장이 담기" 흐름은 동결 상태라 **범위 밖**.
**근거 문서**
- 전략: `production/qa/qa-strategy-part1-2026-09-27.md`
- 계획: `production/qa/qa-plan-part1-2026-09-27.md`
- 스모크: `production/qa/smoke-2026-09-27.md` — **PASS** (자동 374/374, `dist/` 기준)
- 수동 실행 기록: `production/qa/evidence/part1-regression/part1-regression-results.md`
- 버그: `production/qa/bugs/BUG-001-side-menu-daily-lines.md`

> 이 리포트는 기록된 결과만 정리한 것이다. 사인오프를 위해 다시 실행한 것은 없다.

---

## 1. 전제 조건 확인

| 확인 항목 | 결과 |
|---|---|
| 스모크 체크 PASS | ✅ `smoke-2026-09-27.md` PASS |
| 자동 테스트 | ✅ 374/374 통과, 0 실패, 0 건너뜀 |
| 범위 안 Logic/Integration 스토리마다 테스트 파일 있음 | ✅ 전부 있음 (아래 표) |
| 범위 안 모든 스토리에 실행 증거 있음 | ✅ 있음. 수동 세션 A(10건)·B(9건)·C(9건)·D(7건) 실행 완료, Visual/Feel·UI 스크린샷이 `production/qa/evidence/`에 남아 있음 |

**전제 조건 충족** → 판정을 낼 수 있다 (NOT ASSESSED 아님).

---

## 2. 테스트 커버리지 요약

| 스토리 | 유형 | 자동 테스트 | 수동 QA | 결과 |
|---|---|---|---|---|
| economy/001 메뉴 단가 | Integration | ✅ `tests/integration/economy/menu_prices_test.mjs` | 스모크 + A-03–A-05 (봇 2–10일 매출) | **PASS** |
| economy/002 D 기준·가격표 | Logic | ✅ `tests/unit/economy/price_table_test.mjs` | A-03–A-05 (📒 `D-n`, 금액 일치) | **PASS** |
| economy/003 주간 임대료 | Integration | ✅ `tests/integration/economy/weekly_rent_test.mjs` | A-03–A-05: 7일차 차감 460,800원(194,000 + 266,800) 일치 | **PASS** |
| economy/004 권리금·엔딩 | Integration | ✅ `tests/integration/economy/premium_ending_test.mjs` | A-05 남은 권리금 800,200원 · D 세션 28일 엔딩 통과 · 스모크 | **PASS** |
| economy/005 1부 밸런스 | Config/Data (ADVISORY) | ✅ `tests/integration/economy/part1_balance_test.mjs` + `tools/sim/part1_run.mjs` | A-01 · A-02 PASS. 체감은 **판정 안 함** (봇이 사람보다 빨라 떠난 손님 0명) | **PASS WITH NOTES** |
| part1-story/001 매일 대사 | Logic | ✅ `tests/unit/self-serve/daily_lines_test.mjs` | A-06/A-07 레이아웃 PASS (두 창 크기, 두 줄 이하, 스크롤 없음) / **내용 FAIL** | **PASS WITH NOTES** — BUG-001 (S3) 열림 |
| part1-story/002 단골 | Integration | ✅ `tests/integration/part1/regulars_test.mjs` | D 세션 28일 통과, 오류 0 (단골만 따로 판정한 기록은 없음) | **PASS** |
| part1-story/003 2부 예고 | Integration | ✅ `tests/integration/part1/part2_teaser_test.mjs` | D 세션: 28일 엔딩 → 2부 예고 → 34일차 통과 · 스모크 | **PASS** |
| shop-growth/001 가게 단면 | Visual/Feel | N/A (자동화 대상 아님) | 스크린샷 `evidence/shop-cross-section/` 있음, A-10 스크롤 없음. **리드 사인오프 미서명** | **PASS WITH NOTES** — 사인오프 대기 |
| shop-growth/005 인테리어 | Integration | ✅ `tests/integration/shop-growth/interior_upgrades_test.mjs` | 스크린샷 `evidence/interior-upgrades/` · D 세션 통과 | **PASS** |
| shop-growth/007 간판 교체 (In Progress) | Visual/Feel | N/A | C-01–C-03 PASS (오프닝 순서, 마지막 줄만 `scene-takeover-open`, 이어서 하기로 다시 안 나옴). **리드 사인오프 미서명** | **PASS WITH NOTES** — 사인오프 대기 |
| side-menu/001 사이드 메뉴 | Integration | ✅ `tests/integration/side-menu/side_menu_test.mjs` | C-04–C-08 PASS (해금 카드, 비용 29,100/48,500/77,600, 선물 10개, 웍 조건, 돈 부족 시 버튼 비활성) | **PASS** (관련 대사 결함은 BUG-001) |
| quick-spec #3 대기열 인내심 게이지 | UI | — (전용 테스트 없음) | B-07–B-09 PASS · 스크린샷 `part1-regression/B-gauge.png`, `playtest-fixes/01·02` | **PASS** |
| quick-spec #8 분홍 커서 | UI | — | B-01–B-06 PASS — 11개 화면의 계산된 `cursor` 값으로 판정. 헤드리스 캡처에 커서가 안 찍혀 **커서가 보이는 스크린샷은 없음** | **PASS WITH NOTES** |
| quick-spec #7 상점 장부 📒 | UI | ✅ `tests/unit/self-serve/shop_ledger_test.mjs` | A-08 PASS (두 창 크기 × 충분/부족) · 스크린샷 `side-open-ledger/3-ledger-popup.png` | **PASS** |
| 설정 엔딩 크레딧 | UI | ✅ `tests/unit/self-serve/credits_test.mjs` | A-09 PASS · 스크린샷 `side-open-ledger/4-credits.png` | **PASS** |
| 살아 있는 타이틀 배경 | UI | ✅ `tests/unit/self-serve/title_anim_test.mjs` | C-09 PASS (35초, 120fps, 최악 프레임 26ms). reduced-motion 경로는 **브라우저에서 관찰 안 됨** (코드 테스트만) | **PASS WITH NOTES** |

**교차 확인**
- A-10: 11개 화면 × 2 크기(1024×640 · 1280×720) = 22회 모두 스크롤 없음 → Steam 배포 "스크롤 금지" 조건 충족.
- D-06/D-07: 힙 7.5–12.8MB에서 오르내림(최대/시작 < 2×), DOM 노드 229–230으로 일정, 페이지 오류 0 → 스모크에서 "미확인"이던 28일 한 세션 메모리 항목 해소.

---

## 3. 발견한 버그

| ID | 요약 | 심각도 | 우선순위 | 상태 | 담당 |
|---|---|---|---|---|---|
| BUG-001 | 사이드 메뉴를 추가하지 않아도 8·10·12일차 아침 사장 대사가 음료 박스/웍/꿔바로우가 생긴 것처럼 말함 (플레이테스트 변경 #2 뒤 남은 문구) | **S3 — Minor (확정)** | **P2 — 곧 수정 (출시 전)** | Open | game-designer (문구 안 A/B/C 선택) → programmer |

**심각도 판단 (qa-lead 확정)**: 제안값 **S3 / P2를 그대로 확정한다.**
- S2가 아닌 이유: 재고·매출·웍 로직은 `sideGifts` 기준으로 맞게 돌아가고, 기능이 깨지거나 진행이 막히지 않는다. 결함은 문구에만 있다.
- S4가 아닌 이유: 조건만 맞으면 **항상** 나오고, 추가하지 않는 쪽이 기본 경로다. 게다가 8일차 대사는 "상점에서 추가해야 한다"는 새 규칙을 오히려 가려서 플레이어를 헷갈리게 한다. 단순한 오타 수준보다 무겁다.
- P2 유지: 출시(Steam) 전에 고쳐야 한다. 수정 뒤 `daily_lines_test.mjs` 회귀 테스트 3건과 8/10/12일차 추가/미추가 스크린샷이 필요하다 (BUG-001 §회귀 테스트 제안).
- 관찰 범위: 8·10일차는 A-06/A-07에서 직접 봤다. 12일차는 `story.js:127`의 같은 원인에서 추론한 것이고 브라우저에서는 보지 않았다 → 수정 확인 때 12일차도 반드시 본다.

**게임 결함이 아닌 문서 결함 (버그 번호 없음)**
- `part1-A-balance-text-cases.md` A-02 기대값 "약 50초"는 틀렸다. 대기열 인내심 0.9를 넣으면 50 ÷ 0.9 ≈ **55.6초(±5)**가 맞다. 관찰값 53.3초는 허용 범위 안이므로 PASS가 맞다. 케이스 문서를 고쳐야 한다.

---

## 4. 판정

### **APPROVED WITH CONDITIONS**

- 전제 조건 충족: 범위 안 모든 스토리에 실행 증거가 있다.
- 열린 S1/S2 **없음**.
- 열린 S3 1건(BUG-001), 그리고 PASS WITH NOTES 항목이 있다 (리드 사인오프 미서명, 사람 체감 밸런스 미판정, 브라우저에서 못 본 경로).

> 이 판정은 1부 회귀 **QA 사이클**에 대한 것이다. 스토리별 Done 게이트와는 별개다.
> shop-growth/001 · 007은 Visual/Feel **BLOCKING** 게이트가 "스크린샷 + 리드 사인오프"를 요구하므로,
> 아래 조건 2가 풀리기 전까지 두 스토리는 **Done 처리할 수 없다**. Sign-off 표는 비어 있는 대기 상태 그대로 둔다.

### 조건

1. **BUG-001 수정·확인** — 디자이너가 문구 안(A/B/C)을 고르고, 수정 뒤 `daily_lines_test.mjs` 회귀 테스트 추가, 8/10/12일차 추가/미추가 두 경우 스크린샷을 두 창 크기로 보존, `/bug-report verify BUG-001` → VERIFIED FIXED. 출시 빌드 전까지.
2. **Visual/Feel 리드 사인오프** — `shop-cross-section-evidence.md`(shop-growth/001)와 `sign-swap-opening-evidence.md`(shop-growth/007)의 Sign-off 표에 리드가 이름·날짜를 적고 승인해야 한다. 그 전까지 두 스토리는 Done이 아니다.
3. **사람 플레이테스트로 1부 밸런스 체감 확인** (economy/005) — 새 플레이어가 1~10일을 실제로 플레이하고, 시작 자금 500,000 · 진열 10개 · 인내심 0.9 · 권리금 11D가 너무 쉬운지/어려운지 기록한다. 봇 결과(떠난 손님 0명)는 체감 근거가 아니다.
4. **이번 도구로 못 본 항목 확인** — 실제 브라우저에서 `prefers-reduced-motion` 타이틀 경로 관찰, 커서가 보이는 스크린샷 1장 보존, 데스크톱 패키지가 나오면 실제 Windows / Steam Deck 하드웨어 확인. 하드웨어 확인은 Steam 출시 게이트(`/release-checklist`, cert_tier `steam`)에서 막는 조건이다.

---

## 5. 참고 사항 (조건은 아님)

- A-02 케이스 문서 기대값 수정 (§3).
- 전략 문서 §3-2에서 잡은 **375px 모바일 폭** 글자 넘침 확인은 이번 세션에서 하지 않았다 (1024×640 · 1280×720만 함). Steam 대상이라 막지는 않지만, 모바일 웹 배포(GitHub Pages)도 지원 대상이면 다음 사이클에 넣는다.
- D 세션은 출시 빌드 `dist/`가 아니라 개발 서버 `src/`의 개발 바 봇으로 돌렸다 (가속 도구가 개발 빌드에만 있음). 로직은 같지만, 출시 빌드 기준 장시간 확인은 A·B·C와 스모크가 대신한다.
- 힙 측정값은 `performance.memory` 거친 값이다 (정밀 플래그 없음). 누수 판정은 "꾸준한 증가 없음" 수준에서만 유효하다.
- A-06/A-07에서 1일차 대사는 저장으로 만들 수 없어 빠졌고, 스모크의 새 게임에서 확인했다.

---

## 6. 다음 단계

1. **BUG-001** → game-designer에게 넘겨 문구 안(A/B/C)과 BUG-001의 엣지 케이스 3개(볶음밥 건너뛰고 꿔바로우만 추가, 음료 늦게 추가, 29일차 이후)를 정하게 한다 → programmer가 수정 → `/bug-report verify BUG-001` → `/bug-report close BUG-001` → `/bug-triage`로 열린 버그 수 갱신.
2. **리드 사인오프** → 아트/디자인 리드가 두 evidence 문서의 Sign-off 표를 채운다 → 그 뒤 shop-growth/001 · 007 `/story-done`.
3. **사람 플레이테스트** → 1~10일 체감 세션 1회를 잡고 결과를 `production/qa/evidence/`에 남긴다.
4. **케이스 문서 수정** → `part1-A-balance-text-cases.md` A-02 기대값을 55.6초(±5)로 고친다.
5. 조건 1~3이 풀리면 이 리포트를 **APPROVED**로 올릴 수 있다. 조건 4의 하드웨어 항목은 데스크톱 패키지가 나온 뒤 `/release-checklist`(Steam)과 `/gate-check`에서 따로 막는다.

---

## Sign-off

| 역할 | 이름 | 날짜 | 판정 |
|---|---|---|---|
| QA Lead | qa-lead (에이전트) | 2026-09-27 | APPROVED WITH CONDITIONS |
| Producer 확인 | | | [ ] |

---

### 후속 (2026-09-27, 같은 날)

- **조건 1 해소** — BUG-001 수정·확인 완료 (상태 따라 대사 분기, 회귀 테스트 +3, 출시 빌드 12조합 확인).
  기록: `production/qa/bugs/BUG-001-side-menu-daily-lines.md` §Fix & Verification. 열린 버그 0건.
- 남은 조건: 2 (shop-growth 001·007 리드 사인오프), 3 (사람 플레이테스트 밸런스 체감), 4 (reduced-motion·커서 캡처·실기기).

