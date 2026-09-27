// Story N001 (production/epics/part1-story/story-001-daily-lines.md): a fixed start-of-day line for every
// business day 4–27, from design/quick-specs/part1-28-days-2026-09-27.md §B; days 1–3 stay the panda's tips
// and day 29+ goes back to the protagonist's rotating lines.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DAILY_LINES, dayStartLine, dayStartSpeaker } from '../../../src/js/self-serve/story.js'

const SUNDAYS = [7, 14, 21, 28]
const BUBBLE_MAX_CHARS = 32 // two lines of the owner's bubble (owner_line_test.mjs)

test('test_daily_lines_days_1_to_3_keep_the_panda_tips', () => {
  assert.equal(dayStartLine(1), '손님 그릇은 꼭 뒤적여 봐. 고기랑 꼬치가 숨어 있거든!')
  assert.equal(dayStartLine(3), '샹궈는 100g당 더 비싸! 주문표 조리 방식부터 확인해.')
  assert.deepEqual([1, 2, 3].map(dayStartSpeaker), ['panda', 'panda', 'panda'])
})

test('test_daily_lines_days_4_to_27_follow_the_design_table', () => {
  assert.equal(dayStartLine(4), '오늘부터 진짜 혼자다. 배운 대로만 하자!')
  assert.equal(dayStartSpeaker(4), 'me')
  assert.equal(dayStartLine(18), '(메시지) 혼자 다 하려고 하지 마. 쉬는 것도 장사야.')
  assert.equal(dayStartSpeaker(18), 'panda')
  assert.equal(dayStartLine(22), '(메시지) 다음 주 일요일에 가게 한번 들를게.')
  assert.equal(dayStartSpeaker(22), 'panda')
  assert.equal(dayStartLine(27), '내일은 판다 사장님 오시는 날. 마지막 영업도 한 그릇씩!')
  assert.equal(dayStartSpeaker(27), 'me')
})

test('test_daily_lines_every_business_day_4_to_27_has_its_own_line', () => {
  const days = Array.from({ length: 24 }, (_, i) => i + 4).filter((d) => !SUNDAYS.includes(d))
  days.forEach((d) => assert.ok(DAILY_LINES[d], `day ${d} has no line`))
  assert.equal(new Set(days.map(dayStartLine)).size, days.length, 'lines repeat')
  SUNDAYS.forEach((d) => assert.equal(DAILY_LINES[d], undefined, `day ${d} is a Sunday (no business)`))
})

test('test_daily_lines_after_day_28_rotate_the_protagonist_lines', () => {
  assert.equal(dayStartSpeaker(29), 'me')
  assert.equal(dayStartSpeaker(35), 'me')
  assert.ok(dayStartLine(29).length > 0)
  assert.ok(dayStartLine(35).length > 0)
  assert.equal(DAILY_LINES[29], undefined)
})

test('test_daily_lines_all_fit_the_two_line_bubble', () => {
  for (let d = 1; d <= 40; d++) {
    assert.ok([...dayStartLine(d)].length <= BUBBLE_MAX_CHARS, `day ${d}: ${dayStartLine(d)}`)
  }
})
