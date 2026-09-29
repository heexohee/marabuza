# BUG-002 — 오프닝 삽화 전환 시 빈 상자가 보였다가 그림이 뚝 나타남 (비 오는 장면은 캐릭터가 배경보다 먼저 뜸)

> **스토리 유형**: Visual/Feel (삽화 전환 연출) + Logic (프리로드 목록 노출) · **증거 위치**: `production/qa/evidence/opening-approved/qa-2026-09-29/` (시각), `tests/unit/self-serve/` (프리로드 목록 회귀 테스트) · **게이트**: BLOCKING (Visual — 수정 후 retained screenshot 및 빈 상자 프레임 0 측정 필요)

## Bug Report

| 항목 | 값 |
|---|---|
| **ID** | BUG-002 |
| **제목** | 오프닝 삽화 전환 시 빈 상자가 보였다가 그림이 뚝 나타남 (비 오는 장면은 캐릭터가 배경보다 먼저 뜸) |
| **Severity** | S3 (Minor) — 플레이어에게 보이는 완성도 문제. 제안값, qa-lead 확정 필요 |
| **Priority** | P2 — 출시 전 수정 |
| **Status** | Fixed — Verified 2026-09-29 |
| **Frequency** | Always (각 삽화를 처음 볼 때마다 100%) |
| **Build** | 출시 빌드 `dist/` (localhost:8131) 및 dev 서버 — 브랜치 `chore/pre-release-qa`, 커밋 `90da7c5` |
| **Platform** | macOS (Darwin 25.5), 브라우저 실행, 창 크기 1280×720 |
| **발견** | 2026-09-29, 스모크 체크 중 사용자 보고 — "오프닝 씬 이미지 전환에서 약간 이미지 전환이 어색했어." 같은 날 Claude 가 chrome-devtools 로 측정·검증 |
| **보고 대상** | qa-lead → 개발 (연출 수치는 아트/디자인 확인) |

## 배경

오프닝은 19줄 대사 동안 삽화가 장면별로 바뀐다. 삽화 파일은 대부분 큰 PNG 이며, 비 오는 장면(03-notice → 04-offer)만 배경 판(plate) 위에 캐릭터 레이어를 겹치는 구조다.

| 삽화 | 파일 | 크기 |
|---|---|---|
| 01 사무실 | `01-office` | 2.0 MB |
| 02 단골 | `02-regular` | 1.8 MB |
| 03–04 비 오는 장면 (배경 판) | `img/opening-approved/rain-background.png` (1672×941, 화면 표시 폭 약 1000 px) | 4.0 MB |
| 03–04 비 오는 장면 (캐릭터) | `img/opening-approved/layers/*.png` | — |
| 05 앞치마 | `05-apron` | 1.9 MB |
| 06 혼자 | `06-alone` | 1.8 MB |
| 07 개업 | `07-open` | 1.8 MB |

오프닝의 나머지 항목은 모두 통과했다 — 19줄 전부 화자/대사 정확, 1280×720 · 1024×640 에서 넘침 없음, 캐스트 레이어 좌표 정확 (150,368,205 / 355,368,441 / reading 1070,447,198).

## Steps to Reproduce

1. 출시 빌드 `dist/` 를 로컬 서버로 연다 (예: localhost:8131). 캐시 없는 첫 실행 상태로 시작한다.
2. 창 크기를 1280×720 으로 맞춘다.
3. 타이틀에서 **새 게임** 을 누른다.
4. 오프닝 대사를 Space 로 한 줄씩 넘기며, 삽화가 바뀌는 줄에서 장면 상자를 관찰한다 (측정 시 Space 직후 requestAnimationFrame 으로 프레임별 `<img>` 준비 상태 샘플링).
5. 03-notice → 04-offer (비 오는 장면) 전환에서 배경 판과 캐릭터 레이어가 나타나는 순서를 관찰한다.

## Expected Behavior

- 삽화가 바뀔 때 빈 장면 상자(배경색 `#211b24`)가 한 프레임도 보이지 않는다.
- 새 그림은 이전 그림에서 부드럽게 넘어간다 (짧은 크로스페이드, `prefers-reduced-motion` 시에는 즉시 교체하되 빈 상자 없음).
- 레이어 장면에서는 배경 판이 캐릭터 레이어보다 먼저(또는 동시에) 보인다. 캐릭터가 빈 상자 위에 떠 있는 프레임이 없다.
- 첫 삽화는 새 게임을 누른 직후 지연 없이 보인다.

## Actual Behavior

| 상황 | 측정 결과 (로컬 서버, macOS, 1280×720) |
|---|---|
| 일반 삽화 전환 | 새 `<img>` 가 약 **30–40 ms** 준비되지 않아 빈 장면 상자(`#211b24`)가 보인 뒤, 페이드 없이 그림이 **뚝** 나타남 |
| 03-notice → 04-offer (레이어 장면) | 캐릭터 레이어 **25 ms**, 배경 판 **49 ms** 에 로드 완료 → 약 24 ms 동안 **캐릭터가 빈 상자 위에 떠 있는** 프레임 발생 |
| 첫 새 게임 (내장 미리보기 브라우저, 2026-09-28) | 첫 삽화가 약 **2 초** 늦게 나타남 |

위 수치는 로컬 서버 기준이다. 느린 PC, 느린 디스크, Steam 첫 실행에서는 더 나빠질 것으로 예상된다.

## Impact

- 오프닝은 플레이어가 게임에서 가장 먼저 보는 연출이라 첫인상에 직접 영향.
- 기능·진행에는 영향 없음 (대사·진행·레이아웃 정상) → S3.
- 레이어 장면의 "캐릭터가 먼저 뜨는" 프레임은 단순 지연보다 눈에 더 띄는 깨짐으로 보인다.
- **추정, 미측정**: 엔딩 삽화(`img/story-v2/ending`)도 같은 렌더 방식이라 동일 증상이 있을 가능성이 높다. 별도 측정 필요.

## 영향 파일 / 라인

| 파일 | 위치 | 내용 |
|---|---|---|
| `src/js/self-serve/story-ui.js` | `openingArtHtml()` | 대사 한 줄마다 HTML 재렌더로 삽화 `<img>` 를 새로 생성 (근본 원인) |
| `src/js/self-serve/story-ui.js` | (해당 없음 — 누락) | 다음 삽화 프리로드(`new Image()` / `decode()`) 없음, 크로스페이드 없음 |
| `src/img/opening-approved/rain-background.png` | — | 4.0 MB, 1672×941 — 표시 크기(약 1000 px 폭) 대비 과대 |
| `src/img/opening-approved/layers/*.png` | — | 배경 판보다 먼저 디코드되어 먼저 표시됨 |
| `src/img/story-v2/ending/` | — | 동일 패턴 추정 (미측정) |

## 수정 방향 제안 (미결정 — 개발/아트 선택)

| 안 | 내용 | 장점 | 단점 |
|---|---|---|---|
| A. 선로딩 | 새 게임 누를 때(또는 타이틀 대기 중) 오프닝 삽화 전부 `new Image()` + `decode()` | 빈 상자 대부분 제거, 구현 단순 | 첫 삽화 전 로딩 대기 발생 가능 (타이틀 중 로딩이면 완화) |
| B. 요소 유지 + decode 후 교체 | `<img>` 를 재생성하지 않고 유지, 새 src 를 `decode()` 완료 후에만 교체 | 어떤 환경에서도 빈 상자 0 보장 | 렌더 구조(HTML 재렌더) 일부 변경 필요 |
| C. 크로스페이드 | 약 150–200 ms 크로스페이드, `prefers-reduced-motion` 존중 | "뚝" 나타나는 느낌 제거 | 단독으로는 빈 상자 해결 안 됨 — A/B 와 병행 |
| D. 레이어 순서 보장 | 레이어 장면에서 배경 판 decode 완료 후 캐릭터 레이어 표시 | 캐릭터 부유 프레임 제거 | 레이어 장면 전용 처리 필요 |
| E. 에셋 경량화 (선택) | PNG 를 WebP 로 변환하거나 1280 px 폭으로 축소 | 로드·디코드 시간 전반 단축, 빌드 용량 감소 | 아트 승인 필요, 화질 확인 필요 |

권장 조합(QA 관점 제안): A 또는 B + C + D, E 는 여유 시.

## 회귀 테스트 제안 (수정 후)

1. **Unit (Logic, BLOCKING)** — `tests/unit/self-serve/opening_art_preload_test.js`
   - `test_opening_module_exposes_preload_urls_for_all_scenes` — 오프닝 모듈이 프리로드할 삽화 URL 목록을 노출하고, 19줄 전체에서 참조하는 모든 삽화(레이어 장면의 배경 판 + `layers/*.png` 포함)가 목록에 들어 있는지 확인.
   - `test_preload_list_has_no_duplicates_or_missing_files` — 중복 없음, 목록의 모든 경로가 빌드 산출물에 존재.
2. **Manual (Visual, BLOCKING)** — 캐시 없는 첫 실행, 1280×720 · 1024×640 에서 오프닝 전체를 Space 로 넘기며 rAF 샘플링:
   - 빈 장면 상자(`#211b24` 만 보이는) 프레임 **0**.
   - 03-notice → 04-offer 에서 배경 판 없이 캐릭터 레이어만 보이는 프레임 **0**.
   - 첫 삽화가 새 게임 직후 표시 (지연 기준값은 qa-lead 확정 필요).
   - `prefers-reduced-motion: reduce` 에뮬레이션에서 페이드 없이 즉시 교체되고 빈 상자 0.
   - 각 장면 retained screenshot 을 `production/qa/evidence/` 에 저장.
3. **추가 확인** — 엔딩 삽화(`img/story-v2/ending`) 전환에 동일 측정 수행 (현재 미측정).
4. **회귀 범위** — 오프닝 19줄 화자/대사, 1280×720 · 1024×640 넘침 없음(스크롤 금지), 캐스트 레이어 좌표 (150,368,205 / 355,368,441 / reading 1070,447,198) 가 그대로인지 재확인.

## 관련 스토리 / 문서

- 스모크 체크: `production/qa/smoke-2026-09-29.md`
- 증거: `production/qa/evidence/opening-approved/qa-2026-09-29/` (`1280x720-01-office.png` … `1280x720-07-open.png`, `1024x640-07-open.png`)
- 관련 커밋: `4d21415` (승인 삽화 및 공유 오프닝 레이어 적용), `90da7c5` (출시 빌드 삽화 초안 제외)
- 테스트 케이스: `production/qa/test-cases/opening-certificate-cases.md`

---

## Fix & Verification (2026-09-29)

**수정** (브랜치 `chore/pre-release-qa`) — 제안 A·C·D 채택, E(파일 축소)는 보류
- `src/js/self-serve/preload.js` (신규): `preloadImages(urls)` — `new Image()` + `decode()`, Image 객체를 세션 동안 보관해 디코딩된 그림이 메모리 캐시에 남음. 실패한 파일은 0으로 세고 게임을 멈추지 않음.
- `src/js/self-serve/story-ui.js`: `storyArtUrls()` — 오프닝·엔딩·2부 예고 그림 15장 목록(표에서 파생). 그림이 **바뀌는 줄에서만** `.art-enter`(이전 그림을 상자 배경으로 깔고 새 그림 0.2초 페이드인), 비 오는 03→04처럼 배경이 같으면 `.cast-enter`(캐릭터만 페이드). 엔딩·예고에도 같은 규칙.
- `src/js/self-serve/main.js`: 타이틀이 떠 있는 동안 `preloadImages(storyArtUrls())`.
- `src/self-serve.css`: `.art-enter` / `.cast-enter` / `@keyframes art-in`, `prefers-reduced-motion`이면 페이드 없이 바로 전환.

**회귀 테스트**: `tests/unit/self-serve/story_art_test.mjs` 7개 — 수정 전 실패(모듈 없음) 확인 → 수정 후 통과. 전체 `npm test` 419/419.

**재측정** (출시 빌드 `dist/`, 캐시 끔, 1280×720, 타이틀 2초 대기 후 새 게임 → 대사 9줄, rAF 샘플링)
- 타이틀 동안 스토리 그림 15장 미리 불러옴
- 빈 상자(이미지 미완료) 프레임: **0** (수정 전 전환마다 30–40 ms)
- 그림이 바뀌는 줄: 0.2초 페이드인(불투명도 0→1, 약 180 ms), 같은 그림 줄: 페이드 없음
- 03→04: 배경 불투명도 1.0 유지, 캐릭터만 페이드 — 캐릭터만 떠 있는 프레임 없음

**남은 것**: 저사양 PC·첫 실행에서 새 게임을 타이틀 직후 곧바로 누르면 첫 그림이 아직 디코딩 중일 수 있음(페이드인이 가려 줌). 파일 축소(WebP·1280폭)는 필요 시 별도 작업.
