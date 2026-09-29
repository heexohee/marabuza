# 세션 C 수동 테스트 케이스 — 오프닝 스토리 + 전수증(증서) 전달 장면

- **대상 커밋**: 6c0e7a1 (오프닝·증서 전달 대사), 4d21415 (승인 삽화 `img/opening-approved/*.png`, 03-notice / 04-offer 레이어 합성: `rain-background.png` + `layers/reading|talk-protagonist|talk-panda.png`)
- **스토리 유형**: UI + Visual/Feel (대사·삽화 컷, 창 크기 레이아웃) — **증거 위치**: `production/qa/evidence/opening-approved/` — **게이트**: BLOCKING (스크린샷 보존 필수)
- **실행자**: 브라우저를 조작하는 Claude
- **작성일**: 2026-09-29 / 작성: qa-tester
- **근거 코드**: `src/js/self-serve/story.js` (OPENING_SCENES, ENDING_LINES, ENDING_FRAME_STEP=4), `src/js/self-serve/story-ui.js` (OPENING_ART, RAIN_CAST, endingHtml), `logic.js` (advanceStory / skipStory / enterEnding), `dev.js` (jumpToEnding)

---

## 0. 공통 환경 및 규칙

| 항목 | 값 |
|---|---|
| 개발 서버 | http://localhost:8124/self-serve.html (DEV 바: ⏩ 하루 자동, ⏩ 6일 자동, 💰 +10만, 🎬 엔딩 보기) |
| 출시 빌드 | http://localhost:8131/self-serve.html (IS_RELEASE=true → DEV 바 없음) |
| 기본 창 크기 | 1280×720 (모든 컷 케이스 1차 실행) |
| 보조 창 크기 | 1024×640 (C-15, C-16에서 전 컷 재확인) |
| 진행 입력 | Space 또는 화면 클릭 (Enter 도 동일). Esc = 건너뛰기 (오프닝 한정) |
| 세이브 키 | `localStorage['maratang-selfserve-save-v1']` |

**모든 케이스 공통 사전 조건 (P0)**
1. 해당 포트 origin에서 DevTools 콘솔 `localStorage.clear()` 후 새로고침.
2. DevTools Console / Network 탭을 열어 두고 Network는 "Preserve log", 필터 없음.
3. 타이틀 화면에서 기본 강조가 **새 게임**인지 확인 (세이브 없음).

**모든 컷 공통 확인 항목 (L-체크)** — 각 컷 케이스의 "기대 결과"에 포함된 것으로 간주한다.
- L1. 대사 텍스트가 `.dialogue` 박스 밖으로 넘치지 않는다 (박스 bounding rect 안에 `<p>`의 rect가 완전히 포함).
- L2. 페이지 스크롤 없음: `document.documentElement.scrollHeight <= innerHeight` 그리고 `scrollWidth <= innerWidth`.
- L3. 삽화가 잘리지 않고 전부 보임: `.opening-illustration` rect가 뷰포트 안, 이미지 `naturalWidth > 0` (1672×941 원본).
- L4. 레이어 컷(03/04)에서 cast 이미지가 plate 위 정해진 위치에 정렬됨 (C-06, C-08 참조).
- L5. `▶ 클릭 / Space` 힌트 표시 (마지막 비트 제외), 화자 이름 규칙 준수 (캡션은 화자 없음).
- L6. 콘솔 error 0, Network 404 0 (C-17에서 누적 판정).

화자 표기 규칙: 캐릭터 생성 전(office/regular/notice) 주인공 = **"나"**, 생성 후(takeover, 엔딩) = **입력한 이름**. 판다 = **"판다 사장님"**, 안내문 = **"📜 안내문"**(박스에 `is-notice` 클래스), 캡션 = 화자 없음(`is-caption` 클래스).

테스트용 이름: **`마라QA`** (8자 제한 이내).

---

## C-01 — 새 게임 → 첫 삽화(01-office) 표시 지연 측정

**사전 조건**: P0, 개발 서버, 창 1280×720, Network "Disable cache" **켬** (첫 방문 조건 재현).
**단계**:
1. 콘솔에 다음을 붙여 넣어 측정기를 준비한다:
   ```js
   window.__t0 = 0; new MutationObserver(() => { const img = document.querySelector('.opening-illustration img'); if (__t0 && img && img.complete && img.naturalWidth && !window.__t1) { window.__t1 = performance.now(); console.info('first-art ms', Math.round(__t1 - __t0)) } }).observe(document.body, { subtree: true, childList: true, attributes: true }); document.addEventListener('click', () => { if (!__t0) __t0 = performance.now() }, { capture: true, once: true })
   ```
   (이미지 load 이벤트까지 잡으려면 `setInterval` 폴링 100ms로 대체 가능)
2. 타이틀에서 **새 게임** 클릭.
3. 2초 이상 대기 후 콘솔의 `first-art ms` 값을 기록.
4. `performance.getEntriesByName(location.origin + '/img/opening-approved/01-office.png')[0]`의 `startTime`, `responseEnd`, `transferSize`를 기록.
5. "Disable cache" **끔** 상태로 P0 반복 후 1~4 재측정 (캐시 적중 조건).
**기대 결과**: 새 게임 클릭 즉시 오프닝 화면(대사 박스 "새벽 2시… 오늘도 야근이다.")이 뜨고, 삽화가 뒤따라 표시된다. 측정값을 기록한다. 참고: 01-office.png ≈2.0MB, rain-background.png ≈4.0MB이며 `<link rel=preload>` 없음 → 알려진 관찰 "~2초 지연"과 일치하는지 확인.
**합격 기준**: 측정값이 기록되고, 삽화 로드 완료 전 구간에 깨진 이미지 아이콘/alt 텍스트 노출이 없으며, 대사 박스 위치가 삽화 로드 전후로 이동하지 않는다(레이아웃 시프트 0). 지연 허용 한도(ms)는 **qa-lead 판정 대기** — 판정 전까지는 수치 기록만으로 Pass.
**스크린샷**: `C-01_first-art-loading_1280x720.png` (클릭 직후 ~300ms), `C-01_first-art-loaded_1280x720.png`
**실제 결과**:
**Pass/Fail**:

---

## C-02 — office 장면 / 컷 01-office (라인 0–1)

**사전 조건**: P0, 개발 서버, 1280×720. 새 게임 클릭 직후.
**단계**:
1. 첫 화면 상태 확인 후 스크린샷.
2. Space 1회.
3. 두 번째 화면 확인 후 스크린샷.
**기대 결과**:

| 라인 | 화자 | 대사 |
|---|---|---|
| 0 | 나 | 새벽 2시… 오늘도 야근이다. |
| 1 | 나 | 그래도 버틸 수 있는 건, 퇴근길 마라판다의 마라탕 한 그릇 덕분이야. |

- 삽화 `img/opening-approved/01-office.png` (alt "야근을 마치고 마라판다로 걸어가는 주인공"), 두 라인 모두 동일 컷.
- 하단 scene-dots 4개 중 1번째가 `on`. "건너뛰기 ⏭" 버튼 표시.
- L1–L5 충족.
**합격 기준**: 두 라인의 화자·대사가 표와 글자 단위로 일치하고 L1–L5 모두 참.
**스크린샷**: `C-02_office-L0_1280x720.png`, `C-02_office-L1_1280x720.png`
**실제 결과**:
**Pass/Fail**:

---

## C-03 — regular 장면 / 컷 02-regular (라인 0–1)

**사전 조건**: C-02 종료 상태 (office 라인 1).
**단계**:
1. Space 1회 → 스크린샷.
2. Space 1회 → 스크린샷.
**기대 결과**:

| 라인 | 화자 | 대사 |
|---|---|---|
| 0 | 판다 사장님 | 늦었네? 오늘도 3단계, 고수 듬뿍 맞지? |
| 1 | 나 | 사장님 마라탕이 제 하루의 유일한 낙이에요…. |

- 삽화 `02-regular.png` (alt "단골 주인공을 반기는 판다 사장님"). scene-dots 2번째 `on`. L1–L5.
**합격 기준**: 표와 일치 + L1–L5 참.
**스크린샷**: `C-03_regular-L0_1280x720.png`, `C-03_regular-L1_1280x720.png`
**실제 결과**:
**Pass/Fail**:

---

## C-04 — notice 장면 / 컷 03-notice (라인 0–3, 레이어 합성)

**사전 조건**: C-03 종료 상태.
**단계**:
1. Space 1회 (라인 0) → 스크린샷.
2. Space 3회, 각 라인마다 스크린샷 (라인 1, 2, 3).
**기대 결과**:

| 라인 | 화자 | 박스 클래스 | 대사 |
|---|---|---|---|
| 0 | (없음) | `is-caption` | 며칠 뒤, 회사를 그만둔 날. |
| 1 | 나 | — | 퇴사하고 제일 먼저 달려온 곳인데… 불이 꺼져 있네. |
| 2 | 📜 안내문 | `is-notice` | 그동안 감사했습니다. 고향으로 내려갑니다. 가게 넘깁니다. — 마라판다 |
| 3 | 나 | — | 회사 그만두면 여기서 느긋하게 먹으려고 했는데…. |

- 네 라인 모두 레이어 컷: 컨테이너 `.opening-layered` (`role="img"`, aria-label "불 꺼진 가게의 안내문을 읽는 주인공"), plate `rain-background.png` + cast `layers/reading.png` **1장만** (판다 없음).
- scene-dots 3번째 `on`. L1–L5.
**합격 기준**: 표와 일치, 라인 0에 `.speaker` 요소 없음, 라인 2 박스에 `is-notice` 있음, 라인 0–3 동안 `.opening-cast` 개수 = 1.
**스크린샷**: `C-04_notice-L0_1280x720.png` ~ `C-04_notice-L3_1280x720.png`
**실제 결과**:
**Pass/Fail**:

---

## C-05 — 03-notice 레이어 정렬 수치 검증

**사전 조건**: notice 라인 0–3 중 아무 화면 (1280×720), 이후 1024×640에서 반복.
**단계**:
1. 콘솔 실행:
   ```js
   const p = document.querySelector('.opening-plate').getBoundingClientRect(); [...document.querySelectorAll('.opening-cast')].map(c => { const r = c.getBoundingClientRect(); return { src: c.src.split('/').pop(), left: ((r.left - p.left) / p.width * 1672).toFixed(1), top: ((r.top - p.top) / p.height * 941).toFixed(1), width: (r.width / p.width * 1672).toFixed(1), inside: r.left >= p.left && r.right <= p.right && r.top >= p.top && r.bottom <= p.bottom } })
   ```
2. 창을 1024×640으로 바꾸고 1 반복.
3. 캐릭터 발/그림자가 plate의 바닥 그림과 맞는지 시각 확인, 확대 스크린샷.
**기대 결과**: `reading.png` → left ≈ 1070, top ≈ 447, width ≈ 198 (plate 원본 px 좌표계), `inside: true`. 두 창 크기에서 동일 좌표.
**합격 기준**: 각 값이 기대값 ±2 이내, 두 크기 모두 `inside: true`, 시각적으로 떠 있거나 어긋난 경계(흰 테두리·잘림) 없음.
**스크린샷**: `C-05_notice-layer-align_1280x720.png`, `C-05_notice-layer-align_1024x640.png`
**실제 결과**:
**Pass/Fail**:

---

## C-06 — notice 장면 / 컷 04-offer (라인 4–6, 레이어 합성)

**사전 조건**: C-04 종료 상태 (notice 라인 3).
**단계**:
1. Space 1회 (라인 4) → 스크린샷.
2. Space 2회, 각각 스크린샷 (라인 5, 6).
**기대 결과**:

| 라인 | 화자 | 대사 |
|---|---|---|
| 4 | 판다 사장님 | …왔구나, 우리 단골. |
| 5 | 판다 사장님 | 자네가 해 볼 텐가? 권리금은 천천히 갚아도 돼. |
| 6 | 나 | 네, 퇴직금 전부 걸게요. 이 가게, 제가 지킬게요! |

- 라인 4에서 컷 전환: 같은 plate `rain-background.png` 유지, cast가 `talk-protagonist.png` + `talk-panda.png` **2장**으로 교체 (`reading.png` 사라짐). aria-label "가게 인수를 제안하는 판다 사장님".
- plate 이미지가 전환 시 다시 깜빡이거나 재다운로드되지 않음 (Network에 rain-background.png 요청 1회).
- L1–L5.
**합격 기준**: 표 일치, 라인 4–6 동안 `.opening-cast` = 2, rain-background.png 요청 수 = 1 (캐시 사용 시 memory cache 표시 허용).
**스크린샷**: `C-06_offer-L4_1280x720.png`, `C-06_offer-L5_1280x720.png`, `C-06_offer-L6_1280x720.png`
**실제 결과**:
**Pass/Fail**:

---

## C-07 — 04-offer 레이어 정렬 수치 검증

**사전 조건**: notice 라인 4–6 중 아무 화면.
**단계**: C-05의 1–3과 동일 (1280×720, 1024×640).
**기대 결과**:

| 레이어 | left | top | width |
|---|---|---|---|
| talk-protagonist.png | 150 | 368 | 205 |
| talk-panda.png | 355 | 368 | 441 |

두 레이어 모두 `inside: true`, 두 캐릭터가 같은 바닥선에 서 있고 서로 겹침 순서(주인공 → 판다)가 자연스러움.
**합격 기준**: 값 ±2 이내, 두 크기에서 `inside: true`, 시각 어긋남 없음.
**스크린샷**: `C-07_offer-layer-align_1280x720.png`, `C-07_offer-layer-align_1024x640.png`
**실제 결과**:
**Pass/Fail**:

---

## C-08 — notice → 캐릭터 생성 전환

**사전 조건**: C-06 종료 상태 (notice 라인 6).
**단계**:
1. Space 1회.
2. 화면 확인 후 스크린샷.
3. 이름 입력란을 비우고 `마라QA` 입력, 머리 기장/머리색/앞치마 각각 기본 외 옵션 1개 선택.
4. **앞치마 입고 가게로!** 클릭.
**기대 결과**: 2단계에서 "사장님 준비" 생성 화면, 부제 "마라판다를 인수했다! 이름과 모습을 정하고, 사장님이 건넨 앞치마를 골라요.", 이름 input `maxlength=8`. 4단계 후 takeover 장면 라인 0으로 진입(C-09).
**합격 기준**: 생성 화면이 뜨고, 타이핑 중 포커스 유지, 버튼 클릭 후 takeover 라인 0 표시. L2(스크롤 없음) 참.
**스크린샷**: `C-08_create_1280x720.png`
**실제 결과**:
**Pass/Fail**:

---

## C-09 — takeover 장면 / 컷 05-apron (라인 0–4)

**사전 조건**: C-08 종료 상태, 이름 = `마라QA`.
**단계**: 라인 0 스크린샷 → Space 4회, 각 라인 스크린샷.
**기대 결과**:

| 라인 | 화자 | 대사 |
|---|---|---|
| 0 | (없음, caption) | 그리고, 인수 첫날 아침. |
| 1 | 판다 사장님 | 내가 쓰던 앞치마야. 오늘부터 마라QA 사장이네. |
| 2 | 마라QA | 임대료는 매주, 권리금은 조금씩… 꼭 다 갚을게요. |
| 3 | 판다 사장님 | 천천히 해. 대신 손님 그릇은 꼭 뒤적여 봐. 고기랑 꼬치가 숨어 있거든. |
| 4 | 판다 사장님 | 난 이만 간다. 가끔 손님으로 올게. |

- 삽화 `05-apron.png` (alt "판다 사장님에게 앞치마를 받는 주인공"), scene-dots 4번째 `on`.
- `{name}` 문자열이 화면 어디에도 남지 않음. 주인공 화자명이 "나"가 아니라 `마라QA`.
- L1–L5 (라인 3이 가장 긴 판다 대사 — 넘침 중점 확인).
**합격 기준**: 표 일치, `document.body.innerText.includes('{name}') === false`.
**스크린샷**: `C-09_apron-L0_1280x720.png` ~ `C-09_apron-L4_1280x720.png`
**실제 결과**:
**Pass/Fail**:

---

## C-10 — takeover 장면 / 컷 06-alone (라인 5–6)

**사전 조건**: C-09 종료 상태 (라인 4).
**단계**: Space 2회, 각 라인 스크린샷.
**기대 결과**:

| 라인 | 화자 | 대사 |
|---|---|---|
| 5 | 마라QA | …이제 진짜 혼자네. |
| 6 | 마라QA | 이번엔 내가 누군가의 "버티게 해주는 한 그릇"이 되어 줄 거야. |

- 라인 5에서 삽화가 `06-alone.png`로 전환 (alt "가게에 혼자 남은 주인공"). 큰따옴표가 이스케이프 문자(`&quot;`)로 보이지 않음.
- L1–L5.
**합격 기준**: 표 일치, 컷 전환이 정확히 라인 5에서 발생.
**스크린샷**: `C-10_alone-L5_1280x720.png`, `C-10_alone-L6_1280x720.png`
**실제 결과**:
**Pass/Fail**:

---

## C-11 — takeover 장면 / 컷 07-open (라인 7) → 1일차 진입

**사전 조건**: C-10 종료 상태 (라인 6).
**단계**:
1. Space 1회 → 스크린샷.
2. Space 1회.
**기대 결과**:
- 라인 7: 화자 `마라QA`, 대사 "마라QA 사장의 마라부자, 첫 영업 시작!", 삽화 `07-open.png` (alt "마라부자의 첫 영업을 시작하는 주인공").
- 2단계 후 오프닝 종료 → 1일차 영업 화면(또는 1일차 인트로/달력 연출)으로 진입. 오프닝 화면이 다시 나오지 않음.
**합격 기준**: 라인 7 텍스트 일치, 다음 입력으로 1일차 진입.
**스크린샷**: `C-11_open-L7_1280x720.png`, `C-11_day1-entry_1280x720.png`
**실제 결과**:
**Pass/Fail**:

---

## C-12 — 건너뛰기 동작 (생성 전 / 생성 후)

**사전 조건**: P0, 개발 서버, 1280×720.
**단계**:
1. 새 게임 → office 라인 0에서 **건너뛰기 ⏭** 클릭.
2. 생성 화면이 뜨는지 확인 → 이름 `마라QA` 입력 후 **앞치마 입고 가게로!**
3. takeover 라인 0에서 **Esc** 키.
4. P0 반복 → 새 게임 → notice 라인 4(04-offer)까지 진행 후 Esc.
**기대 결과**: 1 → 생성 화면(프롤로그는 건너뛰어도 생성은 생략 불가). 3 → 곧바로 1일차 진입(takeover 나머지 생략). 4 → 생성 화면.
**합격 기준**: 세 경우 모두 기대 화면으로 이동, 콘솔 error 0.
**스크린샷**: `C-12_skip-to-create_1280x720.png`, `C-12_skip-to-day1_1280x720.png`
**실제 결과**:
**Pass/Fail**:

---

## C-13 — 전수증 장면 (완납 분기): 엔딩 전 컷 01-ledger / 02-settlement / 08-certificate

**사전 조건**: 개발 서버, 1280×720. C-11 또는 C-12 이후 게임 진행 중(캐릭터 `마라QA`, 어떤 화면이든).
**단계** (가장 빠른 경로):
1. DEV 바 **🎬 엔딩 보기** 클릭 → 28일차 일요일 장면(휴무 가게) 표시.
2. Space로 일요일 비트 진행: 캡션 "오늘은 일요일! 쉬는 날." → 마라QA "한 달 동안 수고했어. 장부부터 정리하자." → 장부(권리금 행 "완납 ✓") → 마라QA "임대료 완납! 이번 주도 잘 버텼다." (하단 버튼 라벨 **…**).
3. Space(또는 **…** 버튼) → 엔딩 step 0. 이후 step 6까지 Space로 하나씩 진행하며 매 step 스크린샷.
**기대 결과**:

| step | 화자 | 대사 (완납 분기) | 삽화 (`img/story-v2/ending/`) | 완납 뱃지 |
|---|---|---|---|---|
| 0 | (caption) | 28일차, 일요일 저녁. | 01-ledger.png | 없음 |
| 1 | 판다 사장님 | 장부 봤어. …다 갚았네. | 02-settlement.png | "권리금 완납" 표시 |
| 2 | 마라QA | 사장님 덕분이에요. | 02-settlement.png | 표시 |
| 3 | 판다 사장님 | 아니. 이제 네 가게구나. | 02-settlement.png | 표시 |
| 4 (ENDING_FRAME_STEP) | 판다 사장님 | 이젠 마라 맛 전수증을 넘겨줄게. 잘 보이는 데 걸어 둬. | **08-certificate.png** | 표시 |
| 5 | 마라QA | 감사합니다. 앞으로도 잘해 나갈게요! | 08-certificate.png | 표시 |
| 6 (마지막) | (caption) | 마라부자 1부 — 끝 | 08-certificate.png | 표시 |

- step 4 alt = "붉은 발바닥 도장이 찍힌 마라판다의 맛 전수증을 전하는 판다 사장님"; 증서 그림 속 붉은 발바닥 도장이 잘리지 않고 보임.
- step 0–5 `▶ 클릭 / Space` 표시, step 6은 힌트 없음 + **계속 →** 버튼.
- L1–L3, L5.
**합격 기준**: 7개 step 모두 표와 일치, 증서 컷 전환이 정확히 step 4에서 발생.
**스크린샷**: `C-13_ending-S0_1280x720.png` ~ `C-13_ending-S6_1280x720.png` (step 4는 필수: `C-13_certificate-S4_1280x720.png`)
**실제 결과**:
**Pass/Fail**:

---

## C-14 — 엔딩 종료 → 2부 예고 → 크레딧 → 상점 벽의 전수증 액자

**사전 조건**: C-13 종료 상태 (step 6).
**단계**:
1. **계속 →** 클릭.
2. 예고 첫 비트 캡션 "29일차, 월요일 아침." 확인 후 Space로 끝까지 → **엔딩 크레딧 →** → 크레딧 종료 → 상점.
3. 상점 홀 벽의 액자 확인 후 스크린샷.
4. 새로고침 → **이어서 하기** → 액자 재확인.
**기대 결과**: 벽에 `.wall-frame` "마라판다의 맛 · 전수증" / "마라판다 주인장" + 발바닥 SVG + 금색 **완납** 판. 새로고침 후에도 유지. 엔딩이 다시 재생되지 않음.
**합격 기준**: 액자·완납 판 존재, 리로드 후 동일, 엔딩 재진입 없음.
**스크린샷**: `C-14_wall-frame-paid_1280x720.png`
**실제 결과**:
**Pass/Fail**:

---

## C-15 — 1024×640 전 컷 레이아웃 회귀 (오프닝)

**사전 조건**: P0, 개발 서버, 창 **1024×640** (뷰포트 기준; DevTools 디바이스 툴바 사용 시 1024×640 지정).
**단계**:
1. 새 게임 → C-02~C-11의 모든 라인을 Space로 진행 (생성 화면 포함, 이름 `마라QA`).
2. 각 컷 첫 라인과 가장 긴 라인에서 L1–L3 콘솔 체크 실행:
   ```js
   const d = document.querySelector('.dialogue').getBoundingClientRect(), t = document.querySelector('.dialogue p').getBoundingClientRect(), a = document.querySelector('.opening-illustration').getBoundingClientRect(); ({ textInBox: t.top >= d.top && t.bottom <= d.bottom && t.left >= d.left && t.right <= d.right, noScroll: document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth, artVisible: a.top >= 0 && a.left >= 0 && a.bottom <= innerHeight && a.right <= innerWidth })
   ```
   필수 확인 라인: office L1, notice L2(안내문), notice L5, takeover L3, takeover L6.
**기대 결과**: 모든 확인 라인에서 세 값 모두 `true`. 대사 박스가 삽화를 가리지 않음. scene-dots/건너뛰기 버튼이 뷰포트 안.
**합격 기준**: 검사한 모든 라인 `{true, true, true}`.
**스크린샷**: `C-15_office-L1_1024x640.png`, `C-15_notice-L2_1024x640.png`, `C-15_offer-L5_1024x640.png`, `C-15_apron-L3_1024x640.png`, `C-15_alone-L6_1024x640.png`, `C-15_create_1024x640.png`
**실제 결과**:
**Pass/Fail**:

---

## C-16 — 1024×640 전수증 장면 레이아웃

**사전 조건**: 개발 서버, 1024×640, 게임 진행 중.
**단계**: 🎬 엔딩 보기 → C-13 단계 2–3 반복, step 0/1/4/6에서 C-15의 콘솔 체크 실행 (`.opening-illustration` 셀렉터 동일).
**기대 결과**: 모든 step `{true, true, true}`, "권리금 완납" 뱃지가 삽화 안에 위치, 증서 도장이 잘리지 않음, **계속 →** 버튼이 뷰포트 안.
**합격 기준**: 검사 step 전부 true.
**스크린샷**: `C-16_ending-S1_1024x640.png`, `C-16_certificate-S4_1024x640.png`, `C-16_ending-S6_1024x640.png`
**실제 결과**:
**Pass/Fail**:

---

## C-17 — 콘솔 오류 0 / 404 0 (개발 서버 전체 흐름)

**사전 조건**: P0, 개발 서버, Console·Network Preserve log 켬.
**단계**:
1. 새 게임 → 오프닝 전 라인 → 생성 → 1일차 → 🎬 엔딩 보기 → 엔딩 → 예고 → 크레딧 → 상점까지 진행.
2. Console 레벨 "Errors"만 필터해 개수 기록.
3. Network를 Status 기준 정렬해 4xx/5xx 개수 기록. 또는 콘솔: `performance.getEntriesByType('resource').filter(e => e.responseStatus >= 400).map(e => e.name)`.
4. 다음 파일이 모두 200(또는 캐시)인지 확인: `opening-approved/01-office.png, 02-regular.png, 05-apron.png, 06-alone.png, 07-open.png, rain-background.png, layers/reading.png, layers/talk-protagonist.png, layers/talk-panda.png`, `story-v2/ending/01-ledger.png, 02-settlement.png, 08-certificate.png`.
**기대 결과**: 콘솔 error 0, 4xx/5xx 0. `opening-approved/03-notice.png`·`04-offer.png` 요청은 **없어야 함**(레이어 합성이므로 파일 자체가 존재하지 않음).
**합격 기준**: error = 0, 404 = 0, 03-notice.png/04-offer.png 요청 0.
**스크린샷**: `C-17_console-network_dev.png`
**실제 결과**:
**Pass/Fail**:

---

## C-18 — 출시 빌드: 오프닝 전 컷 + 누락 에셋 없음

**사전 조건**: 출시 빌드 http://localhost:8131/self-serve.html, P0(8131 origin에서 clear), 1280×720. DEV 바가 **없는지** 먼저 확인.
**단계**:
1. 새 게임 → C-02~C-11 전 라인 진행 (대사는 C-02~C-11 표와 동일해야 함).
2. C-01 측정 스크립트로 첫 삽화 지연을 한 번 측정·기록.
3. C-17 3–4단계로 오류/404 확인 (오프닝 에셋 9개).
4. 출시 빌드가 제외하는 초안 경로(`img/opening/`, `img/ending/`, `img/story-v2/opening/`)에 대한 요청이 하나도 없는지 확인.
**기대 결과**: 모든 컷 표시, 대사 개발 서버와 동일, error 0, 404 0, 초안 경로 요청 0.
**합격 기준**: 위 네 조건 모두 참.
**스크린샷**: `C-18_release-offer-L4_1280x720.png`, `C-18_release-open-L7_1280x720.png`, `C-18_release-network.png`
**실제 결과**:
**Pass/Fail**:

---

## C-19 — 출시 빌드: 전수증 장면 (세이브 주입)

**사전 조건**: 출시 빌드(DEV 바 없음). C-18 진행으로 1일차 상점까지 가서 세이브가 한 번 저장된 상태 (1일차 영업 후 **상점으로** 클릭 시 저장).
**단계**:
1. 콘솔에서 세이브를 28일차 일요일로 바꾼다:
   ```js
   const k = 'maratang-selfserve-save-v1', d = JSON.parse(localStorage.getItem(k)); Object.assign(d, { day: 28, phase: 'sunday', premiumLeft: 0, premiumCarry: 0, endingSeen: false, premiumPaidInFull: false, part2TeaserSeen: false, rentOverdue: 0, ledger: { weekRevenue: 500000, rentDue: 0, rentPaid: true, bankrupt: false, premiumDue: 0, premiumPaid: 0, premiumSettled: true } }); localStorage.setItem(k, JSON.stringify(d))
   ```
   (필드 이름은 개발 서버에서 🎬 엔딩 보기 직후 상태를 저장한 세이브와 비교해 맞출 것)
2. 새로고침 → **이어서 하기** → 일요일 마지막 비트에서 Space → 엔딩 step 0–6 진행.
3. step 4에서 스크린샷.
**기대 결과**: C-13 표와 동일한 7개 step(완납 분기), step 4에서 08-certificate.png, 404 0.
**합격 기준**: C-13 합격 기준과 동일 + `story-v2/ending/*.png` 3종 200.
**스크린샷**: `C-19_release-certificate-S4_1280x720.png`
**실제 결과**:
**Pass/Fail**:

---

## C-20 — 전수증 장면 (미완납/탕감 분기) — 조건부

**사전 조건**: 개발 서버, 1280×720, 세이브가 존재하는 진행 중 게임.
**단계**:
1. C-19 1단계 스크립트에서 `premiumLeft: 300000`(0 초과 아무 값), `premiumSettled: false`, `premiumDue: 100000`, `premiumPaid: 0` 으로 바꿔 주입.
2. 새로고침 → 이어서 하기 → 일요일 마지막 비트 → Space → 엔딩 step 0–6 진행, 매 step 스크린샷.
**기대 결과**:

| step | 화자 | 대사 (탕감 분기) | 삽화 | 완납 뱃지 |
|---|---|---|---|---|
| 0 | (caption) | 28일차, 일요일 저녁. | 01-ledger | 없음 |
| 1 | 판다 사장님 | 장부 봤어. 조금 남았네. | 02-settlement | **없음** |
| 2 | 마라QA | 죄송해요… 조금만 더 시간을 주시면— | 02-settlement | 없음 |
| 3 | 판다 사장님 | 됐어. 나머지는 그동안 손님들한테 내준 한 그릇으로 받았다 치자. …이제 네 가게구나. | 02-settlement | 없음 |
| 4 | 판다 사장님 | 이젠 마라 맛 전수증을 넘겨줄게. 잘 보이는 데 걸어 둬. | 08-certificate | 없음 |
| 5 | 마라QA | 감사합니다. 앞으로도 잘해 나갈게요! | 08-certificate | 없음 |
| 6 | (caption) | 마라부자 1부 — 끝 | 08-certificate | 없음 |

- step 3은 전체 대사 중 가장 긴 문장 → 1280×720과 1024×640 **둘 다** L1 확인.
- 이후 상점 벽 액자에 **완납 판 없음**.
**합격 기준**: 표 일치, 뱃지 0, step 3 두 크기에서 textInBox = true, 벽 액자에 `.wall-plate` 없음.
**스크린샷**: `C-20_forgiven-S3_1280x720.png`, `C-20_forgiven-S3_1024x640.png`, `C-20_forgiven-S4_1280x720.png`, `C-20_wall-frame-forgiven_1280x720.png`
**실제 결과**:
**Pass/Fail**:

---

## 결과 요약표 (실행 후 기입)

| ID | 이름 | 창 크기 | 빌드 | Pass/Fail | 비고 |
|---|---|---|---|---|---|
| C-01 | 첫 삽화 지연 측정 | 1280×720 | dev | | 측정값: ___ ms (no-cache) / ___ ms (cache) |
| C-02 | 01-office | 1280×720 | dev | | |
| C-03 | 02-regular | 1280×720 | dev | | |
| C-04 | 03-notice 대사 | 1280×720 | dev | | |
| C-05 | 03-notice 레이어 정렬 | 둘 다 | dev | | |
| C-06 | 04-offer 대사 | 1280×720 | dev | | |
| C-07 | 04-offer 레이어 정렬 | 둘 다 | dev | | |
| C-08 | 캐릭터 생성 전환 | 1280×720 | dev | | |
| C-09 | 05-apron | 1280×720 | dev | | |
| C-10 | 06-alone | 1280×720 | dev | | |
| C-11 | 07-open → 1일차 | 1280×720 | dev | | |
| C-12 | 건너뛰기 | 1280×720 | dev | | |
| C-13 | 전수증 장면 (완납) | 1280×720 | dev | | |
| C-14 | 엔딩 후 벽 액자 | 1280×720 | dev | | |
| C-15 | 오프닝 1024×640 | 1024×640 | dev | | |
| C-16 | 전수증 1024×640 | 1024×640 | dev | | |
| C-17 | 콘솔/404 | 1280×720 | dev | | |
| C-18 | 출시 빌드 오프닝 | 1280×720 | release | | |
| C-19 | 출시 빌드 전수증 | 1280×720 | release | | |
| C-20 | 탕감 분기 (조건부) | 둘 다 | dev | | |
