// Build flags. The source tree is always a development build; tools/release/release.mjs rewrites this file in its
// dist/ copy to `true`, which keeps every dev-only tool off there (launch checklist 2026-09-27 ⛔ 개발 모드 끄기).
export const IS_RELEASE = false
