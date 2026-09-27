# 출시 체크리스트: 글꼴 내장 + 이모지 대체 그림 — 증거 (2026-09-27)

## 무엇을 바꿨나
- **글꼴**: `src/index.html`·`src/self-serve.html`이 jsDelivr 대신 `src/fonts/galmuri.css`를 읽음. 쓰는 세 벌만 동봉(Galmuri11 400/700, Galmuri9 — 약 1.1MB), OFL 전문 `src/fonts/OFL-Galmuri.md`.
- **이모지 그림**: `src/js/sprites.js`가 기기 이모지 글꼴 대신 `src/img/emoji/`의 Noto PNG(64px, 78개, 약 390KB)를 캔버스에 그려 도트화. 이미지는 모듈 최상위 `await`로 첫 화면 전에 모두 불러옴. 목록에 없는 이모지만 예전처럼 기기 글꼴로 그림(콘솔 경고 없이 조용히 예비 경로).
- **도구**: `tools/art/bundle_emoji.mjs` — `src/js`에서 쓰는 이모지를 찾아 PNG를 복사하고 `src/js/emoji-images.js`(생성 파일)를 씀.

## 자동 테스트
`node --test tests/unit/*.mjs tests/unit/**/*.mjs` — 176개 통과(변경 전과 동일). Node에는 `Image`가 없어 테스트에서는 불러오기를 건너뜀.

## 실제 화면 (Chromium, 1280×800, localhost 밖 요청 전부 차단)
- 외부 요청 0건, `document.fonts`에 Galmuri11 400·700 로드 확인
- `offline-assets/self-serve-title.png` — 셀프 담기 타이틀, Galmuri 표시
- `offline-assets/self-serve-day1.png` — DAY 1 영업: 손님 얼굴·재료 칸·주문 칩이 Noto 그림 기반 도트
- `offline-assets/classic-title.png` — 클래식 타이틀의 동물 행렬·냄비 (Noto 그림)

## 남은 것
- 글자 속 이모지(버튼 "⏭", 안내 "🎫", 장부 "📒" 등)는 스프라이트가 아니라 텍스트라 여전히 기기 글꼴로 그려짐.
