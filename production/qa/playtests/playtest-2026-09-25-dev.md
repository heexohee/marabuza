# Playtest Report — 셀프 담기 버전 1판

## Session Info
- **Date**: 2026-09-25
- **Build**: `565ed0d` (feat/self-serve-flow) · `src/self-serve.html`
- **Duration**: 1판 (하루 영업 120초)
- **Tester**: 개발자 본인
- **Platform**: PC 브라우저
- **Input Method**: 마우스 + 키보드
- **Session Type**: 목적 테스트 — 셀프 담기 흐름 vs 기존 흐름(사장이 담기) 비교

## Test Focus
셀프 담기 흐름의 핵심 가정 세 가지 (`design/quick-specs/self-serve-restock-flow-2026-09-24.md`):
1. 계산대에서 "확인"(뒤적이기·계산)하는 일이 재미있는가
2. 러시 때 "보충 vs 계산" 긴장감이 생기는가
3. 신선도(시듦) 때문에 "적당히 채우기" 판단이 생기는가

## Gameplay Flow
### What worked well
- **고기 찾기(뒤적이기)가 재미있었다** → 가정 1 확인.
- 기존 흐름과 재미는 비슷하지만 **셀프 담기가 확장성이 좋다**는 판단. 사장이 담기는 재료가 늘수록 클릭 시간·난이도가 커진다.

### Pain points
- **러시 때 계산·장사에 치여 재고를 거의 못 채웠고, 후반에 진열대가 비었다** — Severity: High
  → 가정 2가 "긴장감"이 아니라 "과부하"로 기울었다. 판단 여지 없이 보충을 포기함.
  → 테스터 제안: 알바 기능

### Confusion points
- **신선도/시듦을 전혀 인지하지 못함** → 가정 3 검증 실패. 메커니즘은 동작하지만 플레이어에게 전달되지 않음.

### Moments of delight
- 숨은 고기를 찾아내는 순간.

## Bugs Encountered
| # | Description | Severity | Reproducible |
|---|-------------|----------|-------------|
| — | 없음 | — | — |

## Quantitative Data
- 손님 11명 중 정확 계산 7, 덜 받음 2, 더 받음 1 → **계산 오류율 약 30% (3/10)**, 1명은 결제 전 이탈로 추정.

## Overall Assessment
- **Would play again?** Yes ("재미있네")
- **Difficulty**: 후반 과함 (재고 관리 포기)
- **Pacing**: 초반 적당 / 후반 러시만 과함

## Top 3 Priorities from this session
1. **후반 과부하 해소** — 보충을 포기가 아니라 "고민"하게
2. **신선도 가시화** — 시드는 게 느껴지는 피드백
3. **계산 실수 피드백** — 30% 오류, 어디서 틀렸는지 알려주기

## Conflicts with design intent
- **알바 기능**은 `design/game-brief.md`의 Out of scope("알바 고용·자동화")에 명시돼 있다. 도입하려면 범위 결정이 필요.

## Action Routing
| Category | Item | Next step |
|---|---|---|
| Design change | 후반 과부하 → 보충 방식 쉽게 (알바 전 단계) | 적용: 보충 시간 1.2→0.5초 + 재고 부족 칸 깜빡임 |
| Design change | 신선도 전달 안 됨 (시듦 경고·폐기 연출) | `/quick-design` |
| Balance | 보충 시간, 박스 크기, 손님 간격 | `/balance-check` |
| Polish | 결제 순간 계산 실수 피드백 | 다듬기 목록 |
| Bug | 없음 | — |

## Decisions after this session (2026-09-25)
- **지금**: 보충 방식을 쉽게 — 보충 시간 단축 + 재고 부족 칸 강조. 알바 없이 과부하가 풀리는지 다음 플레이테스트에서 확인.
- **나중 (백로그)**:
  - 알바 기능 — 브리프 범위 변경 필요. 보충 담당 1명 업그레이드 형태가 유력.
  - 스토리 라인 — "왜 마라탕 장사를 시작했는가" 주인공 동기·배경 설계 (`/brainstorm` 또는 narrative 작업).

CD-PLAYTEST skipped — Solo mode.
