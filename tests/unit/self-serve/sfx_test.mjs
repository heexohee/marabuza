// Click sounds (src/js/self-serve/sfx.js + audio.js playSfx): action → sound, failure sound, recipes, and the player.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ACTION_SFX, SFX_RECIPES, scheduleSfx, sfxForAction } from '../../../src/js/self-serve/sfx.js'
import { createAudioPlayer } from '../../../src/js/self-serve/audio.js'

const makeState = (toasts = [], nextToastId = toasts.length) => ({ toasts, nextToastId })

function fakeContext() {
  const oscillators = []
  const param = () => ({ setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {}, value: 1 })
  class Ctx {
    constructor() { this.currentTime = 0; this.state = 'running'; this.destination = {} }
    createGain() { return { gain: param(), connect: (n) => n } }
    createOscillator() {
      const osc = { frequency: param(), connect: (n) => n, start() {}, stop() {} }
      oscillators.push(osc)
      return osc
    }
    createBufferSource() { return { connect: (n) => n, start() {}, stop() {} } }
    decodeAudioData() { return Promise.resolve({ duration: 1 }) }
  }
  return { Ctx, oscillators }
}

const player = (Ctx) => createAudioPlayer({
  AudioContextClass: Ctx, fetchFn: () => new Promise(() => {}), onError: assert.fail,
})

test('test_sfx_requested_actions_have_their_sounds', () => {
  assert.equal(ACTION_SFX.chargeConfirm, 'pay') // 선결제
  assert.equal(ACTION_SFX.restock, 'restock') // 재고 채우기
  assert.equal(ACTION_SFX.buy, 'buy') // 상점 구매
  assert.equal(ACTION_SFX.upgrade, 'buy')
  Object.values(ACTION_SFX).forEach((key) => assert.ok(SFX_RECIPES[key], key))
})

test('test_sfx_recipes_are_short_and_well_formed', () => {
  Object.entries(SFX_RECIPES).forEach(([key, notes]) => {
    assert.ok(notes.length > 0, key)
    notes.forEach((n) => {
      assert.ok(n.from > 0 && n.gain > 0 && n.gain <= 0.4 && n.dur > 0, key)
      assert.ok(n.at + n.dur <= 0.6, `${key} longer than 0.6 s`)
    })
  })
})

test('test_sfx_for_action_plays_the_action_sound_when_state_changed', () => {
  const prev = makeState()
  assert.equal(sfxForAction('restock', prev, { ...prev }), 'restock')
  assert.equal(sfxForAction('chargeConfirm', prev, { ...prev }), 'pay')
  assert.equal(sfxForAction('storyNext', prev, { ...prev }), null) // unmapped → silent
})

test('test_sfx_for_action_is_silent_when_nothing_changed', () => {
  const prev = makeState()
  assert.equal(sfxForAction('buy', prev, prev), null)
})

test('test_sfx_for_action_new_warning_toast_plays_oops', () => {
  const prev = makeState([{ id: 0, kind: 'bad' }], 1) // an old warning must not count
  assert.equal(sfxForAction('buy', prev, { ...prev }), 'buy')
  const next = makeState([{ id: 0, kind: 'bad' }, { id: 1, kind: 'bad' }], 2)
  assert.equal(sfxForAction('buy', prev, next), 'oops')
  const info = makeState([{ id: 0, kind: 'bad' }, { id: 1, kind: 'info' }], 2)
  assert.equal(sfxForAction('buy', prev, info), 'buy')
})

test('test_sfx_schedule_makes_one_oscillator_per_note', () => {
  const { Ctx, oscillators } = fakeContext()
  scheduleSfx(new Ctx(), {}, SFX_RECIPES.buy)
  assert.equal(oscillators.length, SFX_RECIPES.buy.length)
})

test('test_sfx_player_silent_before_unlock_when_off_and_for_null', () => {
  const { Ctx, oscillators } = fakeContext()
  const p = player(Ctx)
  p.playSfx('pay')
  assert.equal(oscillators.length, 0) // not unlocked
  p.unlock()
  p.playSfx(null)
  p.setPrefs({ muted: false, sfxMuted: true, volume: 0.7 })
  p.playSfx('pay')
  assert.equal(oscillators.length, 0)
  p.setPrefs({ muted: true, sfxMuted: false, volume: 0.7 }) // music off does not silence clicks
  p.playSfx('pay')
  assert.equal(oscillators.length, SFX_RECIPES.pay.length)
})

test('test_sfx_player_merges_the_same_sound_clicked_twice_at_once', () => {
  const { Ctx, oscillators } = fakeContext()
  const p = player(Ctx)
  p.unlock()
  p.playSfx('tap')
  p.playSfx('tap')
  p.playSfx('pay')
  assert.equal(oscillators.length, SFX_RECIPES.tap.length + SFX_RECIPES.pay.length)
})
