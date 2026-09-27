# Evidence — 출시 빌드에서 개발 모드 끄기 (launch checklist 2026-09-27 ⛔)

- `release-title-no-dev-bar.png` — `node tools/release/release.mjs` → dist/ 를 localhost:8131 에서 `?dev` 붙여 열어도
  왼쪽 아래 DEV 배지·개발 바 없음 (`[data-dev]` 0개). 개발 서버(src/, localhost:8123)에는 그대로 있음.
- dist/ 에서 `index.html`(레거시 흐름 입구) → 404, `CLAUDE.md` 없음. `dist/js/build-flags.js` = `IS_RELEASE = true`, src/ 는 false 그대로.
- 방식: `src/js/build-flags.js` IS_RELEASE → `dev.js` isDevMode 가 release 면 항상 false. 빌드 스크립트는 플래그 치환을 못 찾으면 실패.
- Tests: tests/unit/release/release_build_test.mjs (3) — suite 374 pass.
