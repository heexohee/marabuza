// Adjustable menu prices (production/epics/economy/story-001-menu-prices.md):
// the shop's per-mode 100g prices drive the register receipt, the correct-price check, demand and the save.
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  chargeBreakdown, confirmCharge, counterPrice, createNewGame, demandFactor, setMenuPrice, startDay,
} from '../../../src/js/self-serve/logic.js'
import { loadGame, saveGame } from '../../../src/js/self-serve/save.js'
import { CHECKOUT_PRICE } from '../../../src/js/data.js'
import { checkoutBasePrice, checkoutBowlPrice, checkoutBowlWeight } from '../../../src/js/logic.js'
import { MENU_PRICE, SAVE_KEY, SHANGUO_CHANCE } from '../../../src/js/self-serve/data.js'

const QUIET = 999
const makeBowl = (over = {}) => ({
  weighed: { noodle: 1, enoki: 1 }, mode: 'maratang', beef: 0, lamb: 0, skewers: {}, cilantro: false, ...over,
})

// Factory: a day with one customer at the counter, at the given menu prices.
function dayWithCustomer(prices, bowl = makeBowl()) {
  const s = startDay({ ...createNewGame(), prices })
  const customer = { id: 1, face: '🐷', mode: bowl.mode, spice: 2, missing: [], patience: 40, maxPatience: 40, bowl }
  return { ...s, queue: [customer], counter: { ...s.counter, customerId: 1, mode: bowl.mode }, spawnTimer: QUIET }
}
const expectedBase = (bowl, rate) => Math.round(((checkoutBowlWeight(bowl) / 100) * rate) / 100) * 100

function memoryStorage() {
  const store = new Map()
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  }
}
beforeEach(() => { globalThis.localStorage = memoryStorage() })

// ---------- shop adjustment ----------

test('test_menu_prices_new_game_starts_at_default_rates', () => {
  assert.deepEqual(createNewGame().prices, CHECKOUT_PRICE.ratePer100g)
})

test('test_menu_prices_set_price_rounds_to_step_and_clamps_per_mode', () => {
  const s = createNewGame()
  assert.equal(setMenuPrice(s, 'maratang', 2049).prices.maratang, 2000)
  assert.equal(setMenuPrice(s, 'maratang', 1).prices.maratang, MENU_PRICE.maratang.min)
  assert.equal(setMenuPrice(s, 'shanguo', 99999).prices.shanguo, MENU_PRICE.shanguo.max)
})

test('test_menu_prices_changing_one_mode_leaves_the_other', () => {
  const s = setMenuPrice(createNewGame(), 'shanguo', 3500)
  assert.equal(s.prices.shanguo, 3500)
  assert.equal(s.prices.maratang, CHECKOUT_PRICE.ratePer100g.maratang)
})

test('test_menu_prices_unknown_mode_is_ignored', () => {
  const s = createNewGame()
  assert.equal(setMenuPrice(s, 'soup', 5000), s)
})

// ---------- register: receipt and correct price use the same adjusted rate ----------

test('test_menu_prices_register_base_and_correct_use_adjusted_maratang_rate', () => {
  const bowl = makeBowl()
  const s = dayWithCustomer({ maratang: 2400, shanguo: 3000 }, bowl)
  const { base, correct } = counterPrice(s)
  assert.equal(base, expectedBase(bowl, 2400))
  assert.equal(correct, base, 'no extras: correct price equals the scale price')
  assert.notEqual(base, expectedBase(bowl, CHECKOUT_PRICE.ratePer100g.maratang), 'fixed rate no longer used')
})

test('test_menu_prices_register_uses_adjusted_shanguo_rate', () => {
  const bowl = makeBowl({ mode: 'shanguo' })
  const s = dayWithCustomer({ maratang: 1800, shanguo: 4000 }, bowl)
  assert.equal(counterPrice(s).base, expectedBase(bowl, 4000))
})

test('test_menu_prices_surcharges_stay_fixed', () => {
  const bowl = makeBowl({ beef: 1, cilantro: true })
  const s = dayWithCustomer({ maratang: 2400, shanguo: 3000 }, bowl)
  const { base, correct } = counterPrice(s)
  assert.equal(correct - base, CHECKOUT_PRICE.beefSurcharge + CHECKOUT_PRICE.cilantroSurcharge)
})

test('test_menu_prices_charging_the_adjusted_scale_price_is_exact', () => {
  const s = dayWithCustomer({ maratang: 2400, shanguo: 3000 })
  const { base } = counterPrice(s)
  const after = confirmCharge(s)
  assert.equal(after.money, s.money + base)
  assert.equal(after.toasts.at(-1).kind, 'good', 'charging what the receipt shows is not a mistake')
})

test('test_menu_prices_breakdown_shows_the_adjusted_scale_amount', () => {
  const bowl = makeBowl()
  const prices = { maratang: 2400, shanguo: 3000 }
  assert.equal(chargeBreakdown(bowl, prices)[0].amount, expectedBase(bowl, 2400))
})

test('test_menu_prices_shared_pricing_defaults_to_fixed_rates_for_classic_flow', () => {
  const bowl = makeBowl()
  assert.equal(checkoutBasePrice(bowl), expectedBase(bowl, CHECKOUT_PRICE.ratePer100g.maratang))
  assert.equal(checkoutBowlPrice(bowl), checkoutBasePrice(bowl))
})

// ---------- demand ----------

test('test_menu_prices_demand_is_neutral_at_default_prices', () => {
  assert.equal(demandFactor(createNewGame()), 1)
})

test('test_menu_prices_demand_falls_when_dearer_and_rises_when_cheaper', () => {
  const s = createNewGame()
  assert.ok(demandFactor(setMenuPrice(s, 'maratang', 2400)) < 1)
  assert.ok(demandFactor(setMenuPrice(s, 'shanguo', 2400)) > 1)
})

test('test_menu_prices_demand_weights_modes_by_order_mix', () => {
  // The same relative raise moves demand more for the mode ordered more often.
  const s = createNewGame()
  const dearMaratang = demandFactor(setMenuPrice(s, 'maratang', 1800 * 1.2))
  const dearShanguo = demandFactor(setMenuPrice(s, 'shanguo', 3000 * 1.2))
  if (SHANGUO_CHANCE < 0.5) assert.ok(dearMaratang < dearShanguo)
  else assert.ok(dearShanguo <= dearMaratang)
})

// ---------- save ----------

test('test_menu_prices_round_trip_through_save', () => {
  const s = setMenuPrice(setMenuPrice(createNewGame(), 'maratang', 2100), 'shanguo', 3400)
  assert.equal(saveGame(s), true)
  assert.deepEqual(loadGame().prices, { maratang: 2100, shanguo: 3400 })
})

test('test_menu_prices_legacy_single_price_save_loads_with_defaults', () => {
  const legacy = {
    version: 1, day: 4, money: 7000, rating: 3, pricePer100g: 2600,
    stock: { noodle: 4 }, unlocked: ['noodle'], upgrades: { pots: 1 },
  }
  localStorage.setItem(SAVE_KEY, JSON.stringify(legacy))
  const loaded = loadGame()
  assert.ok(loaded, 'old saves are not rejected')
  assert.deepEqual(loaded.prices, CHECKOUT_PRICE.ratePer100g)
  assert.equal(loaded.day, 4)
})

test('test_menu_prices_out_of_range_saved_prices_are_clamped', () => {
  saveGame(createNewGame())
  const raw = JSON.parse(localStorage.getItem(SAVE_KEY))
  localStorage.setItem(SAVE_KEY, JSON.stringify({ ...raw, prices: { maratang: 50, shanguo: 99999 } }))
  assert.deepEqual(loadGame().prices, { maratang: MENU_PRICE.maratang.min, shanguo: MENU_PRICE.shanguo.max })
})

test('test_menu_prices_malformed_saved_prices_reject_the_save', () => {
  saveGame(createNewGame())
  const raw = JSON.parse(localStorage.getItem(SAVE_KEY))
  localStorage.setItem(SAVE_KEY, JSON.stringify({ ...raw, prices: { maratang: 'cheap' } }))
  assert.equal(loadGame(), null)
})
