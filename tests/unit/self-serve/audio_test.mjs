// Background music (src/js/self-serve/audio.js): phase → track, jingles, volume prefs, and the player with a fake AudioContext.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  AUDIO_TRACKS, DEFAULT_AUDIO_PREFS, PHASE_MUSIC, changeVolume, createAudioPlayer, jingleForTransition, loadAudioPrefs,
  masterGain, musicForPhase, sanitizeAudioPrefs, saveAudioPrefs, toggleMuted,
} from '../../../src/js/self-serve/audio.js'
import { musicControlsHtml, settingsHtml } from '../../../src/js/self-serve/screens.js'

const GAME_PHASES = ['menu', 'create', 'opening', 'day', 'summary', 'shop', 'sunday', 'closed']

function fakeStorage(initial = {}) {
  const data = { ...initial }
  return { getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = String(v) }, data }
}

function fakeAudio() {
  const started = []
  const param = () => ({ value: 1, setValueAtTime() {}, linearRampToValueAtTime() {}, cancelScheduledValues() {}, setTargetAtTime(v) { this.value = v } })
  class FakeContext {
    constructor() { this.currentTime = 0; this.state = 'running'; this.destination = {} }
    createGain() { return { gain: param(), connect: (n) => n } }
    createBufferSource() {
      const src = { connect: (n) => n, start() { started.push(src) }, stop() { src.stopped = true } }
      return src
    }
    decodeAudioData(url) { return Promise.resolve({ url, duration: 0.01 }) }
  }
  const fetchFn = (url) => Promise.resolve({ ok: true, arrayBuffer: async () => url })
  return { FakeContext, fetchFn, started }
}

const settle = (ms = 0) => new Promise((r) => setTimeout(r, ms))

test('test_every_game_phase_has_a_music_entry_and_every_track_exists', () => {
  GAME_PHASES.forEach((phase) => assert.ok(phase in PHASE_MUSIC, phase))
  Object.values(PHASE_MUSIC).filter(Boolean).forEach((key) => assert.ok(AUDIO_TRACKS[key], key))
})

test('test_music_for_phase_title_business_shop_and_silence', () => {
  assert.equal(musicForPhase('menu'), 'title')
  assert.equal(musicForPhase('day'), 'business')
  assert.equal(musicForPhase('summary'), 'shop')
  assert.equal(musicForPhase('sunday'), 'shop')
  assert.equal(musicForPhase('closed'), null)
  assert.equal(musicForPhase('unknown'), null)
})

test('test_jingle_plays_on_day_end_and_closing_only', () => {
  assert.equal(jingleForTransition('day', 'summary'), 'dayEnd')
  assert.equal(jingleForTransition('day', 'closed'), 'closed')
  assert.equal(jingleForTransition('sunday', 'closed'), 'closed')
  assert.equal(jingleForTransition('shop', 'day'), null)
  assert.equal(jingleForTransition('menu', 'menu'), null)
  assert.equal(jingleForTransition(null, 'menu'), null)
})

test('test_prefs_sanitize_bad_values_to_defaults_and_clamp_volume', () => {
  assert.deepEqual(sanitizeAudioPrefs(null), DEFAULT_AUDIO_PREFS)
  assert.deepEqual(sanitizeAudioPrefs({ muted: 'yes', volume: 'loud' }), DEFAULT_AUDIO_PREFS)
  assert.deepEqual(sanitizeAudioPrefs({ muted: true, volume: 3 }), { muted: true, volume: 1 })
  assert.deepEqual(sanitizeAudioPrefs({ muted: false, volume: -1 }), { muted: false, volume: 0 })
})

test('test_volume_steps_clamp_and_turning_up_unmutes', () => {
  assert.deepEqual(changeVolume({ muted: false, volume: 0.9 }, 0.1), { muted: false, volume: 1 })
  assert.deepEqual(changeVolume({ muted: false, volume: 1 }, 0.1), { muted: false, volume: 1 })
  assert.deepEqual(changeVolume({ muted: false, volume: 0.1 }, -0.1), { muted: false, volume: 0 })
  assert.deepEqual(changeVolume({ muted: true, volume: 0.5 }, 0.1), { muted: false, volume: 0.6 })
  assert.deepEqual(changeVolume({ muted: true, volume: 0.5 }, -0.1), { muted: true, volume: 0.4 })
  assert.equal(masterGain(toggleMuted({ muted: false, volume: 0.7 })), 0)
})

test('test_prefs_round_trip_through_storage_and_survive_broken_storage', () => {
  const storage = fakeStorage()
  assert.equal(saveAudioPrefs(storage, { muted: true, volume: 0.3 }), true)
  assert.deepEqual(loadAudioPrefs(storage), { muted: true, volume: 0.3 })
  assert.deepEqual(loadAudioPrefs(fakeStorage({ 'maratang.audio.v1': '{not json' })), DEFAULT_AUDIO_PREFS)
  assert.deepEqual(loadAudioPrefs(undefined), DEFAULT_AUDIO_PREFS)
  const throwing = { getItem() { throw new Error('blocked') }, setItem() { throw new Error('blocked') } }
  assert.deepEqual(loadAudioPrefs(throwing), DEFAULT_AUDIO_PREFS)
  assert.equal(saveAudioPrefs(throwing, DEFAULT_AUDIO_PREFS), false)
})

test('test_music_controls_show_state_and_disable_volume_at_the_ends', () => {
  const on = musicControlsHtml({ muted: false, volume: 1 })
  assert.match(on, /배경음악 켜짐/)
  assert.match(on, /100%/)
  assert.match(on, /data-arg="1"[^>]*disabled/)
  const off = musicControlsHtml({ muted: true, volume: 0 })
  assert.match(off, /배경음악 꺼짐/)
  assert.match(off, /음소거/)
  assert.match(off, /data-arg="-1"[^>]*disabled/)
  assert.match(settingsHtml({ muted: false, volume: 0.7 }), /music-controls/)
})

test('test_player_stays_silent_until_unlocked_then_plays_the_current_phase', async () => {
  const { FakeContext, fetchFn, started } = fakeAudio()
  const player = createAudioPlayer({ AudioContextClass: FakeContext, fetchFn, onError: assert.fail })
  player.setPhase('menu')
  await settle()
  assert.equal(started.length, 0)
  player.unlock()
  await settle()
  assert.equal(started.length, 1)
  assert.equal(started[0].buffer.url, AUDIO_TRACKS.title)
  assert.equal(started[0].loop, true)
})

test('test_player_plays_the_day_end_jingle_then_the_shop_loop', async () => {
  const { FakeContext, fetchFn, started } = fakeAudio()
  const player = createAudioPlayer({ AudioContextClass: FakeContext, fetchFn, onError: assert.fail })
  player.unlock()
  player.setPhase('day')
  await settle()
  player.setPhase('summary')
  await settle(500) // jingle (0.01 s fake) + AUDIO_TUNING.afterJingleSec
  assert.deepEqual(started.map((s) => [s.buffer.url, s.loop]), [
    [AUDIO_TRACKS.business, true], [AUDIO_TRACKS.dayEnd, false], [AUDIO_TRACKS.shop, true],
  ])
  assert.equal(started[0].stopped, true)
})

test('test_player_same_track_across_phases_keeps_playing', async () => {
  const { FakeContext, fetchFn, started } = fakeAudio()
  const player = createAudioPlayer({ AudioContextClass: FakeContext, fetchFn, onError: assert.fail })
  player.unlock()
  player.setPhase('shop')
  await settle()
  player.setPhase('sunday')
  await settle()
  assert.equal(started.length, 1)
  assert.notEqual(started[0].stopped, true)
})

test('test_player_reports_a_failed_load_once', async () => {
  const { FakeContext } = fakeAudio()
  const errors = []
  const fetchFn = () => Promise.resolve({ ok: false, status: 404 })
  const player = createAudioPlayer({ AudioContextClass: FakeContext, fetchFn, onError: (m) => errors.push(m) })
  player.unlock()
  player.setPhase('menu')
  await settle()
  player.setPhase('day')
  await settle()
  assert.equal(errors.length, 1)
  assert.match(errors[0], /음악을 불러오지 못했어요/)
})
