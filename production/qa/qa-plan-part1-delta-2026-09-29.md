# QA 계획 — 1부 셀프 담기 변경분 회귀 (2026-09-29)

**브랜치**: `chore/pre-release-qa` · **기준 커밋**: `90da7c5` · **이전 사이클**: `qa-signoff-part1-2026-09-27.md` (`7e78f3a`, APPROVED WITH CONDITIONS)
**전략**: `production/qa/qa-strategy-part1-delta-2026-09-28.md` (스모크 UNKNOWN → 세션 A에서 해소)

> **정정 (2026-09-29, 사용자)**: 출시 타이틀은 **밤 타이틀**(기본값). 낮 타이틀 이미지(`?title=day`)는 쓰지 않으므로 범위 밖.
> 전략 문서의 "낮 타이틀을 출시 타이틀로 간주"는 이 계획이 대체한다.

## 범위
`7e78f3a` 이후 변경 항목 — 출시 빌드 `dist/` 기준, 빨리 넘기기는 개발 서버의 dev 바(하루 자동·6일 자동·+10만·엔딩 보기).

## 항목 분류
| # | 항목 | 유형 | 자동 테스트 | 수동 |
|---|---|---|---|---|
| 1 | 데스크톱 포장 | Integration | ✅ app_path_test | A — 90da7c5 이후 포장본 재확인 |
| 2 | 저장 파일화 | Logic | ✅ save_file/save_store_test | — |
| 3 | 판다·동물 초상화 | Visual/Feel | ✅ animal_faces_test | D — 사인오프 표 |
| 4 | 앉은 손님·가구 | Visual/Feel | 부분 | D — 사인오프 표 |
| 5 | 엔딩 순서·크레딧 | Integration | ✅ | — |
| 6 | 전신 토끼 예고 | Visual/Feel | 간접 | B 캡처 + D 사인오프 표 |
| 7 | 낮 타이틀 | — | — | **범위 밖 (출시 안 함)** |
| 8 | 오프닝·증서 대사 | UI | ❌ | C |
| 9 | 승인 삽화·레이어 | Visual/Feel | 간접 | C (8과 함께) |
| 10 | 일자 전환 달력 | UI | ✅ day_intro_test | — |
| 11 | 토끼 채용 결정 | UI | ❌ | B |
| 12 | 초안 제외 + 세로 창 타이틀 | Config/Data + Visual | ✅ release_build_test | A — 밤 타이틀 (960×1200 확인 2026-09-28, 600×1200 추가) |

## 자동 테스트
신규 작성 없음. `npm test` 412/412 기준, 세션 A의 `/smoke-check`로 재확인.

## 수동 세션 (드라이버: Claude, 브라우저 조작)
- **A** — `/smoke-check` 재실행 · `npm run desktop:pack` 재포장 → 크기·실행·저장 후 재시작 · 600×1200 밤 타이틀(간판 전체, 위아래 가장자리 색, 비·네온 모션 유지)
- **B** — 토끼 채용 결정 3컷: 알바 지원(`04-rabbit`) → 맞은편 프랜차이즈(`05-franchise`) → 채용 결정(`06-hiring-pose-overlay`). 대사 분기, 콘솔 오류 0 → `evidence/rabbit-hiring/`
- **C** — 오프닝 전체 컷 + 증서 인수인계. 1024×640 · 1280×720에서 글자 넘침·스크롤 없음 → `evidence/opening-approved/`
- **D** — 항목 3·4·6 증거 문서에 사인오프 표 추가 (**칸은 비워둠**, 사장님이 직접 체크)

## 범위 밖
레거시 흐름(`index.html`), 낮 타이틀(`?title=day`), 이미 통과한 항목 2·5·10, Steamworks 연동, 윈도우 빌드.

## 시작 조건
1. 스모크 PASS 또는 PASS WITH WARNINGS 보고서 (`production/qa/smoke-*.md`) — 세션 A에서 생성
2. 빌드 실행 시 크래시 없음
3. 스프린트 파일 없음 — 스토리 상태 조건은 해당 없음

## 종료 조건
범위 안 항목 모두 PASS / PASS WITH NOTES, 또는 FAIL 항목마다 `production/qa/bugs/BUG-NNN-*.md` 기록.
