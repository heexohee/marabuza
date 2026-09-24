// Regression: the warehouse used to run dry early on day 1 (start stock 10, 5 of it
// shelved at opening, one restock empties the rest). A scripted owner plays day 1 and
// no shelf item (ingredients, skewers, cilantro) may be left unrefillable before closing.
// design/quick-specs/self-serve-restock-flow-2026-09-24.md §A
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  adjustCharge, confirmCharge, counterPrice, createNewGame, frontCustomer, pickPot, restock, serveTable,
  setTicketMode, setTicketSpice, shelfIds, startCooking, startDay, tick,
} from '../../../src/js/self-serve/logic.js'
import { shelfQty } from '../../../src/js/self-serve/shelf.js'
import { DAY_LENGTH_SEC } from '../../../src/js/data.js'

const STEP_SEC = 0.25
const RESTOCK_BELOW = 3 // the scripted owner tops up a slot once it drops to this
const SEEDS = [1, 7, 42, 1234, 99991]

// Deterministic LCG so every run plays the same day.
function seeded(seed) {
  let x = seed
  return () => {
    x = (x * 1664525 + 1013904223) % 4294967296
    return x / 4294967296
  }
}

/** One owner decision per step: serve, restock a low slot, cook, then take a payment. */
function ownerStep(s) {
  if (s.busy > 0) return s
  if (s.heldPot !== null) {
    const ticketNo = s.pots[s.heldPot].ticketNo
    return serveTable(s, s.tables.findIndex((t) => t && t.ticketNo === ticketNo))
  }
  const donePot = s.pots.findIndex((p) => p && p.remaining <= 0)
  if (donePot >= 0) return pickPot(s, donePot)
  const low = shelfIds(s).find((id) => shelfQty(s.shelf, id) <= RESTOCK_BELOW && s.stock[id] > 0)
  if (low) return restock(s, low)
  if (s.rail.length > 0 && s.pots.includes(null)) return startCooking(s, s.rail[0].ticketNo)
  const c = frontCustomer(s)
  if (!c || !s.tables.includes(null)) return s
  const ticketed = setTicketSpice(setTicketMode(s, c.mode), c.spice)
  const { charged, correct } = counterPrice(ticketed)
  return confirmCharge(adjustCharge(ticketed, correct - charged))
}

/** "Dry" = a shelf slot needs topping up but the warehouse has nothing left to bring. */
const dryIds = (s) => shelfIds(s).filter((id) => shelfQty(s.shelf, id) <= RESTOCK_BELOW && s.stock[id] <= 0)

/** Plays the open hours; returns the final state and the first moment a slot could not be refilled. */
function playOpenHours(s, rng) {
  let cur = s
  let firstDry = null
  while (cur.phase === 'day' && cur.dayTime < DAY_LENGTH_SEC) {
    cur = tick(ownerStep(cur), STEP_SEC, rng)
    const dry = dryIds(cur)
    if (!firstDry && dry.length > 0) firstDry = { at: Math.round(cur.dayTime), ids: dry }
  }
  return { end: cur, firstDry }
}

for (const seed of SEEDS) {
  test(`test_warehouse_day1_restock_never_runs_dry_seed_${seed}`, () => {
    // Arrange
    const day1 = startDay(createNewGame())
    // Act
    const { end, firstDry } = playOpenHours(day1, seeded(seed))
    // Assert
    assert.equal(firstDry, null, `warehouse ran dry at ${firstDry?.at}s on day 1: ${firstDry?.ids.join(', ')}`)
    assert.ok(end.stats.served > 0, 'the scripted owner actually served customers')
  })
}
