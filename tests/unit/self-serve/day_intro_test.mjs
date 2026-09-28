// Day-change calendar (request 2026-09-28): a tear-off calendar page between days — the new day's number,
// week and weekday, and one line counting down to the Sunday ledger (rent + 권리금).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PART1_LAST_DAY } from '../../../src/js/self-serve/data.js'
import { dayIntroHtml, dayIntroInfo, shouldShowDayIntro } from '../../../src/js/self-serve/day-intro.js'

test('test_day_intro_weekday_counts_down_to_the_sunday_ledger', () => {
  const tue = dayIntroInfo(9) // week 2, Tuesday
  assert.equal(tue.title, 'DAY 9')
  assert.equal(tue.sub, '2주차 화요일')
  assert.equal(tue.prevDay, 8)
  assert.equal(tue.isSunday, false)
  assert.equal(tue.note, '일요일 장부까지 5일')
})

test('test_day_intro_saturday_says_tomorrow_is_sunday', () => {
  assert.equal(dayIntroInfo(13).note, '내일은 일요일 — 장부 정리!')
})

test('test_day_intro_sunday_is_the_ledger_day', () => {
  const sun = dayIntroInfo(14)
  assert.equal(sun.isSunday, true)
  assert.equal(sun.sub, '2주차 일요일')
  assert.equal(sun.note, '오늘은 장부 정리하는 날')
})

test('test_day_intro_day_28_is_the_pandas_visit', () => {
  assert.equal(dayIntroInfo(PART1_LAST_DAY).note, '판다 사장님 오시는 날')
})

test('test_day_intro_day_1_has_no_previous_page', () => {
  const first = dayIntroInfo(1)
  assert.equal(first.prevDay, null)
  assert.doesNotMatch(dayIntroHtml(first), /cal-page old/)
  assert.match(dayIntroHtml(dayIntroInfo(2)), /cal-page old/)
})

test('test_day_intro_shows_on_entering_a_new_business_day_or_sunday_only', () => {
  assert.equal(shouldShowDayIntro({ phase: 'day', day: 9 }, 'shop', 8), true)
  assert.equal(shouldShowDayIntro({ phase: 'sunday', day: 14 }, 'summary', 13), true)
  assert.equal(shouldShowDayIntro({ phase: 'day', day: 1 }, 'opening', null), true)
  assert.equal(shouldShowDayIntro({ phase: 'day', day: 9 }, 'day', 9), false, 'not every frame')
  assert.equal(shouldShowDayIntro({ phase: 'day', day: 9 }, 'shop', 9), false, 'same day shown already')
  assert.equal(shouldShowDayIntro({ phase: 'shop', day: 9 }, 'summary', 8), false)
  assert.equal(shouldShowDayIntro({ phase: 'ending', day: 28 }, 'sunday', 28), false)
})
