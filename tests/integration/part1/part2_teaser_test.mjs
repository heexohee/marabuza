// Story N003 (production/epics/part1-story/story-003-part2-teaser.md): right after the day-28 ending a short
// scene plays once — the rabbit asks for a part-time job, a franchise banner goes up across the street,
// "마라부자 2부 — 준비 중" — then the ending credits roll, then the day-28 shop, then day 29 as usual
// (order decided 2026-09-28: ending → teaser → credits → shop → day 29).
// Design: design/quick-specs/part1-28-days-2026-09-27.md §D.
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { PART1_LAST_DAY, PREMIUM_INSTALMENT, SAVE_KEY } from '../../../src/js/self-serve/data.js'
import {
  advanceEnding, advanceTeaser, afterSummary, createNewGame, finishCredits, finishTeaser, isEndingDone, isTeaserDone,
  resumeShop, startNextDay,
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

/** Saturday 27's summary, rich and nearly paid up: afterSummary opens Sunday 28. */
const saturday27 = () =>
  ({ ...createNewGame(), phase: 'summary', day: PART1_LAST_DAY - 1, money: RICH, premiumLeft: PREMIUM_INSTALMENT })

/** The day-28 ending on its last beat (Saturday 27's summary → Sunday 28 → ending). */
function endingDone() {
  let s = afterSummary(afterSummary(saturday27()))
  while (!isEndingDone(s)) s = advanceEnding(s)
  return s
}

/** Clicks through every beat of the teaser, then leaves it. */
function playTeaser(s) {
  let cur = s
  while (!isTeaserDone(cur)) cur = advanceTeaser(cur)
  return finishTeaser(cur)
}

/** The shop on day 28 after ending, teaser and credits. */
const afterPart1Shop = (extra = {}) =>
  ({ ...createNewGame(), phase: 'shop', day: PART1_LAST_DAY, money: RICH, endingSeen: true, part2TeaserSeen: true, premiumLeft: 0, ...extra })

test('test_teaser_plays_right_after_the_ending', () => {
  const s = afterSummary(endingDone())
  assert.equal(s.phase, 'teaser')
  assert.equal(s.teaserStep, 0)
  assert.equal(s.part2TeaserSeen, true)
  assert.equal(s.day, PART1_LAST_DAY)
})

test('test_teaser_ends_into_the_credits', () => {
  const credits = playTeaser(afterSummary(endingDone()))
  assert.equal(credits.phase, 'credits')
  assert.equal(credits.day, PART1_LAST_DAY)
})

test('test_credits_end_in_the_day_28_shop_then_day_29_opens_without_a_second_teaser', () => {
  const shop = finishCredits(playTeaser(afterSummary(endingDone())))
  assert.equal(shop.phase, 'shop')
  assert.equal(shop.day, PART1_LAST_DAY)
  const day = startNextDay(shop)
  assert.equal(day.phase, 'day')
  assert.equal(day.day, PART1_LAST_DAY + 1)
})

test('test_finish_credits_does_nothing_outside_the_credits', () => {
  const shop = afterPart1Shop()
  assert.equal(finishCredits(shop), shop)
})

test('test_teaser_steps_stop_at_the_last_beat', () => {
  let s = afterSummary(endingDone())
  for (let i = 0; i < PART2_TEASER_LINE_COUNT + 3; i++) s = advanceTeaser(s)
  assert.equal(s.teaserStep, PART2_TEASER_LINE_COUNT - 1)
  assert.equal(isTeaserDone(s), true)
})

test('test_teaser_not_on_day_30', () => {
  const s = startNextDay({ ...afterPart1Shop(), day: PART1_LAST_DAY + 1 })
  assert.equal(s.phase, 'day')
  assert.equal(s.day, PART1_LAST_DAY + 2)
})

test('test_teaser_not_without_the_ending', () => {
  // dev mode can reach day 28's shop without the ending scene
  const s = startNextDay(afterPart1Shop({ endingSeen: false, part2TeaserSeen: false }))
  assert.equal(s.phase, 'day')
  assert.equal(s.day, PART1_LAST_DAY + 1)
})

test('test_teaser_old_save_after_the_ending_still_gets_it_once_before_day_29', () => {
  // a save from before this order: day-28 shop after the ending, teaser not seen yet
  const s = startNextDay(afterPart1Shop({ part2TeaserSeen: false }))
  assert.equal(s.phase, 'teaser')
  const shop = finishCredits(playTeaser(s))
  assert.equal(shop.phase, 'shop')
  assert.equal(startNextDay(shop).phase, 'day')
})

test('test_teaser_lines_follow_the_design', () => {
  const lines = Array.from({ length: PART2_TEASER_LINE_COUNT }, (_, i) => teaserLine(i))
  assert.equal(lines.length, 4)
  assert.deepEqual(lines.map((l) => l.who), ['caption', 'rabbit', 'me', 'caption'])
  assert.match(lines[0].text, /29일차, 월요일 아침/)
  assert.equal(lines[1].text, '안녕하세요, 사장님.\n저 여기서 일하고 싶어요!')
  assert.match(lines[2].text, /저기도 마라탕/)
  assert.match(lines[3].text, /2부 — 준비 중/)
})

// ---------- save ----------

test('test_teaser_save_made_on_entry_does_not_replay_after_load', () => {
  const teaser = afterSummary(endingDone())
  assert.equal(saveGame(teaser), true)
  const resumed = resumeShop(loadGame())
  assert.equal(resumed.phase, 'shop')
  assert.equal(resumed.day, PART1_LAST_DAY)
  const next = startNextDay(resumed)
  assert.equal(next.phase, 'day', 'no second teaser after reload')
  assert.equal(next.day, PART1_LAST_DAY + 1)
})

test('test_teaser_old_saves_past_day_28_count_it_as_seen', () => {
  saveGame({ ...afterPart1Shop(), day: 35 })
  const d = JSON.parse(localStorage.getItem(SAVE_KEY))
  delete d.part2TeaserSeen
  localStorage.setItem(SAVE_KEY, JSON.stringify(d))
  assert.equal(loadGame().part2TeaserSeen, true)
})

test('test_teaser_save_rejects_a_bad_flag', () => {
  saveGame(afterPart1Shop())
  const d = JSON.parse(localStorage.getItem(SAVE_KEY))
  assert.equal(isValidSave({ ...d, part2TeaserSeen: 'yes' }), false)
})

// ---------- bot ----------

test('test_teaser_bot_passes_through_ending_teaser_and_credits_into_day_29', () => {
  const end = autoPlayDays(afterSummary(saturday27()), 1, seeded())
  assert.equal(end.day, PART1_LAST_DAY + 1)
  assert.equal(end.part2TeaserSeen, true)
  assert.equal(end.phase, 'summary')
})
