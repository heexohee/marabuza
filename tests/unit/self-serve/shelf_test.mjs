// Shelf (진열대) rules — design/quick-specs/self-serve-restock-flow-2026-09-24.md §A, §B.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  ageShelf, closeShelf, fillBowl, openShelf, restockShelf, shelfQty, takeFromShelf,
} from '../../../src/js/self-serve/shelf.js'
import { BOX_SIZE, SHELF_CAPACITY, WILT_SEC } from '../../../src/js/self-serve/data.js'

const constant = (v) => () => v

test('test_shelf_open_moves_one_box_per_unlocked_ingredient', () => {
  const { stock, shelf } = openShelf({ noodle: 12, bokchoy: 2, beef: 9 }, ['noodle', 'bokchoy'])
  assert.equal(shelfQty(shelf, 'noodle'), BOX_SIZE)
  assert.equal(shelfQty(shelf, 'bokchoy'), 2, 'moves only what the warehouse has')
  assert.equal(stock.noodle, 12 - BOX_SIZE)
  assert.equal(stock.bokchoy, 0)
  assert.equal(stock.beef, 9, 'locked ingredients stay in the warehouse')
})

test('test_shelf_take_is_fifo_oldest_batch_first', () => {
  const shelf = { bokchoy: [{ qty: 2, age: 30 }, { qty: 5, age: 1 }] }
  const { shelf: after, taken } = takeFromShelf(shelf, 'bokchoy', 3)
  assert.equal(taken, 3)
  assert.deepEqual(after.bokchoy, [{ qty: 4, age: 1 }])
  assert.deepEqual(shelf.bokchoy, [{ qty: 2, age: 30 }, { qty: 5, age: 1 }], 'input not mutated')
})

test('test_shelf_take_never_exceeds_what_is_on_the_shelf', () => {
  const { shelf, taken } = takeFromShelf({ noodle: [{ qty: 1, age: 0 }] }, 'noodle', 3)
  assert.equal(taken, 1)
  assert.equal(shelfQty(shelf, 'noodle'), 0)
})

test('test_shelf_restock_moves_a_box_as_a_fresh_batch', () => {
  const r = restockShelf({ noodle: 20 }, { noodle: [{ qty: 1, age: 9 }] }, 'noodle')
  assert.equal(r.moved, BOX_SIZE)
  assert.equal(r.stock.noodle, 20 - BOX_SIZE)
  assert.deepEqual(r.shelf.noodle, [{ qty: 1, age: 9 }, { qty: BOX_SIZE, age: 0 }])
})

test('test_shelf_restock_is_capped_by_capacity_and_warehouse', () => {
  const nearlyFull = { noodle: [{ qty: SHELF_CAPACITY - 2, age: 0 }] }
  assert.equal(restockShelf({ noodle: 20 }, nearlyFull, 'noodle').moved, 2)
  assert.equal(restockShelf({ noodle: 3 }, {}, 'noodle').moved, 3)
  const full = { noodle: [{ qty: SHELF_CAPACITY, age: 0 }] }
  assert.equal(restockShelf({ noodle: 20 }, full, 'noodle').moved, 0)
  assert.equal(restockShelf({ noodle: 0 }, {}, 'noodle').moved, 0)
})

test('test_shelf_perishable_batches_wilt_after_wilt_sec', () => {
  const shelf = {
    bokchoy: [{ qty: 3, age: WILT_SEC - 1 }, { qty: 2, age: 0 }],
    noodle: [{ qty: 4, age: WILT_SEC + 100 }],
  }
  const { shelf: after, wilted } = ageShelf(shelf, 1)
  assert.deepEqual(wilted, { bokchoy: 3 })
  assert.deepEqual(after.bokchoy, [{ qty: 2, age: 1 }])
  assert.equal(shelfQty(after, 'noodle'), 4, 'non-perishables never wilt')
})

test('test_shelf_wilt_boundary_just_before_is_kept', () => {
  const { wilted } = ageShelf({ sprout: [{ qty: 1, age: WILT_SEC - 0.5 }] }, 0.4)
  assert.deepEqual(wilted, {})
})

test('test_shelf_close_returns_leftovers_to_warehouse', () => {
  const stock = closeShelf({ noodle: 2, bokchoy: 0 }, { noodle: [{ qty: 3, age: 5 }], bokchoy: [{ qty: 1, age: 2 }] })
  assert.deepEqual(stock, { noodle: 5, bokchoy: 1 })
})

test('test_fill_bowl_takes_wished_items', () => {
  const shelf = { noodle: [{ qty: 5, age: 0 }], enoki: [{ qty: 5, age: 0 }] }
  const r = fillBowl(shelf, { noodle: 2, enoki: 1 }, constant(0))
  assert.deepEqual(r.items, { noodle: 2, enoki: 1 })
  assert.deepEqual(r.missing, [])
  assert.equal(shelfQty(r.shelf, 'noodle'), 3)
})

test('test_fill_bowl_substitutes_sold_out_items_and_reports_missing', () => {
  const shelf = { noodle: [{ qty: 5, age: 0 }], enoki: [] }
  const r = fillBowl(shelf, { noodle: 1, enoki: 2 }, constant(0))
  assert.deepEqual(r.missing, ['enoki'])
  assert.equal(r.total, 3, 'two substitutes replace the missing enoki')
  assert.equal(r.items.noodle, 3)
})

test('test_fill_bowl_with_empty_shelf_takes_nothing', () => {
  const r = fillBowl({}, { noodle: 2 }, constant(0))
  assert.equal(r.total, 0)
  assert.deepEqual(r.items, {})
})
