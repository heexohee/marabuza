// Skewers and cilantro are real shelf items in the self-serve variant: bought in the shop,
// kept in the warehouse, restocked to the shelf, and only taken while the shelf has them.
// design/quick-specs/self-serve-restock-flow-2026-09-24.md §A, §B.6
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buyPack, createNewGame, restock, shelfIds, spawnCustomer, startDay, tick } from '../../../src/js/self-serve/logic.js'
import { fillBowl, shelfQty } from '../../../src/js/self-serve/shelf.js'
import { INGREDIENTS, PACK_SIZE, SKEWER_ITEMS } from '../../../src/js/data.js'
import {
  BOX_SIZE, EXTRA_IDS, RATING_DELTA, SHELF_ITEM_BY_ID, WILT_SEC,
} from '../../../src/js/self-serve/data.js'

const constant = (v) => () => v
const QUIET = 999
// rng 0.1 → wants skewers (< SKEWER_CHANCE) and cilantro (< CILANTRO_CHANCE)
const WANTS_EXTRAS = constant(0.1)
const skewerIds = SKEWER_ITEMS.map((i) => i.id)
const onShelf = (s, ids) => ids.reduce((n, id) => n + shelfQty(s.shelf, id), 0)
const withoutShelf = (s, ids) => ({ ...s, shelf: { ...s.shelf, ...Object.fromEntries(ids.map((id) => [id, []])) } })

test('test_extras_catalog_has_every_skewer_and_cilantro', () => {
  assert.deepEqual([...EXTRA_IDS].sort(), [...skewerIds, 'cilantro'].sort())
  EXTRA_IDS.forEach((id) => assert.ok(SHELF_ITEM_BY_ID[id].packCost > 0, `${id} can be bought`))
})

test('test_extras_start_in_warehouse_and_open_on_shelf', () => {
  const fresh = createNewGame()
  EXTRA_IDS.forEach((id) => assert.equal(fresh.stock[id], SHELF_ITEM_BY_ID[id].startStock))
  const s = startDay(fresh)
  EXTRA_IDS.forEach((id) => {
    assert.equal(shelfQty(s.shelf, id), BOX_SIZE)
    assert.equal(s.stock[id], SHELF_ITEM_BY_ID[id].startStock - BOX_SIZE)
  })
  assert.deepEqual(shelfIds(s), [...s.unlocked, ...EXTRA_IDS])
})

test('test_extras_customer_takes_skewers_and_cilantro_from_the_shelf', () => {
  const s = startDay(createNewGame())
  const next = spawnCustomer(s, WANTS_EXTRAS)
  const c = next.queue[0]
  const skewers = Object.values(c.bowl.skewers).reduce((a, b) => a + b, 0)
  assert.ok(skewers > 0)
  assert.equal(onShelf(s, skewerIds) - onShelf(next, skewerIds), skewers, 'every skewer came off the shelf')
  assert.equal(c.bowl.cilantro, true)
  assert.equal(shelfQty(s.shelf, 'cilantro') - shelfQty(next.shelf, 'cilantro'), 1)
})

test('test_extras_sold_out_means_none_in_bowl_and_a_grumble', () => {
  const s = withoutShelf(startDay(createNewGame()), EXTRA_IDS)
  const next = spawnCustomer(s, WANTS_EXTRAS)
  const c = next.queue[0]
  assert.deepEqual(c.bowl.skewers, {})
  assert.equal(c.bowl.cilantro, false)
  assert.ok(c.missing.includes('cilantro'))
  assert.ok(c.missing.some((id) => skewerIds.includes(id)))
  assert.ok(Math.abs(next.rating - (s.rating + RATING_DELTA.grumble * c.missing.length)) < 1e-9)
})

test('test_extras_never_used_as_substitutes_for_sold_out_scoops', () => {
  const ingredientIds = INGREDIENTS.map((i) => i.id)
  const shelf = { noodle: [], skewer_shrimp: [{ qty: 5, age: 0 }], cilantro: [{ qty: 5, age: 0 }] }
  const r = fillBowl(shelf, { noodle: 2 }, constant(0), ingredientIds)
  assert.equal(r.total, 0)
  assert.equal(shelfQty(r.shelf, 'skewer_shrimp'), 5)
})

test('test_extras_cilantro_wilts_but_skewers_keep', () => {
  const s = startDay(createNewGame())
  const next = tick({ ...s, spawnTimer: QUIET }, WILT_SEC + 1, constant(0.5))
  assert.equal(shelfQty(next.shelf, 'cilantro'), 0)
  skewerIds.forEach((id) => assert.equal(shelfQty(next.shelf, id), BOX_SIZE))
})

test('test_extras_restock_and_shop_purchase', () => {
  const s = withoutShelf(startDay(createNewGame()), ['skewer_sausage_deluxe'])
  const r = restock(s, 'skewer_sausage_deluxe')
  assert.equal(shelfQty(r.shelf, 'skewer_sausage_deluxe'), BOX_SIZE)
  const shop = { ...createNewGame(), phase: 'shop' }
  const bought = buyPack(shop, 'cilantro')
  assert.equal(bought.stock.cilantro, SHELF_ITEM_BY_ID.cilantro.startStock + PACK_SIZE)
  assert.equal(bought.money, shop.money - SHELF_ITEM_BY_ID.cilantro.packCost)
})
