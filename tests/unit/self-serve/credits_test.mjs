// Credits (src/js/self-serve/screens.js): reachable from settings and carries every bundled font's license.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync } from 'node:fs'
import { CREDITS, creditsHtml, settingsHtml } from '../../../src/js/self-serve/screens.js'

const FONTS_DIR = new URL('../../../src/fonts/', import.meta.url)
const AUDIO = { muted: false, sfxMuted: false, volume: 0.5 }

test('test_settings_has_a_credits_button', () => {
  assert.match(settingsHtml(AUDIO), /data-action="credits"/)
})

test('test_credits_name_each_bundled_font_with_its_license', () => {
  const html = creditsHtml()
  for (const font of ['Galmuri', 'Noto Color Emoji']) {
    const entry = CREDITS.find((c) => c.title.includes(font))
    assert.ok(entry, `${font} missing from credits`)
    assert.ok(entry.lines.some((l) => l.includes('Open Font License')), `${font} license line missing`)
    assert.match(html, new RegExp(font))
  }
  assert.match(html, /data-action="closeCredits"/)
})

test('test_every_credited_font_ships_its_license_text', () => {
  const files = readdirSync(FONTS_DIR)
  assert.ok(files.includes('OFL-Galmuri.md'))
  assert.ok(files.includes('OFL-NotoColorEmoji.md'))
})
