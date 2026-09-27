// Dev mode "엔딩 보기" (request 2026-09-28): jumps from any screen to Sunday 28's ledger scene, one step before the
// part-1 ending, keeping the player's character and interior — then the real flow runs:
// ending → part-2 teaser → credits → day-28 shop → day 29.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PART1_LAST_DAY } from '../../../src/js/self-serve/data.js'
import { DEV_ACTIONS } from '../../../src/js/self-serve/dev.js'
import { afterSummary, createNewGame } from '../../../src/js/self-serve/logic.js'

const look = { ...createNewGame().character, name: '초아' }

test('test_dev_ending_jumps_to_the_day_28_sunday_scene', () => {
  const s = DEV_ACTIONS.ending({ ...createNewGame(), phase: 'shop', day: 5, interior: 3, character: look })
  assert.equal(s.phase, 'sunday')
  assert.equal(s.day, PART1_LAST_DAY)
  assert.equal(s.interior, 3, 'the ending hall shows the interior already bought')
  assert.equal(s.character.name, '초아')
  assert.equal(s.ledger.rentPaid, true)
})

test('test_dev_ending_leaving_the_sunday_scene_opens_the_paid_ending', () => {
  const ending = afterSummary(DEV_ACTIONS.ending({ ...createNewGame(), phase: 'day', day: 12 }))
  assert.equal(ending.phase, 'ending')
  assert.equal(ending.premiumPaidInFull, true)
})

test('test_dev_ending_works_again_after_the_ending_was_seen', () => {
  const seen = { ...createNewGame(), phase: 'shop', day: 30, endingSeen: true, part2TeaserSeen: true, premiumLeft: 0 }
  const ending = afterSummary(DEV_ACTIONS.ending(seen))
  assert.equal(ending.phase, 'ending')
  assert.equal(afterSummary({ ...ending, endingStep: 99 }).phase, 'teaser', 'the teaser plays again too')
})

test('test_dev_ending_works_from_the_title_menu', () => {
  const s = DEV_ACTIONS.ending(createNewGame())
  assert.equal(s.phase, 'sunday')
})
