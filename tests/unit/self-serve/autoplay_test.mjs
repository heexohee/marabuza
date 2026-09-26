// Dev-mode autoplay bot + dev bar actions (src/js/self-serve/autoplay.js, dev.js).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createNewGame, openShop, startDay } from '../../../src/js/self-serve/logic.js'
import {
  BOT_MISTAKES, NO_MISTAKES, autoPlayDay, autoPlayDays, planMistakes, restockWarehouse,
} from '../../../src/js/self-serve/autoplay.js'
import { DEV_ACTIONS, DEV_MONEY_STEP, isDevMode } from '../../../src/js/self-serve/dev.js'

// Deterministic random source (Park–Miller), so every run plays the same customers.
function seeded(seed = 7) {
  let x = seed
  return () => (x = (x * 16807) % 2147483647) / 2147483647
}
const loc = (url) => new URL(url)

test('test_autoplay_perfect_day_plays_to_the_summary_without_mistakes', () => {
  const s = startDay(createNewGame())
  const after = autoPlayDay(s, seeded(), NO_MISTAKES)
  assert.equal(after.phase, 'summary')
  assert.equal(after.day, s.day)
  assert.ok(after.stats.served > 0, 'customers are served')
  assert.equal(after.stats.overchargeCount, 0)
  assert.equal(after.stats.undercharge, 0)
  assert.equal(after.stats.exactCharges, after.stats.served, 'every seated customer was charged exactly and served')
  assert.ok(after.money > s.money)
})

test('test_autoplay_day_makes_a_few_register_slips_by_default', () => {
  const { undercharge, overcharge } = BOT_MISTAKES
  for (const seed of [3, 7, 55, 99, 1234]) {
    const after = autoPlayDay(startDay(createNewGame()), seeded(seed))
    const { stats } = after
    const slipped = stats.served - stats.exactCharges
    assert.ok(slipped >= undercharge.count[0] && slipped <= undercharge.count[1] + overcharge.count[1], `seed ${seed}: ${slipped} slips`)
    assert.ok(stats.undercharge >= undercharge.amount[0], `seed ${seed}: at least one full-size undercharge`)
    assert.ok(stats.undercharge <= undercharge.amount[1] * undercharge.count[1])
    assert.ok(stats.overchargeCount <= overcharge.count[1])
    assert.equal(stats.overcharge, stats.overchargeCount * overcharge.amount)
  }
})

test('test_autoplay_plan_mistakes_follows_the_counts_and_amounts', () => {
  const { undercharge, overcharge, within } = BOT_MISTAKES
  for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
    const plan = planMistakes(seeded(seed))
    const unders = [...plan.values()].filter((v) => v < 0)
    const overs = [...plan.values()].filter((v) => v > 0)
    assert.ok(unders.length >= undercharge.count[0] && unders.length <= undercharge.count[1])
    assert.ok(overs.length <= overcharge.count[1])
    unders.forEach((v) => assert.ok(-v >= undercharge.amount[0] && -v <= undercharge.amount[1] && v % undercharge.step === 0))
    overs.forEach((v) => assert.equal(v, overcharge.amount))
    ;[...plan.keys()].forEach((k) => assert.ok(k >= 0 && k < within))
  }
})

test('test_autoplay_day_ignores_non_business_screens', () => {
  const shop = { ...createNewGame(), phase: 'shop' }
  assert.equal(autoPlayDay(shop, seeded()), shop)
})

test('test_autoplay_days_advance_and_top_up_the_warehouse', () => {
  const first = autoPlayDay(startDay(createNewGame()), seeded())
  const after = autoPlayDays(first, 2, seeded(11))
  assert.equal(after.phase, 'summary')
  assert.equal(after.day, first.day + 2)
  assert.ok(after.stats.served > 0, 'still serving: shelves were refilled between days')
})

test('test_autoplay_restock_warehouse_never_overspends', () => {
  const broke = { ...openShop(autoPlayDay(startDay(createNewGame()), seeded())), money: 0 }
  const after = restockWarehouse(broke)
  assert.equal(after.money, 0)
  assert.deepEqual(after.stock, broke.stock)
})

test('test_dev_auto_day_from_shop_plays_the_next_day', () => {
  const shop = openShop(autoPlayDay(startDay(createNewGame()), seeded()))
  const after = DEV_ACTIONS.autoDay(shop)
  assert.equal(after.phase, 'summary')
  assert.equal(after.day, shop.day + 1)
})

test('test_dev_auto_week_plays_six_business_days_from_a_day', () => {
  const s = startDay(createNewGame())
  const after = DEV_ACTIONS.autoWeek(s)
  assert.equal(after.phase, 'summary')
  assert.equal(after.day, s.day + 5, 'the rest of today counts as the first of the six days')
})

test('test_dev_auto_day_on_menu_only_shows_a_hint', () => {
  const menu = createNewGame()
  const after = DEV_ACTIONS.autoDay(menu)
  assert.equal(after.phase, menu.phase)
  assert.equal(after.toasts.at(-1).kind, 'info')
})

test('test_dev_money_adds_the_step', () => {
  const s = createNewGame()
  assert.equal(DEV_ACTIONS.money(s).money, s.money + DEV_MONEY_STEP)
})

test('test_dev_mode_on_for_localhost_and_flag_only', () => {
  assert.equal(isDevMode(loc('http://localhost:8124/self-serve.html')), true)
  assert.equal(isDevMode(loc('http://127.0.0.1:8124/self-serve.html')), true)
  assert.equal(isDevMode(loc('https://example.com/self-serve.html')), false)
  assert.equal(isDevMode(loc('https://example.com/self-serve.html?dev')), true)
  assert.equal(isDevMode(loc('http://localhost:8124/self-serve.html?dev=0')), false)
})
