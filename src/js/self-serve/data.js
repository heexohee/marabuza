// Balance constants for the self-serve flow variant only.
// design/quick-specs/self-serve-restock-flow-2026-09-24.md
// Shared data (ingredients, prices, upgrades) stays in ../data.js and is only imported here.

export const RATING_DELTA = {
  leave: -0.25,
  stockoutLeave: -0.15, // walked out: shelf too empty to fill a bowl
  grumble: -0.05, // per wished ingredient that was sold out
  wrongTable: -0.1, // pot brought to the wrong ticket number
  serveGood: 0.08, // ticket mode + spice matched what the customer asked for
  serveWrong: -0.2,
  fastBonus: 0.05,
}

// Starting warehouse units per starter ingredient. Day-1 warehouse draw measured at 15–25 per
// ingredient (opening box + restocks, incl. wilt; tests/integration/self-serve/warehouse-balance_test.mjs),
// so 30 lasts day 1 with one spare box and day 2 still needs a shop order.
// The shared START_STOCK (10) was sized for the original flow, where nothing is shelved or wilts.
export const START_WAREHOUSE_STOCK = 30
export const BOX_SIZE = 5 // units moved warehouse → shelf per restock click
export const SHELF_CAPACITY = 12 // max units per shelf slot
export const RESTOCK_BUSY_SEC = 1.2 // owner is away from the counter while restocking
export const DIG_BUSY_SEC = 0.3 // one dig through the customer's bowl
export const WILT_SEC = 55 // perishable batches older than this are thrown away
export const PERISHABLE_IDS = new Set(['bokchoy', 'sprout', 'enoki', 'woodear'])
export const QUEUE_MAX = 3 // customers waiting at the counter
export const MIN_BOWL_ITEMS = 2 // fewer scoops than this and the customer walks out
export const SHANGUO_CHANCE = 0.3
export const SKEWER_CHANCE = 0.4
export const MAX_SKEWERS = 2
export const CILANTRO_CHANCE = 0.25

// Separate save slot so this variant never overwrites the original flow's save.
export const SAVE_KEY = 'maratang-selfserve-save-v1'
