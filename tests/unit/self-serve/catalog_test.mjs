// The self-serve variant sells shrimp only as a skewer (새우 꼬치); the weighed "새우" scoop from the
// shared ingredient list is dropped so the shelf and shop show one shrimp, not two.
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createNewGame, shelfIds, startDay, unlockIngredient } from '../../../src/js/self-serve/logic.js'
import { loadGame } from '../../../src/js/self-serve/save.js'
import { SAVE_KEY, SHELF_ITEM_BY_ID, VARIANT_INGREDIENTS } from '../../../src/js/self-serve/data.js'

const DROPPED = 'shrimp'

function memoryStorage() {
  const store = new Map()
  return { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) }
}
beforeEach(() => { globalThis.localStorage = memoryStorage() })

test('test_catalog_has_shrimp_skewer_but_no_weighed_shrimp', () => {
  assert.equal(VARIANT_INGREDIENTS.some((i) => i.id === DROPPED), false)
  assert.equal(SHELF_ITEM_BY_ID[DROPPED], undefined)
  assert.ok(SHELF_ITEM_BY_ID.skewer_shrimp, 'shrimp is still sold as a skewer')
})

test('test_catalog_new_game_and_shelf_have_no_weighed_shrimp', () => {
  const s = startDay(createNewGame())
  assert.equal(DROPPED in s.stock, false)
  assert.equal(shelfIds(s).includes(DROPPED), false)
})

test('test_catalog_weighed_shrimp_cannot_be_unlocked', () => {
  const s = { ...createNewGame(), phase: 'shop', money: 999999 }
  const after = unlockIngredient(s, DROPPED)
  assert.equal(after.unlocked.includes(DROPPED), false)
  assert.equal(after.money, s.money)
})

test('test_catalog_legacy_save_with_weighed_shrimp_still_loads_without_it', () => {
  const legacy = {
    version: 1, day: 3, money: 5000, rating: 3, pricePer100g: 2200,
    stock: { noodle: 4, shrimp: 7, skewer_shrimp: 2 }, unlocked: ['noodle', 'shrimp'], upgrades: { pots: 1 },
  }
  localStorage.setItem(SAVE_KEY, JSON.stringify(legacy))
  const loaded = loadGame()
  assert.ok(loaded, 'old saves are not rejected')
  assert.equal(loaded.day, 3)
  assert.equal(DROPPED in loaded.stock, false)
  assert.deepEqual(loaded.unlocked, ['noodle'])
  assert.equal(loaded.stock.skewer_shrimp, 2)
})
