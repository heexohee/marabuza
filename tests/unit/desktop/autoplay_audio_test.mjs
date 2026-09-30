// Desktop title music from launch (request 2026-09-30): a browser keeps audio locked until the first click, so
// the title used to stay silent until then — the desktop app allows autoplay and starts the music at once.
// The browser build still waits for a gesture.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { canAutoplay } from '../../../src/js/self-serve/audio.js'

test('test_autoplay_audio_allowed_only_where_the_desktop_app_says_so', () => {
  assert.equal(canAutoplay({ marabuzaDesktop: { autoplayAudio: true } }), true)
  assert.equal(canAutoplay({}), false, 'a browser tab waits for the first click')
  assert.equal(canAutoplay({ marabuzaDesktop: {} }), false)
  assert.equal(canAutoplay(undefined), false)
})

test('test_autoplay_audio_desktop_window_lifts_the_gesture_rule_and_tells_the_game', () => {
  // Arrange
  const main = fs.readFileSync('desktop/main.cjs', 'utf8')
  const preload = fs.readFileSync('desktop/preload.cjs', 'utf8')

  // Assert: Chromium's autoplay policy is off for the game window, and the preload says so to the page
  assert.match(main, /autoplayPolicy:\s*'no-user-gesture-required'/)
  assert.match(preload, /exposeInMainWorld\('marabuzaDesktop',\s*\{\s*autoplayAudio:\s*true\s*\}\)/)
})

test('test_autoplay_audio_game_starts_the_music_on_launch_when_allowed', () => {
  const src = fs.readFileSync('src/js/self-serve/main.js', 'utf8')
  assert.match(src, /if \(canAutoplay\(window\)\) audio\.unlock\(\)/)
})
