# QA 전략 — 셀프 담기 1부(1~28일) 델타 회귀 사이클

**날짜**: 2026-09-28 · **작성**: qa-lead
**브랜치**: `chore/pre-release-qa` · **HEAD**: `90da7c5`
**기준선**: `production/qa/qa-signoff-part1-2026-09-27.md` (커밋 `7e78f3a`, APPROVED WITH CONDITIONS). BUG-001은 그 뒤 Fixed/Verified — 이번 사이클 열린 버그 0건에서 시작.
**범위**: 셀프 담기 1부(1~28일)만. 레거시 "사장이 담기"(`src/index.html`)는 범위 밖. 밤 타이틀(기본값)은 출시 대상이 아니므로 "여전히 기본값이 밤"이라는 사실만 기록하고 그 외는 범위 밖 — 출시 타이틀은 낮 타이틀(`?title=day`, `src/js/self-serve/title-day.js`).
**범위 안 커밋** (`7e78f3a..HEAD`, 15개): da15e29, 967add4, 09ed8fb, a74a6c8, 7e65c75, e532d8d, a492588, 2b1f9f8, 4f24df0, 31118a7, 6c0e7a1, 4d21415, b4f7016, bbca177, 90da7c5

---

## 1. 분류표

| 항목 | 유형 | 자동 테스트 | 수동 필요 | 블로커? |
|---|---|---|---|---|
| 1. 데스크톱 Electron 포장 (`desktop/main.cjs`, `app://`) | Integration | ✅ `tests/unit/desktop/app_path_test.mjs` (app:// 경로 제한, 4건) | **예 — 이미 실행됨**: `npm run desktop` / `npm run desktop:pack` 로 실행 기록이 `production/qa/evidence/desktop/desktop-evidence.md`에 있음(타이틀→1일차→저장/재시작, 개발 바 없음, 포장 앱 294MB). **커밋 90da7c5(삽화 초안 제외) 이후 포장본은 재확인 안 됨** — dist 크기가 69MB→28MB로 바뀌었는데 그 이후 `npm run desktop:pack`을 다시 돌린 기록이 없다 | 아니오 (기존 증거 유효, 재확인은 세션 A에서 짧게) |
| 2. 데스크톱 저장 파일화 (스팀 Auto-Cloud 준비) | Logic | ✅ `tests/unit/desktop/save_file_test.mjs` (원자적 쓰기, 키 검증), `tests/unit/self-serve/save_store_test.mjs` | 이미 실행됨 — `save-file-resumed.png`, `packaged-save-file-resumed.png` | 아니오 |
| 3. 판다 사장 + 커스텀 동물 대기열 초상화 | Visual/Feel | ✅ `tests/unit/self-serve/animal_faces_test.mjs` (PNG 크기/알파, 판다는 손님 풀에서 제외) | 스크린샷 있음 (`evidence/animal-queue/queue.png`, `evidence/panda-owner-a/opening.png`) — **리드 사인오프 표 없음** | **예** — Visual/Feel BLOCKING 게이트, 사인오프 미기재 |
| 4. 착석 손님 + 파스텔 가구 스프라이트 | Visual/Feel | 부분 — `animal_faces_test.mjs`(DOM 구조: 턱받이 클래스, 앞발 2개)는 마크업만 검증, 픽셀 외관은 안 봄 | 스크린샷 다수 있음 (`evidence/seated-customers/*.png`, README에 "최종 승인 반영" 기록) — **명시적 리드 사인오프 표는 없음** | **예** — 사인오프 표 없음 |
| 5. 엔딩 순서 재배치 (2부 예고→크레딧→29일 준비) + 개발 모드 "엔딩 보기" + 크레딧 로고 | Integration | ✅ `tests/unit/self-serve/dev_ending_test.mjs`, `tests/integration/part1/part2_teaser_test.mjs`, `tests/unit/self-serve/credits_test.mjs` | 스크린샷 있음 (`evidence/ending-scene/*.png`, `evidence/part2-teaser/*.png`) | 아니오 |
| 6. 엔딩 예고에 전신 토끼 그림 | Visual/Feel | 간접 — `part2_teaser_test.mjs`는 스텝 진행 로직만, 그림 자체는 검증 안 함 | 스크린샷 있음 (`evidence/ending-illustrations/rabbit-preview.png`) — 리드 사인오프 표 없음 | **예** — 사인오프 표 없음 |
| 7. 낮 타이틀 장면 (`?title=day`) | UI | ✅ `tests/unit/self-serve/title_day_test.mjs` (7건 — sway/gust 경계, `titleSceneName` 쿼리 분기) | 스크린샷 2장 + 실기 12초 관찰 기록 있음 (`evidence/title-day/`) | 아니오 (증거 충족) |
| 8. 오프닝 + 증서 인수인계 대사 텍스트 | UI | — (대사 텍스트는 전용 테스트 없음, `story_test.mjs`는 단골 스케줄만 다룸) | 스크린샷 **1장뿐** (`evidence/opening-approved/dialogue.png`) — 오프닝 전체 흐름(증서 인수인계 포함 여러 컷)을 한 장으로 대표하기엔 부족 | **예** — UI BLOCKING, 화면당 스크린샷 요구를 다 못 채움 |
| 9. 승인된 스토리 삽화 + 공용 오프닝 레이어 적용 | Visual/Feel | ✅ `release_build_test.mjs`(참조 안 되는 이미지 폴더 없음 — 간접) | 스크린샷 있음 (`evidence/story-v2/*.png`, `evidence/opening-approved/dialogue.png`) | 항목 8과 중복 — 8에서 이미 블로커 처리 |
| 10. 일자 전환 달력(스킵 가능 애니메이션) | UI | ✅ `tests/unit/self-serve/day_intro_test.mjs` (요일 계산, 일요일/28일 특수 문구, 표시 조건) | 스크린샷 있음 (`evidence/day-intro/01·02.png`) | 아니오 |
| 11. 경쟁 매장 노출 뒤 토끼 고용 결정 | UI | **없음** — `story-ui.js`는 어떤 테스트에서도 import되지 않음. `part2_teaser_test.mjs`는 로직(`advanceTeaser`/스텝 카운트)만 검증, 고용 분기 대사·그림 선택(`04-rabbit`/`05-franchise`/`06-hiring-pose-overlay`)은 미검증 | **없음** — 관련 스크린샷 못 찾음 (`ending-scene`/`part2-teaser` 폴더에 고용 결정 컷이 있는지 파일명만으로 불명확) | **예** — UI BLOCKING, 자동 테스트도 스크린샷도 없음 |
| 12. 출시 빌드 삽화 초안 제외 + 세로 창 타이틀 잘림 수정 | Config/Data (제외 로직) + Visual/Feel (잘림 수정) | ✅ 제외 로직: `release_build_test.mjs::test_release_build_ships_only_image_folders_the_game_code_references` | 잘림 수정은 CSS 전용, 자동 테스트 없음. 기지식(known facts)의 "800×1000에서 스크롤 없음"은 이 커밋 **이전에 확인된 사실**로 보이며 낮 타이틀(`?title=day`)로 재현했는지 불명 | **예** (잘림 수정 부분만) — 세로로 아주 긴 창(예 600×1200)에서 간판이 안 잘리는지 낮 타이틀로 직접 본 기록 없음 |

**분류 근거**: 6·11은 "본 게임 안 다이얼로그·일러스트 연출"이라 Visual/Feel·UI 경계에 걸치지만, 게임 로직 상태 전이(스텝 카운트)는 Integration으로 이미 테스트되어 있고 남은 것은 "무엇이 보이는가"이므로 UI/Visual 쪽 증거 요구를 적용했다.

---

## 2. 스모크 검증

**판정: UNKNOWN (재실행 필요) — 근거 문서가 이번 범위 커밋을 다 반영하지 않음**

- 출처: `production/qa/smoke-2026-09-27.md` — PASS (374/374, 구버전 빌드). **이 세션 범위 안 15개 커밋 중 다수(항목 3~12)가 이 스모크 이후 커밋**이라 근거로 쓸 수 없다.
- 이번 세션에 확인된 최신 사실(자동 테스트): `npm test` **412/412 pass, 0 fail** — 이건 최신 HEAD 기준으로 유효.
- 이미 알려진 빌드 확인(오늘 세션): 출시 빌드 동작, `dist/`에서 `IS_RELEASE` 정상 전환, `dist/`에 개발 바 없음(`?dev`에도), 타이틀→오프닝 콘솔 오류 0·404 0·깨진 이미지 0, 4개 창 크기(960×600, 1024×768, 1920×1080, 800×1000)에서 스크롤 없음.
- **하지만 자동 테스트 통과 + 개별 known facts만으로는 `/smoke-check` 정식 실행을 대체할 수 없다.** 특히 커밋 90da7c5(드래프트 제외 + 세로 창 수정) 이후 정식 스모크가 한 번도 안 돌았다.
- **결론**: 수동 QA 인계 전 `/smoke-check`를 **현재 HEAD(`90da7c5`) 기준 `dist/`에 대해 재실행**해야 한다. 그 전까지 이 사이클의 스모크 상태는 PASS로 선언할 수 없다.

---

## 3. 블로커

| # | 내용 | 관련 항목 | 심각도 |
|---|---|---|---|
| B1 | `/smoke-check` 미재실행 (90da7c5 기준) | 스모크 전체 | 수동 QA 인계 전 필수 |
| B2 | 항목 11 "경쟁 매장 노출 뒤 토끼 고용 결정" — 자동 테스트도 스크린샷도 없음. UI BLOCKING 게이트 미충족 | 11 | BLOCKING |
| B3 | 항목 8 "오프닝+증서 인수인계 대사" — 스크린샷 1장뿐, 여러 컷 중 일부만 증거화됨 | 8 | BLOCKING |
| B4 | 항목 3·4·6 Visual/Feel — 스크린샷은 있으나 **리드(아트/디자인) 사인오프 표가 없음**. 지난 사이클(shop-growth/001·007)과 동일한 패턴 | 3, 4, 6 | BLOCKING (Done 게이트 기준, 이번 QA 사이클 자체는 진행 가능) |
| B5 | 항목 1·12 — 커밋 90da7c5 이후 데스크톱 포장본 재검증 안 됨, 세로로 아주 긴 창에서 낮 타이틀 잘림 미확인 | 1, 12 | 세션에서 해소 가능 (짧은 재확인) |
| C1 (참고) | 항목 9는 항목 8과 증거가 겹쳐 있어 8이 풀리면 자동으로 같이 풀림 — 별도 블로커로 세지 않음 | 8, 9 | — |

---

## 4. 수동 세션 계획

드라이버: Claude가 개발 서버(`npm start` 등, dev bar: 하루 자동/6일 자동/+10만/엔딩 보기)로 브라우저 조작. 데스크톱 항목은 Electron 실행 필요(아래 세션 A).

### 세션 A — 데스크톱 + 출시 빌드 재확인 (B1, B5)
1. `/smoke-check` 실행 — HEAD `90da7c5` 기준 `dist/` 빌드로 재실행, PASS 확인.
2. `npm run desktop:pack` 재실행(90da7c5 이후) → 포장 앱 크기 확인(28MB 기준 dist 반영됐는지), 타이틀→1일차→저장/재시작 짧게 재확인, 스크린샷 1장 갱신.
3. 세로로 아주 긴 창(예 600×1200)에서 `self-serve.html?title=day` 열어 간판(로고)이 잘리지 않고 위아래가 그림 가장자리 색으로 채워지는지 육안 확인, 스크린샷 저장.
4. (선택) `npm run desktop`에서 같은 세로 비율 창 크기 확인 — Electron 창은 최소 960×600 고정이라 해당 없으면 생략 기록.

### 세션 B — 항목 11 토끼 고용 결정 (B2)
1. 개발 바 "엔딩 보기"로 28일 엔딩 진입 → 2부 예고 진행 → 고용 결정 분기(`hiring` step) 화면 캡처.
2. 고용 전(`04-rabbit`, 알바 지원자 대사) / 경쟁 매장 노출(`05-franchise`, 배너) / 고용 결정(`hiring`, `06-hiring-pose-overlay`) 3컷 각각 스크린샷.
3. 대사 텍스트가 각 분기에서 올바르게 갈리는지(알바 지원 → 경쟁 매장 발견 → 함께 일하기로 결심) 육안 확인, 오류 0 확인.
4. 결과를 `production/qa/evidence/rabbit-hiring/`에 저장 제안(신규 폴더).

### 세션 C — 오프닝 + 증서 대사 전체 컷 (B3)
1. 새 게임 시작 → 오프닝 전체 시퀀스(캐릭터 생성 전후) 진행하며 각 대사 컷마다 스크린샷.
2. 증서 인수인계 장면 별도 캡처(다이얼로그 텍스트 포함).
3. 두 창 크기(1024×640, 1280×720)에서 텍스트 넘침·스크롤 없는지 확인.
4. `production/qa/evidence/opening-approved/`에 컷별로 추가 저장.

### 세션 D — Visual/Feel 리드 사인오프 수합 (B4, 승인 절차이므로 세션이라기보다 후속 조치)
1. `evidence/animal-queue/`, `evidence/panda-owner-a/`, `evidence/seated-customers/`, `evidence/ending-illustrations/`에 지난 사이클(`shop-cross-section-evidence.md`)과 같은 형식의 Sign-off 표를 추가.
2. 아트/디자인 리드에게 이름·날짜·승인 여부 기재 요청.

---

## 5. 참고

- 항목 5(엔딩 순서 재배치)·10(일자 전환 달력)·7(낮 타이틀)·2(저장 파일화)는 자동 테스트 + 기존 증거로 충분 — 이번 사이클에서 재작업 불필요.
- `tests/unit/self-serve/animal_faces_test.mjs`는 판다가 손님 풀에서 제외됐는지까지 검증해 항목 3(판다 사장 초상화)의 로직 부분은 강하게 커버됨. 남은 건 순수 시각적 사인오프뿐.
- 이번 전략은 스토리별 Done 게이트가 아니라 **QA 사이클** 통과 여부를 다룬다 — B4(사인오프 누락)는 QA 사이클 자체를 막지 않지만 해당 스토리의 Done 처리는 막는다(코딩 표준 §Testing Standards).
