# 세션 B — 28일차 엔딩 → 2부 예고 → 토끼 채용 → 엔딩 크레딧 → 29일차 (수동 테스트 케이스)

- **스토리 유형**: Integration (엔딩·예고·크레딧·저장·상점 연결) + UI/Visual (삽화, 오버레이 정렬, 창 크기)
- **출력 위치**: 본 문서 + 스크린샷 `production/qa/evidence/rabbit-hiring/`
- **게이트**: BLOCKING (Integration / UI 둘 다)
- **대상 커밋**: bbca177, 4f24df0, a492588 (브랜치 `chore/pre-release-qa`, HEAD 90da7c5)
- **실행 환경**: `http://localhost:8124/self-serve.html` (localhost 이므로 개발 바 노출), 창 크기 1024×640 / 1280×720

## 코드 기준 사실 (테스트 전제)

1. **채용은 선택지가 아니다.** 2부 예고(`phase: 'teaser'`)는 5개 대사가 순서대로 나오는 일직선 장면이며, 수락/거절 버튼이 없다. 주인공 대사 "좋아요. 우리, 같이 해 봐요!"가 곧 채용 결정이다. 따라서 **분기는 하나(수락)뿐**이고, 거절 분기는 존재하지 않는다.
2. **채용 결과를 저장하는 상태값이 없다.** 저장되는 것은 `endingSeen`, `premiumPaidInFull`, `part2TeaserSeen` 뿐이다. 29일차 영업 화면에는 토끼 알바 관련 내용이 없다 (주석: "part 2 content comes later").
3. 엔딩(28일차) 대사는 **완납 / 탕감** 두 갈래로 나뉜다 (`premiumPaidInFull`). 삽화는 같고, 완납일 때만 "권리금 완납" 배지와 벽 액자 "완납" 명판이 붙는다.
4. 흐름: 28일차 일요일 장부 → 엔딩 7비트 → [계속 →] → 2부 예고 5비트 → [엔딩 크레딧 →] → 크레딧 오버레이 → [29일차 준비 →] → 28일차 상점 → [DAY 29 영업 시작!] → 달력 → 29일차 영업.
5. 키 입력: `ending`/`teaser` = Enter·Space 둘 다, `credits` = **Enter만** (Space 매핑 없음). 달력(day-intro)이 떠 있는 동안에는 아무 키나 누르면 달력만 닫힌다.
6. 저장 시점: 엔딩 마지막 비트에서 [계속 →] 누를 때(예고 진입 상태가 `part2TeaserSeen: true`로 저장됨), 크레딧의 [29일차 준비 →], 29일차 [영업 시작] 시. 예고·크레딧 단계 자체는 저장되지 않으므로 그 사이 새로고침 → [이어하기]는 **28일차 상점**으로 복귀한다.
7. 예고 삽화: step 0–1 = `04-rabbit.png`, step 2 = `05-franchise.png` + 간판 텍스트, step 3–4 = `04-rabbit.png` + `06-hiring-pose-overlay.png` (1672×941 RGBA, `inset:0`, 기본 이미지와 같은 크기).

## 공통 점검 (모든 케이스에 적용)

- DevTools 콘솔 오류 0건, Network 탭에 404 0건 (특히 `img/story-v2/ending/*.png`).
- 페이지 스크롤 없음: `document.documentElement.scrollHeight <= innerHeight` 그리고 `scrollWidth <= innerWidth`.
- 대화 상자 텍스트가 상자 밖으로 넘치거나 잘리지 않음.

---

## B-01 — 개발 모드 "엔딩 보기"로 28일차 일요일 진입

**Precondition**: 1280×720. self-serve.html 로드, 새 게임 시작 후 캐릭터 생성 완료(이름 예: `테스터`), 1일차 이상 진행한 상태. 콘솔/네트워크 탭 열어 둠.
**Steps**:
1. 개발 바의 **🎬 엔딩 보기** 클릭.
2. 달력 카드가 뜨면 내용 확인 후 기다리거나 클릭해 닫는다.
3. 일요일 장면을 클릭/Space로 진행하며 각 비트 확인.
**Expected Result**:
- 달력: `DAY 28`, `4주차 일요일`, 메모 `판다 사장님 오시는 날`, 빨간 일요일 페이지.
- step 0 캡션(화자 없음) "오늘은 일요일! 쉬는 날."
- step 1 화자 `테스터` "한 달 동안 수고했어. 장부부터 정리하자."
- step 2 장부 패널(📒 장부): 4주차 매출, 임대료 `완납 ✓`, 권리금 행.
- step 3 화자 `테스터` "임대료 완납! 이번 주도 잘 버텼다." / 하단 버튼 라벨 `…` (상점으로 → 아님).
**Actual Result**:
**Pass/Fail**:
**Pass Criteria**: 위 4개 비트 문구·화자 일치, 버튼 라벨 `…`, 콘솔 오류 0.
**Screenshot**: `production/qa/evidence/rabbit-hiring/B-01-day28-sunday-1280.png`

## B-02 — 28일차 엔딩 7비트 (완납 분기)

**Precondition**: B-01 step 3 화면 (개발 "엔딩 보기"는 마지막 할부금+임대료만큼 돈을 채워 주므로 완납 분기로 들어가는 것이 기대값).
**Steps**:
1. `…` 버튼 클릭 → 엔딩 진입.
2. 클릭으로 한 비트씩 진행하며 비트마다 삽화·화자·대사 확인.
**Expected Result**:
| step | 삽화 | 화자 | 대사 |
|---|---|---|---|
| 0 | 01-ledger | (캡션) | 28일차, 일요일 저녁. |
| 1 | 02-settlement + "권리금 완납" 배지 | 판다 사장님 | 장부 봤어. …다 갚았네. |
| 2 | 02-settlement | 테스터 | 사장님 덕분이에요. |
| 3 | 02-settlement | 판다 사장님 | 아니. 이제 네 가게구나. |
| 4 | 08-certificate | 판다 사장님 | 이젠 마라 맛 전수증을 넘겨줄게. 잘 보이는 데 걸어 둬. |
| 5 | 08-certificate | 테스터 | 감사합니다. 앞으로도 잘해 나갈게요! |
| 6 | 08-certificate | (캡션) | 마라부자 1부 — 끝 / `계속 →` 버튼, ▶ 힌트 없음 |
- step 1 이후 모든 비트에 "권리금 완납" 배지 표시.
**Actual Result**:
**Pass/Fail**:
**Pass Criteria**: 7비트 모두 표와 일치, 배지 표시, 404 없음.
**Screenshot**: `B-02-ending-step1-paid-1280.png`, `B-02-ending-step6-1280.png`

## B-03 — 28일차 엔딩 탕감 분기 (조건부)

**Precondition**: 정상 플레이 또는 세이브 조작으로 28일차 장부 시점에 권리금이 남아 있는 상태 (개발 "엔딩 보기"로는 기본적으로 도달 불가 — 아래 CONCERNS 참조). 도달 불가 시 BLOCKED로 기록.
**Steps**:
1. 28일차 일요일 → 엔딩 진입.
2. step 1–3 확인, step 6까지 진행.
**Expected Result**:
- step 1 판다 사장님 "장부 봤어. 조금 남았네."
- step 2 테스터 "죄송해요… 조금만 더 시간을 주시면—"
- step 3 판다 사장님 "됐어. 나머지는 그동안 손님들한테 내준 한 그릇으로 받았다 치자. …이제 네 가게구나."
- "권리금 완납" 배지 **없음**. step 3의 긴 대사가 1024×640에서도 상자 안에 들어감.
**Actual Result**:
**Pass/Fail**:
**Pass Criteria**: 대사 3줄 일치, 배지 부재, 텍스트 넘침 없음.
**Screenshot**: `B-03-ending-forgiven-step3-1024.png`

## B-04 — 2부 예고 step 0–1: 토끼 등장

**Precondition**: B-02 step 6 화면.
**Steps**:
1. `계속 →` 버튼 클릭.
2. 화면 확인 후 클릭해 step 1로.
**Expected Result**:
- step 0: 삽화 `04-rabbit.png`(전신 토끼, 4f24df0), 캡션 "29일차, 월요일 아침.", ▶ 힌트 표시. 달력 카드는 **뜨지 않음**(teaser는 달력 대상 phase 아님).
- step 1: 화자 `대학생 토끼`, 대사 2줄 "안녕하세요, 사장님." / "저 여기서 일하고 싶어요!" (줄바꿈 유지, pre-line).
- 오버레이 포즈·간판 없음. img alt = "월요일 아침 가게에 찾아온 귀여운 토끼 알바 지원자".
**Actual Result**:
**Pass/Fail**:
**Pass Criteria**: 캡션·화자·2줄 대사 일치, 추가 레이어 없음.
**Screenshot**: `B-04-teaser-step1-rabbit-1280.png`

## B-05 — 2부 예고 step 2: 맞은편 프랜차이즈 공개

**Precondition**: B-04 step 1.
**Steps**:
1. 클릭(또는 Space)으로 step 2 진입.
2. 간판 위치 확인.
**Expected Result**:
- 삽화 `05-franchise.png`로 교체.
- 화자 `테스터`, 대사 "(문밖을 보며) …저기도 마라탕?"
- 간판 텍스트 "대형 마라탕 프랜차이즈" + 노란 굵은 "오픈 예정"이 창밖 맞은편 건물 위치(삽화 가로 약 68%, 세로 약 30%)에 기울어진 채 표시, 삽화 밖으로 벗어나지 않음.
- 포즈 오버레이 없음.
**Actual Result**:
**Pass/Fail**:
**Pass Criteria**: 삽화 교체·대사 일치, 간판이 삽화 영역 안에서 맞은편 건물에 걸림.
**Screenshot**: `B-05-teaser-step2-franchise-1280.png`

## B-06 — 2부 예고 step 3: 채용 결정 (단일 분기)

**Precondition**: B-05 step 2.
**Steps**:
1. 클릭으로 step 3 진입.
2. 오버레이 정렬 확인: 기본 이미지와 `.hiring-pose`의 `getBoundingClientRect()`를 비교.
3. 수락/거절 버튼 존재 여부 확인.
**Expected Result**:
- 삽화 `04-rabbit.png` 위에 `06-hiring-pose-overlay.png`가 겹쳐 주인공이 토끼를 향해 웃는 포즈. 기본 이미지 alt = "토끼를 향해 웃으며 함께 일하기로 결심하는 주인공".
- 화자 `테스터`, 대사 "좋아요. 우리, 같이 해 봐요!"
- 두 이미지 rect(left/top/width/height)가 ±1px 이내로 일치, 포즈에 이중 윤곽/어긋남 없음.
- 간판 없음. **선택 버튼 없음** — 클릭 한 번으로 넘어감.
**Actual Result**:
**Pass/Fail**:
**Pass Criteria**: 대사 일치, 오버레이 rect 차이 ≤1px, 선택 UI 부재 확인.
**Screenshot**: `B-06-teaser-step3-hiring-1280.png`

## B-07 — 2부 예고 step 4 → 엔딩 크레딧

**Precondition**: B-06 step 3.
**Steps**:
1. 클릭으로 step 4 진입.
2. `엔딩 크레딧 →` 버튼 클릭.
**Expected Result**:
- step 4: 포즈 오버레이 유지, 캡션 "마라부자 2부 — 준비 중", ▶ 힌트 없음, 버튼 `엔딩 크레딧 →`.
- 버튼 클릭 → 크레딧 오버레이: 좌측 `07-credits-service-neutral.png`, 머리말 "PART 01 · COMPLETE" / 분홍 로고 "마라부자" / "퇴사하고 마라탕집 사장님", 제작진 롤이 창 안에서 스크롤(페이지는 스크롤되지 않음), 마지막 "그리고, 이 가게의 사장님 — 플레이해 주신 당신", 하단 "이야기는 내일도 계속됩니다." + 버튼 `29일차 준비 →`.
**Actual Result**:
**Pass/Fail**:
**Pass Criteria**: step 4 문구·버튼 라벨 일치, 크레딧 요소 모두 표시, 페이지 스크롤 0.
**Screenshot**: `B-07-teaser-step4-1280.png`, `B-07-credits-1280.png`

## B-08 — 크레딧 → 28일차 상점 → 29일차

**Precondition**: B-07 크레딧 화면.
**Steps**:
1. `29일차 준비 →` 클릭.
2. 상점 화면 확인.
3. `DAY 29 영업 시작!` 클릭, 달력 확인.
4. 29일차 영업 화면 확인.
**Expected Result**:
- 2: 28일차 상점. 홀 벽에 전수증 액자(완납 분기면 "완납" 명판), 헤더에 권리금 바 **없음**, 하단 버튼 `DAY 29 영업 시작!`.
- 3: 2부 예고가 **다시 재생되지 않고** 달력 카드 `DAY 29`, `5주차 월요일`, 메모 "일요일 장부까지 N일" 형식.
- 4: 일반 영업일. 토끼 알바 관련 UI/대사 없음(현재 사양상 정상 — CONCERNS 참조), 전수증 액자 유지.
**Actual Result**:
**Pass/Fail**:
**Pass Criteria**: 예고 재생 0회, 29일차 영업 정상 시작, 액자 유지, 권리금 바 부재.
**Screenshot**: `B-08-day28-shop-after-ending-1280.png`, `B-08-day29-calendar-1280.png`

## B-09 — 키보드만으로 엔딩~크레딧 진행

**Precondition**: 개발 "엔딩 보기"로 28일차 일요일 step 0 (B-01 step 1 후 달력 닫힌 상태). 마우스 사용 금지.
**Steps**:
1. Space로 일요일 step 3까지, Enter로 엔딩 진입.
2. 엔딩 비트를 Space/Enter 번갈아 눌러 step 6까지, Enter로 예고 진입.
3. 예고 step 0→4를 Space로, step 3(채용)에서는 Enter로 진행.
4. step 4에서 Enter → 크레딧.
5. 크레딧에서 Space 1회 → 결과 기록, 그 다음 Enter 1회.
**Expected Result**:
- 1–4: 각 키 1회당 정확히 1비트 진행(건너뜀/중복 없음), 마우스 없이 크레딧 도달.
- 5: Space는 **아무 동작 없음**(코드상 Enter만 매핑), Enter는 28일차 상점으로 이동.
**Actual Result**:
**Pass/Fail**:
**Pass Criteria**: 키 1회 = 1비트, 크레딧 Enter로 상점 도달. (크레딧 Space 무반응은 기록만 — 의도 여부 확인 필요)
**Screenshot**: `B-09-keyboard-credits-1280.png`

## B-10 — 마우스: 화면 아무 곳 클릭 vs 버튼 클릭

**Precondition**: 예고 step 0.
**Steps**:
1. 삽화 영역 클릭 → step 1.
2. 대화 상자 클릭 → step 2.
3. 삽화 영역(간판 위 포함) 클릭 → step 3, 포즈 오버레이 위 클릭 → step 4.
4. step 4에서 빈 영역 클릭 → 결과 기록. 이어서 `엔딩 크레딧 →` 버튼 클릭.
5. 크레딧 오버레이 빈 영역 클릭 → 결과 기록, 이어 `29일차 준비 →` 클릭.
**Expected Result**:
- 1–3: 클릭 1회당 1비트. 오버레이(`pointer-events: none`)가 클릭을 막지 않음.
- 4: step 4에서는 화면 전체가 `teaserNext` 이므로 빈 영역 클릭도 크레딧으로 이동(버튼과 동일 결과). 버튼 클릭 1회로 크레딧이 한 번만 열림.
- 5: 빈 영역 클릭은 무반응, 버튼 클릭 시 상점.
**Actual Result**:
**Pass/Fail**:
**Pass Criteria**: 모든 클릭이 1비트씩, 이중 진행 없음.
**Screenshot**: `B-10-mouse-step3-overlay-1280.png`

## B-11 — 1024×640 레이아웃 (엔딩·예고·크레딧)

**Precondition**: 창 1024×640. 개발 "엔딩 보기".
**Steps**:
1. 엔딩 step 3·4, 예고 step 1·2·3·4, 크레딧 화면에서 각각 스크린샷.
2. 각 화면에서 스크롤 수치와 오버레이 rect 비교(B-06과 동일 방법) 실행.
**Expected Result**:
- 모든 화면 페이지 스크롤 0, 대화 상자·버튼이 뷰포트 안.
- 토끼 2줄 대사, 간판 텍스트, 크레딧 머리말이 잘리지 않음(크레딧은 max-height 650px 규칙 적용 — 롤 창 높이 축소).
- 포즈 오버레이 rect 차이 ≤1px.
**Actual Result**:
**Pass/Fail**:
**Pass Criteria**: 넘침/스크롤/정렬 오류 0건.
**Screenshot**: `B-11-teaser-step1-1024.png`, `B-11-teaser-step2-1024.png`, `B-11-teaser-step3-1024.png`, `B-11-credits-1024.png`

## B-12 — 1280×720 레이아웃 + 창 크기 변경 중 정렬

**Precondition**: 1280×720, 예고 step 3.
**Steps**:
1. 스크롤·오버레이 rect 측정.
2. 창을 1024×640으로 줄였다가 1280×720으로 되돌린 뒤 다시 측정.
**Expected Result**: 크기 변경 전후 모두 오버레이가 기본 삽화에 정렬(≤1px), 페이지 스크롤 0, 간판·대사 넘침 없음.
**Actual Result**:
**Pass/Fail**:
**Pass Criteria**: 두 측정 모두 기준 충족.
**Screenshot**: `B-12-teaser-step3-resized-1280.png`

## B-13 — 저장: 예고 도중 새로고침

**Precondition**: 정상 저장 흐름 확인용. 개발 "엔딩 보기" → 엔딩 step 6 → `계속 →` 클릭(이 시점 저장됨) → 예고 step 3.
**Steps**:
1. F5 새로고침.
2. 타이틀에서 `이어하기`.
3. 상점 화면에서 `DAY 29 영업 시작!` 클릭.
**Expected Result**:
- 2: 28일차 상점으로 복귀(예고 중간 복원 아님). 전수증 액자 표시, 권리금 바 없음.
- 3: 예고가 **재생되지 않고** 곧바로 29일차 달력 → 영업 (`part2TeaserSeen: true`가 예고 진입 시 저장됨).
- 크레딧은 이 경로에서 보이지 않음 — 기록(CONCERNS 참조).
**Actual Result**:
**Pass/Fail**:
**Pass Criteria**: 이어하기 → 28일차 상점, 예고 재생 0회, 29일차 정상 진입.
**Screenshot**: `B-13-reload-mid-teaser-shop-1280.png`

## B-14 — 저장: 크레딧 완료 후 / 29일차 진입 후 새로고침

**Precondition**: B-08 step 2 (28일차 상점, 크레딧 완료).
**Steps**:
1. F5 → `이어하기` → 상태 확인.
2. `DAY 29 영업 시작!` 클릭, 달력 닫고 영업 몇 초 진행.
3. F5 → `이어하기` → 상태 확인.
4. DevTools → Application → localStorage 저장 JSON에서 `endingSeen`, `premiumPaidInFull`, `part2TeaserSeen` 확인.
**Expected Result**:
- 1: 28일차 상점, 액자 유지, 예고/크레딧 재생 없음.
- 3: 29일차 시작 시점 상점/영업 복귀 기준(기존 저장 규칙: sunday 외 phase는 상점으로 재개), 예고 재생 없음.
- 4: `endingSeen: true`, `part2TeaserSeen: true`, `premiumPaidInFull`은 분기대로. 채용 여부 필드는 존재하지 않음(사양상).
**Actual Result**:
**Pass/Fail**:
**Pass Criteria**: 어떤 새로고침에서도 엔딩/예고 재생 0회, 3개 플래그 값 일치.
**Screenshot**: `B-14-reload-day29-1280.png`

## B-15 — 저장: 엔딩 도중 새로고침 (회귀 확인)

**Precondition**: 개발 "엔딩 보기" → 엔딩 step 3 (아직 `계속 →` 누르지 않음). 개발 점프 상태 자체는 저장되지 않는다는 점 유의.
**Steps**:
1. F5 → `이어하기`.
2. 결과 화면과 저장 JSON 기록.
**Expected Result**: 개발 점프 이전의 마지막 저장 상태로 복귀(엔딩 중간 저장 없음). 엔딩·예고 플래그가 true로 남지 않아야 함. 오류/빈 화면 없음.
**Actual Result**:
**Pass/Fail**:
**Pass Criteria**: 이어하기 정상 동작, 플래그가 점프 이전 값과 동일, 콘솔 오류 0.
**Screenshot**: `B-15-reload-mid-ending-1280.png`

## B-16 — "엔딩 보기" 재실행 (엔딩 이후 반복)

**Precondition**: B-08 완료 후 29일차 영업 중.
**Steps**:
1. 개발 바 `🎬 엔딩 보기` 다시 클릭.
2. 일요일 → 엔딩 → 예고 → 크레딧 → 상점까지 진행.
**Expected Result**: 코드 주석대로 "엔딩 이후에도 다시 동작" — 28일차 일요일부터 엔딩·예고 전 과정이 B-01~B-08과 동일하게 재생, 캐릭터·인테리어 유지. 콘솔 오류 0.
**Actual Result**:
**Pass/Fail**:
**Pass Criteria**: 전 구간 재생, 문구 차이 없음.
**Screenshot**: `B-16-ending-replay-teaser-step3-1280.png`

## B-17 — 리소스·콘솔 전수 점검

**Precondition**: Network 탭 "Disable cache", 콘솔 비움. 1280×720.
**Steps**:
1. 개발 "엔딩 보기"부터 B-08 step 4까지 한 번에 진행.
2. Network를 `png` 필터로 확인, 콘솔 확인.
**Expected Result**: `01-ledger`, `02-settlement`, `08-certificate`, `04-rabbit`, `05-franchise`, `06-hiring-pose-overlay`, `07-credits-service-neutral` 모두 200. 404 0건, 콘솔 error 0건.
**Actual Result**:
**Pass/Fail**:
**Pass Criteria**: 404 = 0, console error = 0.
**Screenshot**: `B-17-network-png-1280.png`
