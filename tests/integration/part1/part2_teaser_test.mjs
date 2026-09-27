// Story N003 (production/epics/part1-story/story-003-part2-teaser.md): after the day-28 ending, a short scene
// plays once before day 29 opens — the rabbit asks for a part-time job, a franchise banner goes up across the
// street, "마라부자 2부 — 준비 중". Design: design/quick-specs/part1-28-days-2026-09-27.md §D.
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { PART1_LAST_DAY, SAVE_KEY } from '../../../src/js/self-serve/data.js'
import {
  advanceTeaser, createNewGame, finishTeaser, isTeaserDone, resumeShop, startNextDay,
} from '../../../src/js/self-serve/logic.js'
import { PART2_TEASER_LINE_COUNT, teaserLine } from '../../../src/js/self-serve/story.js'
import { autoPlayDays } from '../../../src/js/self-serve/autoplay.js'
import { isValidSave, loadGame, saveGame } from '../../../src/js/self-serve/save.js'

const RICH = 10_000_000

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

/** The shop on day 28 right after the ending scene (economy E004 leaves the player here). */
const afterEndingShop = (extra = {}) =>
  ({ ...createNewGame(), phase: 'shop', day: PART1_LAST_DAY, money: RICH, endingSeen: true, premiumLeft: 0, ...extra })

/** Clicks through every beat of the teaser, then leaves it. */
function playTeaser(s) {
  let cur = s
  while (!isTeaserDone(cur)) cur = advanceTeaser(cur)
  return finishTeaser(cur)
}

test('test_teaser_plays_before_day_29_after_the_ending', () => {
  const s = startNextDay(afterEndingShop())
  assert.equal(s.phase, 'teaser')
  assert.equal(s.teaserStep, 0)
  assert.equal(s.part2TeaserSeen, true)
  assert.equal(s.day, PART1_LAST_DAY, 'day 29 has not opened yet')
})

test('test_teaser_ends_into_day_29_business', () => {
  const day = playTeaser(startNextDay(afterEndingShop()))
  assert.equal(day.phase, 'day')
  assert.equal(day.day, PART1_LAST_DAY + 1)
  assert.equal(day.part2TeaserSeen, true)
})

test('test_teaser_steps_stop_at_the_last_beat', () => {
  let s = startNextDay(afterEndingShop())
  for (let i = 0; i < PART2_TEASER_LINE_COUNT + 3; i++) s = advanceTeaser(s)
  assert.equal(s.teaserStep, PART2_TEASER_LINE_COUNT - 1)
  assert.equal(isTeaserDone(s), true)
})

test('test_teaser_not_on_day_30', () => {
  const s = startNextDay({ ...afterEndingShop({ part2TeaserSeen: true }), day: PART1_LAST_DAY + 1 })
  assert.equal(s.phase, 'day')
  assert.equal(s.day, PART1_LAST_DAY + 2)
})

test('test_teaser_not_without_the_ending', () => {
  // dev mode can reach day 28's shop without the ending scene
  const s = startNextDay(afterEndingShop({ endingSeen: false }))
  assert.equal(s.phase, 'day')
  assert.equal(s.day, PART1_LAST_DAY + 1)
})

test('test_teaser_not_on_earlier_days', () => {
  const s = startNextDay({ ...afterEndingShop(), day: 10 })
  assert.equal(s.phase, 'day')
})

test('test_teaser_lines_follow_the_design', () => {
  const lines = Array.from({ length: PART2_TEASER_LINE_COUNT }, (_, i) => teaserLine(i))
  assert.equal(lines.length, 4)
  assert.deepEqual(lines.map((l) => l.who), ['caption', 'rabbit', 'me', 'caption'])
  assert.match(lines[0].text, /29일차, 월요일 아침/)
  assert.match(lines[1].text, /여기서 일해도 돼요/)
  assert.match(lines[2].text, /저기도 마라탕/)
  assert.match(lines[3].text, /2부 — 준비 중/)
})

// ---------- save ----------

test('test_teaser_save_made_on_entry_does_not_replay_after_load', () => {
  const teaser = startNextDay(afterEndingShop())
  assert.equal(saveGame(teaser), true)
  const resumed = resumeShop(loadGame())
  assert.equal(resumed.phase, 'shop')
  assert.equal(resumed.day, PART1_LAST_DAY)
  const next = startNextDay(resumed)
  assert.equal(next.phase, 'day', 'no second teaser after reload')
  assert.equal(next.day, PART1_LAST_DAY + 1)
})

test('test_teaser_old_saves_past_day_28_count_it_as_seen', () => {
  saveGame({ ...afterEndingShop(), day: 35 })
  const d = JSON.parse(localStorage.getItem(SAVE_KEY))
  delete d.part2TeaserSeen
  localStorage.setItem(SAVE_KEY, JSON.stringify(d))
  assert.equal(loadGame().part2TeaserSeen, true)
})

test('test_teaser_save_rejects_a_bad_flag', () => {
  saveGame(afterEndingShop())
  const d = JSON.parse(localStorage.getItem(SAVE_KEY))
  assert.equal(isValidSave({ ...d, part2TeaserSeen: 'yes' }), false)
})

// ---------- bot ----------

test('test_teaser_bot_passes_through_it_into_day_29', () => {
  const end = autoPlayDays(afterEndingShop(), 1, seeded())
  assert.equal(end.day, PART1_LAST_DAY + 1)
  assert.equal(end.part2TeaserSeen, true)
})
