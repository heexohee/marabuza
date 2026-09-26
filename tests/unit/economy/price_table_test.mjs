// Economy price table (production/epics/economy/story-002-baseline-and-price-table.md): every price is a D multiple.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  BASELINE_D, ECONOMY_MULTIPLE, INTERIOR_STAGES, SELF_UPGRADES, SELF_UPGRADE_BY_ID, priceOf,
} from '../../../src/js/self-serve/data.js'
import { buyUpgrade, createNewGame, startDay, upgradeCost } from '../../../src/js/self-serve/logic.js'

const RICH = 10_000_000

test('test_price_table_price_of_rounds_to_100', () => {
  assert.equal(priceOf(1, 97000), 97000)
  assert.equal(priceOf(1.5, 97050), 145600)
  assert.equal(priceOf(0.5, 1234), 600)
})

test('test_price_table_uses_the_measured_d', () => {
  assert.ok(BASELINE_D > 0 && BASELINE_D % 1000 === 0)
  assert.equal(priceOf(ECONOMY_MULTIPLE.rent), 2 * BASELINE_D)
  assert.equal(ECONOMY_MULTIPLE.premium, 30)
  assert.equal(ECONOMY_MULTIPLE.premiumMinWeekly, 0.5)
})

test('test_price_table_interior_multiples_and_unlock_days', () => {
  assert.deepEqual(INTERIOR_STAGES.map((i) => i.multiple), [1, 1.5, 2, 3, 4, 5])
  assert.deepEqual(INTERIOR_STAGES.map((i) => i.unlockDay), [1, 3, 5, 7, 9, 12])
})

test('test_price_table_upgrade_costs_follow_multiples', () => {
  const s = createNewGame()
  for (const u of SELF_UPGRADES) assert.equal(upgradeCost(s, u.id), priceOf(u.multiples[0]))
  assert.equal(upgradeCost(s, 'interior'), null, 'the old interior upgrade is gone')
})

test('test_price_table_seats_go_from_2_to_4', () => {
  const seats = SELF_UPGRADE_BY_ID.seats
  assert.equal(seats.start, 2)
  const maxed = [0, 1, 2].reduce((s) => buyUpgrade(s, 'seats'), { ...createNewGame(), money: RICH })
  assert.equal(maxed.upgrades.seats, 4)
  assert.equal(upgradeCost(maxed, 'seats'), null)
  assert.equal(startDay(maxed).tables.length, 4)
})

test('test_price_table_upgrade_needs_the_money', () => {
  const s = { ...createNewGame(), money: priceOf(SELF_UPGRADE_BY_ID.fire.multiples[0]) - 100 }
  assert.equal(buyUpgrade(s, 'fire').upgrades.fire, 0)
  assert.equal(buyUpgrade({ ...s, money: s.money + 100 }, 'fire').money, 0)
})
