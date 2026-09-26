// Shop cross-section layout (production/epics/shop-growth/story-001-shop-cross-section.md).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { POT_ART_W, SHOP_STAGE, potZoom, tableSpots } from '../../../src/js/self-serve/shop-stage.js'

test('test_table_spots_one_per_table_inside_dining_span', () => {
  for (const n of [2, 3, 4, 5]) {
    const spots = tableSpots(n)
    assert.equal(spots.length, n)
    assert.ok(spots[0].x >= SHOP_STAGE.dining.x0 - 0.01)
    const last = spots[n - 1]
    assert.ok(last.x + last.w <= SHOP_STAGE.dining.x1 + 0.01)
  }
})

test('test_table_spots_do_not_overlap_and_are_equal', () => {
  const spots = tableSpots(5)
  for (let i = 1; i < spots.length; i++) {
    assert.ok(spots[i].x >= spots[i - 1].x + spots[i - 1].w - 0.02)
    assert.ok(Math.abs(spots[i].w - spots[0].w) < 0.02)
  }
})

test('test_table_spots_stay_inside_the_stage', () => {
  const last = tableSpots(4).at(-1)
  assert.ok(last.x + last.w <= SHOP_STAGE.w)
})

test('test_table_spots_zero_returns_empty', () => {
  assert.deepEqual(tableSpots(0), [])
})

test('test_pot_zoom_caps_at_one_when_room', () => {
  assert.equal(potZoom(POT_ART_W * 3, 1), 1)
})

test('test_pot_zoom_shrinks_so_pots_fit_side_by_side', () => {
  const px = 212
  for (const n of [1, 2, 3, 4]) {
    const z = potZoom(px, n)
    assert.ok(z * POT_ART_W * n <= px, `pots ${n} at ${z}`)
  }
})

test('test_pot_zoom_has_floor', () => {
  assert.equal(potZoom(10, 4), 0.25)
})
