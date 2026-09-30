// Day 28 never closes the shop (decision 2026-09-29, balance run: the slowest players otherwise reached the
// last Sunday only to be closed for two weeks' rent instead of seeing the ending). Earlier Sundays keep the
// two-miss closure. Covers src/js/self-serve/{logic,story}.js.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PART1_LAST_DAY } from '../../../src/js/self-serve/data.js'
import { afterSummary, createNewGame } from '../../../src/js/self-serve/logic.js'
import { sundayLine } from '../../../src/js/self-serve/story.js'

/** The summary screen after Saturday `day`, broke, with last week's rent already overdue. */
const brokeSaturday = (day) => ({ ...createNewGame(), phase: 'summary', day, money: 0, rentOverdue: 1 })

test('test_finale_rent_second_miss_on_day_28_still_reaches_the_ending', () => {
  // Arrange
  const saturday = brokeSaturday(PART1_LAST_DAY - 1)

  // Act
  const sunday = afterSummary(saturday)
  const next = afterSummary(sunday)

  // Assert
  assert.equal(sunday.day, PART1_LAST_DAY)
  assert.equal(sunday.ledger.rentPaid, false)
  assert.equal(sunday.ledger.bankrupt, false, 'the last Sunday never stamps 폐업')
  assert.equal(next.phase, 'ending')
})

test('test_finale_rent_the_ending_clears_the_unpaid_rent', () => {
  const ending = afterSummary(afterSummary(brokeSaturday(PART1_LAST_DAY - 1)))
  assert.equal(ending.rentOverdue, 0, 'the panda settles it — part 2 does not open owing double rent')
})

test('test_finale_rent_second_miss_before_day_28_still_closes_the_shop', () => {
  const sunday = afterSummary(brokeSaturday(20))
  assert.equal(sunday.ledger.bankrupt, true)
  assert.equal(afterSummary(sunday).phase, 'closed')
})

test('test_finale_rent_short_rent_on_day_28_gets_its_own_line', () => {
  // Arrange: the ledger of an unpaid last Sunday
  const { ledger } = afterSummary(brokeSaturday(PART1_LAST_DAY - 1))

  // Act
  const line = sundayLine(3, ledger, PART1_LAST_DAY)

  // Assert: not "next week, two weeks' worth" — there is no next week to owe
  assert.equal(line.who, 'landlord')
  assert.doesNotMatch(line.text, /다음 주/)
  assert.match(line.text, /판다 사장님/)
})
