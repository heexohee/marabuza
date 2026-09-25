// Player feedback for the two things the first playtest missed
// (production/qa/playtests/playtest-2026-09-25-dev.md): shelf freshness and register mistakes.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  adjustCharge, chargeBreakdown, chargeMistake, confirmCharge, createNewGame, dig, isJustWilted, setTicketMode,
  startDay, tick,
} from '../../../src/js/self-serve/logic.js'
import { freshness, isWilting } from '../../../src/js/self-serve/shelf.js'
import { CHECKOUT_PRICE } from '../../../src/js/data.js'
import {
  FEEDBACK_TOAST_SEC, RATING_DELTA, WILT_FLASH_SEC, WILT_SEC, WILT_WARN_RATIO,
} from '../../../src/js/self-serve/data.js'

const constant = (v) => () => v
const QUIET = 999

const makeBowl = (over = {}) => ({
  weighed: { noodle: 1, enoki: 1 }, mode: 'maratang', beef: 0, lamb: 0, skewers: {}, cilantro: false, ...over,
})

// Factory: day with one customer at the counter.
function dayWithCustomer(c = {}) {
  const s = startDay(createNewGame())
  const customer = { id: 1, face: '🐷', mode: 'maratang', spice: 2, missing: [], patience: 40, maxPatience: 40, bowl: makeBowl(), ...c }
  return { ...s, queue: [customer], counter: { ...s.counter, customerId: 1 }, spawnTimer: QUIET }
}
const lastToast = (s) => s.toasts.at(-1)
const digAll = (s, times) => Array.from({ length: times }).reduce((cur) => dig(tick(cur, 1, constant(0.5))), s)

// ---------- freshness ----------

test('test_freshness_is_share_of_wilt_time_left_on_oldest_batch', () => {
  const shelf = { bokchoy: [{ qty: 1, age: WILT_SEC * 0.75 }, { qty: 3, age: 0 }] }
  assert.ok(Math.abs(freshness(shelf, 'bokchoy') - 0.25) < 1e-9)
  assert.equal(freshness(shelf, 'noodle'), null, 'empty slot has no freshness')
  assert.equal(freshness({ noodle: [{ qty: 1, age: 999 }] }, 'noodle'), null, 'non-perishables never wilt')
})

test('test_freshness_warning_starts_at_warn_ratio', () => {
  const at = (ratio) => ({ sprout: [{ qty: 1, age: WILT_SEC * (1 - ratio) }] })
  assert.equal(isWilting(at(WILT_WARN_RATIO + 0.05), 'sprout'), false)
  assert.equal(isWilting(at(WILT_WARN_RATIO), 'sprout'), true)
})

test('test_wilted_slot_is_flagged_for_a_short_flash', () => {
  const s = { ...startDay(createNewGame()), spawnTimer: QUIET }
  const wilted = tick(s, WILT_SEC + 0.1, constant(0.5))
  assert.equal(isJustWilted(wilted, 'bokchoy'), true)
  assert.equal(isJustWilted(wilted, 'noodle'), false)
  assert.equal(isJustWilted(tick(wilted, WILT_FLASH_SEC + 0.1, constant(0.5)), 'bokchoy'), false)
})

// ---------- register breakdown ----------

test('test_charge_breakdown_lines_add_up_to_the_correct_price', () => {
  const bowl = makeBowl({ mode: 'shanguo', beef: 2, skewers: { skewer_shrimp: 2 }, cilantro: true })
  const lines = chargeBreakdown(bowl)
  const total = lines.reduce((sum, l) => sum + l.amount, 0)
  // 120g shanguo 3,600 + beef 2 × 3,000 + 2 skewers + cilantro
  assert.equal(total, 3600 + 6000 + 2 * CHECKOUT_PRICE.skewerPrice + CHECKOUT_PRICE.cilantroSurcharge)
  assert.deepEqual(lines.map((l) => l.label), ['저울 샹궈 120g', '소고기 ×2', '꼬치 ×2', '고수'])
})

// ---------- mistake reasons ----------

test('test_charge_mistake_is_null_when_exact', () => {
  assert.equal(chargeMistake(dayWithCustomer()), null)
})

test('test_charge_mistake_blames_wrong_ticket_mode_first', () => {
  const s = dayWithCustomer({ mode: 'shanguo', bowl: makeBowl({ mode: 'shanguo' }) })
  assert.equal(chargeMistake(s), 'mode')
})

test('test_charge_mistake_blames_undug_items_when_some_are_still_hidden', () => {
  const s = dayWithCustomer({ bowl: makeBowl({ beef: 1 }) })
  assert.equal(chargeMistake(s), 'undug')
  const dug = digAll(s, 1)
  assert.equal(chargeMistake(dug), 'extras', 'all found, surcharge still missing')
  const handsFree = tick(dug, 1, constant(0.5)) // digging keeps the owner busy briefly
  assert.equal(chargeMistake(adjustCharge(handsFree, CHECKOUT_PRICE.beefSurcharge)), null)
})

// ---------- confirm feedback ----------

test('test_confirm_exact_praises_and_lingers', () => {
  const s = confirmCharge(dayWithCustomer())
  assert.match(lastToast(s).text, /딱 맞게/)
  assert.equal(lastToast(s).ttl, FEEDBACK_TOAST_SEC)
})

test('test_confirm_undercharge_names_amount_and_reason', () => {
  const s = confirmCharge(dayWithCustomer({ mode: 'shanguo', bowl: makeBowl({ mode: 'shanguo' }) }))
  const t = lastToast(s)
  assert.equal(t.kind, 'bad')
  assert.match(t.text, /1,400원 덜 받았어요/)
  assert.match(t.text, /조리 방식/)
  assert.match(t.text, /3,600원/, 'shows the correct total')
})

test('test_confirm_overcharge_costs_rating_and_says_so', () => {
  const before = dayWithCustomer()
  const s = confirmCharge(adjustCharge(before, 1000))
  assert.match(lastToast(s).text, /1,000원 더 받았어요/)
  assert.ok(Math.abs(s.rating - (before.rating + RATING_DELTA.overcharge)) < 1e-9)
})

test('test_confirm_undug_reason_mentions_hidden_items', () => {
  const s = confirmCharge(dayWithCustomer({ bowl: makeBowl({ skewers: { skewer_sausage_deluxe: 1 } }) }))
  assert.match(lastToast(s).text, /숨은 재료/)
})

test('test_confirm_matching_mode_switch_is_not_a_mistake', () => {
  const s = setTicketMode(dayWithCustomer({ mode: 'shanguo', bowl: makeBowl({ mode: 'shanguo' }) }), 'shanguo')
  assert.equal(chargeMistake(s), null)
})
