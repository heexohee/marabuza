// Maps an app:// URL to a file inside the release folder (dist/), or null. The desktop app serves the game through
// its own app:// scheme rather than file:// — Chromium blocks ES modules over file://, and a standard scheme keeps
// one stable origin, so localStorage saves survive app updates. Pure, so node tests can check it.
const path = require('node:path')

const APP_HOST = 'game'
const APP_ORIGIN = `app://${APP_HOST}`
const ENTRY = 'self-serve.html'

/**
 * @param {string} url a request URL such as app://game/js/main.js?v=1
 * @param {string} root absolute path of the release folder
 * @returns {string | null} absolute file path inside root, or null for another host or an escaping path
 */
function resolveAppPath(url, root) {
  let parsed
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  if (parsed.protocol !== 'app:' || parsed.host !== APP_HOST) return null
  let rel
  try {
    rel = decodeURIComponent(parsed.pathname).replace(/^\/+/, '')
  } catch {
    return null
  }
  const file = path.resolve(root, rel || ENTRY)
  const inside = file === root || file.startsWith(root + path.sep)
  return inside && file !== root ? file : null
}

module.exports = { APP_ORIGIN, ENTRY, resolveAppPath }
