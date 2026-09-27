// Title menu (src/js/self-serve/screens.js): four items, which ones can be chosen, and which starts highlighted.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { TITLE_MENU, defaultTitleSel, menuHtml, titleItemEnabled } from '../../../src/js/self-serve/screens.js'

const labels = (html) => [...html.matchAll(/class="title-item[^"]*"[^>]*>([^<]+)/g)].map((m) => m[1])

test('test_title_menu_lists_the_four_items_in_order', () => {
  assert.deepEqual(TITLE_MENU.map((it) => it.label), ['새 게임', '이어서 하기', '불러오기', '설정'])
  assert.deepEqual(labels(menuHtml({ hasSave: true })), ['새 게임', '이어서 하기', '불러오기', '설정'])
})

test('test_title_menu_continue_needs_a_save_and_load_waits_for_slots', () => {
  const [newGame, cont, load, settings] = TITLE_MENU
  assert.equal(titleItemEnabled(cont, { hasSave: false }), false)
  assert.equal(titleItemEnabled(cont, { hasSave: true }), true)
  assert.equal(titleItemEnabled(load, { hasSave: true }), false, '불러오기 has no action yet')
  assert.equal(titleItemEnabled(newGame, { hasSave: false }), true)
  assert.equal(titleItemEnabled(settings, { hasSave: false }), true)
})

test('test_title_menu_highlights_continue_with_a_save_else_new_game', () => {
  assert.equal(TITLE_MENU[defaultTitleSel({ hasSave: true })].id, 'continue')
  assert.equal(TITLE_MENU[defaultTitleSel({ hasSave: false })].id, 'new')
})

test('test_title_menu_marks_the_highlighted_item_and_disables_the_rest_that_cannot_run', () => {
  const html = menuHtml({ hasSave: false, titleSel: 3 })
  assert.match(html, /class="title-item on"[^>]*data-action="settings"/)
  assert.match(html, /data-action="continue"[^>]*disabled/)
  assert.match(html, /data-action=""[^>]*disabled>불러오기<small>준비 중/)
})
