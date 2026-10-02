// First-day tutorial (request 2026-10-02): one guided customer with the clock held, then the day runs as usual.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  confirmCharge, createNewGame, dig, pickPot, serveTable, startCooking, startDay,
} from '../../../src/js/self-serve/logic.js'
import {
  TUTORIAL_STEPS, isTutorialDone, nextTutorialStep, setTutorialDone, skipTutorial, startTutorial, tutorialAfterAction,
  tutorialStep, tutorialTick,
} from '../../../src/js/self-serve/tutorial.js'

const seeded = (seed = 7) => () => {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}
const LONG_SEC = 60

const startedDay1 = () => startTutorial(startDay(createNewGame()), seeded())
const stepId = (s) => tutorialStep(s)?.id ?? null

function memoryStorage() {
  const map = new Map()
  return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) }
}

test('test_tutorial_start_brings_the_first_customer_in_at_once', () => {
  const s = startedDay1()
  assert.equal(s.queue.length, 1)
  assert.equal(stepId(s), 'intro')
  assert.equal(s.ownerLine, null, 'the morning line gives way to the bubble')
})

test('test_tutorial_start_does_nothing_outside_a_business_day', () => {
  const shop = { ...createNewGame(), phase: 'shop' }
  assert.equal(startTutorial(shop), shop)
})

test('test_tutorial_does_not_start_when_the_shelf_cannot_fill_a_bowl', () => {
  const day = startDay(createNewGame())
  const empty = { ...day, shelf: {} }
  const s = startTutorial(empty, seeded())
  assert.equal(s, empty, 'no tutorial, no walk-out, no rating loss — it waits for a day with stock')
})

test('test_tutorial_tick_holds_clock_patience_and_spawning', () => {
  const s = startedDay1()
  const later = tutorialTick(s, LONG_SEC)
  assert.equal(later.dayTime, 0)
  assert.equal(later.queue.length, 1, 'no second customer')
  assert.equal(later.queue[0].patience, s.queue[0].patience)
})

test('test_tutorial_walks_one_order_from_intro_to_done', () => {
  let s = nextTutorialStep(startedDay1())
  assert.equal(stepId(s), 'dig')
  const dug = dig(s)
  s = tutorialAfterAction(s, dug, 'dig')
  assert.equal(stepId(s), 'ticket')
  s = nextTutorialStep(s)
  assert.equal(stepId(s), 'charge')
  s = tutorialTick(s, LONG_SEC) // hands free again after digging
  s = tutorialAfterAction(s, confirmCharge(s), 'chargeConfirm')
  assert.equal(stepId(s), 'cook')
  s = tutorialAfterAction(s, startCooking(s, s.rail[0].ticketNo), 'cook')
  assert.equal(stepId(s), 'shelf')
  s = tutorialTick(s, LONG_SEC) // the pot keeps boiling while the clock waits
  assert.equal(stepId(s), 'pick')
  s = tutorialAfterAction(s, pickPot(s, 0), 'pick')
  assert.equal(stepId(s), 'serve')
  const tableIdx = s.tables.findIndex(Boolean)
  s = tutorialAfterAction(s, serveTable(s, tableIdx), 'table')
  assert.equal(stepId(s), 'done')
  assert.equal(s.stats.served, 1)
  s = nextTutorialStep(s)
  assert.equal(s.tutorial, null)
})

test('test_tutorial_paying_early_skips_dig_and_ticket', () => {
  const s = nextTutorialStep(startedDay1())
  const paid = tutorialAfterAction(s, confirmCharge(s), 'chargeConfirm')
  assert.equal(stepId(paid), 'cook')
})

test('test_tutorial_action_steps_ignore_the_next_button', () => {
  const atDig = nextTutorialStep(startedDay1())
  assert.equal(nextTutorialStep(atDig), atDig)
})

test('test_tutorial_skip_ends_it_for_the_day', () => {
  assert.equal(skipTutorial(startedDay1()).tutorial, null)
})

test('test_tutorial_resume_with_a_customer_does_not_spawn_another', () => {
  const s = startedDay1()
  const resumed = startTutorial({ ...s, tutorial: null }, seeded())
  assert.equal(resumed.queue.length, 1)
})

test('test_tutorial_steps_say_something_and_end_with_a_button', () => {
  TUTORIAL_STEPS.forEach((step) => assert.ok(step.text.length > 0 && step.text.length <= 44, step.id))
  assert.ok(TUTORIAL_STEPS.at(-1).next, 'the last step closes with a button')
})

test('test_tutorial_done_flag_round_trips_and_can_be_cleared', () => {
  const storage = memoryStorage()
  assert.equal(isTutorialDone(storage), false)
  setTutorialDone(storage, true)
  assert.equal(isTutorialDone(storage), true)
  setTutorialDone(storage, false)
  assert.equal(isTutorialDone(storage), false)
})

test('test_tutorial_done_flag_survives_storage_that_throws', () => {
  const broken = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') } }
  assert.equal(isTutorialDone(broken), false)
  assert.equal(setTutorialDone(broken, true), false)
  assert.equal(isTutorialDone(undefined), false)
})
