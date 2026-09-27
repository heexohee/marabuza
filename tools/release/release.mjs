// Release build (launch checklist 2026-09-27 ⛔ 개발 모드 끄기): copies src/ into an output folder (default dist/)
// as the game a player gets — build flag flipped to release, so the dev bar (auto-play, +10만) can never show,
// not even on localhost where a packaged app may run; the retired legacy flow's entry page and dev notes left out.
//
// Run from the repo root: node tools/release/release.mjs [outDir]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = 'src'
const FLAGS = 'js/build-flags.js'
/** Paths under src/ that a release never ships. */
export const EXCLUDED = new Set(['index.html', 'CLAUDE.md'])

/**
 * Builds the release into `outDir` (emptied first).
 * @param {string} outDir
 * @returns {string} outDir
 */
export function buildRelease(outDir = 'dist') {
  const flagsSrc = fs.readFileSync(path.join(SRC, FLAGS), 'utf8')
  const flags = flagsSrc.replace('export const IS_RELEASE = false', 'export const IS_RELEASE = true')
  if (flags === flagsSrc) throw new Error(`${FLAGS}: IS_RELEASE = false not found — the release flag was not set`)
  fs.rmSync(outDir, { recursive: true, force: true })
  fs.cpSync(SRC, outDir, { recursive: true, filter: (from) => !EXCLUDED.has(path.relative(SRC, from)) })
  fs.writeFileSync(path.join(outDir, FLAGS), flags)
  return outDir
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stdout.write(`release build → ${buildRelease(process.argv[2])}\n`)
}
