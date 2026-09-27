// Emoji written inside words ("건너뛰기 ⏭", "같은 🎫 번호", "📒 장부", toasts…) were drawn by the player's OS emoji
// font, so they looked different on every machine (launch checklist 2026-09-27). The self-serve renderer runs every
// screen's HTML through spriteText, which swaps each emoji in text for the same bundled Noto pixel sprite the rest
// of the game uses. Tag markup (attributes such as title tooltips) is left alone.
import { spriteImg } from '../sprites.js'

// same pattern as tools/art/bundle_emoji.mjs, so every emoji matched here has a bundled image
const EMOJI_RE = /\p{Extended_Pictographic}(️|‍\p{Extended_Pictographic}️?|[\u{1F3FB}-\u{1F3FF}])*/gu
/** Pictographs that read as typography, not pictures: they stay characters in the pixel font. */
export const TEXT_SYMBOLS = new Set(['©', '®', '™', '▶', '◀'])
const TEXT_EMOJI_PX = 16

/**
 * Replaces emoji in the text of `html` (never inside tags) with inline pixel sprites.
 * @param {string} html
 * @returns {string}
 */
export function spriteText(html) {
  return html.replace(/(<[^>]*>)|([^<]+)/g, (whole, tag, text) => (tag ? tag : text.replace(EMOJI_RE, (emoji) => {
    const bare = emoji.replace(/️/g, '')
    return TEXT_SYMBOLS.has(bare) ? emoji : spriteImg(bare, TEXT_EMOJI_PX, 'txt-emoji', bare)
  })))
}
