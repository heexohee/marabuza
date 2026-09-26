// Measures D — the average daily profit of a week-1 day in the self-serve flow — for the economy price
// table (production/epics/economy/story-002-baseline-and-price-table.md, design/game-brief.md §경제 레벨링).
//
// Run: node tools/sim/baseline_day.mjs [days=40]
//
// Week-1 conditions: a new game's upgrades (2 tables, 1 pot, no fire), default menu prices and rating,
// a fresh day each run. Profit = money taken (charges + tips) − cost of the ingredients the day used up
// (sold and wilted), at pack price. Two players: a perfect one (upper bound) and the dev bot with its
// realistic register slips (BOT_MISTAKES) — D is the realistic one. Deterministic (seeded).
import { createNewGame, startDay } from '../../src/js/self-serve/logic.js'
import { NO_MISTAKES, BOT_MISTAKES, autoPlayDay } from '../../src/js/self-serve/autoplay.js'
import { PACK_SIZE } from '../../src/js/data.js'
import { SHELF_ITEM_BY_ID } from '../../src/js/self-serve/data.js'
import { shelfQty } from '../../src/js/self-serve/shelf.js'

const DAYS = Number(process.argv[2] ?? 40)

function seeded(seed) {
  let x = seed
  return () => (x = (x * 16807) % 2147483647) / 2147483647
}

const unitsOf = (s) => Object.fromEntries(Object.keys(SHELF_ITEM_BY_ID).map((id) => [id, (s.stock[id] ?? 0) + shelfQty(s.shelf ?? {}, id)]))
const unitCost = (id) => SHELF_ITEM_BY_ID[id].packCost / PACK_SIZE

/** Profit of one played week-1 day. */
export function dayProfit(seed, mistakes) {
  const start = startDay(createNewGame())
  const end = autoPlayDay(start, seeded(seed), mistakes)
  const before = unitsOf(start)
  const after = unitsOf(end)
  const ingredients = Object.keys(before).reduce((sum, id) => sum + (before[id] - after[id]) * unitCost(id), 0)
  return { taken: end.money - start.money, ingredients: Math.round(ingredients), profit: Math.round(end.money - start.money - ingredients), served: end.stats.served }
}

function measure(mistakes) {
  const runs = Array.from({ length: DAYS }, (_, i) => dayProfit(1000 + i, mistakes))
  const avg = (k) => Math.round(runs.reduce((a, r) => a + r[k], 0) / runs.length)
  return { taken: avg('taken'), ingredients: avg('ingredients'), profit: avg('profit'), served: avg('served') }
}

const perfect = measure(NO_MISTAKES)
const realistic = measure(BOT_MISTAKES)
console.log(`week-1 day, ${DAYS} seeded days each`)
console.log('perfect  ', perfect)
console.log('realistic', realistic)
console.log(`D (realistic, rounded to 1,000) = ${Math.round(realistic.profit / 1000) * 1000}`)
