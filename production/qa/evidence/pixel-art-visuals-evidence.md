# Test Evidence: 픽셀아트 냄비·그릇·재료 스프라이트

> **Story**: 스토리 문서 없음 — 2026-09-24~25 세션 사용자 요청 (케이스: `production/qa/test-cases/pixel-art-visuals-cases.md`)
> **Story Type**: Visual/Feel
> **Date**: 2026-09-25
> **Tester**: Claude (앱 내 브라우저에서 실행) · 판정: 사용자
> **Build / Commit**: 미커밋 작업 트리 (브랜치 `feat/self-serve-flow`, 기준 `7ed2c3e`)

---

## What Was Tested

냄비와 그릇이 4px 격자 픽셀아트로 보이는지, 냄비의 세 상태(빈 냄비·조리 중·완성), 그릇의 맵기별 국물 색, 떠 있는 재료가 국물 안에 머무는지, 새로 그린 팽이버섯·목이버섯·푸주 스프라이트, 이모지 스프라이트 잘림 여부를 확인했다.

**Acceptance criteria covered**: 케이스 문서 TC 전체 (12개)

---

## Acceptance Criteria Results

| # | 기준 | Result | Notes |
|---|------|--------|-------|
| 1 | 빈 냄비: 어두운 국물, 불꽃 없음 | PASS | `.broth.off`, 불꽃 0개 |
| 2 | 조리 중: 국물 색 + 떠 있는 재료 + 불꽃 3개 + 진행 막대 | PASS | |
| 3 | 완성: 불꽃 없음, 노란 빛, ♨, "완성! 서빙" | PASS | `drop-shadow(rgba(255,210,63,.9))` |
| 4 | 냄비·그릇이 매끈한 벡터가 아니라 픽셀아트로 보임 | PASS | `image-rendering: pixelated`, 사용자 판정 |
| 5 | 그릇 맵기 0→4 국물 색이 연주황 → 진한 빨강 | PASS | rgb(231,179,107) → rgb(143,27,18) |
| 6 | 떠 있는 재료가 타원 국물 안에 머묾 | PASS | 국물 마스크 적용, 영역 밖 0개 |
| 7 | 팽이버섯: 밑동 없는 긴 가닥 세 개 + 둥근 갓 | PASS | 사용자 판정 |
| 8 | 목이버섯: 주름진 짙은 갈색 귀 모양 | PASS | 사용자 판정 |
| 9 | 푸주: 연노랑 주름진 막대 | PASS | 사용자 판정 |
| 10 | 이모지 스프라이트 위·오른쪽 잘림 없음 | PASS | 36종 × 4크기 = 144개, 가장자리에 외곽선이 아닌 색 0개 |
| 11 | 재료 칸: 그림 여백, 재고 배지가 그림과 안 겹침 | PASS | 최소 여백 24px, 겹침 0 |
| 12 | 상점 업그레이드 아이콘(🍲🔥🏮🪑) 잘림 없음 | PASS | 10번 검사에 포함 |

---

## Screenshots / Video

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `pixel-pot-bowl-2026-09-25.png` | 게임 화면: 조리 중 냄비, 손님 그릇, 재료 칸 | 2, 4, 5, 6, 7–9, 11 |

이번 실행 도구(앱 내 브라우저)는 스크린샷을 파일로 저장하지 못해, 같은 빌드에서 앞서 저장한 위 파일을 증거로 사용한다.

---

## Test Conditions

- **Game state at start**: 저장 데이터 주입 (DAY 3, 20,000원, 소고기·양고기 해금, 냄비 2, 화력 3)
- **Platform / hardware**: macOS, Claude 데스크톱 앱 내 브라우저, 1200×800
- **Framerate during test**: 측정 안 함 (브라우저 창이 숨겨져 있어 프레임을 16ms 타이머로 구동)
- **Any special setup required**: 창이 숨겨지면 `requestAnimationFrame`이 멈춰서, 테스트 탭에서만 타이머 기반으로 바꾸고 게임 모듈을 다시 불러옴. 게임 코드는 변경하지 않음.

---

## Observations

*No significant observations.*

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer (implemented) | Claude | 2026-09-25 | [x] Approved |
| Designer / Art Lead / UX Lead | 사용자 (세션 내 판정: PASS) | 2026-09-25 | [x] Approved |
| QA Lead | qa-lead (sign-off: qa-signoff-adhoc-2026-09-25.md) | 2026-09-25 | [x] Approved |

---

*Template: `.claude/docs/templates/test-evidence.md`*
