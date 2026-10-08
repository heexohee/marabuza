// Language support (request 2026-10-02: English build for demo feedback). The game is written in Korean, and the
// legacy modules it borrows text from stay frozen, so English is applied to the finished HTML rather than at every
// call site: ui.js runs each section's markup through translate() just before it goes on screen.
//
// A dictionary entry maps Korean → English. Entries with {placeholders} become patterns:
//   {n}  a number ("3", "1,200", "-1")          {m}  money: "1,200원" → in English "₩1,200"
//   {w}  one word (no spaces)                     {t}  any text inside one tag (may hold spaces)
// Add a digit to use a kind twice ({n}, {n2}). Captured words and text are translated again on their own, so
// "{w}가 시들어 버렸어요" turns "청경채" into "Bok choy" before it lands in the English sentence.
// Order: text runs / attribute values that are exactly an entry → then every entry, patterns and phrases alike,
// longest Korean first — so whole sentences go before the short patterns ("{n}단계") that sit inside them.
// One-syllable entries (요일 letters, "곰") only ever replace a whole text run or a captured word.

const STORAGE_KEY = 'marabuza.lang'
/** Languages the game can show, in settings order. */
export const LANGS = ['ko', 'en']

const PLACEHOLDER = /\{([a-z]+)(\d*)\}/g
const HAS_PLACEHOLDER = /\{[a-z]+\d*\}/
const KIND_SOURCE = {
  n: '([−+-]?\\d[\\d,.]*)',
  m: '(\\d[\\d,]*)원',
  w: '([^\\s<>"\'(),·]+?)',
  t: '([^<>"\\n]+?)',
}
const HTML_ESCAPES = { '"': '&quot;', "'": '&#39;' }
const escRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const escHtml = (text) => text.replace(/["']/g, (ch) => HTML_ESCAPES[ch])
const HANGUL = /[가-힣]/
const MEMO_MAX = 2000 // translated text pieces kept (each a line or a label, not a whole section)

/** A pattern entry as a regex, with its placeholder names in capture order. */
function compilePattern(ko, en) {
  const keys = []
  let source = ''
  let last = 0
  for (const m of ko.matchAll(PLACEHOLDER)) {
    source += escRegex(ko.slice(last, m.index)) + (KIND_SOURCE[m[1]] ?? KIND_SOURCE.t)
    keys.push(m[0])
    last = m.index + m[0].length
  }
  source += escRegex(ko.slice(last))
  return { ko, regex: new RegExp(source, 'g'), keys, en, literal: ko.replace(PLACEHOLDER, '').length }
}

// text between tags, a leading run before the first tag, and attribute values people read
const TEXT_RUNS = /(>)([^<]+)(<|$)|^([^<]+)(<|$)|((?:title|alt|aria-label|placeholder|value)=")([^"]*)(")/g

/**
 * Builds a translator from a Korean → English dictionary.
 * @param {Record<string, string>} dict
 * @returns {(html: string) => string} memoised; text without Hangul passes straight through
 */
export function createTranslator(dict) {
  // quotes inside story lines reach the page HTML-escaped, so each entry is also known in that form
  const entries = Object.entries(dict).flatMap(([ko, en]) => (escHtml(ko) === ko ? [[ko, en]] : [[ko, en], [escHtml(ko), escHtml(en)]]))
  const exact = new Map(entries.filter(([ko]) => !HAS_PLACEHOLDER.test(ko)))
  const rules = [
    ...entries.filter(([ko]) => HAS_PLACEHOLDER.test(ko)).map(([ko, en]) => compilePattern(ko, en)),
    ...[...exact].filter(([ko]) => ko.length > 1).map(([ko, en]) => ({ ko, en, literal: ko.length })),
  ].sort((a, b) => b.literal - a.literal)
  // Performance (feedback 2026-10-02: the English game stuttered in Electron): only the text pieces that hold Hangul
  // are translated — never the whole section, whose markup (sprite <img> data URLs) can be many KB — and each piece
  // is remembered on its own. The same lines come back all day, so nearly every piece is a cache hit, and the cache
  // holds short strings only.
  const memo = new Map()
  const remember = (key, value) => {
    if (memo.size >= MEMO_MAX) memo.delete(memo.keys().next().value) // oldest first
    memo.set(key, value)
    return value
  }

  // a pattern's captured words go through piece() (hoisted below), so "청경채" arrives in English too; the value is
  // handed over as a function so "$&" / "$'" in a player's name stay literal (code review 2026-10-09)
  const fill = (rule) => (...groups) => rule.keys.reduce((out, key, i) => {
    const value = key.startsWith('{m') ? `₩${groups[i + 1]}` : piece(groups[i + 1])
    return out.replace(key, () => value)
  }, rule.en)

  function applyRules(text) {
    let out = text
    for (const rule of rules) {
      if (!HANGUL.test(out)) break
      out = rule.regex ? out.replace(rule.regex, fill(rule)) : out.replaceAll(rule.ko, rule.en)
    }
    return out
  }
  /** One text run or attribute value: a whole entry if it is one, else every rule in order. */
  function piece(text) {
    if (!HANGUL.test(text)) return text
    const hit = memo.get(text)
    if (hit !== undefined) return hit
    const trimmed = text.trim()
    const whole = exact.get(trimmed)
    return remember(text, whole === undefined ? applyRules(text) : text.replace(trimmed, whole))
  }

  // entries that span tags ("<b>이어서 하기</b>를 누르면") go before the per-run pass would split them up
  const spanning = rules.filter((rule) => rule.ko.includes('<'))
  const applySpanning = (html) => spanning.reduce((out, rule) =>
    (rule.regex ? out.replace(rule.regex, fill(rule)) : out.replaceAll(rule.ko, rule.en)), html)

  return function translate(html) {
    if (typeof html !== 'string' || !HANGUL.test(html)) return html
    return applySpanning(html).replace(TEXT_RUNS, (all, a, text, b, lead, end, attr, value, close) => {
      if (text !== undefined) return a + piece(text) + b
      if (lead !== undefined) return piece(lead) + end
      return attr + piece(value) + close
    })
  }
}

/** The identity "translation" used for Korean. */
export const keepKorean = (html) => html

/**
 * The language to start in: the saved choice, else the system's (Korean → ko, anything else → en).
 * @param {Storage|undefined} storage
 * @param {{ languages?: readonly string[], language?: string }|undefined} nav
 */
export function loadLang(storage, nav) {
  try {
    const saved = storage?.getItem(STORAGE_KEY)
    if (LANGS.includes(saved)) return saved
  } catch {
    // unreadable storage: fall through to the system language
  }
  const system = nav?.languages?.[0] ?? nav?.language ?? 'ko'
  return system.toLowerCase().startsWith('ko') ? 'ko' : 'en'
}

/** @param {Storage|undefined} storage @returns {boolean} whether it was stored */
export function saveLang(storage, lang) {
  try {
    storage?.setItem(STORAGE_KEY, lang)
    return true
  } catch {
    return false
  }
}

/** The other language (the settings button switches between the two). */
export const otherLang = (lang) => (lang === 'en' ? 'ko' : 'en')
