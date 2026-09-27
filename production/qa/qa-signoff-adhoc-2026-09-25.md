## QA Sign-Off Report: 애드혹 (원래 흐름)
**Date**: 2026-09-25
**전략 / 계획**: [qa-strategy-adhoc-2026-09-25.md](qa-strategy-adhoc-2026-09-25.md) · [qa-plan-adhoc-2026-09-25.md](qa-plan-adhoc-2026-09-25.md)

### Test Coverage Summary

| 대상 | 유형 | 자동 테스트 | 수동 QA | 결과 |
|---|---|---|---|---|
| 계산대 (story-001) | Logic | 47/47 통과 (`tests/unit/logic.test.mjs` 11, `tests/unit/checkout/pricing_test.mjs` 25, `tests/unit/save/save_test.mjs` 11) | 11/12 케이스 확인 (저울 금액 자동, 고기 개수별 추가금, 많은 항목 모달, 과다·과소 청구, 추가금 지우기, 0원 아래 금지, Enter 확정, 두 번째 서빙 막힘, 결제 거부) | PASS WITH NOTES |
| 픽셀아트 비주얼 | Visual/Feel | 해당 없음 | 12/12 통과 (냄비 세 상태, 그릇 맵기별 국물 색, 스프라이트 3종, 이모지 스프라이트 144개 잘림 0, 재료 칸 여백·배지) | PASS |
| 상점 정렬 | UI | 해당 없음 | 10/10 통과 (1200px, 375px) | PASS WITH NOTES |

증거: `evidence/story-001-meat-portions-2026-09-25.png`, `evidence/pixel-art-visuals-evidence.md`, `evidence/shop-alignment-evidence.md`
케이스: `test-cases/story-001-checkout-cases.md`, `test-cases/pixel-art-visuals-cases.md`, `test-cases/shop-alignment-cases.md`

### Bugs Found

없음 (FAIL 판정 없음, 버그 보고서 없음)

### Out of Scope

- **클라우드 저장 (Supabase + 카카오 로그인)**: Phase 2에서 사용자가 이번 사이클 범위에서 제외. Supabase 프로젝트·카카오 앱이 아직 없어 실제 로그인·동기화를 실행할 수 없음. 미실행 항목이 아니라 범위 밖 항목으로 기록.
- 셀프 담기 흐름 (`src/js/self-serve/`, `src/self-serve.html`) — 다른 세션 작업.

### Verdict: **APPROVED WITH CONDITIONS**

**Conditions**:
1. **스모크 체크 미실시** — `production/qa/smoke-*.md`가 없어 시작 시점 스모크 상태가 UNKNOWN. 사용자가 알고 진행함. 다음 QA 사이클 전 `/smoke-check` 선행.
2. **계산대 PASS WITH NOTES** — "계산 대기 중 마감 불가" 케이스는 테스트 도중 브라우저 창이 외부에서 조작되어 대기 중 계산이 확정되는 바람에 화면 판정 불가. 같은 로직은 유닛 테스트 `test_checkout_day_does_not_end_while_checkout_pending`으로 검증됨. 정확·과다·과소 청구 기록은 아직 마감 정산 화면에 나오지 않아(story-004) 유닛 테스트로만 검증됨.
3. **상점 정렬 PASS WITH NOTES** — 375px에서 업그레이드 카드가 한 줄에 하나씩 쌓여 스크롤이 김(기능 결함 아님). 375px 화면은 도구 제약으로 이미지 파일로 남기지 못해 이 보고서의 텍스트로만 존재.

**테스트 환경 메모**: 브라우저 창이 숨겨져 있어 테스트 탭에서만 `requestAnimationFrame`을 16ms 타이머로 바꿔 실행(게임 코드 변경 없음). 고기 케이스는 DAY 1을 거치지 않고 해금된 저장 데이터로 시작.

### Follow-ups (non-blocking)

- 클라우드 업로드가 예외를 던질 때(reject) 알림 없이 묻힘 — `false` 반환 때처럼 `.catch`에서도 같은 실패 토스트를 띄우고, 실패 분기 테스트 추가.
- `pullSave`가 네트워크 오류와 "저장 데이터 없음"을 구분하지 못함.
- `connectCloud`의 catch-all이 설정 오타를 "설정 안 함"과 같게 숨김.
- `savedAt`이 기기 시계에 의존 — 시계가 어긋난 기기끼리 최신본을 잘못 고를 수 있음.
- `saves` 테이블에 삭제 RLS 정책 없음 (현재는 안전한 기본값, 탈퇴·초기화 기능 추가 시 필요).
- 마감 정산 화면에 정확·과다·과소 청구 기록 표시 (story-004 범위).
- 375px 상점 업그레이드 카드 배치 다듬기.
- 375px 증거 스크린샷 보강 (파일 저장이 되는 환경에서 재캡처).

### Next Step

Resolve conditions before advancing. S3/S4 수준 항목은 다듬기 단계로 미뤄도 됨.
- 다음 사이클 전 `/smoke-check` 실행.
- 클라우드 저장은 Supabase·카카오 설정 완료 후 별도 QA 사이클로 평가.
