// Self-serve save slot: round-trips the warehouse including skewer/cilantro stock,
// rejects malformed data, and never touches the original flow's slot.
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { beginNewGame, buyPack, createNewGame, finishCharacter, resumeShop, startDay, tick } from '../../../src/js/self-serve/logic.js'
import { isValidSave, loadGame, saveGame } from '../../../src/js/self-serve/save.js'
import { SAVE_KEY } from '../../../src/js/self-serve/data.js'

const ORIGINAL_KEY = 'maratang-save-v1'

// In-memory localStorage stand-in (node has none).
function memoryStorage() {
  const store = new Map()
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  }
}

beforeEach(() => { globalThis.localStorage = memoryStorage() })

test('test_selfserve_save_round_trips_extra_warehouse_stock', () => {
  const s = buyPack({ ...createNewGame(), phase: 'shop' }, 'skewer_shrimp')
  assert.equal(saveGame(s), true)
  const loaded = loadGame()
  assert.equal(loaded.stock.skewer_shrimp, s.stock.skewer_shrimp)
  assert.equal(loaded.stock.cilantro, s.stock.cilantro)
  assert.equal(loaded.money, s.money)
})

test('test_selfserve_save_uses_its_own_slot', () => {
  saveGame(createNewGame())
  assert.notEqual(localStorage.getItem(SAVE_KEY), null)
  assert.equal(localStorage.getItem(ORIGINAL_KEY), null)
})

test('test_selfserve_save_rejects_unknown_or_negative_stock', () => {
  const good = { version: 1, day: 1, money: 0, rating: 3, pricePer100g: 2200, stock: { noodle: 1, cilantro: 2 }, unlocked: ['noodle'], upgrades: { pots: 1 } }
  assert.equal(isValidSave(good), true)
  assert.equal(isValidSave({ ...good, stock: { hacked: 5 } }), false)
  assert.equal(isValidSave({ ...good, stock: { cilantro: -1 } }), false)
  assert.equal(isValidSave({ ...good, unlocked: ['cilantro'] }), false, 'extras are never "unlocked" ingredients')
})

// First save right after character creation (decision 2026-09-29, QA sign-off part1-delta condition 3): quitting
// in the rest of the opening or during day 1 no longer loses the character — 이어하기 opens day 1.
test('test_selfserve_save_after_character_creation_resumes_at_day_one', () => {
  // Arrange: creation finished, the takeover scene of the opening is playing
  const created = finishCharacter({ ...beginNewGame(), phase: 'create', character: { ...createNewGame().character, name: '초아' } })

  // Act
  assert.equal(saveGame(created), true)
  const loaded = loadGame()
  const resumed = resumeShop(loaded)

  // Assert
  assert.equal(JSON.parse(localStorage.getItem(SAVE_KEY)).phase, 'ready')
  assert.equal(loaded.phase, 'ready')
  assert.equal(loaded.character.name, '초아')
  assert.equal(resumed.phase, 'day')
  assert.equal(resumed.day, 1)
  assert.equal(resumed.money, created.money)
})

test('test_selfserve_save_phase_accepts_ready_and_sunday_only', () => {
  const good = { version: 1, day: 1, money: 0, rating: 3, pricePer100g: 2200, stock: { noodle: 1 }, unlocked: ['noodle'], upgrades: { pots: 1 } }
  assert.equal(isValidSave({ ...good, phase: 'ready' }), true)
  assert.equal(isValidSave({ ...good, phase: 'sunday' }), true)
  assert.equal(isValidSave({ ...good, phase: 'day' }), false)
})

// Mid-day save (decision 2026-09-29): the running day is saved as-is, so quitting to the title and pressing
// 이어하기 returns to that exact moment — a bad day cannot be re-rolled by restarting it.
const midDay = () => {
  let s = startDay({ ...createNewGame(), phase: 'shop', day: 5 })
  for (let i = 0; i < 300; i++) s = tick(s, 0.1) // 30 seconds into the day, customers arriving
  return s
}

test('test_selfserve_save_mid_day_resumes_at_the_same_moment', () => {
  // Arrange
  const day = midDay()

  // Act
  assert.equal(saveGame(day), true)
  const resumed = resumeShop(loadGame())

  // Assert
  assert.equal(resumed.phase, 'day')
  assert.equal(resumed.day, 5)
  assert.equal(resumed.dayTime, day.dayTime)
  assert.equal(resumed.money, day.money)
  assert.deepEqual(resumed.queue, day.queue)
  assert.deepEqual(resumed.pots, day.pots)
  assert.deepEqual(resumed.stats, day.stats)
})

test('test_selfserve_save_day_summary_resumes_on_the_summary', () => {
  // Arrange: the day ran out and its results are showing
  let s = midDay()
  for (let i = 0; i < 2000 && s.phase === 'day'; i++) s = tick(s, 0.1)
  assert.equal(s.phase, 'summary')

  // Act
  saveGame(s)
  const resumed = resumeShop(loadGame())

  // Assert: the results screen again, so 상점으로 still runs the day's close-out (week roll, Sunday)
  assert.equal(resumed.phase, 'summary')
  assert.deepEqual(resumed.stats, s.stats)
})

test('test_selfserve_save_mid_day_needs_its_snapshot', () => {
  const good = { version: 1, day: 5, money: 0, rating: 3, pricePer100g: 2200, stock: { noodle: 1 }, unlocked: ['noodle'], upgrades: { pots: 1 } }
  assert.equal(isValidSave({ ...good, phase: 'day' }), false, 'a day save without the running day is broken')
  assert.equal(isValidSave({ ...good, phase: 'day', snapshot: { dayTime: 'x' } }), false)
})

test('test_selfserve_save_between_days_still_resumes_at_the_shop', () => {
  saveGame({ ...createNewGame(), phase: 'shop', day: 3 })
  const resumed = resumeShop(loadGame())
  assert.equal(resumed.phase, 'shop')
  assert.equal(resumed.day, 3)
})
