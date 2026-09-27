// The desktop app's save (launch checklist ⛔ 저장 → 파일 + 스팀 클라우드): one JSON file per save key in
// <userData>/saves/, so Steam Auto-Cloud can sync that folder (localStorage's LevelDB cannot be synced safely).
// Writes go to a temp file first and are renamed over the old one, so a crash mid-write keeps the last save.
// Same getItem / setItem / removeItem shape as localStorage; failures return false or null instead of throwing.
const fs = require('node:fs')
const path = require('node:path')

/** Only the self-serve flow's own keys (src/js/self-serve/data.js SAVE_KEY) — never a path. */
const SAVE_KEY_RE = /^maratang-selfserve-[a-z0-9]+(-[a-z0-9]+)*$/

/** @param {unknown} key */
const isSaveKey = (key) => typeof key === 'string' && SAVE_KEY_RE.test(key)

/**
 * @param {string} dir the saves folder (created on first write)
 * @param {Partial<typeof fs>} [io] fs overrides for tests
 */
function createSaveFile(dir, io = {}) {
  const f = { ...fs, ...io }
  const fileOf = (key) => path.join(dir, `${key}.json`)
  return {
    getItem(key) {
      if (!isSaveKey(key)) return null
      try {
        return f.readFileSync(fileOf(key), 'utf8')
      } catch {
        return null
      }
    },
    setItem(key, value) {
      if (!isSaveKey(key)) return false
      const tmp = `${fileOf(key)}.tmp`
      try {
        f.mkdirSync(dir, { recursive: true })
        f.writeFileSync(tmp, String(value), 'utf8')
        f.renameSync(tmp, fileOf(key))
        return true
      } catch {
        try { f.rmSync(tmp, { force: true }) } catch { /* nothing to clean up */ }
        return false
      }
    },
    removeItem(key) {
      if (!isSaveKey(key)) return false
      try {
        f.rmSync(fileOf(key), { force: true })
        return true
      } catch {
        return false
      }
    },
  }
}

module.exports = { createSaveFile, isSaveKey }
