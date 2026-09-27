# QA 계획 — 셀프 담기 흐름 1부 (1–28일) 회귀, 2026-09-27

> 전략: `production/qa/qa-strategy-part1-2026-09-27.md` (qa-lead) · 스모크: `production/qa/smoke-2026-09-27.md` PASS
> 레거시 흐름(사장이 담기)은 범위 밖.

## 범위

스토리 12개 + 2026-09-27 플레이테스트 변경(`design/quick-specs/playtest-2026-09-27.md` #1–#12),
엔딩 크레딧, 글자 속 이모지 스프라이트, 출시 빌드(개발 바 제거), 살아있는 타이틀 배경.

## 스토리 분류

| 스토리/변경 | 유형 | 자동 | 수동 |
|---|---|---|---|
| economy/001 메뉴 단가 | Integration | ✅ menu_prices_test | — |
| economy/002 D 기준·가격표 | Logic | ✅ price_table_test | — |
| economy/003 주간 임대료 | Integration | ✅ weekly_rent_test | (스모크 7일차 포함) |
| economy/004 권리금·엔딩 | Integration | ✅ premium_ending_test | (스모크 28일차 포함) |
| economy/005 1부 밸런스 | Config/Data | ✅ part1_balance_test + 봇 시뮬 | A (체감) |
| part1-story/001 매일 대사 | Logic | ✅ daily_lines_test | A (넘침) |
| part1-story/002 단골 | Integration | ✅ regulars_test | A |
| part1-story/003 2부 예고 | Integration | ✅ part2_teaser_test | (스모크 포함) |
| shop-growth/001 가게 단면 | Visual/Feel | — | 증거 있음, 사인오프 줄 |
| shop-growth/005 인테리어 | Integration | ✅ interior_upgrades_test | — |
| shop-growth/007 간판 교체 | Visual/Feel | — | C (1회성), 사인오프 줄 |
| side-menu/001 사이드 메뉴 (+#2 상점 해금) | Integration | ✅ side_menu_test | C (구매 흐름) |
| #3 계산대 인내심 게이지 · #8 분홍 커서 | UI | — | B |
| #7 상점 장부 · 엔딩 크레딧 | UI | ✅ shop_ledger_test · credits_test | A (넘침) |
| 살아있는 타이틀 배경 | Visual/Feel | ✅ title_anim_test | C (30초+ 방치) |

## 자동 테스트 요구

충족 — 374개 통과, 스토리마다 대응 파일 존재 (스모크 보고서 커버리지 표).

## 수동 QA 범위 (Claude가 브라우저로 진행)

- **A** — 출시 빌드 `dist/`, 1–10일 플레이 체감 메모(자본금 500,000 · 진열 10 · 대기열 0.9 · 권리금 11D) +
  1024×640 · 1280×720에서 글자 넘침: 매일 대사 말풍선, 📒 장부 팝업, 엔딩 크레딧
- **B** — 분홍 커서가 타이틀·영업·상점·설정에서 일관, 계산대 인내심 게이지가 줄고 거의 다 되면 빨강·흔들림·말풍선
- **C** — 간판 교체 컷씬이 새 게임에서 1회, 기존 저장 이어하기에선 다시 안 나옴 · 사이드 메뉴 추가 흐름 문구 ·
  타이틀 배경 30초 이상 방치 시 끊김/거슬리는 반복 없음
- **D** — 28일 한 세션 메모리·프레임: 사람이 실시간으로 불가하므로 개발 서버(`src/`)의 봇(개발 바 자동 영업)으로 가속

## 범위 밖

레거시 흐름 · 미착수 스토리(shop-growth 002/003/004/006) · 실제 하드웨어(윈도우·스팀 덱 — 데스크톱 포장 후).

## 시작 조건

1. 스모크 체크 PASS 보고서 존재 — ✅ `production/qa/smoke-2026-09-27.md`
2. 빌드 실행 중 크래시 없음 — ✅ (스모크)
3. Must Have 스토리 상태 — 해당 없음 (`production/sprint-status.yaml` 없음, 애드혹 사이클)

## 종료 조건

A–D 모든 케이스가 PASS/FAIL로 기록되고, FAIL마다 `production/qa/bugs/BUG-NNN-*.md`가 있음.
Visual/Feel 증거 문서(001·007)에 사인오프 줄 추가(실제 사인 전까지 체크 안 함), story-007 증거 체크박스 갱신.
