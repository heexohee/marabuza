// Playtest 2026-09-27 #9·#10 (design/quick-specs/playtest-2026-09-27.md): four self-serve-only ingredients
// (유부·감자·면두부·콘치즈볼) unlocked in the shop, and one more skewer (치즈떡 꼬지) on the shelf from the start.
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { INGREDIENTS, SELF_SERVE_INGREDIENTS, SKEWER_ITEMS } from '../../../src/js/data.js'
import { EXTRA_IDS, SAVE_KEY, SELF_SKEWER_ITEMS, SHELF_EXTRAS, VARIANT_INGREDIENTS } from '../../../src/js/self-serve/data.js'
import { checkoutBowlWeight, createNewGame, generateWish, shelfIds, unlockIngredient } from '../../../src/js/self-serve/logic.js'
import { loadGame, saveGame } from '../../../src/js/self-serve/save.js'

const NEW_IDS = ['yubu', 'potato', 'tofunoodle', 'cornball']
const RICH = 1_000_000

function memoryStorage() {
  const store = new Map()
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  }
}
beforeEach(() => { globalThis.localStorage = memoryStorage() })

test('test_new_ingredients_are_sold_in_self_serve_but_not_in_the_legacy_flow', () => {
  const selfServe = VARIANT_INGREDIENTS.map((i) => i.id)
  NEW_IDS.forEach((id) => assert.ok(selfServe.includes(id), id))
  assert.deepEqual(SELF_SERVE_INGREDIENTS.map((i) => i.id), NEW_IDS)
  NEW_IDS.forEach((id) => assert.equal(INGREDIENTS.some((i) => i.id === id), false, `${id} stays out of the legacy list`))
})

test('test_new_ingredients_start_locked_with_empty_warehouse', () => {
  const s = createNewGame()
  NEW_IDS.forEach((id) => {
    assert.equal(s.unlocked.includes(id), false, id)
    assert.equal(s.stock[id], 0, id)
    assert.equal(shelfIds(s).includes(id), false, `${id} is not on the shelf while locked`)
  })
  SELF_SERVE_INGREDIENTS.forEach((i) => assert.ok(i.unlockCost > 0, i.id))
})

test('test_new_ingredient_unlock_costs_money_and_puts_it_on_the_shelf', () => {
  const potato = SELF_SERVE_INGREDIENTS.find((i) => i.id === 'potato')
  const s = unlockIngredient({ ...createNewGame(), phase: 'shop', money: RICH }, 'potato')
  assert.equal(s.money, RICH - potato.unlockCost)
  assert.ok(s.unlocked.includes('potato'))
  assert.ok(s.stock.potato > 0, 'the first pack comes free')
  assert.ok(shelfIds(s).includes('potato'))
})

test('test_new_ingredient_unlock_needs_enough_money', () => {
  const s = unlockIngredient({ ...createNewGame(), phase: 'shop', money: 0 }, 'cornball')
  assert.equal(s.unlocked.includes('cornball'), false)
})

test('test_unlocked_new_ingredient_can_be_wished_and_weighs_its_grams', () => {
  const potato = SELF_SERVE_INGREDIENTS.find((i) => i.id === 'potato')
  let x = 3
  const rng = () => (x = (x * 16807) % 2147483647) / 2147483647
  const wishes = Array.from({ length: 50 }, () => generateWish(['potato', 'bokchoy'], rng))
  assert.ok(wishes.some((w) => w.potato > 0), 'customers ask for it once unlocked')
  const bowl = { weighed: { potato: 2 }, beef: 0, lamb: 0, skewers: {}, cilantro: false }
  assert.equal(checkoutBowlWeight(bowl), potato.grams * 2)
})

test('test_new_ingredient_unlock_survives_save_and_load', () => {
  const s = unlockIngredient({ ...createNewGame(), phase: 'shop', money: RICH }, 'yubu')
  assert.equal(saveGame(s), true)
  const loaded = loadGame()
  assert.ok(loaded.unlocked.includes('yubu'))
  assert.equal(loaded.stock.yubu, s.stock.yubu)
})

test('test_cheese_tteok_skewer_is_on_the_shelf_from_the_start', () => {
  assert.ok(SELF_SKEWER_ITEMS.some((k) => k.id === 'skewer_cheese_tteok'))
  assert.equal(SKEWER_ITEMS.some((k) => k.id === 'skewer_cheese_tteok'), false, 'legacy skewer list untouched')
  const extra = SHELF_EXTRAS.find((i) => i.id === 'skewer_cheese_tteok')
  assert.equal(extra.name, '치즈떡 꼬지')
  assert.equal(extra.kind, 'skewer')
  const s = createNewGame()
  assert.ok(EXTRA_IDS.includes('skewer_cheese_tteok'))
  assert.ok(shelfIds(s).includes('skewer_cheese_tteok'), 'no unlock needed')
  assert.equal(s.stock.skewer_cheese_tteok, extra.startStock)
})

test('test_old_save_gets_the_new_skewer_start_stock_on_load', () => {
  saveGame({ ...createNewGame(), phase: 'shop', day: 9 })
  const raw = JSON.parse(localStorage.getItem(SAVE_KEY))
  delete raw.stock.skewer_cheese_tteok
  localStorage.setItem(SAVE_KEY, JSON.stringify(raw))
  assert.ok(loadGame().stock.skewer_cheese_tteok > 0)
})
