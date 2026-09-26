// Shop tabs (src/js/self-serve/screens.js): the shop shows one tab at a time and marks tabs where something opened today.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createNewGame } from '../../../src/js/self-serve/logic.js'
import { INTERIOR_STAGES, SIDE_ITEMS } from '../../../src/js/self-serve/data.js'
import { DEFAULT_SHOP_TAB, SHOP_TABS, shopHtml, shopTabBadges } from '../../../src/js/self-serve/screens.js'

// spriteImg paints sprites on a canvas; node has none, so a blank canvas stands in (the markup is what is tested).
function fakeCanvas() {
  const canvas = { width: 0, height: 0, toDataURL: () => 'data:,' }
  const ctx = {
    fillText() {}, fillRect() {}, drawImage() {}, putImageData() {},
    getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(w, canvas.width) * Math.max(h, canvas.height) * 4) }),
  }
  canvas.getContext = () => ctx
  return canvas
}
globalThis.document ??= { createElement: () => fakeCanvas() }
globalThis.ImageData ??= class { constructor(data, w, h) { Object.assign(this, { data, width: w, height: h }) } }

const shopOn = (day, extra = {}) => ({ ...createNewGame(), phase: 'shop', day, ...extra })
const sections = (html) => [...html.matchAll(/<h2>([^<]+)/g)].map((m) => m[1].trim())

test('test_shop_tabs_order_tab_opens_first', () => {
  assert.equal(DEFAULT_SHOP_TAB, 'order')
  assert.deepEqual(sections(shopHtml(shopOn(1))), ['재료 발주', '꼬치 · 고수 발주'])
})

test('test_shop_tabs_each_tab_shows_only_its_sections', () => {
  const s = shopOn(1)
  assert.deepEqual(sections(shopHtml(s, 'decor')), ['가게 업그레이드', '인테리어'])
  assert.deepEqual(sections(shopHtml(s, 'menu')), ['메뉴 가격', '사이드 메뉴'])
})

test('test_shop_tabs_every_section_is_in_exactly_one_tab', () => {
  const s = shopOn(1)
  const all = SHOP_TABS.flatMap((t) => sections(shopHtml(s, t.id)))
  assert.equal(new Set(all).size, all.length)
  assert.equal(all.length, 6)
})

test('test_shop_tabs_unknown_tab_falls_back_to_order', () => {
  assert.deepEqual(sections(shopHtml(shopOn(1), 'nope')), sections(shopHtml(shopOn(1), 'order')))
})

test('test_shop_tabs_marks_the_active_tab_and_keeps_the_footer', () => {
  const html = shopHtml(shopOn(1), 'menu')
  assert.match(html, /class="shop-tab on"[^>]*data-arg="menu"/)
  assert.match(html, /data-action="nextDay"/)
})

test('test_shop_tabs_new_on_decor_when_an_interior_stage_opened_today', () => {
  const stage = INTERIOR_STAGES[1]
  const s = shopOn(stage.unlockDay, { interior: 1 })
  assert.ok(shopTabBadges(s).has('decor'))
  assert.ok(!shopTabBadges({ ...s, day: stage.unlockDay + 1 }).has('decor'), 'only on the day it opens')
  assert.ok(!shopTabBadges({ ...s, interior: 2 }).has('decor'), 'not once it is bought')
})

test('test_shop_tabs_new_on_menu_when_a_side_opened_today', () => {
  const side = SIDE_ITEMS[0]
  assert.ok(shopTabBadges(shopOn(side.unlockDay)).has('menu'))
  assert.ok(!shopTabBadges(shopOn(side.unlockDay - 1)).has('menu'))
})

test('test_shop_tabs_new_mark_hidden_on_the_tab_you_are_on', () => {
  const s = shopOn(SIDE_ITEMS[0].unlockDay)
  assert.match(shopHtml(s, 'order'), /가격 · 사이드<span class="new">NEW/)
  assert.doesNotMatch(shopHtml(s, 'menu'), /class="new"/)
})
