# E003: 주간 임대료 + 일요일 휴일 — 증거 (2026-09-27)

## 자동 테스트
`tests/integration/economy/weekly_rent_test.mjs` — 25개, 전체 스위트 263개 통과.
- 달력 계산(weekOf/weekdayOf/isSunday), 평일→상점 직행, 토요일→일요일 진입(장부 스냅샷·임대료 차감·주간 매출 리셋)
- 임대료 부족 시 연체 표시(무차감) → 다음 주 2배 청구 → 그마저 부족하면 폐업
- 평판 0에서 tick()이 폐업으로 전환
- 저장: rentOverdue·weekRevenue 왕복, 일요일 화면에서 저장 시 그 화면으로 재개, 그 외는 상점으로
- 봇(autoplay)이 토요일→일요일→월요일 경계를 넘어가며 실제로 임대료를 차감

버그 주입 검증: `enterSunday`의 차감 줄을 지웠을 때 관련 테스트 3개가 실제로 실패하는 것을 확인한 뒤 복구 (테스트가 실제로 뭔가를 검증한다는 근거).

## 실제 화면 (브라우저 실행, 1280×884 고정 무대)
- `weekly-rent/01-saturday-summary.png` — DAY 6 마감! 1주차 토요일 · 임대료까지 1일
- 일요일은 영업 화면 위 창이 아니라 **오프닝처럼 장면**으로 (피드백 2026-09-27): 휴무 가게 배경(`scene-sunday.png`, `tools/art/scene_regular.py`의 sunday 모드 — 마라부자 간판, 창에 "휴무", 조명·냄비 꺼짐)
  - `weekly-rent/02a-sunday-caption.png` — "오늘은 일요일! 쉬는 날."
  - `weekly-rent/02b-sunday-her-line.png` — 초아 "한 주 동안 수고했어. 장부부터 정리하자."
  - `weekly-rent/02-sunday-ledger.png` — 📒 장부: 1주차 매출 → 임대료 (건물주) −194,000원(완납 ✓) → 남은 돈
  - `weekly-rent/02c-sunday-paid-last.png` — 초아 "임대료 완납! 이번 주도 잘 버텼다." + 상점으로
  - 장면이 바뀌어도 그림 위치 고정 (4장면 모두 top 103px)
- `weekly-rent/03-sunday-resumed-from-save.png` — 새로고침 + 이어하기로 일요일 장면(첫 장면부터) 재개
- `weekly-rent/04-sunday-overdue.png` — 돈이 모자랄 때 장부: 빨간 연체 ! 도장 (돈 미차감)
- `weekly-rent/04b-sunday-overdue-landlord.png` — 임대료는 **건물주**에게: "임대료가 모자라네요… 이번 주는 봐 드릴게요. 다음 주엔 두 주 치, 꼭이요!" (판다 사장님은 권리금만 — E004)
- `weekly-rent/05-closed-rating.png` — 평판 0 폐업 화면 ("평판이 바닥나서 손님 발길이 끊겼어요…" / 새로 시작)
- 임대료 2주 연속 미납도 일요일 장면 안에서 (피드백 2026-09-27 — 토요일 영업 화면 위에 바로 뜨지 않게):
  - `weekly-rent/06a-sunday-bankrupt-ledger.png` — 장부 임대료 줄에 빨간 **폐업** 도장 (−388,000원 = 두 주 치)
  - `weekly-rent/06b-sunday-bankrupt-landlord.png` — 건물주 "두 주 연속이면… 더는 어렵겠어요. 가게를 비워 주셔야겠어요."
  - `weekly-rent/06-closed-rent.png` — 폐업 창, 배경은 휴무 가게 그대로
- 폐업하면 세이브를 지운다: 타이틀의 "이어하기"가 꺼지고 "새로 시작"만 남음 (전에는 이어하기로 상점에서 이어져 폐업을 건너뛸 수 있었음 — 브라우저에서 발견해 고침)

콘솔 오류 없음. "새로 시작" 버튼이 오프닝으로 정상 복귀하는 것도 확인.

## 알아둘 점
- 상점은 토요일(day%7===6) 번호로는 절대 진입하지 않는다 — 일요일 처리는 `afterSummary`에서만 일어난다.
  이 성질에 의존하는 코드를 건드릴 때는 주의.
- 상점 화면이 무대보다 길어 스크롤되는 문제(층 배치 재작업)는 이 스토리의 범위 밖이며 그대로 남아 있다.
