// Self-serve save slot: round-trips the warehouse including skewer/cilantro stock,
// rejects malformed data, and never touches the original flow's slot.
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { buyPack, createNewGame } from '../../../src/js/self-serve/logic.js'
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
