# QA 전략 — 셀프서비스 흐름 1부 (1~28일) 회귀 QA 사이클

**작성**: 2026-09-27 · **작성자**: qa-lead
**범위**: 셀프서비스(self-serve) 흐름, 1부(1~28일)만. 레거시 "사장이 담기" 흐름
(`src/index.html`, `src/js/{logic,save,screens,ui}.js` 최상위)은 동결 상태이며 **범위 밖**.
**스모크 체크 참조**: `production/qa/smoke-2026-09-27.md`

---

## 0. 스모크 체크 판정

> **PASS** — `production/qa/smoke-2026-09-27.md`
> 자동 테스트 374/374 통과 (`node --test`, 이번 세션에서 재실행하여 재확인 완료, 릴리스 빌드 `dist/` 기준).
> 헤드리스 Chrome 수동 스모크: 실행→오프닝→캐릭터→1일차 실시간 플레이→요약, 상점 구매, 저장/재접속/이어하기,
> 7일차 일요일 장부 산술, 28일차 엔딩→상점→29일차 2부 예고, 120fps, 1024×640/1920×747 스크롤 없음 — 모두 확인.
> **미확인**: 28일 단일 세션 메모리 누수, 실제 Windows/Steam Deck 하드웨어(데스크톱 패키지 미보유).
>
> 이 판정이 아래 회귀 QA 사이클의 진입 조건이다 — 스모크 실패 시 수동 QA 핸드오프 자체를 보류한다(본 문서 원칙 참고).

---

## 1. 스토리별 분류표

범례 — **Gate**: BLOCKING(자동 완료 없이는 Done 불가) / ADVISORY(권고, Done을 막지 않음).
**자동화**: 필수 자동 테스트 존재 여부. **수동**: 자동이 볼 수 없는 부분(체감/문구/레이아웃)의 수동 확인 필요 여부.

| 스토리/변경 | 유형 | Gate | 자동화 | 수동 | 상태 |
|---|---|---|---|---|---|
| economy/001 메뉴 단가 | Integration | BLOCKING | ✅ `tests/integration/economy/menu_prices_test.mjs` | 아니오 (수치 검증은 테스트로 충분) | OK |
| economy/002 D 기준·가격표 | Logic | BLOCKING | ✅ `tests/unit/economy/price_table_test.mjs` | 아니오 | OK |
| economy/003 주간 임대료 | Integration | BLOCKING | ✅ `tests/integration/economy/weekly_rent_test.mjs` | 권장: 7일차 실플레이 1회(스모크에 이미 포함) | OK |
| economy/004 권리금·엔딩 | Integration | BLOCKING | ✅ `tests/integration/economy/premium_ending_test.mjs` | 권장: 28일차 엔딩 실플레이 1회(스모크에 이미 포함) | OK |
| economy/005 1부 밸런스 | Config/Data | ADVISORY (기본) | ✅ `tests/integration/economy/part1_balance_test.mjs` + 봇 시뮬 `tools/sim/part1_run.mjs` | **예 — 체감 밸런스는 시뮬 통과와 별개** (§3) | OK, 수동 세션 필요 |
| part1-story/001 매일 대사 | Logic | BLOCKING | ✅ `tests/unit/self-serve/daily_lines_test.mjs` | 텍스트 오버플로 확인 필요 (§3) | OK + 수동 보완 |
| part1-story/002 단골 | Integration | BLOCKING | ✅ `tests/integration/part1/regulars_test.mjs` | 체감(단골 등장 타이밍·대사 톤) | OK |
| part1-story/003 2부 예고 | Integration | BLOCKING | ✅ `tests/integration/part1/part2_teaser_test.mjs` | UI 플로우 확인(29일차 전환) | OK |
| shop-growth/001 가게 단면 | Visual/Feel | BLOCKING | N/A(자동화 대상 아님) | ✅ 스크린샷 존재, **리드 사인오프 문구 없음** | **CONCERN** (§2-1) |
| shop-growth/005 인테리어 | Integration | BLOCKING | ✅ `tests/integration/shop-growth/interior_upgrades_test.mjs` | 단계 전환 시 시각 확인(스크린샷 존재) | OK |
| shop-growth/007 간판 교체 (In Progress) | Visual/Feel | BLOCKING | N/A | ✅ 스크린샷 존재, **리드 사인오프 없음** + **스토리 파일 Status 체크박스 미갱신** | **CONCERN** (§2-1, §2-2) |
| side-menu/001 사이드 메뉴 | Integration | BLOCKING | ✅ `tests/integration/side-menu/side_menu_test.mjs` | UI 스크린샷 존재(`side-menu/`) | OK |

**범위 제외 확인**: shop-growth 002/003/004/006(Status: Ready, 미착수) — 스토리 파일 기준 미구현이므로 이번 회귀 대상 아님, 정상 제외.
maratang-tycoon/* — 레거시, CLAUDE.md/directory-structure 원칙에 따라 동결·범위 밖.

---

## 2. 블로커·주의 사항

### 2-1. Visual/Feel 게이트에 "리드 사인오프"가 문서화되어 있지 않음 (CONCERN, BLOCKING은 아님)

`.claude/docs/coding-standards.md`의 Gate 표는 Visual/Feel 스토리에 **"리드 사인오프"**를 스크린샷과
함께 요구한다. 확인 결과:

- `shop-cross-section-evidence.md` (story-001): 7개 항목 전부 PASS로 기록되어 있으나, 서명자/승인자 이름과
  날짜가 명시된 사인오프 줄이 없다. 문서 자체는 매우 꼼꼼하지만 "누가 승인했는가"가 비어 있다.
- `sign-swap-opening-evidence.md` (story-007): 동일하게 PASS 표는 있으나 사인오프 줄이 없다.

**영향**: 두 스토리 모두 스크린샷 증거 자체는 실재하고 조건을 충족하므로 즉시 Done을 막을 정도는 아니라고
판단하지만(BLOCKER 아님), 엄밀한 Gate 정의를 따르면 **리드 서명이 없는 한 형식적으로는 미완**이다.
→ **조치 제안**: 각 evidence.md 하단에 `**Sign-off**: [이름] — [날짜]` 한 줄만 추가하면 해소된다. QA 리드가
이 문서 리뷰와 함께 즉시 사인오프 가능(스크린샷 내용은 이미 검증 완료로 보임).

### 2-2. story-007 스토리 파일의 Test Evidence 체크박스가 stale

`production/epics/shop-growth/story-007-sign-swap-cutscene.md`의 Test Evidence 섹션은
`**Status**: [ ] Not yet created`로 남아 있으나, 실제로는 `production/qa/evidence/sign-swap-opening/`에
스크린샷 1장과 evidence.md가 이미 존재한다(2026-09-27 작성). 스토리 자체도 Status: In Progress로
아직 Done 처리 전이라 워크플로 상 사고는 아니지만, 이 상태로 `/story-done`을 돌리면 게이트 스크립트가
증거 없음으로 오판할 수 있다. → **조치 제안**: 스토리 파일의 체크박스를 `[x]`로 갱신하고 경로를 채워 넣을 것.

### 2-3. economy/005 (1부 밸런스, Config/Data)의 수동 검증 범위

Gate 기본값은 ADVISORY이지만, 이 스토리는 2026-09-27 당일 플레이테스트로 대량 수치 변경이 있었다
(시작 자금 500,000 · 진열 10개 · 대기열 인내심 0.9 · 권리금 11D=1,067,000 등). 시뮬레이션 봇
(`tools/sim/part1_run.mjs`)과 통합 테스트는 산술적 정합성만 보장하며, "체감상 너무 쉽다/어렵다"는
판단은 자동화 대상이 아니다(`.claude/docs/coding-standards.md`"What NOT to Automate" — Feel 자동화 금지).
→ 수동 세션에서 반드시 확인 (§3).

### 2-4. 신규 재료·꼬치(#9, #10)와 커서(#8)·패니언스 게이지(#3)의 테스트 커버리지

`tests/integration/self-serve/new_ingredients_test.mjs`로 4개 신규 재료+치즈떡꼬치 로직은 커버되는 것을
확인했다(코드로 확인, 명칭 매칭). 다만 핑크 커서(#8)와 카운터 대기열 인내심 게이지(#3)는 시각적
요소로, 전용 자동 테스트 파일을 찾지 못했다 — `shelf-patience/` 평가 디렉터리(2 files)가 있어 스크린샷
증거는 존재하는 것으로 보이나, 이 디렉터리를 기준으로 한 evidence.md가 없어 무엇을 어떤 기준으로
확인했는지 문서화되어 있지 않다. → BLOCKING 게이트 대상 스토리가 아니라 "당일 변경"(quick-spec) 항목이라
ADVISORY 취급이 맞지만, 수동 QA 체크리스트에는 포함해 눈으로 재확인한다(§3).

---

## 3. 수동 QA 범위 (자동화가 볼 수 없는 것만)

자동 테스트 374/374 통과로 로직·수치는 이미 담보되어 있다. 수동 세션은 **아래로만 한정**한다 — 이미
테스트가 도는 산술/상태전이를 사람이 다시 확인하지 않는다.

1. **1부 밸런스 체감** (economy/005) — 신규 플레이어 페르소나로 1~10일 실플레이:
   시작 자금 500,000이 너무 여유롭게/빡빡하게 느껴지는지, 진열 10개·대기열 인내심 0.9가 실제 매장
   운영 리듬에서 자연스러운지 코멘트.
2. **UI 텍스트 오버플로** — 매일 대사(part1-story/001), 상점 장부 팝업(#7, 다음 일요일 임대료 D-n·분할·부족액),
   설정 엔딩 크레딧(Noto 표기 포함) — 1024×640과 375px 폭 모바일 두 해상도에서 줄바꿈 깨짐 여부.
3. **커서/게이지 시각 확인** — 핑크 커서(#8)가 모든 화면(타이틀/영업/상점/설정)에서 기본 커서로
   일관되게 나타나는지, 카운터 대기열 인내심 게이지(#3)가 0.9 설정에서 시각적으로 읽히는 속도로
   줄어드는지.
4. **간판 교체 컷씬 1회성** — story-007: 기존 세이브로 이어하기 했을 때 컷씬이 다시 나오지 않는지
   (evidence.md에 "1회만 나오는지 확인"이 요구사항으로 적혀 있으나 새 게임 기준 검증만 되어 있어,
   기존 세이브 이어하기 케이스를 별도로 1회 확인 권장).
5. **사이드 메뉴 구매 플로우(#2)** — openCost 지불 후 사이드 메뉴 해금, 선물(gift 10) 플로우가
   실제 상점 UI에서 매끄러운지, 오해 소지 있는 문구 없는지.
6. **살아있는 타이틀 배경(title_anim)** — 코드 테스트(`title_anim_test.mjs`)는 애니메이션 파라미터만
   검증. 실제로 30초 이상 방치했을 때 눈에 거슬리는 반복/끊김이 없는지.
7. **28일 단일 세션 메모리** — 스모크 체크에서 명시적으로 "미확인"으로 남긴 항목. 이번 회귀 사이클에서
   1부 전체를 끊지 않고 28일 연속 플레이(또는 자동 진행 도구가 있다면 그것으로 가속) 1세션 확보 권장.

**예상 수동 QA 세션 수**: **4세션** (세션당 약 1.5~2시간 기준)
- 세션 A: 1~10일 밸런스 체감 + 텍스트 오버플로 1024×640 (§3-1, 3-2 일부)
- 세션 B: 375px 모바일 폭 텍스트 오버플로 + 커서/게이지 시각 확인 (§3-2 나머지, 3-3)
- 세션 C: 간판 컷씬 1회성 + 사이드 메뉴 구매 플로우 + 타이틀 배경 (§3-4, 3-5, 3-6)
- 세션 D: 28일 연속 단일 세션 메모리/성능 확인 (§3-7) — 별도로 길게 잡을 것(실시간 28일 또는 가속 도구 필요)

---

## 4. 블로커/컨선 요약 (재확인용)

- **BLOCKER**: 없음. 스모크 PASS, 374/374 자동 테스트 통과, 범위 내 모든 스토리에 필수 테스트 파일 또는
  스크린샷 증거가 실재함을 확인함.
- **CONCERN 1**: shop-growth/001, shop-growth/007 evidence.md에 리드 사인오프 줄 누락 — 형식상 Gate
  미완. 조치는 한 줄 추가로 해소 가능(§2-1).
- **CONCERN 2**: story-007 스토리 파일의 Test Evidence 체크박스가 실제 증거 존재와 불일치(stale) —
  `/story-done` 게이트 오판 우려(§2-2).
- **CONCERN 3**: 핑크 커서(#8)·대기열 인내심 게이지(#3)의 evidence.md 미비 — 스크린샷은 있으나 판정
  기록 없음(§2-4). ADVISORY이나 수동 체크리스트에 포함함.
