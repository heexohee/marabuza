// Side menu (production/epics/side-menu/story-001-side-menu.md): unlock days, ordering, pricing, stock,
// serving with the main pot, save, and the dev bot.
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  adjustCharge, buySidePack, chargeBreakdown, confirmCharge, counterPrice, createNewGame, openSides, pickPot,
  serveTable, spawnCustomer, startCooking, startDay,
} from '../../../src/js/self-serve/logic.js'
import { autoPlayDay, restockWarehouse } from '../../../src/js/self-serve/autoplay.js'
import { loadGame, saveGame } from '../../../src/js/self-serve/save.js'
import { SAVE_KEY, SIDE_BY_ID, SIDE_GIFT, sideStockId } from '../../../src/js/self-serve/data.js'

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

const dayOn = (day, over = {}) => startDay({ ...createNewGame(), day, money: RICH, ...over })
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

// ---------- unlock days ----------

test('test_side_menu_opens_drink_friedrice_guobao_on_days_8_10_12', () => {
  const ids = (day) => openSides({ day }).map((i) => i.id)
  assert.deepEqual(ids(7), [])
  assert.deepEqual(ids(8), ['drink'])
  assert.deepEqual(ids(10), ['drink', 'friedrice'])
  assert.deepEqual(ids(12), ['drink', 'friedrice', 'guobao'])
})

test('test_side_menu_opening_day_gives_one_gift_box_once', () => {
  const day8 = dayOn(8)
  assert.equal(day8.stock[sideStockId('drink')], SIDE_GIFT)
  assert.deepEqual(day8.sideGifts, ['drink'])
  assert.match(day8.toasts.map((t) => t.text).join(' '), /중국음료/)
  const day9 = startDay({ ...day8, phase: 'shop', day: 9 })
  assert.equal(day9.stock[sideStockId('drink')], SIDE_GIFT, 'no second gift')
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

test('test_side_menu_side_boxes_only_for_open_sides', () => {
  const s = { ...createNewGame(), phase: 'shop', day: 9, money: RICH }
  assert.equal(buySidePack(s, 'drink').stock[sideStockId('drink')], 10)
  assert.equal(buySidePack(s, 'guobao'), s, 'not open yet')
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
