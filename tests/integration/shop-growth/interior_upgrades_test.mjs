// Interior 6 stages (production/epics/shop-growth/story-005-interior-upgrades.md): order, unlock day, money,
// atmosphere effects and save.
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  adjustCharge, buyInterior, confirmCharge, counterPrice, createNewGame, maxPatience, nextInterior, pickPot, serveTable, startCooking,
  startDay, tick,
} from '../../../src/js/self-serve/logic.js'
import { loadGame, saveGame } from '../../../src/js/self-serve/save.js'
import { INTERIOR_EFFECT, INTERIOR_STAGES, SAVE_KEY, priceOf } from '../../../src/js/self-serve/data.js'

const RICH = 10_000_000
const shopOn = (day, over = {}) => ({ ...createNewGame(), phase: 'shop', day, money: RICH, ...over })
const buyAll = (s, n) => Array.from({ length: n }).reduce((cur) => buyInterior(cur), s)

function memoryStorage() {
  const store = new Map()
  return { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) }
}
beforeEach(() => { globalThis.localStorage = memoryStorage() })

// ---------- buying ----------

test('test_interior_buys_stages_in_order', () => {
  const s = buyAll(shopOn(20), 3)
  assert.equal(s.interior, 3)
  assert.equal(nextInterior(s).id, INTERIOR_STAGES[3].id)
})

test('test_interior_costs_its_d_multiple', () => {
  const s = shopOn(1)
  assert.equal(buyInterior(s).money, RICH - priceOf(INTERIOR_STAGES[0].multiple))
})

test('test_interior_stage_waits_for_its_unlock_day', () => {
  const s = buyInterior(shopOn(2)) // 벽지 (day 1) bought; 바닥 opens on day 3
  assert.equal(s.interior, 1)
  const early = buyInterior(s)
  assert.equal(early.interior, 1)
  assert.equal(early.toasts.at(-1).kind, 'info')
  assert.equal(buyInterior({ ...s, day: 3 }).interior, 2)
})

test('test_interior_needs_the_money', () => {
  const s = shopOn(1, { money: priceOf(INTERIOR_STAGES[0].multiple) - 100 })
  const after = buyInterior(s)
  assert.equal(after.interior, 0)
  assert.equal(after.money, s.money)
})

test('test_interior_stops_after_the_sixth_stage', () => {
  const done = buyAll(shopOn(12), 6)
  assert.equal(done.interior, 6)
  assert.equal(nextInterior(done), null)
  assert.equal(buyInterior(done).interior, 6)
})

// ---------- effects ----------

test('test_interior_wallpaper_raises_rating_each_morning', () => {
  const s = { ...shopOn(1), rating: 3 }
  assert.equal(startDay(s).rating, 3)
  assert.equal(startDay({ ...s, interior: 1 }).rating, 3 + INTERIOR_EFFECT.morningRating)
})

test('test_interior_floor_adds_patience', () => {
  const s = startDay(shopOn(3))
  assert.ok(Math.abs(maxPatience({ ...s, interior: 2 }) - maxPatience(s) * INTERIOR_EFFECT.patience) < 1e-9)
  assert.equal(maxPatience({ ...s, interior: 1 }), maxPatience(s))
})

// A seated, paid customer whose pot is done and held — ready to be served.
function readyToServe(interior) {
  const bowl = { weighed: { noodle: 3, enoki: 3, bokchoy: 2 }, mode: 'maratang', beef: 1, lamb: 0, skewers: {}, cilantro: false }
  const base = startDay({ ...shopOn(12), interior })
  const customer = { id: 1, face: '🐷', mode: 'maratang', spice: 2, missing: [], patience: 40, maxPatience: 40, bowl }
  const atCounter = { ...base, queue: [customer], counter: { ...base.counter, customerId: 1, mode: 'maratang', spice: 2 }, spawnTimer: 999 }
  const { charged, correct } = counterPrice(atCounter)
  const exact = adjustCharge(atCounter, correct - charged) // punch in the meat surcharge
  const cooking = startCooking(confirmCharge(exact), 1)
  const done = { ...cooking, pots: cooking.pots.map((p) => (p ? { ...p, remaining: 0 } : p)) }
  return pickPot(done, 0)
}

test('test_interior_lighting_raises_tips', () => {
  const plain = serveTable(readyToServe(2), 0)
  const lit = serveTable(readyToServe(3), 0)
  assert.ok(plain.stats.tips > 0)
  assert.ok(lit.stats.tips > plain.stats.tips)
})

test('test_interior_furniture_raises_rating_from_a_good_serve', () => {
  const before = readyToServe(4)
  const after = readyToServe(5)
  const gain4 = serveTable(before, 0).rating - before.rating
  const gain5 = serveTable(after, 0).rating - after.rating
  assert.ok(gain5 > gain4)
})

test('test_interior_door_brings_customers_sooner', () => {
  const s = { ...startDay(shopOn(7)), spawnTimer: 0 }
  const plain = tick(s, 0.01, () => 0.5)
  const door = tick({ ...s, interior: 4 }, 0.01, () => 0.5)
  assert.ok(door.spawnTimer < plain.spawnTimer)
})

test('test_interior_kitchen_slows_wilting', () => {
  const s = startDay(shopOn(12))
  const age = (st) => Object.values(tick(st, 10, () => 0.99).shelf).flat().reduce((a, b) => a + b.age, 0)
  assert.ok(age({ ...s, interior: 6 }) < age(s))
})

// ---------- save ----------

test('test_interior_stage_round_trips_through_save', () => {
  const s = buyAll(shopOn(20), 4)
  saveGame(s)
  assert.equal(loadGame().interior, 4)
})

test('test_interior_legacy_save_starts_at_zero_and_drops_old_upgrade', () => {
  const legacy = {
    version: 1, day: 5, money: 9000, rating: 3, pricePer100g: 2200,
    stock: { noodle: 4 }, unlocked: ['noodle'], upgrades: { pots: 2, fire: 1, interior: 3, seats: 5 },
  }
  localStorage.setItem(SAVE_KEY, JSON.stringify(legacy))
  const loaded = loadGame()
  assert.equal(loaded.interior, 0)
  assert.equal('interior' in loaded.upgrades, false)
  assert.equal(loaded.upgrades.seats, 4, 'old 5-table saves are capped at 4')
  assert.equal(loaded.upgrades.pots, 2)
})

test('test_interior_rejects_an_out_of_range_saved_stage', () => {
  saveGame(createNewGame())
  const raw = JSON.parse(localStorage.getItem(SAVE_KEY))
  localStorage.setItem(SAVE_KEY, JSON.stringify({ ...raw, interior: 9 }))
  assert.equal(loadGame(), null)
})
