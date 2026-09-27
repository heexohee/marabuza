// Weekly rent + Sunday off day (economy story E003): calendar day count, the Sunday ledger, overdue rent,
// bankruptcy, and the save round-trip. Covers src/js/self-serve/{data,logic,save}.js.
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { RENT, isSunday, weekOf, weekdayOf } from '../../../src/js/self-serve/data.js'
import {
  advanceSunday, afterSummary, createNewGame, enterSunday, isSundayDone, resumeShop, startDay, tick,
} from '../../../src/js/self-serve/logic.js'
import { SUNDAY_LAST_STEP, sundayLine } from '../../../src/js/self-serve/story.js'
import { autoPlayDay, autoPlayDays } from '../../../src/js/self-serve/autoplay.js'
import { clearSave, hasSave, isValidSave, loadGame, saveGame } from '../../../src/js/self-serve/save.js'

const RICH = 10_000_000 // enough to always cover rent (a D multiple, economy E002)
const atDay = (day, extra = {}) => ({ ...createNewGame(), day, money: RICH, ...extra })

// Deterministic random source (Park–Miller), so autoplay tests run the same customers every time.
function seeded(seed = 7) {
  let x = seed
  return () => (x = (x * 16807) % 2147483647) / 2147483647
}

// In-memory localStorage stand-in (node has none).
function memoryStorage() {
  const store = new Map()
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  }
}
beforeEach(() => { globalThis.localStorage = memoryStorage() })

// ---------- calendar (weekOf/weekdayOf/isSunday) ----------

test('test_calendar_day_seven_fourteen_twentyone_are_sunday', () => {
  assert.deepEqual([7, 14, 21, 28].map(isSunday), [true, true, true, true])
  assert.deepEqual([1, 6, 8, 13, 15, 20].map(isSunday), [false, false, false, false, false, false])
})

test('test_calendar_day_one_is_monday_day_six_is_saturday', () => {
  assert.equal(weekdayOf(1), 1) // 월
  assert.equal(weekdayOf(6), 6) // 토
  assert.equal(weekdayOf(8), 1) // week 2's Monday — the count never skips a day
})

test('test_calendar_week_number_covers_seven_days_each', () => {
  assert.deepEqual([1, 7, 8, 14, 15].map(weekOf), [1, 1, 2, 2, 3])
})

// ---------- afterSummary: weekday vs Saturday ----------

test('test_afterSummary_on_a_weekday_goes_straight_to_the_shop', () => {
  const after = afterSummary(atDay(3, { phase: 'summary' })) // Wednesday
  assert.equal(after.phase, 'shop')
  assert.equal(after.day, 3, 'day does not advance until nextDay')
})

test('test_afterSummary_on_saturday_enters_sunday_with_the_week_settled', () => {
  const s = atDay(6, { phase: 'summary', weekRevenue: 50000 })
  const after = afterSummary(s)
  assert.equal(after.phase, 'sunday')
  assert.equal(after.day, 7, 'Sunday is its own calendar day, not skipped')
  assert.equal(after.money, RICH - RENT)
  assert.deepEqual(after.ledger, { weekRevenue: 50000, rentDue: RENT, rentPaid: true, bankrupt: false })
  assert.equal(after.rentOverdue, 0)
  assert.equal(after.weekRevenue, 0, 'resets for the new week')
})

test('test_afterSummary_from_sunday_falls_through_to_the_shop_on_the_same_day', () => {
  const after = afterSummary(atDay(7, { phase: 'sunday' }))
  assert.equal(after.phase, 'shop')
  assert.equal(after.day, 7)
})

// ---------- rent shortfall: one grace week, then bankruptcy ----------

test('test_enterSunday_marks_overdue_without_charging_when_short', () => {
  const s = atDay(7, { money: RENT - 1, rentOverdue: 0 })
  const after = enterSunday(s)
  assert.equal(after.phase, 'sunday', 'a first miss is a warning, not closure')
  assert.equal(after.money, RENT - 1, 'nothing is deducted when it cannot be paid')
  assert.equal(after.rentOverdue, 1)
  assert.equal(after.ledger.rentPaid, false)
})

test('test_enterSunday_charges_double_the_week_after_a_miss', () => {
  const after = enterSunday(atDay(14, { money: RENT * 2, rentOverdue: 1 }))
  assert.equal(after.phase, 'sunday')
  assert.equal(after.money, 0)
  assert.equal(after.rentOverdue, 0)
  assert.equal(after.ledger.rentDue, RENT * 2)
  assert.equal(after.ledger.rentPaid, true)
})

test('test_enterSunday_second_consecutive_miss_plays_sunday_then_closes_the_shop', () => {
  const sunday = enterSunday(atDay(14, { money: RENT * 2 - 1, rentOverdue: 1 }))
  assert.equal(sunday.phase, 'sunday', 'the Sunday scene still plays — the ledger is where it is decided')
  assert.equal(sunday.ledger.bankrupt, true)
  assert.equal(sunday.money, RENT * 2 - 1, 'still not deducted')
  assert.equal(sundayLine(SUNDAY_LAST_STEP, sunday.ledger).who, 'landlord')
  const closed = afterSummary(sunday)
  assert.equal(closed.phase, 'closed', 'leaving the scene closes the shop instead of opening it')
  assert.equal(closed.closedReason, 'rent')
})

test('test_enterSunday_a_first_miss_is_not_bankrupt', () => {
  assert.equal(enterSunday(atDay(7, { money: RENT - 1 })).ledger.bankrupt, false)
})

test('test_enterSunday_one_miss_then_recovering_clears_the_overdue_flag', () => {
  const missed = enterSunday(atDay(7, { money: RENT - 1 }))
  assert.equal(missed.rentOverdue, 1)
  const recovered = enterSunday({ ...missed, day: 14, money: RENT * 2 })
  assert.equal(recovered.phase, 'sunday')
  assert.equal(recovered.rentOverdue, 0, 'paying the double clears it')
})

// ---------- reputation failure closes the same screen ----------

test('test_tick_closes_the_shop_when_rating_hits_zero', () => {
  const s = { ...startDay(createNewGame()), rating: 0.01 }
  const after = tick({ ...s, rating: 0 }, 0.1)
  assert.equal(after.phase, 'closed')
  assert.equal(after.closedReason, 'rating')
})

test('test_tick_does_not_close_the_shop_while_rating_is_above_zero', () => {
  const s = startDay(createNewGame())
  const after = tick(s, 0.1)
  assert.notEqual(after.phase, 'closed')
})

// ---------- save round-trip ----------

test('test_save_round_trips_rent_overdue_and_week_revenue', () => {
  const s = { ...createNewGame(), phase: 'shop', rentOverdue: 1, weekRevenue: 12345 }
  assert.equal(saveGame(s), true)
  const loaded = loadGame()
  assert.equal(loaded.rentOverdue, 1)
  assert.equal(loaded.weekRevenue, 12345)
})

test('test_save_resumes_into_the_sunday_screen_when_closed_there', () => {
  const s = enterSunday(atDay(7))
  assert.equal(saveGame(s), true)
  const loaded = loadGame()
  const resumed = resumeShop(loaded)
  assert.equal(resumed.phase, 'sunday')
  assert.deepEqual(resumed.ledger, s.ledger)
})

test('test_save_resumes_into_the_shop_from_every_other_phase', () => {
  saveGame({ ...createNewGame(), phase: 'summary' })
  assert.equal(resumeShop(loadGame()).phase, 'shop')
})

test('test_save_rejects_a_bad_rent_overdue_flag', () => {
  const good = { version: 1, day: 1, money: 0, rating: 3, stock: {}, unlocked: [], upgrades: { pots: 1 } }
  assert.equal(isValidSave({ ...good, rentOverdue: 2 }), false)
  assert.equal(isValidSave({ ...good, phase: 'shop' }), false, "only 'sunday' is ever a saved phase")
})

// ---------- full week, played by the bot ----------

test('test_autoplay_crosses_the_sunday_boundary_and_keeps_serving_on_monday', () => {
  const monday = startDay(createNewGame())
  const after = autoPlayDays(monday, 7, seeded())
  assert.equal(after.phase, 'summary')
  assert.equal(after.day, 8, 'Monday of week 2 — Sunday (day 7) was a free pass-through')
  assert.ok(after.stats.served > 0, 'business resumed after the Sunday off day')
})

test('test_autoplay_pays_rent_on_the_sunday_it_crosses', () => {
  const saturday = { ...startDay(createNewGame()), day: 6, money: RICH }
  const summary = autoPlayDay(saturday, seeded()) // plays out the bot's Saturday
  const sunday = afterSummary(summary)
  assert.equal(sunday.phase, 'sunday')
  assert.equal(sunday.money, summary.money - RENT, 'exactly the rent came out, nothing more')
  assert.equal(sunday.ledger.rentPaid, true)

  // 2 more iterations: the 1st resolves Sunday's free pass-through into Monday's (day 8) business and
  // plays it; the 2nd would play day 9 — stopping after 1 still lands past the boundary, on day 8's summary
  const after = autoPlayDays(sunday, 1, seeded(11))
  assert.equal(after.day, 8)
  assert.equal(after.phase, 'summary')
})

// ---------- the Sunday scene (feedback 2026-09-27: a scene in the closed shop, rent goes to the landlord) ----------

test('test_sunday_scene_opens_on_its_first_beat_and_stops_on_the_last', () => {
  let s = enterSunday(atDay(7))
  assert.equal(s.sundayStep, 0)
  assert.equal(isSundayDone(s), false)
  for (let i = 0; i < SUNDAY_LAST_STEP + 3; i++) s = advanceSunday(s)
  assert.equal(s.sundayStep, SUNDAY_LAST_STEP, 'clamped; leaving is afterSummary\'s job')
  assert.equal(isSundayDone(s), true)
  assert.equal(afterSummary(s).phase, 'shop')
})

test('test_sunday_scene_opens_with_the_day_off_caption', () => {
  assert.deepEqual(sundayLine(0, null), { who: 'caption', text: '오늘은 일요일! 쉬는 날.' })
})

test('test_sunday_scene_short_rent_is_the_landlords_line_not_the_pandas', () => {
  const short = enterSunday(atDay(7, { money: RENT - 1 }))
  assert.equal(sundayLine(SUNDAY_LAST_STEP, short.ledger).who, 'landlord')
  const paid = enterSunday(atDay(7))
  assert.equal(sundayLine(SUNDAY_LAST_STEP, paid.ledger).who, 'me')
})

test('test_sunday_scene_advance_does_nothing_outside_sunday', () => {
  const shop = atDay(3, { phase: 'shop' })
  assert.equal(advanceSunday(shop), shop)
})

test('test_save_clear_ends_the_run_so_continue_has_nothing_to_load', () => {
  saveGame({ ...createNewGame(), phase: 'shop', day: 14, rentOverdue: 1 })
  assert.equal(hasSave(), true)
  assert.equal(clearSave(), true)
  assert.equal(hasSave(), false)
  assert.equal(loadGame(), null)
})
