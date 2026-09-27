# QA 계획 — 애드혹 사이클 (2026-09-25)

전략: [qa-strategy-adhoc-2026-09-25.md](qa-strategy-adhoc-2026-09-25.md)

## 범위
- 대상 흐름: 원래 흐름 (`src/index.html`, `src/js/*.js`, `src/styles.css`)
- 항목 3개 (클라우드 저장은 사용자 결정으로 이번 사이클에서 제외)

| 대상 | 유형 | 근거 |
|---|---|---|
| 계산대 (스토리 001) | Logic (+ 계산대 화면) | `production/epics/maratang-tycoon/story-001-checkout-pricing.md` |
| 픽셀아트 냄비·그릇·재료 스프라이트 | Visual/Feel | 스토리 문서 없음 — 이번 세션 사용자 요청 |
| 상점 카드·버튼 정렬 | UI | 스토리 문서 없음 — 이번 세션 사용자 요청 |

## 자동 테스트
- 계산대: `tests/unit/checkout/pricing_test.mjs`, `tests/unit/logic.test.mjs` — 이미 있음, 추가 없음
- 실행: `node --test tests/unit/logic.test.mjs tests/unit/checkout/pricing_test.mjs tests/unit/save/save_test.mjs`

## 수동 QA
- **계산대**: 정확 / 과다 / 과소 청구, 소고기·양고기 여러 개(×N 표시와 개당 추가금), 추가금 지우기, 계산 대기 중 마감 차단, 항목이 많을 때 모달 레이아웃, Enter 확정
- **픽셀아트**: 냄비 빈 상태·조리 중(불꽃)·완성(빛남), 그릇 맵기 0–4 국물 색, 떠 있는 재료가 국물 안에 머무는지, 팽이버섯·목이버섯·푸주 스프라이트 모양, 이모지 스프라이트 잘림 없음
- **상점 정렬**: 넓은 화면(1200px)과 좁은 화면(375px)에서 업그레이드·재료 구매 버튼 줄맞춤, 버튼 글자 잘림 없음, 가격 조절 −/+ 박스 안에 있음

## 범위 밖
- 클라우드 저장 실제 로그인·동기화 — Supabase 프로젝트·카카오 앱 미생성 (미평가)
- 셀프 담기 흐름 (`src/js/self-serve/`, `src/self-serve.html`) — 다른 세션 작업
- 샹궈·꼬치·고수 선택 화면 — 스토리 002·003에서 생김, 현재는 유닛 테스트로만 확인

## 시작 조건
1. 스모크 체크 보고서 — **없음 (UNKNOWN)**. 사용자 결정으로 없이 진행, 최종 보고서에 경고로 남김
2. 게임이 오류 없이 켜짐 (`http://localhost:8123`)
3. 자동 테스트 전부 통과 (시작 시점 47/47)

## 종료 조건
- 세 항목 모두 PASS / PASS WITH NOTES / FAIL 중 하나로 판정
- FAIL은 `production/qa/bugs/BUG-NNN-*.md`로 기록
- Visual/UI 통과 항목은 `production/qa/evidence/`에 증거 문서와 스크린샷 보존 (승인 칸은 실제 승인 전까지 비워 둠)
