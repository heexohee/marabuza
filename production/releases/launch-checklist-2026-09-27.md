# Launch Checklist: 마라부자 (Steam)
Target Launch: **미정** — 1부(28일) 완성 후 확정
Generated: 2026-09-27
Scope: `platform.cert_tier: steam` · `rigor: minimal` · 1인 개발 · 싱글 플레이, 서버 없음
Build under review: 셀프 담기 흐름 (`src/self-serve.html`, `src/js/self-serve/`) — 레거시 사장님 담기 흐름(`src/index.html`)은 출시 대상 아님 (`docs/flows.md`)

`[?]` = not assessed — the input to this check was absent

**범위에서 뺀 섹션**: 서버·자동 확장·DDoS·안티치트·멀티플레이 스트레스(서버 없는 싱글 게임), 콘솔 인증(TRC/Lotcheck — cert_tier가 steam), 72시간 대기 당번·워룸(1인 개발 minimal). 클라우드 저장은 카카오/Supabase를 중단하고 스팀 클라우드로 간다(2026-09-27).

---

## 1. Code Readiness

### Build Health
- [x] 유닛·통합 테스트 전부 통과 — `node --test` 412/412 (2026-09-28 갱신)
- [x] **데스크톱 앱 포장** (Electron) — `npm run desktop` / `npm run desktop:pack` → `out/desktop/` (맥 arm64 확인, 2026-09-27, `production/qa/evidence/desktop/`). 남은 것: 윈도우 빌드 확인, 아이콘, 코드 서명
- [ ] 포장된 빌드가 윈도우 · macOS(선택) · 스팀 덱(선택)에서 깨끗하게 실행
- [x] 빌드 크기 확인 — 맥 arm64 앱 294MB (대부분 Electron 런타임, 게임 app.asar 2.9MB). 윈도우는 빌드 후 측정
  - [x] 출시 빌드 dist/ 69MB → 28MB (2026-09-28) — git 밖 삽화 초안 폴더(`img/ending`·`img/opening`·`img/story-v2/opening`)가 통째로 복사되던 것을 `release.mjs` 제외 목록에 추가. 코드가 참조하지 않는 이미지 폴더가 출시 빌드에 들어가면 실패하는 테스트 추가 (`release_build_test.mjs`)
- [ ] 빌드 버전 표기와 git 태그 — 타이틀에 "v0.1" 표기만 있음
- [ ] 장시간 플레이(28일 + 2부 루프) 메모리·프레임 확인 — `[?]` 측정한 적 없음

### Code Quality (scanned 27 files in `src/` — .js/.html/.css, cloud-config 제외)
- [x] TODO 0 · FIXME 0 · HACK 0
- [x] `console.*` 디버그 출력 0
- [x] **개발 모드 끄기** ⛔ — 출시 빌드 `node tools/release/release.mjs` → dist/ (`src/js/build-flags.js` IS_RELEASE=true면 localhost·`?dev`여도 개발 바 없음, 2026-09-27). 포장 앱은 dist/를 담을 것
- [x] 레거시 흐름 링크 정리 — 설정 링크 제거(#11), 출시 빌드는 `index.html`을 빼고 만듦 (2026-09-27)
- [x] 하드코딩된 테스트 계정·키 없음 (cloud-config.js는 git 제외, 출시 대상 아님)
- [ ] 크래시·오류 보고 (선택) — 없음

### Security / Privacy
- [x] 소스에 API 키·비밀번호 없음
- [ ] 개인정보 처리방침 — 수집 데이터 없음을 명시한 한 장짜리라도 필요(스팀 상점 요구 시)

---

## 2. Content Readiness

### 1부 콘텐츠 — 설계: `design/quick-specs/part1-28-days-2026-09-27.md` (승인 2026-09-27)
- [x] **E004 개정** — 권리금 4주 분할 + 이월 + 28일차 엔딩(완납/탕감), 엔딩 배경 = 내 가게 인테리어 단계, 홀 벽 액자 (남은 것: 액자 도트 그림 — 비차단)
- [x] **N001** 4–28일차 날짜별 아침 한마디 (2026-09-27)
- [x] **N002** 단골(너구리·토끼·곰) 방문 (2026-09-27)
- [x] **N003** 29일차 2부 예고 — 토끼 "여기서 일해도 돼요?"(알바) + 맞은편 프랜차이즈 "오픈 예정" (2026-09-27)
- [x] **B001** 28일 봇 시뮬레이션으로 권리금 총액 확정 — P 10D · 시작 50만 · 손님 증가 0.1 (2026-09-27)
- [ ] 진행 중 스토리 마무리: economy E001·E003, shop-growth 001·005·007, side-menu 001 (코드 리뷰 → 완료 처리)
- [ ] 1–28일 처음부터 끝까지 사람 플레이테스트 1회 이상

### Assets
- [x] **이모지 대체 그림** — 도트 스프라이트(동물·재료·아이콘)는 이제 게임에 내장한 Noto 이모지 PNG 78개(`src/img/emoji/`, Apache-2.0)를 도트화. 기기 이모지 글꼴은 목록에 없는 이모지에만 쓰는 예비. 새 이모지를 코드에 넣으면 `node tools/art/bundle_emoji.mjs <emoji-datasource-google 폴더>` 다시 실행. 증거: `production/qa/evidence/offline-assets-evidence.md`
  - [x] 글자 속 이모지도 번들 도트 스프라이트로 (emoji-text.js, 2026-09-27 — 툴팁 속 이모지는 기기 글꼴 그대로)
- [x] **글꼴 내장** — Galmuri 2.40.3 중 쓰는 세 벌(Galmuri11 보통·굵게, Galmuri9)을 `src/fonts/`에 넣음(OFL 전문 동봉). 외부 요청 전부 막은 브라우저에서 글꼴 로드 확인
- [x] 임시 에셋 없음 — `placeholder|temp_|WIP_` 0건(입력칸 안내 문구 1건 제외), `src/img` 15개 중 임시 파일명 없음
- [x] **사운드** — 배경음악(화면별 곡)·징글·클릭 효과음 + 음소거·볼륨 설정 (b0541c8, 07f40a1). 음원 라이선스 표기는 Legal 항목에서

### Text and Localization
- [ ] 한국어 문구 교정
- [ ] **문구 외부화** — 대사·UI 문구가 JS 코드에 직접 들어 있음(`story.js`, `screens.js`, `ui.js`…). 번역하려면 문자열 테이블로 빼내기
- [ ] **영어 번역** (강력 권장 — 한국어만이면 시장이 크게 줄어듦) + 영어에서 글자 넘침 확인
- [ ] 영어·한국어 글꼴 커버리지 (Galmuri는 한글·라틴 지원)
- [x] 크레딧 — 설정 → 엔딩 크레딧 (Galmuri OFL · Noto Emoji Apache-2.0 표기 포함, 2026-09-27)

### Game Content
- [ ] 튜토리얼 흐름 — 오프닝 4장 + 1–3일차 판다 팁 있음, 처음 하는 사람 대상 테스트 필요
- [~] **저장**: 데스크톱 앱은 파일 저장 완료 (`<userData>/saves/*.json`, 2026-09-28, `production/qa/evidence/desktop/desktop-evidence.md`) — 남은 것: Steamworks에서 Auto-Cloud 경로 설정(사람), 스팀 기기 간 동기화 확인 ⛔
- [ ] 도전과제 설계·구현 (예: 첫 완납, 인테리어 6단계, 계산 완벽한 하루, 28일 엔딩)
- [x] 엔딩 시퀀스 (E004) — 크레딧 화면은 아직 없음(Text 항목의 크레딧과 함께)

---

## 3. Quality Assurance

### Testing
- [x] 자동 테스트 412개 통과 (2026-09-28)
- [ ] 1부 전체 회귀 QA (`/team-qa`) — 마지막 QA 2026-09-25는 레거시 흐름 대상
- [x] 스모크 체크 보고서 — `production/qa/smoke-2026-09-27.md` PASS (출시 빌드 dist/, 374 테스트)
- [ ] S1·S2 버그 0 — `[?]` 버그 트래커 없음(`production/qa/bugs/` 비어 있음)
- [ ] 저장소 가득 참·강제 종료 후 저장 복구 확인
- [x] 출시 빌드 점검 (2026-09-28, 브랜치 `chore/pre-release-qa`) — `?dev`여도 개발 바 없음, 타이틀→오프닝 콘솔 오류·404·깨진 이미지 0, 960×600·1024×768·1920×1080에서 스크롤 없음. 소스(개발) 빌드는 localhost에서 개발 바 4버튼 그대로
- [x] **세로로 긴 창에서 타이틀 잘림** (2026-09-28 발견·수정) — 타이틀 그림이 창 높이에 맞춰 확대돼 좌우가 잘리며 "마라부자" 간판이 반쯤 사라짐. 창이 무대(1280×884)보다 좁은 비율이면 그림을 무대 모양 띠에 맞추고 위아래를 그림 가장자리 색(하늘·바닥)으로 채우도록 `self-serve.css` 수정. 밤·낮 타이틀 960×1200, 1280×800, 1920×1080 확인 — 가로 창은 이전과 동일, 스크롤 없음
- [ ] 새 게임 직후 첫 오프닝 삽화가 약 2초 검은 화면 뒤 표시 — 페이드 연출인지 로딩인지 확인 필요 (삽화 PNG 장당 약 2MB)

### Platform Certification — Steam
- [ ] Steamworks SDK 연동 (Electron: `steamworks.js` 등) — 도전과제·클라우드·오버레이
- [ ] 상점 페이지: 캡슐 이미지 5종, 스크린샷 5장+, 트레일러 30–60초, 짧은·긴 소개, 태그
- [ ] 시스템 요구사항 (포장 후 측정)
- [ ] 디포 빌드 업로드 → 새 계정에서 깨끗하게 설치·실행
- [ ] 도전과제 작동
- [ ] 스팀 콘텐츠 규칙·성인 콘텐츠 설문 (해당 없음 확인)
- [ ] 스팀 덱 호환(선택): 1280×800 고정 무대가 이미 맞음, 컨트롤러 조작은 없음

### Every tier
- [ ] 접근성 최소 기준 — `prefers-reduced-motion` 지원 있음. 글자 크기·색약 모드 없음

### Performance
- [ ] 저사양 PC에서 60fps (포장 후) — `[?]`
- [ ] 로딩 시간 — `[?]`

---

## 4. Store and Distribution

### 행정
- [ ] 스팀 파트너 가입 + 등록비(Steam Direct, 게임당) — 결제 후 출시까지 최소 대기 기간 있음
- [ ] 세금 정보(W-8BEN 등)·정산 계좌 등록
- [ ] 한국 게임 등급 분류 확인 (스팀 자체등급 적용 여부)

### Store Pages
- [ ] **"출시 예정" 상점 페이지 조기 공개** — 찜(위시리스트) 모으기. 출시 최소 2주 전 공개가 필수, 실제로는 수개월 전 권장
- [ ] 가격 설정 — 유료 한 번 구매 (인디 타이쿤 가격대 조사 후)
- [ ] **무료 체험판** (1주차 = 1–6일 + 첫 일요일 권장) + 넥스트 페스트 참가

### Legal
- [ ] EULA — 스팀 기본 EULA 사용 가능
- [ ] 서드파티 라이선스 표기 — Galmuri(OFL, `src/fonts/OFL-Galmuri.md`), Noto 이모지 그림(Apache-2.0, `src/img/emoji/LICENSE-Noto.txt`), Electron/Tauri(MIT) — 파일은 동봉됨, 게임 안 크레딧 표기는 아직
- [ ] 음악·효과음 라이선스 (사운드 결정 후)
- [ ] 상표 확인 — "마라부자" 이름 검색

---

## 5. Infrastructure

생략 — 서버 없는 싱글 플레이. 분석(analytics)도 수집하지 않으면 개인정보 처리방침이 단순해짐.

---

## 6. Community and Marketing
- [ ] 소개 짤(GIF)·트레일러 — 셀프 담기 → 뒤적이기 → 계산 → 서빙 한 사이클
- [ ] SNS·디스코드 등 소통 채널 1곳
- [ ] 출시 공지·패치 노트 초안
- [ ] 2부 로드맵 공개 문구 ("1부 완결 + 2부: 알바와 맞은편 프랜차이즈")

---

## 7. Operations (1인 개발 최소)
- [ ] 출시 후 긴급 패치 절차 (빌드 → 디포 업로드 → 기본 브랜치 설정) 한 번 연습
- [ ] 알려진 문제·FAQ 페이지

---

## Go / No-Go Decision

**Overall Status**: **NOT READY** (출시일 미정 — 준비 단계) · 2026-09-28 출시 빌드 점검 반영 · 2026-09-27 갱신: 차단 14 → 7 (E004·N001·N002·N003·B001·이모지 그림·글꼴 내장 완료)

### Blocking Items (⛔ 14)
1. 데스크톱 앱 포장
2. 개발 모드 출시판에서 제거
3. ~~이모지 대체 그림 (기기마다 다르게 보임)~~ ✅
4. ~~글꼴 내장 (오프라인)~~ ✅
5. 파일 저장 + 스팀 클라우드
6. ~~E004 권리금 4주 분할 + 28일 엔딩~~ ✅
7. ~~N001 날짜별 아침 한마디~~ ✅
8. ~~N002 단골 방문~~ ✅
9. ~~N003 2부 예고~~ ✅
10. ~~B001 1부 밸런스~~ ✅
11. Steamworks 연동 (도전과제·클라우드)
12. 상점 페이지 재료 (캡슐·스크린샷·트레일러)
13. 스팀 파트너 가입·세금·계좌
14. 1부 전체 QA (`/smoke-check` + `/team-qa`)

### Conditional Items (결정 필요)
- 영어 번역: 출시 때 함께 / 출시 후 업데이트
- 체험판 범위와 넥스트 페스트 참가 시점

### 추천 순서
1. **1부 콘텐츠** (E004 → N001 → N002 → N003 → B001) — 게임 본체
2. **출시 기술 기반** — 데스크톱 포장 + 개발 모드 제거 + 파일 저장 (한 묶음)
3. ~~**이모지 대체 그림**~~ ✅ (Noto 내장)
4. **상점 페이지 "출시 예정" 공개** — 스크린샷이 나오는 즉시, 찜 모으기 시작
5. 스팀 기능(도전과제·클라우드) → 체험판 → QA → 출시일 확정

### Sign-Offs Required (1인 개발 — 같은 사람이 역할별로 확인)
- [ ] Creative Director — 1부 콘텐츠·엔딩
- [ ] Technical Director — 포장 빌드 안정성
- [ ] QA Lead — 1부 QA
- [ ] Producer — 일정
- [ ] Release Manager — 디포·상점 페이지
