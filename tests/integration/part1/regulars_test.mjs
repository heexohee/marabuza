// Story N002 (production/epics/part1-story/story-002-regulars.md): on the table's days one of the day's customers
// is a regular (야근 너구리 · 시험기간 토끼 · 택배 곰) with their own face and a line at the counter.
// Design: design/quick-specs/part1-28-days-2026-09-27.md §B (단골 방문 열).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { REGULAR_FROM_CUSTOMER } from '../../../src/js/self-serve/data.js'
import { createNewGame, frontRegular, startDay, tick } from '../../../src/js/self-serve/logic.js'
import { REGULARS, regularVisits } from '../../../src/js/self-serve/story.js'

const STEP_SEC = 0.5
const DAY_WATCH_SEC = 240 // long enough for the first handful of customers to arrive

function seeded(seed = 7) {
  let x = seed
  return () => (x = (x * 16807) % 2147483647) / 2147483647
}

/** Opens `day` and lets customers arrive (nobody is served); returns every customer that joined the queue, in order. */
function customersOf(day, seed = 7) {
  const rng = seeded(seed)
  let s = startDay({ ...createNewGame(), day, story: null })
  const seen = new Map()
  for (let t = 0; t < DAY_WATCH_SEC && s.phase === 'day'; t += STEP_SEC) {
    s = tick(s, STEP_SEC, rng)
    s.queue.forEach((c) => seen.set(c.id, c))
  }
  return [...seen.values()]
}

test('test_regulars_day_4_raccoon_comes_once_as_a_later_customer', () => {
  const regulars = customersOf(4).filter((c) => c.regular)
  assert.deepEqual(regulars.map((c) => c.regular), ['raccoon'])
  assert.equal(regulars[0].face, REGULARS.raccoon.face)
  assert.ok(regulars[0].id >= REGULAR_FROM_CUSTOMER, 'the morning line is not interrupted by the first customer')
})

test('test_regulars_day_5_has_no_regular', () => {
  assert.equal(customersOf(5).filter((c) => c.regular).length, 0)
})

test('test_regulars_day_27_all_three_come', () => {
  const who = customersOf(27).filter((c) => c.regular).map((c) => c.regular)
  assert.deepEqual([...who].sort(), ['bear', 'rabbit', 'raccoon'])
})

test('test_regulars_after_day_28_no_visits', () => {
  assert.deepEqual(regularVisits(29), [])
  assert.equal(customersOf(29).filter((c) => c.regular).length, 0)
})

test('test_regulars_table_matches_the_design_days', () => {
  const days = (id) => Array.from({ length: 28 }, (_, i) => i + 1).filter((d) => regularVisits(d).some((v) => v.who === id))
  assert.deepEqual(days('raccoon'), [4, 11, 18, 25, 27])
  assert.deepEqual(days('rabbit'), [9, 16, 24, 27])
  assert.deepEqual(days('bear'), [13, 20, 23, 27])
})

test('test_regulars_front_regular_says_their_line_at_the_counter', () => {
  const rng = seeded(7)
  let s = startDay({ ...createNewGame(), day: 4, story: null })
  for (let t = 0; t < DAY_WATCH_SEC && !s.queue.some((c) => c.regular); t += STEP_SEC) s = tick(s, STEP_SEC, rng)
  const regular = s.queue.find((c) => c.regular)
  assert.ok(regular, 'the raccoon arrived')
  const atFront = { ...s, queue: [regular, ...s.queue.filter((c) => c !== regular)] }
  assert.deepEqual(frontRegular(atFront), { who: 'raccoon', text: '여기… 아직 하나요? 맛이 그대로네요.' })
  assert.equal(frontRegular({ ...s, queue: s.queue.filter((c) => !c.regular) }), null)
})
