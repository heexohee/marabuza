// Ending credits in the settings (request 2026-09-27): a button in the settings, every CREDITS line in the roll.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CREDITS } from '../../../src/js/self-serve/data.js'
import { creditsHtml, settingsHtml } from '../../../src/js/self-serve/screens.js'

test('test_credits_settings_has_an_ending_credits_button', () => {
  assert.match(settingsHtml({ muted: false, volume: 0.5, sfxMuted: false }), /data-action="credits">엔딩 크레딧/)
})

test('test_credits_roll_lists_every_role_and_name_and_can_close', () => {
  const html = creditsHtml()
  for (const c of CREDITS) {
    assert.ok(html.includes(c.role), c.role)
    for (const n of c.names) assert.ok(html.includes(n.replace('&', '&amp;')) || html.includes(n), n)
  }
  assert.match(html, /data-action="closeCredits"/)
})
