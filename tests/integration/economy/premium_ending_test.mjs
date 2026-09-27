// 권리금 4주 분할 + 28일차 엔딩 (economy story E004, design/quick-specs/part1-28-days-2026-09-27.md §A·§C):
// instalments on Sundays 7/14/21/28, carry-over (never bankrupt for 권리금), paying extra, early payoff,
// the day-28 ending in two branches, the save round-trip and the bot walking through the ending.
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { PART1_LAST_DAY, PREMIUM_INSTALMENT, PREMIUM_TOTAL, RENT, SAVE_KEY } from '../../../src/js/self-serve/data.js'
import {
  advanceEnding, afterSummary, createNewGame, isEndingDone, payPremium,
} from '../../../src/js/self-serve/logic.js'
import { ENDING_LINE_COUNT, endingLine, premiumLine } from '../../../src/js/self-serve/story.js'
import { autoPlayDays } from '../../../src/js/self-serve/autoplay.js'
import { isValidSave, loadGame, saveGame } from '../../../src/js/self-serve/save.js'

const RICH = 10_000_000
// A Saturday's summary rolls into Sunday `sunday` through afterSummary (economy E003).
const saturday = (sunday, extra = {}) => ({ ...createNewGame(), phase: 'summary', day: sunday - 1, money: RICH, ...extra })
const sundayOf = (sunday, extra = {}) => afterSummary(saturday(sunday, extra))

function memoryStorage() {
  const store = new Map()
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  }
}
beforeEach(() => { globalThis.localStorage = memoryStorage() })

function seeded(seed = 11) {
  let x = seed
  return () => (x = (x * 16807) % 2147483647) / 2147483647
}

/** Saves `s`, then strips the E004 fields from the stored JSON — a save written before this story. */
function saveWithoutPremiumFields(s) {
  saveGame(s)
  const d = JSON.parse(localStorage.getItem(SAVE_KEY))
  for (const k of ['premiumLeft', 'premiumCarry', 'endingSeen', 'premiumPaidInFull']) delete d[k]
  localStorage.setItem(SAVE_KEY, JSON.stringify(d))
  return d
}

// ---------- amounts ----------

test('test_premium_total_is_ten_d_paid_in_four_equal_instalments', () => {
  // 10D, confirmed by the B001 28-day sim (was 8D)
  assert.equal(PREMIUM_TOTAL, 970_000)
  assert.equal(PREMIUM_INSTALMENT, 242_500)
  assert.equal(PART1_LAST_DAY, 28)
  assert.equal(createNewGame().premiumLeft, PREMIUM_TOTAL)
})

// ---------- Sunday instalments ----------

test('test_sunday_takes_rent_then_one_instalment', () => {
  const s = sundayOf(7)
  assert.equal(s.phase, 'sunday')
  assert.equal(s.money, RICH - RENT - PREMIUM_INSTALMENT)
  assert.equal(s.premiumLeft, PREMIUM_TOTAL - PREMIUM_INSTALMENT)
  assert.equal(s.ledger.premiumDue, PREMIUM_INSTALMENT)
  assert.equal(s.ledger.premiumPaid, PREMIUM_INSTALMENT)
  assert.equal(s.premiumCarry, 0)
})

test('test_sunday_short_money_pays_what_it_can_and_carries_the_rest', () => {
  const s = sundayOf(7, { money: RENT + 50_000 })
  assert.equal(s.ledger.rentPaid, true)
  assert.equal(s.ledger.premiumPaid, 50_000)
  assert.equal(s.premiumCarry, PREMIUM_INSTALMENT - 50_000)
  assert.equal(s.money, 0)
  assert.equal(s.ledger.bankrupt, false)
})

test('test_sunday_carry_is_added_to_next_weeks_instalment', () => {
  const s = sundayOf(14, { premiumCarry: 30_000, premiumLeft: PREMIUM_TOTAL - 164_000 })
  assert.equal(s.ledger.premiumDue, PREMIUM_INSTALMENT + 30_000)
  assert.equal(s.premiumCarry, 0)
})

test('test_sunday_unpaid_rent_means_no_premium_payment_and_full_carry', () => {
  const s = sundayOf(7, { money: 1_000 })
  assert.equal(s.ledger.rentPaid, false)
  assert.equal(s.ledger.premiumPaid, 0)
  assert.equal(s.premiumCarry, PREMIUM_INSTALMENT)
  assert.equal(s.money, 1_000)
})

test('test_premium_arrears_alone_never_close_the_shop', () => {
  const week1 = afterSummary(sundayOf(7, { money: RENT }))
  assert.equal(week1.phase, 'shop')
  const week2 = afterSummary(sundayOf(14, { money: RENT, premiumCarry: week1.premiumCarry, premiumLeft: week1.premiumLeft }))
  assert.equal(week2.phase, 'shop')
  assert.equal(week2.premiumCarry, PREMIUM_INSTALMENT * 2)
})

test('test_sunday_after_early_payoff_owes_nothing', () => {
  const s = sundayOf(21, { premiumLeft: 0 })
  assert.equal(s.ledger.premiumDue, 0)
  assert.equal(s.ledger.premiumSettled, true)
  assert.equal(s.money, RICH - RENT)
})

test('test_sunday_after_part1_has_no_premium_row', () => {
  const s = sundayOf(35, { premiumLeft: 0, endingSeen: true })
  assert.equal(s.ledger.premiumDue, undefined)
  assert.equal(s.money, RICH - RENT)
})

// ---------- paying extra ----------

test('test_pay_premium_extra_on_sunday_lowers_what_is_left', () => {
  const s = payPremium(sundayOf(7), 50_000)
  assert.equal(s.premiumLeft, PREMIUM_TOTAL - PREMIUM_INSTALMENT - 50_000)
  assert.equal(s.money, RICH - RENT - PREMIUM_INSTALMENT - 50_000)
})

test('test_pay_premium_is_capped_by_money_and_by_what_is_left', () => {
  const poor = sundayOf(7, { money: RENT + PREMIUM_INSTALMENT + 20_000 })
  assert.equal(payPremium(poor, 50_000).money, 0)
  const all = payPremium(sundayOf(7), 'all')
  assert.equal(all.premiumLeft, 0)
  assert.equal(all.money, RICH - RENT - PREMIUM_TOTAL)
})

test('test_pay_premium_extra_clears_carry_first', () => {
  const short = sundayOf(7, { money: RENT + 100_000 }) // pays 100,000 of the instalment, money 0
  assert.equal(short.premiumCarry, PREMIUM_INSTALMENT - 100_000)
  const topped = payPremium({ ...short, money: 60_000 }, 60_000)
  assert.equal(topped.premiumCarry, PREMIUM_INSTALMENT - 160_000)
})

test('test_pay_premium_does_nothing_outside_sunday', () => {
  const shop = { ...createNewGame(), phase: 'shop', money: RICH }
  assert.equal(payPremium(shop, 50_000), shop)
})

// ---------- day-28 ending ----------

test('test_early_payoff_on_day_21_still_waits_for_day_28', () => {
  const s = afterSummary(payPremium(sundayOf(21), 'all'))
  assert.equal(s.phase, 'shop')
  assert.equal(s.endingSeen, false)
})

test('test_day_28_sunday_collects_everything_left', () => {
  const s = sundayOf(28, { premiumLeft: 300_000, premiumCarry: 106_000 })
  assert.equal(s.ledger.premiumDue, 300_000)
  assert.equal(s.premiumLeft, 0)
})

test('test_day_28_leads_into_the_paid_in_full_ending', () => {
  const end = afterSummary(sundayOf(28, { premiumLeft: PREMIUM_INSTALMENT }))
  assert.equal(end.phase, 'ending')
  assert.equal(end.premiumPaidInFull, true)
  assert.equal(end.endingSeen, true)
})

test('test_day_28_short_leads_into_the_forgiven_ending_with_nothing_left', () => {
  const end = afterSummary(sundayOf(28, { money: RENT + 10_000, premiumLeft: 400_000 }))
  assert.equal(end.phase, 'ending')
  assert.equal(end.premiumPaidInFull, false)
  assert.equal(end.premiumLeft, 0)
  assert.equal(end.premiumCarry, 0)
})

test('test_bankrupt_on_day_28_closes_the_shop_instead_of_ending', () => {
  const s = afterSummary(sundayOf(28, { money: 0, rentOverdue: 1 }))
  assert.equal(s.phase, 'closed')
})

test('test_ending_steps_then_opens_the_shop', () => {
  let s = afterSummary(sundayOf(28))
  for (let i = 0; i < ENDING_LINE_COUNT + 3; i++) s = advanceEnding(s)
  assert.equal(isEndingDone(s), true)
  const shop = afterSummary(s)
  assert.equal(shop.phase, 'shop')
  assert.equal(shop.day, 28)
})

// ---------- lines ----------

test('test_panda_premium_lines_follow_the_week', () => {
  assert.match(premiumLine({ day: 7, premiumPaid: 1, premiumDue: 1 }).text, /첫 할부/)
  assert.match(premiumLine({ day: 14, premiumPaid: 1, premiumDue: 1 }).text, /반 왔네/)
  assert.match(premiumLine({ day: 21, premiumPaid: 1, premiumDue: 1 }).text, /하나 남았다/)
  assert.match(premiumLine({ day: 7, premiumPaid: 0, premiumDue: 1 }).text, /다음 주에 같이/)
  assert.match(premiumLine({ day: 21, premiumSettled: true }).text, /28일에 보자/)
  assert.equal(premiumLine({ day: 28, premiumPaid: 1, premiumDue: 1 }), null)
})

test('test_ending_lines_differ_only_in_the_middle', () => {
  const paid = Array.from({ length: ENDING_LINE_COUNT }, (_, i) => endingLine(i, true))
  const forgiven = Array.from({ length: ENDING_LINE_COUNT }, (_, i) => endingLine(i, false))
  assert.equal(paid[0].text, forgiven[0].text)
  assert.match(paid.map((l) => l.text).join(' '), /다 갚았네/)
  assert.match(forgiven.map((l) => l.text).join(' '), /한 그릇으로 받았다 치자/)
  assert.ok(paid.some((l) => /이제 네 가게구나/.test(l.text)))
  assert.ok(forgiven.some((l) => /이제 네 가게구나/.test(l.text)))
  assert.match(paid.at(-1).text, /1부/)
})

// ---------- save ----------

test('test_save_round_trips_premium_and_ending_state', () => {
  saveGame({ ...createNewGame(), phase: 'shop', day: 30, premiumLeft: 0, premiumCarry: 0, endingSeen: true, premiumPaidInFull: false })
  const loaded = loadGame()
  assert.equal(loaded.premiumLeft, 0)
  assert.equal(loaded.endingSeen, true)
  assert.equal(loaded.premiumPaidInFull, false)
})

test('test_save_old_saves_start_with_the_full_premium_before_day_28', () => {
  saveWithoutPremiumFields({ ...createNewGame(), phase: 'shop', day: 10 })
  const loaded = loadGame()
  assert.equal(loaded.premiumLeft, PREMIUM_TOTAL)
  assert.equal(loaded.endingSeen, false)
})

test('test_save_old_saves_past_day_28_count_part1_as_done', () => {
  saveWithoutPremiumFields({ ...createNewGame(), phase: 'shop', day: 40 })
  const loaded = loadGame()
  assert.equal(loaded.endingSeen, true)
  assert.equal(loaded.premiumLeft, 0)
})

test('test_save_rejects_bad_premium_fields', () => {
  const d = saveWithoutPremiumFields({ ...createNewGame(), phase: 'shop', day: 10 })
  assert.equal(isValidSave({ ...d, premiumLeft: -1 }), false)
  assert.equal(isValidSave({ ...d, premiumCarry: 1.5 }), false)
  assert.equal(isValidSave({ ...d, endingSeen: 'yes' }), false)
})

// ---------- bot ----------

test('test_bot_plays_through_day_28_and_the_ending', () => {
  // Sunday 21's shop, rich: plays days 22–27, then Sunday 28 (settles everything) → ending → day 29.
  const start = { ...createNewGame(), phase: 'shop', day: 21, money: RICH }
  const end = autoPlayDays(start, 7, seeded())
  assert.equal(end.endingSeen, true)
  assert.equal(end.premiumPaidInFull, true)
  assert.equal(end.premiumLeft, 0)
  assert.ok(end.day > PART1_LAST_DAY)
})
