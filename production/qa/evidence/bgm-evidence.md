# BGM 연결 — 검증 기록 (2026-09-27)

사용자 요청(스토리 없음): 게임 BGM/OST 제작 → 게임 화면 연결.

## 변경
- 생성기 `tools/audio/bgm_demo.py` → `src/audio/*.m4a` (루프 3 + 징글 3, 656 KB)
- `src/js/self-serve/audio.js` (신규): 단계별 곡(PHASE_MUSIC), 징글 규칙, 볼륨 설정(localStorage `maratang.audio.v1`), Web Audio 플레이어
- `main.js`: 첫 클릭/키 입력에 오디오 잠금 해제, 매 프레임 `setPhase`, `M` 키 음소거(이름 입력 중 제외), 설정 액션
- `screens.js` `musicControlsHtml` — 타이틀 설정 + 일시정지 메뉴, `self-serve.css` `.music-controls`

| 단계 | 곡 |
|---|---|
| menu / create / opening | bgm-title |
| day | bgm-business |
| summary / shop / sunday | bgm-shop (day → summary 는 jingle-day-end 후) |
| closed | jingle-closed 후 무음 |
| (1부 엔딩) | jingle-ending — 엔딩 장면 생기면 연결 |

## 자동 테스트
`tests/unit/self-serve/audio_test.mjs` 11개 통과, 전체 307 통과.

## 브라우저 확인 (in-app 브라우저, localhost:58049)
- 디코딩 길이 = 루프 길이 정확히 일치, 앞쪽 무음 0 샘플 → 끊김 없는 루프
  - title 36.9231 s, business 61.2766 s, shop 38.4000 s
- 새 게임 → 영업 → DEV 하루 자동 → 정산: 요청 순서 title → business → jingle-day-end → shop, 콘솔 오류 없음
- 설정 창: 배경음악 켜짐/꺼짐 + − 70% + 표시, `M` → 음소거·저장, `+` → 80%·음소거 해제·저장
- 이름 입력칸에 "mimi" 입력 시 음소거 안 됨

## 미보관
설정 창 스크린샷은 세션 안에서 확인했지만 파일로 저장하지 못함(스크린샷 저장 도구가 다른 세션의 브라우저와 충돌). UI 증거 파일은 다음 확인 때 추가 필요.
