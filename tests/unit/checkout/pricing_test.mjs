// Story 001 — checkout pricing. Covers every acceptance criterion and edge case
// in production/epics/maratang-tycoon/story-001-checkout-pricing.md.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  adjustCharge, checkoutBasePrice, checkoutBowlPrice, checkoutBowlWeight, checkoutOutcome, confirmCharge,
  createNewGame, resetCharge, servePot, startDay, tick, toCheckoutBowl,
} from '../../../src/js/logic.js'
import { CHECKOUT_PRICE } from '../../../src/js/data.js'

// Factory: a checkout bowl with no surcharges unless overridden.
const makeBowl = (over = {}) => ({
  weighed: {}, mode: 'maratang', beef: false, lamb: false, skewers: {}, cilantro: false, ...over,
})

// Factory: a day with one finished pot for customer 1 (accurate bowl, full patience).
function dayWithFinishedPot(items) {
  const s = startDay(createNewGame())
  const order = { items, spice: 2 }
  const customer = { id: 1, face: '🐷', order, patience: 40, maxPatience: 40, status: 'cooking' }
  const pot = { customerId: 1, bowl: { items, spice: 2 }, remaining: 0, total: 6 }
  return { ...s, customers: [customer], pots: [pot], spawnTimer: 999, nextCustomerId: 2 }
}

// ---------- weight ----------

test('test_checkout_weight_counts_only_weighed_ingredients', () => {
  // noodle 80g + bokchoy 40g×2 = 160g; meat and skewers are flags/counts, not grams
  const bowl = makeBowl({ weighed: { noodle: 1, bokchoy: 2 }, beef: true, skewers: { skewer_shrimp: 3 } })
  assert.equal(checkoutBowlWeight(bowl), 160)
})

test('test_checkout_weight_ignores_meat_ids_left_in_weighed_map', () => {
  const bowl = makeBowl({ weighed: { noodle: 1, beef: 2, lamb: 1 } })
  assert.equal(checkoutBowlWeight(bowl), 80)
})

// ---------- base price by mode ----------

test('test_checkout_price_maratang_uses_1800_per_100g', () => {
  // 200g maratang → 3,600원
  assert.equal(checkoutBowlPrice(makeBowl({ weighed: { noodle: 2, bokchoy: 1 } })), 3600)
})

test('test_checkout_price_shanguo_uses_3000_per_100g', () => {
  // 200g shanguo → 6,000원
  assert.equal(checkoutBowlPrice(makeBowl({ mode: 'shanguo', weighed: { noodle: 2, bokchoy: 1 } })), 6000)
})

// ---------- surcharges ----------

test('test_checkout_price_beef_adds_3000_and_lamb_adds_4000', () => {
  assert.equal(checkoutBowlPrice(makeBowl({ beef: true })), CHECKOUT_PRICE.beefSurcharge)
  assert.equal(checkoutBowlPrice(makeBowl({ lamb: true })), CHECKOUT_PRICE.lambSurcharge)
  assert.equal(checkoutBowlPrice(makeBowl({ beef: true, lamb: true })), 7000)
})

test('test_checkout_price_meat_surcharge_is_per_portion', () => {
  assert.equal(checkoutBowlPrice(makeBowl({ beef: 2 })), 6000)
  assert.equal(checkoutBowlPrice(makeBowl({ lamb: 3 })), 12000)
  assert.equal(checkoutBowlPrice(makeBowl({ beef: 1, lamb: 2 })), 11000)
})

test('test_checkout_to_checkout_bowl_keeps_meat_portion_counts', () => {
  const bowl = toCheckoutBowl({ items: { noodle: 1, beef: 2, lamb: 1 }, spice: 1 })
  assert.equal(bowl.beef, 2)
  assert.equal(bowl.lamb, 1)
  assert.equal(toCheckoutBowl({ items: { noodle: 1 } }).beef, 0)
})

test('test_checkout_serve_charges_every_meat_portion', () => {
  const s = dayWithFinishedPot({ noodle: 1, enoki: 1, beef: 2 }) // 2,200 + 2 × 3,000
  assert.equal(servePot(s, 0).pendingCheckout.correctPrice, 8200)
})

test('test_checkout_price_each_skewer_adds_1000', () => {
  const bowl = makeBowl({ skewers: { skewer_fishcake_deluxe: 1, skewer_sausage_deluxe: 2 } })
  assert.equal(checkoutBowlPrice(bowl), 3000)
})

test('test_checkout_price_cilantro_adds_flat_1000', () => {
  assert.equal(checkoutBowlPrice(makeBowl({ cilantro: true })), 1000)
})

// ---------- edge cases ----------

test('test_checkout_price_empty_bowl_is_zero', () => {
  assert.equal(checkoutBowlPrice(makeBowl()), 0)
})

test('test_checkout_price_full_combo_matches_story_example', () => {
  // 300g shanguo + beef + 2 skewers + cilantro = 9,000 + 3,000 + 2,000 + 1,000
  const bowl = makeBowl({
    mode: 'shanguo', weighed: { sprout: 6 }, beef: true, skewers: { skewer_shrimp: 2 }, cilantro: true,
  })
  assert.equal(checkoutBowlWeight(bowl), 300)
  assert.equal(checkoutBowlPrice(bowl), 15000)
})

test('test_checkout_price_shrimp_only_bowl_still_charges_skewers', () => {
  const bowl = makeBowl({ skewers: { skewer_shrimp: 1 } })
  assert.equal(checkoutBowlWeight(bowl), 0)
  assert.equal(checkoutBowlPrice(bowl), 1000)
})

// ---------- outcome ----------

test('test_checkout_outcome_exact_overcharge_undercharge', () => {
  assert.deepEqual(checkoutOutcome(5000, 5000), { type: 'exact', difference: 0 })
  assert.deepEqual(checkoutOutcome(5000, 6000), { type: 'overcharge', difference: 1000 })
  assert.deepEqual(checkoutOutcome(5000, 4200), { type: 'undercharge', difference: 800 })
})

// ---------- legacy bowl mapping ----------

test('test_checkout_to_checkout_bowl_turns_meat_scoops_into_counts', () => {
  const bowl = toCheckoutBowl({ items: { noodle: 1, beef: 2 }, spice: 1 })
  assert.deepEqual(bowl.weighed, { noodle: 1 })
  assert.equal(bowl.beef, 2)
  assert.equal(bowl.lamb, 0)
  assert.equal(bowl.mode, 'maratang')
})

// ---------- owner confirms the charge ----------

test('test_checkout_base_price_is_weight_only', () => {
  const bowl = makeBowl({ mode: 'shanguo', weighed: { sprout: 6 }, beef: true, skewers: { skewer_shrimp: 2 }, cilantro: true })
  assert.equal(checkoutBasePrice(bowl), 9000)
})

test('test_checkout_serve_prefills_weight_price_without_paying', () => {
  const s = dayWithFinishedPot({ noodle: 1, enoki: 1 }) // 120g maratang → 2,200원 (rounded to 100)
  const served = servePot(s, 0)
  assert.equal(served.money, s.money, 'no money until the owner confirms')
  assert.equal(served.pendingCheckout.basePrice, 2200)
  assert.equal(served.pendingCheckout.charged, 2200, 'register starts at the weight price')
  assert.equal(served.pots[0], null)
})

test('test_checkout_meat_is_added_by_owner_on_top_of_prefilled_weight_price', () => {
  const s = dayWithFinishedPot({ noodle: 1, enoki: 1, beef: 1 })
  const served = servePot(s, 0)
  assert.equal(served.pendingCheckout.charged, 2200)
  assert.equal(served.pendingCheckout.correctPrice, 5200)
  const done = confirmCharge(adjustCharge(served, 3000))
  assert.equal(done.stats.exactCharges, 1)
})

test('test_checkout_reset_returns_to_weight_price', () => {
  const served = servePot(dayWithFinishedPot({ noodle: 1, enoki: 1 }), 0)
  assert.equal(resetCharge(adjustCharge(served, 5000)).pendingCheckout.charged, 2200)
})

test('test_checkout_second_serve_is_blocked_while_checkout_pending', () => {
  const s = dayWithFinishedPot({ noodle: 1 })
  const withTwoPots = { ...s, pots: [s.pots[0], { ...s.pots[0], customerId: 1 }] }
  const first = servePot(withTwoPots, 0)
  const second = servePot(first, 1)
  assert.notEqual(second.pots[1], null)
  assert.equal(second.pendingCheckout.customerId, first.pendingCheckout.customerId)
})

test('test_checkout_adjust_charge_never_goes_below_zero', () => {
  const pending = servePot(dayWithFinishedPot({ noodle: 1 }), 0) // 80g → 1,400원
  assert.equal(adjustCharge(pending, -5000).pendingCheckout.charged, 0)
  assert.equal(adjustCharge(adjustCharge(pending, 1000), 100).pendingCheckout.charged, 2500)
})

test('test_checkout_confirm_exact_records_exact_sale', () => {
  const pending = servePot(dayWithFinishedPot({ noodle: 1, enoki: 1 }), 0)
  const done = confirmCharge(pending)
  assert.equal(done.pendingCheckout, null)
  assert.equal(done.stats.exactCharges, 1)
  assert.equal(done.stats.overcharge, 0)
  assert.equal(done.stats.undercharge, 0)
  assert.equal(done.stats.revenue, 2200)
  assert.equal(done.money, pending.money + 2200 + done.stats.tips)
})

test('test_checkout_confirm_overcharge_records_difference', () => {
  const pending = servePot(dayWithFinishedPot({ noodle: 1, enoki: 1 }), 0)
  const done = confirmCharge(adjustCharge(pending, 800))
  assert.equal(done.stats.overcharge, 800)
  assert.equal(done.stats.overchargeCount, 1)
  assert.equal(done.stats.revenue, 3000)
})

test('test_checkout_confirm_undercharge_records_loss', () => {
  const pending = servePot(dayWithFinishedPot({ noodle: 1, enoki: 1 }), 0)
  const done = confirmCharge(adjustCharge(pending, -200))
  assert.equal(done.stats.undercharge, 200)
  assert.equal(done.stats.overchargeCount, 0)
  assert.equal(done.stats.revenue, 2000)
})

test('test_checkout_day_does_not_end_while_checkout_pending', () => {
  const pending = servePot(dayWithFinishedPot({ noodle: 1 }), 0)
  const closed = tick({ ...pending, dayTime: 9999 }, 0.1, () => 0.5)
  assert.equal(closed.phase, 'day')
  assert.equal(tick(confirmCharge(closed), 0.1, () => 0.5).phase, 'summary')
})
