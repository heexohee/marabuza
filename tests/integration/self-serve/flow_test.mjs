// Self-serve → counter → prepay → cook → table serve flow.
// design/quick-specs/self-serve-restock-flow-2026-09-24.md §B–§F.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  adjustCharge, confirmCharge, cookNext, counterPrice, createNewGame, dig, hiddenItems, pickPot, resetCharge, restock,
  serveTable, setTicketMode, setTicketSpice, spawnCustomer, startCooking, startDay, tick,
} from '../../../src/js/self-serve/logic.js'
import { shelfQty } from '../../../src/js/self-serve/shelf.js'
import { CHECKOUT_PRICE, DAY_LENGTH_SEC, INGREDIENTS } from '../../../src/js/data.js'
import { BOX_SIZE, MIN_BOWL_ITEMS, QUEUE_MAX, RATING_DELTA, RESTOCK_BUSY_SEC, WILT_SEC } from '../../../src/js/self-serve/data.js'

const constant = (v) => () => v
const QUIET = 999 // spawn timer far in the future

const makeBowl = (over = {}) => ({
  weighed: {}, mode: 'maratang', beef: false, lamb: false, skewers: {}, cilantro: false, ...over,
})

// Factory: a started day with the given customers already queued at the counter.
function dayWithQueue(...customers) {
  const s = startDay(createNewGame())
  const queue = customers.map((c, i) => ({
    id: i + 1, face: '🐷', mode: 'maratang', spice: 2, missing: [],
    patience: 40, maxPatience: 40, bowl: makeBowl({ weighed: { noodle: 1, enoki: 1 } }), ...c,
  }))
  return { ...s, queue, counter: { ...s.counter, customerId: queue[0]?.id ?? null }, spawnTimer: QUIET, nextCustomerId: queue.length + 1 }
}

const paid = (s) => confirmCharge(s)
const finishCooking = (s) => tick(s, 30, constant(0.5))

// ---------- opening / self-serve ----------

test('test_flow_start_day_stocks_the_shelf_from_the_warehouse', () => {
  const fresh = createNewGame()
  const s = startDay(fresh)
  assert.equal(shelfQty(s.shelf, 'noodle'), BOX_SIZE)
  assert.equal(s.stock.noodle, fresh.stock.noodle - BOX_SIZE)
  assert.deepEqual(s.queue, [])
})

test('test_flow_spawned_customer_carries_a_bowl_filled_from_the_shelf', () => {
  const s = startDay(createNewGame())
  const weighedOnShelf = (st) => INGREDIENTS.reduce((n, i) => n + shelfQty(st.shelf, i.id), 0)
  const before = weighedOnShelf(s)
  const next = spawnCustomer(s, constant(0.1))
  assert.equal(next.queue.length, 1)
  const c = next.queue[0]
  const scooped = Object.values(c.bowl.weighed).reduce((a, b) => a + b, 0)
  const after = weighedOnShelf(next)
  assert.ok(scooped >= MIN_BOWL_ITEMS)
  assert.equal(before - after, scooped, 'shelf shrinks by exactly what was scooped')
  assert.ok(['maratang', 'shanguo'].includes(c.mode))
  assert.equal(c.bowl.mode, c.mode, 'bowl is priced by the mode the customer really wants')
})

test('test_flow_customer_walks_out_when_shelf_is_empty', () => {
  const s = { ...startDay(createNewGame()), shelf: {} }
  const next = spawnCustomer(s, constant(0.1))
  assert.equal(next.queue.length, 0)
  assert.equal(next.stats.left, 1)
  assert.ok(Math.abs(next.rating - (s.rating + RATING_DELTA.stockoutLeave)) < 1e-9)
})

test('test_flow_spawn_waits_while_the_queue_is_full', () => {
  const s = dayWithQueue(...Array.from({ length: QUEUE_MAX }, () => ({})))
  const next = tick({ ...s, spawnTimer: 0.01 }, 0.1, constant(0.1))
  assert.equal(next.queue.length, QUEUE_MAX)
})

// ---------- counter: dig, ticket, price ----------

test('test_flow_meat_and_skewers_stay_hidden_until_dug_out', () => {
  const bowl = makeBowl({ weighed: { noodle: 1 }, beef: true, skewers: { skewer_shrimp: 1 } })
  let s = dayWithQueue({ bowl })
  assert.equal(hiddenItems(bowl).length, 2)
  assert.equal(s.counter.revealed, 0)
  s = dig(s)
  assert.equal(s.counter.revealed, 1)
  assert.ok(s.busy > 0, 'digging takes the owner a moment')
  s = dig(tick(s, 1, constant(0.5)))
  assert.equal(s.counter.revealed, 2)
  s = dig(tick(s, 1, constant(0.5)))
  assert.equal(s.counter.revealed, 2, 'nothing more to find')
})

test('test_flow_register_price_follows_ticket_mode_but_correct_price_follows_real_mode', () => {
  // 120g (noodle 80 + enoki 40). Customer really wants shanguo.
  const s = dayWithQueue({ mode: 'shanguo', bowl: makeBowl({ mode: 'shanguo', weighed: { noodle: 1, enoki: 1 } }) })
  assert.equal(counterPrice(s).base, 2200, 'ticket defaults to maratang: 120g × 1,800 → 2,200')
  assert.equal(counterPrice(s).correct, 3600)
  const fixed = setTicketMode(s, 'shanguo')
  assert.equal(counterPrice(fixed).charged, 3600)
})

test('test_flow_surcharge_keys_and_reset', () => {
  const s = dayWithQueue({ bowl: makeBowl({ weighed: { noodle: 1, enoki: 1 }, beef: true }) })
  const up = adjustCharge(s, CHECKOUT_PRICE.beefSurcharge)
  assert.equal(counterPrice(up).charged, 5200)
  assert.equal(counterPrice(up).charged, counterPrice(up).correct)
  assert.equal(counterPrice(resetCharge(up)).charged, 2200)
  assert.equal(counterPrice(adjustCharge(s, -99999)).charged, 0, 'never below zero')
})

// ---------- prepay ----------

test('test_flow_confirm_takes_payment_now_and_seats_customer_with_ticket', () => {
  const s = setTicketSpice(dayWithQueue({ spice: 3 }), 3)
  const next = paid(s)
  assert.equal(next.money, s.money + 2200)
  assert.equal(next.stats.exactCharges, 1)
  assert.equal(next.queue.length, 0)
  assert.equal(next.tables[0].ticketNo, 1)
  assert.equal(next.tables[0].paid, 2200)
  assert.deepEqual(next.rail.map((o) => [o.ticketNo, o.mode, o.spice]), [[1, 'maratang', 3]])
})

test('test_flow_wrong_ticket_mode_is_recorded_as_undercharge', () => {
  const s = dayWithQueue({ mode: 'shanguo', bowl: makeBowl({ mode: 'shanguo', weighed: { noodle: 1, enoki: 1 } }) })
  const next = paid(s)
  assert.equal(next.stats.undercharge, 1400)
})

test('test_flow_confirm_is_blocked_without_a_free_table', () => {
  const s = dayWithQueue({}, {}, {})
  const two = paid(paid(s)) // default 2 seats
  const third = paid(two)
  assert.equal(third.queue.length, 1, 'third customer is still waiting')
  assert.equal(third.money, two.money)
})

test('test_flow_counter_resets_for_the_next_customer', () => {
  let s = dayWithQueue({}, {})
  s = adjustCharge(setTicketSpice(setTicketMode(s, 'shanguo'), 4), 1000)
  s = paid(s)
  assert.equal(s.counter.customerId, 2)
  assert.equal(s.counter.mode, 'maratang')
  assert.equal(s.counter.extra, 0)
  assert.equal(s.counter.revealed, 0)
})

// ---------- cook & serve ----------

test('test_flow_cook_next_puts_the_longest_waiting_ticket_in_a_free_pot', () => {
  const twoPots = (st) => ({ ...st, pots: [null, null] })
  let s = twoPots(paid(paid(dayWithQueue({}, {}))))
  assert.deepEqual(s.rail.map((o) => o.ticketNo), [1, 2])
  s = cookNext(s)
  assert.equal(s.pots[0].ticketNo, 1, 'oldest ticket first')
  assert.deepEqual(s.rail.map((o) => o.ticketNo), [2])
  s = cookNext(s)
  assert.ok(s.pots.some((p) => p?.ticketNo === 2), 'next oldest goes into another free pot')
  assert.equal(s.rail.length, 0)
})

test('test_flow_cook_next_with_no_waiting_ticket_only_says_so', () => {
  const s = dayWithQueue()
  const next = cookNext(s)
  assert.deepEqual(next.pots, s.pots)
  assert.match(next.toasts.at(-1).text, /대기 중인 주문표가 없어요/)
})

test('test_flow_cook_next_with_every_pot_busy_keeps_the_ticket', () => {
  const s = paid(dayWithQueue({}))
  const full = { ...s, pots: s.pots.map(() => ({ ticketNo: 99, order: {}, remaining: 5, total: 5 })) }
  const next = cookNext(full)
  assert.deepEqual(next.rail, full.rail)
  assert.match(next.toasts.at(-1).text, /빈 냄비가 없어요/)
})

test('test_flow_cook_pick_and_serve_to_the_matching_table', () => {
  let s = paid(setTicketSpice(dayWithQueue({ spice: 3 }), 3))
  s = startCooking(s, 1)
  assert.equal(s.rail.length, 0)
  assert.equal(s.pots[0].ticketNo, 1)
  assert.equal(pickPot(s, 0).heldPot, null, 'cannot pick a pot that is still cooking')
  s = pickPot(finishCooking(s), 0)
  assert.equal(s.heldPot, 0)
  const rating = s.rating
  s = serveTable(s, 0)
  assert.equal(s.stats.served, 1)
  assert.equal(s.tables[0], null)
  assert.equal(s.pots[0], null)
  assert.equal(s.heldPot, null)
  assert.ok(s.stats.tips > 0)
  assert.ok(s.rating > rating)
})

test('test_flow_wrong_table_keeps_the_pot_and_costs_rating', () => {
  let s = paid(paid(dayWithQueue({}, {})))
  s = pickPot(finishCooking(startCooking(s, 1)), 0)
  const rating = s.rating
  const wrong = serveTable(s, 1)
  assert.equal(wrong.heldPot, 0)
  assert.notEqual(wrong.tables[1], null)
  assert.ok(Math.abs(wrong.rating - (rating + RATING_DELTA.wrongTable)) < 1e-9)
})

test('test_flow_wrong_spice_ticket_gets_no_tip_and_loses_rating', () => {
  let s = paid(dayWithQueue({ spice: 4 })) // ticket left at default 2
  s = pickPot(finishCooking(startCooking(s, 1)), 0)
  const rating = s.rating
  s = serveTable(s, 0)
  assert.equal(s.stats.served, 1)
  assert.equal(s.stats.tips, 0)
  assert.ok(s.rating < rating)
})

test('test_flow_seated_customer_who_gives_up_is_refunded', () => {
  let s = paid(dayWithQueue({}))
  const money = s.money
  s = tick({ ...s, tables: s.tables.map((t) => (t ? { ...t, patience: 0.05 } : t)) }, 0.1, constant(0.5))
  assert.equal(s.tables[0], null)
  assert.equal(s.rail.length, 0)
  assert.equal(s.money, money - 2200)
  assert.equal(s.stats.refunds, 2200)
})

// ---------- restock & busy ----------

test('test_flow_restock_moves_a_box_and_keeps_the_owner_busy', () => {
  const s = dayWithQueue({})
  const r = restock(s, 'noodle')
  assert.equal(shelfQty(r.shelf, 'noodle'), shelfQty(s.shelf, 'noodle') + BOX_SIZE)
  assert.equal(r.stock.noodle, s.stock.noodle - BOX_SIZE)
  assert.equal(r.busy, RESTOCK_BUSY_SEC)
  const blocked = confirmCharge(r)
  assert.equal(blocked.queue.length, 1, 'counter ignored while restocking')
  assert.equal(restock(r, 'enoki').stock.enoki, r.stock.enoki, 'restock ignored while busy')
  const free = tick(r, RESTOCK_BUSY_SEC + 0.01, constant(0.5))
  assert.equal(free.busy, 0)
  assert.equal(confirmCharge(free).queue.length, 0)
})

test('test_flow_wilted_vegetables_are_counted_as_waste', () => {
  const s = startDay(createNewGame())
  const next = tick({ ...s, spawnTimer: QUIET }, WILT_SEC + 1, constant(0.5))
  assert.equal(shelfQty(next.shelf, 'bokchoy'), 0)
  assert.ok(next.stats.wasted >= BOX_SIZE)
  assert.ok(next.stats.wasteCost > 0)
  assert.equal(shelfQty(next.shelf, 'noodle'), BOX_SIZE)
})

// ---------- closing ----------

test('test_flow_day_ends_when_everyone_is_served_and_shelf_returns_to_warehouse', () => {
  const s = startDay(createNewGame())
  const open = tick({ ...s, spawnTimer: QUIET }, DAY_LENGTH_SEC - 1, constant(0.5))
  assert.equal(open.phase, 'day')
  const late = paid(dayWithQueue({}))
  assert.equal(tick({ ...late, dayTime: DAY_LENGTH_SEC + 1 }, 0.1, constant(0.5)).phase, 'day', 'seated customer still waiting')
  const closed = tick({ ...s, spawnTimer: QUIET, dayTime: DAY_LENGTH_SEC }, 0.1, constant(0.5))
  assert.equal(closed.phase, 'summary')
  assert.equal(closed.stock.noodle, createNewGame().stock.noodle, 'unsold noodles went back to the warehouse')
})
