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

## 저장 → 파일 (스팀 클라우드 준비, 2026-09-28)

- 데스크톱 앱에서는 저장이 localStorage가 아니라 파일: `<userData>/saves/maratang-selfserve-save-v1.json`
  - macOS `~/Library/Application Support/Marabuza/saves/`, Windows `%APPDATA%\Marabuza\saves\`
  - `desktop/save-file.cjs`(임시 파일에 쓰고 이름 바꿔 덮음 — 쓰다 죽어도 이전 저장 유지, 게임 키만 허용) ← IPC ← `desktop/preload.cjs`
    (`window.marabuzaSave`, localStorage와 같은 모양) ← `src/js/self-serve/save-store.js`가 있으면 그걸, 없으면(웹) localStorage.
  - IPC는 app://game 페이지에서 온 요청만 받음. 페이지에 Node 없음(`typeof require` = undefined).
- 확인: `npm run desktop`에서 5일차 777,700원 저장 → localStorage 비어 있고 파일 807B 생성 → 앱 재시작 → 이어서 하기 → 상점 777,700원 · "DAY 6 영업 시작!"
  (`save-file-resumed.png`). 포장 앱(`npm run desktop:pack`)도 같은 파일에서 이어짐(`packaged-save-file-resumed.png`).
- Tests: `tests/unit/desktop/save_file_test.mjs` (4), `tests/unit/self-serve/save_store_test.mjs` (3) — suite 388 pass.
- **스팀 클라우드 설정(Steamworks 파트너 사이트, 사람이 할 일)**: 앱 관리 → 클라우드 → Auto-Cloud 루트 경로
  - Windows: 루트 `WinAppDataRoaming`, 하위 경로 `Marabuza/saves`, 패턴 `*.json`
  - macOS: 루트 `MacAppSupport`, 하위 경로 `Marabuza/saves`, 패턴 `*.json`
- 웹판 저장 → 데스크톱 옮기기는 안 함 (출시된 데스크톱판이 아직 없어서).
