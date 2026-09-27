// Economy B001 (production/epics/economy/story-005-part1-balance.md, design/quick-specs/part1-28-days-2026-09-27.md §E):
// the part-1 economy as confirmed by the 28-day bot sim — seeded, paced bots play a new game to the day-28
// ending. Guards the confirmed knobs (SELF_START_MONEY, SPAWN_PER_DAY, 권리금 10D) against regressions.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PREMIUM_TOTAL, SELF_START_MONEY, SPAWN_PER_DAY } from '../../../src/js/self-serve/data.js'
import { createNewGame } from '../../../src/js/self-serve/logic.js'
import { playPart1, summarise } from '../../../tools/sim/part1_run.mjs'

const SEEDS = [100, 101, 102, 103]
const MIN_INTERIOR = 3
const MIN_END_RATING = 2 // the reputation must not collapse by the end of part 1
const runsOf = (tier) => SEEDS.map((seed) => playPart1(tier, seed))

test('test_part1_balance_confirmed_knobs', () => {
  assert.equal(SELF_START_MONEY, 500_000)
  assert.equal(createNewGame().money, SELF_START_MONEY)
  assert.equal(SPAWN_PER_DAY, 0.1)
  assert.equal(PREMIUM_TOTAL, 970_000)
})

test('test_part1_balance_normal_bot_pays_every_instalment_and_decorates', () => {
  const runs = runsOf('normal')
  const sm = summarise(runs)
  assert.equal(sm.closed, 0)
  assert.equal(sm.premiumOnTimeAll, runs.length, 'all 4 instalments on time')
  assert.equal(sm.rentLateAny, 0, 'no late rent')
  assert.equal(sm.interiorAtLeast3, runs.length, `interior ≥ ${MIN_INTERIOR}`)
  runs.forEach((r) => assert.ok(r.weeks.at(-1).rating >= MIN_END_RATING, `seed ${r.seed} rating ${r.weeks.at(-1).rating}`))
})

test('test_part1_balance_clumsy_bot_carries_into_the_forgiven_ending_but_never_closes', () => {
  const sm = summarise(runsOf('clumsy'))
  assert.equal(sm.closed, 0, 'never closed')
  assert.ok(sm.premiumCarriedAny > 0, 'some instalments carry over')
  assert.ok(sm.endingForgiven > 0, 'at least one forgiven ending')
})

test('test_part1_balance_good_bot_can_pay_off_by_day_21', () => {
  const sm = summarise(runsOf('good'))
  assert.equal(sm.closed, 0)
  assert.equal(sm.paidOffBy21, SEEDS.length)
})
