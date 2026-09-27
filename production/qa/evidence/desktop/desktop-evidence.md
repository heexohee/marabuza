# Evidence — 데스크톱 앱 포장 (Electron, launch checklist 2026-09-27 ⛔)

- 구조: `desktop/main.cjs`(Electron 창, 1280×800, 최소 960×600, 메뉴 없음) + `desktop/app-path.cjs`(app://game → dist/ 파일, 밖으로 못 나감).
  게임 코드는 그대로 — `dist/`(출시 플래그로 개발 바 없음)를 app:// 프로토콜로 띄움. contextIsolation·sandbox 켬, nodeIntegration 끔,
  새 창·외부 이동 차단, 포장본은 DevTools 끔.
- `electron-day1.png` — `npm run desktop`(Electron 44.4.5): 타이틀(움직이는 배경) → 새 게임 → 1일차, 진열 10/12, 개발 바 없음,
  BGM fetch 200, 스크롤 없음, 오류 0.
- `electron-resumed-shop.png` — 저장(3일차 상점 612,345원) → 앱 종료 → 다시 실행 → 이어서 하기 → 상점 612,345원 · "DAY 4 영업 시작!" (localStorage 유지).
- `packaged-title.png` — `npm run desktop:pack`(electron-builder 26.15.3, 서명 안 함) → `out/desktop/mac-arm64/Marabuza.app` 294MB
  (app.asar 2.9MB = desktop/ 3 · dist/ 150 · package.json, index.html·CLAUDE.md·tests 없음). 포장 앱 실행 → 타이틀, 개발 바 없음, 저장 이어짐.
- Tests: `tests/unit/desktop/app_path_test.mjs` (4) — suite 381 pass (`npm test`).
- 안 한 것: 윈도우 빌드·실행(맥에서 확인 불가 — 윈도우 PC나 CI 필요), 코드 서명·공증, 앱 아이콘(기본 Electron 아이콘), 스팀 SDK.
