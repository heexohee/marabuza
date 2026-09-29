# QA 사인오프 — 1부 셀프 담기 변경분 회귀 사이클

- **일자**: 2026-09-29
- **작성**: qa-lead
- **빌드**: 브랜치 `chore/pre-release-qa`, HEAD `5aa62c7` (수정 커밋 `f27df62` 포함), 출시 빌드 `dist/`
- **이전 사이클**: `production/qa/qa-signoff-part1-2026-09-27.md` — APPROVED WITH CONDITIONS (`7e78f3a`)
- **전략**: `production/qa/qa-strategy-part1-delta-2026-09-28.md`
- **계획**: `production/qa/qa-plan-part1-delta-2026-09-29.md` — 정정: 밤 타이틀만 출시, 낮 타이틀(`?title=day`)은 범위 밖
- **스모크**: `production/qa/smoke-2026-09-29.md` — PASS WITH WARNINGS (당시 테스트 412/412, 경고 = 오프닝 삽화 전환 → 이후 수정됨)
- **최종 자동 테스트**: BUG-002 수정 후 `npm test` **419/419 통과**

> 이 보고서는 위 사이클에서 이미 수행된 결과만 정리한 것이다. 이번 보고서 작성을 위해 재실행한 항목은 없다.

---

## 1. 테스트 커버리지 요약

| # | 항목 | 유형 | 증거 | 결과 |
|---|---|---|---|---|
| 1 | 데스크톱 포장 | Integration | 자동 테스트 `app_path`, 2026-09-29 재포장 `Marabuza.app` 315MB / `app.asar` 28MB, `production/qa/evidence/desktop/` | PASS |
| 2 | 저장 파일화 | Logic | 자동 테스트 + 브라우저 저장/불러오기 확인 (1일차 종료 후 가게 진입 시 저장 → 새로고침 → "이어서 하기"로 가게·돈 복원) | PASS |
| 3 | 판다·동물 초상화 | Visual/Feel | 자동 테스트 `animal_faces`, `production/qa/evidence/animal-queue/`, `production/qa/evidence/panda-owner-a/` | PASS — 리드 사인오프 대기 |
| 4 | 앉은 손님·가구 | Visual/Feel | `production/qa/evidence/seated-customers/README.md` | 실행 완료 — 리드 사인오프 대기 |
| 5 | 엔딩 순서·크레딧 | Integration | 자동 테스트 + 흐름 확인: 엔딩 → 예고 → 크레딧 → 28일차 가게 → 29일차 | PASS |
| 6 | 전신 토끼 예고 | Visual/Feel | `production/qa/evidence/rabbit-hiring/`, `production/qa/evidence/ending-illustrations-evidence.md` | PASS — 리드 사인오프 대기 |
| 7 | 낮 타이틀 | — | 범위 밖 (출시 안 함) | N/A |
| 8/9 | 오프닝·증서 대사 + 승인 삽화 | UI/Visual | 세션 C, `production/qa/evidence/opening-approved/qa-2026-09-29/`, 회귀 테스트 `tests/unit/self-serve/story_art_test.mjs` (7건) | 최초 FAIL → BUG-002 수정·검증 후 **PASS** |
| 10 | 일자 전환 달력 | UI | 자동 테스트 `day_intro`, 흐름 내 통과, `production/qa/evidence/day-intro/` | PASS |
| 11 | 토끼 채용 결정 | UI | 세션 B, `production/qa/evidence/rabbit-hiring/` | PASS WITH NOTES |
| 12 | 초안 제외 + 세로 창 타이틀 | UI | `release_build_test`, 밤 타이틀 600×1200 스크린샷 `production/qa/evidence/title-tall-window/` | PASS |

### 8/9 세부 확인 내용
- 오프닝 대사 19줄 전부 화자·문구 정확.
- 1280×720, 1024×640에서 넘침·스크롤 없음. 인물 레이어 좌표 정확.
- 엔딩 7비트 두 분기 모두 확인:
  - **완납**: 배지 "권리금 완납" 표시.
  - **탕감** (저장 파일 편집으로 재현: 임대료 납부, 283,800원 탕감): 판다 대사 "나머지는 그동안 손님들한테 내준 한 그릇으로 받았다 치자" 표시, 배지 없음, 최장 대사 넘침 없음.
- BUG-002 수정 후: 빈 상자 프레임 0 (수정 전 전환마다 30–40ms), 삽화가 바뀔 때만 0.2초 페이드, 비 오는 장면 03→04는 인물만 페이드. 회귀 테스트가 수정 전 실패 → 수정 후 통과하는 것을 확인.

### 11 세부 노트 (버그 아님)
- 선택지 없음 / 저장되지 않음 / 29일차에 토끼 없음 — 사용자 확인 결과 의도된 동작. 채용 기능은 2부(시즌 2)에서 구현.
- 크레딧은 Enter로만 넘어가고 Space는 안 됨 (`main.js`의 `KEY_ACTIONS`) — 사용자가 버그로 등록하지 않기로 결정. 노트로 기록.
- 예고 도중 새로고침하면 28일차 가게로 돌아감.
- 오버레이 정렬 정확 (오차 0).

### 기타 관찰
- 웹 빌드 한정 `favicon.ico` 404 — S4 수준, 등록 안 함.
- 성능: 개발용 Mac에서 120fps. **저사양 PC는 측정 안 함.**
- 항목 2: 첫 저장은 1일차가 끝난 뒤에만 생김 (기획 확인 필요). 가게를 방치하면 평점 0 → 폐업 → 저장 삭제 (영구 사망, 의도된 설계).
- 항목 1: 앱 아이콘이 아직 Electron 기본값이고 공증(notarization)은 생략함 — 이번 사이클 범위가 아닌 출시 체크리스트 항목.

---

## 2. 발견된 버그

| ID | 제목 | 심각도 | 상태 | 회귀 테스트 |
|---|---|---|---|---|
| BUG-002 | 오프닝 삽화 전환 시 빈 상자 프레임 | S3 | 수정됨 / 검증 완료 (2026-09-29) | `tests/unit/self-serve/story_art_test.mjs` |
| BUG-001 | 사이드 메뉴 일일 대사 (이전 사이클) | — | 수정 상태 유지 | — |

- 버그 파일: `production/qa/bugs/BUG-002-opening-illustration-transition.md`, `production/qa/bugs/BUG-001-side-menu-daily-lines.md`
- **열린 S1/S2 버그: 0건.**

---

## 3. 판정

**사전 조건 — 충족.** 범위 안의 모든 항목(1–6, 8–12)에 실제로 실행한 증거(자동 테스트 통과 또는 보관된 스크린샷/세션 기록)가 있다. 범위 밖은 항목 7 하나뿐.

**판정: APPROVED WITH CONDITIONS**

근거: 열린 S1/S2 없음, 자동 테스트 419/419 통과, 유일하게 실패했던 항목(8/9)도 같은 날 수정·검증됨. 다만 Visual/UI 스토리의 리드 사인오프 표가 체크되지 않았고, 이 게이트가 스토리 완료(Done)를 BLOCKING하므로 조건부 승인으로 한다.

---

## 4. 조건

1. **리드 사인오프 (스토리 Done을 막음)**: 항목 3, 4, 6, 11, 12의 사인오프 표를 체크해야 해당 스토리를 Done으로 닫을 수 있다.
   - `production/qa/evidence/animal-queue/`, `production/qa/evidence/panda-owner-a/`
   - `production/qa/evidence/seated-customers/README.md`
   - `production/qa/evidence/ending-illustrations-evidence.md`, `production/qa/evidence/rabbit-hiring/`
   - `production/qa/evidence/title-tall-window/`
2. **저사양 PC 성능 측정**: Steam 출시 전에 최소 사양 기기에서 fps를 측정해 기록해야 한다.
3. **출시 체크리스트로 넘기는 항목**: 앱 아이콘 교체(현재 Electron 기본값), macOS 공증 — 이번 QA 판정 조건은 아니지만 출시 게이트에서 추적해야 한다.
4. **기획 확인**: 첫 저장이 1일차 종료 후에만 생기는 동작이 의도한 것인지 game-designer 확인이 필요하다.

---

## 5. 다음 단계

- 리드가 조건 1의 사인오프 표를 체크한 뒤 해당 스토리를 `/story-done`으로 닫는다.
- `/bug-report close BUG-002` — 검증 완료 상태이므로 종료 기록을 남긴다.
- 조건 2–3은 `/release-checklist`에 넣어 추적한다.
