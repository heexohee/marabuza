// Side menu (production/epics/side-menu/story-001-side-menu.md): adding a side in the shop (playtest 2026-09-27
// #2), ordering, pricing, stock, serving with the main pot, save, and the dev bot.
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  adjustCharge, buySidePack, canOpenSide, chargeBreakdown, confirmCharge, counterPrice, createNewGame, hasWok, openSide, openSides, pickPot,
  serveTable, spawnCustomer, startCooking, startDay,
} from '../../../src/js/self-serve/logic.js'
import { autoPlayDay, restockWarehouse } from '../../../src/js/self-serve/autoplay.js'
import { loadGame, saveGame } from '../../../src/js/self-serve/save.js'
import { SAVE_KEY, SIDE_BY_ID, SIDE_GIFT, SIDE_ITEMS, sideStockId } from '../../../src/js/self-serve/data.js'

const RICH = 10_000_000
const QUIET = 999
const constant = (v) => () => v
function seeded(seed = 7) {
  let x = seed
  return () => (x = (x * 16807) % 2147483647) / 2147483647
}
function memoryStorage() {
  const store = new Map()
  return { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) }
}
beforeEach(() => { globalThis.localStorage = memoryStorage() })

/** The shop the night before `day` with every side that can be added by then added (a player who adds them). */
function shopBefore(day, over = {}) {
  const shop = { ...createNewGame(), phase: 'shop', day: day - 1, money: RICH, ...over }
  return SIDE_ITEMS.filter((i) => i.unlockDay <= day).reduce((s, i) => openSide(s, i.id), shop)
}
const dayOn = (day, over = {}) => startDay({ ...shopBefore(day, over), day })
const makeBowl = () => ({ weighed: { noodle: 1, enoki: 1 }, mode: 'maratang', beef: 0, lamb: 0, skewers: {}, cilantro: false })
function atCounter(day, side) {
  const s = dayOn(day)
  const customer = { id: 1, face: '🐷', mode: 'maratang', spice: 2, missing: [], patience: 40, maxPatience: 40, bowl: makeBowl(), side }
  return { ...s, queue: [customer], counter: { ...s.counter, customerId: 1, mode: 'maratang', spice: 2 }, spawnTimer: QUIET }
}
const chargeExactly = (s) => {
  const { charged, correct } = counterPrice(s)
  return confirmCharge(adjustCharge(s, correct - charged))
}

// ---------- adding a side in the shop ----------

test('test_side_menu_each_side_can_be_added_from_the_night_before_its_day', () => {
  for (const side of SIDE_ITEMS) {
    const shop = (day) => ({ ...createNewGame(), phase: 'shop', day, money: RICH })
    assert.ok(!canOpenSide(shop(side.unlockDay - 2), side), `${side.id} not two nights early`)
    assert.ok(canOpenSide(shop(side.unlockDay - 1), side), `${side.id} the night before`)
    assert.equal(openSide(shop(side.unlockDay - 2), side.id).sideGifts.length, 0, 'refused early')
  }
})

test('test_side_menu_adding_a_side_costs_open_cost_and_brings_the_gift_box_once', () => {
  const shop = { ...createNewGame(), phase: 'shop', day: 7, money: RICH }
  const added = openSide(shop, 'drink')
  assert.equal(added.money, RICH - SIDE_BY_ID.drink.openCost)
  assert.equal(added.stock[sideStockId('drink')], SIDE_GIFT)
  assert.deepEqual(added.sideGifts, ['drink'])
  assert.match(added.toasts.at(-1).text, /중국음료/)
  assert.equal(openSide(added, 'drink'), added, 'no second purchase or gift')
})

test('test_side_menu_adding_a_side_needs_the_money', () => {
  const shop = { ...createNewGame(), phase: 'shop', day: 7, money: SIDE_BY_ID.drink.openCost - 1 }
  const after = openSide(shop, 'drink')
  assert.deepEqual(after.sideGifts, [])
  assert.equal(after.money, shop.money)
  assert.equal(after.toasts.at(-1).kind, 'bad')
})

test('test_side_menu_a_side_never_opens_by_itself', () => {
  const s = startDay({ ...createNewGame(), day: 12, money: RICH })
  assert.deepEqual(openSides(s), [])
  assert.equal(s.stock[sideStockId('guobao')], 0)
  assert.ok(!hasWok(s), 'no wok without a cooked side')
})

test('test_side_menu_open_sides_are_the_added_ones_and_the_wok_follows_cooked_ones', () => {
  const ids = (day) => openSides(dayOn(day)).map((i) => i.id)
  assert.deepEqual(ids(7), [])
  assert.deepEqual(ids(8), ['drink'])
  assert.deepEqual(ids(10), ['drink', 'friedrice'])
  assert.deepEqual(ids(12), ['drink', 'friedrice', 'guobao'])
  assert.ok(!hasWok(dayOn(9)))
  assert.ok(hasWok(dayOn(10)))
})

// ---------- ordering ----------

test('test_side_menu_no_side_orders_before_day_8', () => {
  const s = dayOn(7)
  const after = spawnCustomer(s, constant(0.01))
  assert.equal(after.queue.at(-1)?.side, undefined)
})

test('test_side_menu_customer_orders_an_open_side', () => {
  const s = dayOn(12)
  const after = spawnCustomer(s, constant(0.01))
  assert.ok(SIDE_BY_ID[after.queue.at(-1).side], 'a low roll adds a side')
})

test('test_side_menu_out_of_stock_side_is_skipped_with_a_grumble', () => {
  const s = { ...dayOn(8), stock: { ...dayOn(8).stock, [sideStockId('drink')]: 0 } }
  const after = spawnCustomer(s, constant(0.01))
  assert.equal(after.queue.at(-1).side, undefined)
  assert.match(after.toasts.at(-1).text, /중국음료/)
})

// ---------- register ----------

test('test_side_menu_correct_price_includes_the_side', () => {
  for (const [id, price] of [['drink', 3000], ['friedrice', 8000], ['guobao', 12000]]) {
    const s = atCounter(12, id)
    const { base, correct } = counterPrice(s)
    assert.equal(correct - base, price, id)
  }
})

test('test_side_menu_forgetting_the_side_is_an_undercharge', () => {
  const s = atCounter(12, 'guobao')
  const after = confirmCharge(s) // charged the scale price only
  assert.equal(after.stats.undercharge, SIDE_BY_ID.guobao.price)
})

test('test_side_menu_breakdown_lists_the_side', () => {
  const lines = chargeBreakdown(makeBowl(), { maratang: 1800, shanguo: 3000 }, 'friedrice')
  assert.deepEqual(lines.at(-1), { label: '달걀볶음밥', amount: 8000 })
})

test('test_side_menu_paying_takes_one_from_stock', () => {
  const s = atCounter(12, 'drink')
  const before = s.stock[sideStockId('drink')]
  const after = chargeExactly(s)
  assert.equal(after.stock[sideStockId('drink')], before - 1)
  assert.equal(after.tables.find((t) => t)?.side, 'drink')
  assert.equal(after.rail.at(-1).side, 'drink')
})

// ---------- serving ----------

test('test_side_menu_cooked_side_goes_out_with_the_main_pot', () => {
  const paid = chargeExactly(atCounter(12, 'guobao'))
  const cooking = startCooking(paid, paid.rail[0].ticketNo)
  assert.equal(cooking.pots[0].order.side, 'guobao', 'the wok cooks it with this pot')
  const done = { ...cooking, pots: cooking.pots.map((p) => (p ? { ...p, remaining: 0 } : p)) }
  const tableIdx = done.tables.findIndex((t) => t)
  const served = serveTable(pickPot(done, 0), tableIdx)
  assert.equal(served.tables[tableIdx], null)
  assert.equal(served.stats.sides, 1)
  assert.match(served.toasts.at(-1).text, /🍖/)
})

// ---------- shop, save, bot ----------

test('test_side_menu_side_boxes_only_for_added_sides', () => {
  const s = { ...shopBefore(8), day: 9 }
  assert.equal(buySidePack(s, 'drink').stock[sideStockId('drink')], SIDE_GIFT + 10)
  assert.equal(buySidePack(s, 'guobao'), s, 'not added yet')
})

test('test_side_menu_stock_and_gifts_round_trip_through_save', () => {
  const s = { ...dayOn(10), phase: 'shop' }
  saveGame(s)
  const loaded = loadGame()
  assert.deepEqual(loaded.sideGifts, ['drink', 'friedrice'])
  assert.equal(loaded.stock[sideStockId('friedrice')], SIDE_GIFT)
})

test('test_side_menu_legacy_save_has_no_side_stock', () => {
  const legacy = { version: 1, day: 9, money: 5000, rating: 3, pricePer100g: 2200, stock: { noodle: 4 }, unlocked: ['noodle'], upgrades: { pots: 1 } }
  localStorage.setItem(SAVE_KEY, JSON.stringify(legacy))
  const loaded = loadGame()
  assert.deepEqual(loaded.sideGifts, [])
  assert.equal(loaded.stock[sideStockId('drink')], 0)
})

test('test_side_menu_bot_charges_sides_and_restocks_them', () => {
  const played = autoPlayDay(dayOn(12), seeded(5))
  assert.ok(played.stats.sides > 0, 'sides were sold and served')
  const shop = restockWarehouse({ ...played, phase: 'shop' })
  for (const id of ['drink', 'friedrice', 'guobao']) assert.ok(shop.stock[sideStockId(id)] >= 30, id)
})
