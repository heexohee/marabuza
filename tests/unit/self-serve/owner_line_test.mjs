// Owner row (feedback 2026-09-27): the start-of-day line knows its speaker, so the face frame shows who talks.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createNewGame, ownerLineText, ownerLineWho, startDay, tick } from '../../../src/js/self-serve/logic.js'
import { DAY_LINE_SEC } from '../../../src/js/self-serve/data.js'
import { dayStartLine, dayStartSpeaker } from '../../../src/js/self-serve/story.js'

test('test_owner_line_panda_gives_the_first_three_tips_then_she_talks', () => {
  assert.deepEqual([1, 2, 3, 4, 10].map(dayStartSpeaker), ['panda', 'panda', 'panda', 'me', 'me'])
})

test('test_owner_line_tips_carry_no_name_prefix_the_face_shows_it', () => {
  ;[1, 2, 3].forEach((d) => assert.doesNotMatch(dayStartLine(d), /판다 사장님/))
})

test('test_owner_line_tips_fit_two_lines_of_the_bubble', () => {
  // ~16 characters a line in the counter's bubble at 13px bold
  for (let d = 1; d <= 8; d++) assert.ok([...dayStartLine(d)].length <= 32, `day ${d}: ${dayStartLine(d)}`)
})

test('test_owner_line_who_is_the_panda_while_his_tip_shows_then_her', () => {
  const day1 = startDay(createNewGame())
  assert.equal(ownerLineWho(day1), 'panda')
  const later = tick(day1, DAY_LINE_SEC + 0.1)
  assert.equal(ownerLineText(later), null)
  assert.equal(ownerLineWho(later), 'me', 'once the line is gone her own face is back')
  assert.equal(ownerLineWho(startDay({ ...createNewGame(), day: 4 })), 'me')
})
