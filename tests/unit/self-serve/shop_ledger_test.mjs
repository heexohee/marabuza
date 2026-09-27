// The shop's 📒 장부 (design/quick-specs/playtest-2026-09-27.md #7): what the coming Sunday takes, seen from the shop.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createNewGame, upcomingSunday } from '../../../src/js/self-serve/logic.js'
import { shopHtml, shopLedgerHtml } from '../../../src/js/self-serve/screens.js'
import { PART1_LAST_DAY, PREMIUM_INSTALMENT, PREMIUM_TOTAL, RENT } from '../../../src/js/self-serve/data.js'

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

const shopOn = (day, over = {}) => ({ ...createNewGame(), phase: 'shop', day, ...over })

test('test_shop_ledger_counts_days_to_the_coming_sunday', () => {
  assert.deepEqual([1, 5, 7, 8, 13].map((d) => [upcomingSunday(shopOn(d)).sunday, upcomingSunday(shopOn(d)).daysLeft]),
    [[7, 6], [7, 2], [14, 7], [14, 6], [14, 1]])
})

test('test_shop_ledger_rent_doubles_when_overdue', () => {
  assert.equal(upcomingSunday(shopOn(3)).rent, RENT)
  const late = upcomingSunday(shopOn(9, { rentOverdue: 1 }))
  assert.equal(late.rent, RENT * 2)
  assert.equal(late.rentOverdue, true)
})

test('test_shop_ledger_premium_instalment_plus_carry_and_the_whole_rest_on_day_28', () => {
  assert.equal(upcomingSunday(shopOn(3)).premium, PREMIUM_INSTALMENT)
  assert.equal(upcomingSunday(shopOn(10, { premiumCarry: 5000 })).premium, PREMIUM_INSTALMENT + 5000)
  assert.equal(upcomingSunday(shopOn(PART1_LAST_DAY - 2, { premiumLeft: 123_400 })).premium, 123_400)
  assert.equal(upcomingSunday(shopOn(3)).premiumLeft, PREMIUM_TOTAL)
})

test('test_shop_ledger_no_premium_after_part_1_or_once_paid', () => {
  assert.equal(upcomingSunday(shopOn(30, { endingSeen: true })).premium, null)
  assert.equal(upcomingSunday(shopOn(30, { endingSeen: true })).premiumLeft, 0)
  assert.equal(upcomingSunday(shopOn(10, { premiumLeft: 0 })).premium, null)
})

test('test_shop_ledger_shortfall_is_what_the_money_does_not_cover', () => {
  const due = RENT + PREMIUM_INSTALMENT
  assert.equal(upcomingSunday(shopOn(3, { money: due - 1000 })).shortfall, 1000)
  assert.equal(upcomingSunday(shopOn(3, { money: due + 1 })).shortfall, 0)
  assert.match(shopLedgerHtml(shopOn(3, { money: due - 1000 })), /1,000원 더 벌어야/)
  assert.match(shopLedgerHtml(shopOn(3, { money: due })), /충분해요/)
})

test('test_shop_ledger_button_in_header_and_popup_only_when_open', () => {
  const s = shopOn(3)
  assert.match(shopHtml(s), /class="btn ledger-btn" data-action="ledger"/)
  assert.doesNotMatch(shopHtml(s), /shop-ledger/)
  assert.match(shopHtml(s, 'order', true), /D-4/)
})
