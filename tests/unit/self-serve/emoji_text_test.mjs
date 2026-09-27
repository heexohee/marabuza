// Emoji inside words become bundled pixel sprites (src/js/self-serve/emoji-text.js, launch checklist 2026-09-27).
import { test } from 'node:test'
import assert from 'node:assert/strict'

// spriteImg paints sprites on a canvas; node has none, so a blank canvas stands in (the markup is what is tested).
function fakeCanvas() {
  const canvas = { width: 0, height: 0, toDataURL: () => 'data:,' }
  const ctx = {
    fillText() {}, fillRect() {}, drawImage() {}, putImageData() {},
    getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(w, canvas.width) * Math.max(h, canvas.height) * 4) }),
  }
  canvas.getContext = () => ctx
  return canvas
}
globalThis.document ??= { createElement: () => fakeCanvas() }
globalThis.ImageData ??= class { constructor(data, w, h) { Object.assign(this, { data, width: w, height: h }) } }

const { spriteText } = await import('../../../src/js/self-serve/emoji-text.js')
const sprites = (html) => [...html.matchAll(/<img class="px txt-emoji"[^>]*alt="([^"]*)"/g)].map((m) => m[1])

test('test_emoji_text_emoji_in_words_become_sprites', () => {
  const html = spriteText('<button>건너뛰기 ⏭</button><p>같은 🎫 번호 · 📒 장부</p>')
  assert.deepEqual(sprites(html), ['⏭', '🎫', '📒'])
  assert.match(html, /^<button>건너뛰기 <img/)
  assert.doesNotMatch(html.replace(/<[^>]*>/g, ''), /\p{Extended_Pictographic}/u, 'no emoji left as text')
})

test('test_emoji_text_attributes_are_left_alone', () => {
  const html = spriteText('<button title="장부 📒" data-arg="x">ok</button>')
  assert.equal(html, '<button title="장부 📒" data-arg="x">ok</button>')
})

test('test_emoji_text_variation_selector_is_dropped_and_typographic_symbols_stay', () => {
  assert.deepEqual(sprites(spriteText('<b>🌶️ 맵기</b>')), ['🌶'])
  assert.equal(spriteText('<span>▶ 클릭 · © 2026</span>'), '<span>▶ 클릭 · © 2026</span>')
})

test('test_emoji_text_plain_text_without_emoji_is_unchanged', () => {
  const html = '<div class="a"><span>DAY 3 · 1,800원 ✓</span></div>'
  assert.equal(spriteText(html), html)
})
