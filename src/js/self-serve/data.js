// Balance constants for the self-serve flow variant only.
// design/quick-specs/self-serve-restock-flow-2026-09-24.md
// Shared data (ingredients, prices, upgrades) stays in ../data.js and is only imported here.
import { INGREDIENTS, SKEWER_ITEMS } from '../data.js'

// Weighed ingredients sold in this variant. The shared list's weighed "새우" scoop is dropped:
// here shrimp is only sold as 새우 꼬치 (one skewer = 1,000원), so the shelf and shop show it once.
// The original flow keeps its weighed shrimp — it has no skewer shelf.
export const DROPPED_INGREDIENT_IDS = ['shrimp']
export const VARIANT_INGREDIENTS = INGREDIENTS.filter((i) => !DROPPED_INGREDIENT_IDS.includes(i.id))
export const VARIANT_INGREDIENT_BY_ID = Object.fromEntries(VARIANT_INGREDIENTS.map((i) => [i.id, i]))

// Shelf items that are not weighed: skewers (one shelf unit = one skewer stick) and cilantro
// (one handful). They go through the same shop → warehouse → shelf path as ingredients, but are
// always available (no unlock) and are never scooped as substitutes. Ids match the shared
// SKEWER_ITEMS so checkout pricing (1,000원 per skewer / cilantro) applies unchanged.
// startStock = warehouse units at a new game. Day-1 demand is only ~3 per extra
// (skewer 40% × 1–2 sticks over 3 kinds; cilantro 25%), but cilantro wilts: each shelved box
// is mostly thrown away after WILT_SEC, so it needs ~3 boxes a day (15) + one spare box.
// Checked by tests/integration/self-serve/warehouse-balance_test.mjs.
const SKEWER_PACK_COST = { skewer_shrimp: 3000, skewer_fishcake_deluxe: 2500, skewer_sausage_deluxe: 2500 }
const SKEWER_START_STOCK = 10
export const SHELF_EXTRAS = [
  ...SKEWER_ITEMS.map((sk) => ({
    id: sk.id, kind: 'skewer', name: `${sk.name} 꼬치`, emoji: sk.emoji,
    packCost: SKEWER_PACK_COST[sk.id], startStock: SKEWER_START_STOCK,
    desc: `${sk.name} 꼬치! 꼬치 1개당 1,000원이에요`,
  })),
  { id: 'cilantro', kind: 'cilantro', name: '고수', emoji: '🌿', packCost: 2000, startStock: 20, desc: '향긋한 고수 한 줌! 호불호가 갈려요' },
]
export const EXTRA_IDS = SHELF_EXTRAS.map((i) => i.id)
export const SHELF_ITEM_BY_ID = { ...VARIANT_INGREDIENT_BY_ID, ...Object.fromEntries(SHELF_EXTRAS.map((i) => [i.id, i])) }

export const RATING_DELTA = {
  leave: -0.25,
  stockoutLeave: -0.15, // walked out: shelf too empty to fill a bowl
  grumble: -0.05, // per wished ingredient that was sold out
  wrongTable: -0.1, // pot brought to the wrong ticket number
  serveGood: 0.08, // ticket mode + spice matched what the customer asked for
  serveWrong: -0.2,
  fastBonus: 0.05,
  overcharge: -0.1, // customer complains about being overcharged (design/game-brief.md)
}

// Starting warehouse units per starter ingredient. Day-1 warehouse draw measured at 15–25 per
// ingredient (opening box + restocks, incl. wilt; tests/integration/self-serve/warehouse-balance_test.mjs),
// so 30 lasts day 1 with one spare box and day 2 still needs a shop order.
// The shared START_STOCK (10) was sized for the original flow, where nothing is shelved or wilts.
export const START_WAREHOUSE_STOCK = 30
export const BOX_SIZE = 5 // units moved warehouse → shelf per restock click
export const SHELF_CAPACITY = 12 // max units per shelf slot
// Owner is away from the counter while restocking. Was 1.2s: in the first playtest the rush left
// no time to restock at all (production/qa/playtests/playtest-2026-09-25-dev.md), so it is cut
// to keep "restock or serve?" a decision rather than a lost cause.
export const RESTOCK_BUSY_SEC = 0.5
export const DIG_BUSY_SEC = 0.3 // one dig through the customer's bowl
export const WILT_SEC = 55 // perishable batches older than this are thrown away
export const PERISHABLE_IDS = new Set(['bokchoy', 'sprout', 'enoki', 'woodear', 'cilantro'])

// Player feedback (playtest 2026-09-25: wilting went unnoticed, 3 of 10 charges were wrong).
export const WILT_WARN_RATIO = 0.3 // slot shows "곧 시듦" once its oldest batch has ≤30% of WILT_SEC left
export const WILT_FLASH_SEC = 1.5 // a slot flashes this long right after a batch wilts away
export const FEEDBACK_TOAST_SEC = 5 // register result toast stays longer than the default 2.5s
export const MODE_LABEL = { maratang: '마라탕', shanguo: '샹궈' }

// Adjustable per-mode menu prices (story-001: menu-prices). Defaults match CHECKOUT_PRICE.ratePer100g
// (1,800 / 3,000); bounds keep the shop from ever going below cost or absurdly high, roughly
// 0.67x–1.44x the default, same shape for both modes.
export const MENU_PRICE = {
  step: 100,
  maratang: { min: 1200, max: 2600 },
  shanguo: { min: 2000, max: 4400 },
}

// Story & protagonist (design/quick-specs/story-character-2026-09-25.md)
export const NAME_MAX_LEN = 8 // fits the narrow counter panel
export const DAY_LINE_SEC = 5 // opening-of-day line stays over the owner this long
export const QUEUE_MAX = 3 // customers waiting at the counter
export const MIN_BOWL_ITEMS = 2 // fewer scoops than this and the customer walks out
export const SHANGUO_CHANCE = 0.3
export const SKEWER_CHANCE = 0.4
export const MAX_SKEWERS = 2
export const CILANTRO_CHANCE = 0.25

// Separate save slot so this variant never overwrites the original flow's save.
export const SAVE_KEY = 'maratang-selfserve-save-v1'
