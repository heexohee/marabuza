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

// ---------- economy (design/game-brief.md §경제 레벨링, production/epics/economy/story-002) ----------
// D = average daily profit (charges + tips − ingredients used) of a week-1 day: 2 tables, 1 pot, default menu
// prices, the dev bot with realistic register slips. Measured by `node tools/sim/baseline_day.mjs` (40 seeded
// days, 2026-09-27: perfect 97,507 · realistic 96,516). Every price below is a multiple of D — when menu
// prices or the day's pace change, re-run the sim and update BASELINE_D only.
export const BASELINE_D = 97000
/** A D multiple in won, rounded to 100원. */
export const priceOf = (multiple, d = BASELINE_D) => Math.round((multiple * d) / 100) * 100
export const ECONOMY_MULTIPLE = {
  rent: 2, // weekly 임대료, paid on Sunday (economy story E003)
  premium: 30, // 권리금 total (economy story E004)
  premiumMinWeekly: 0.5, // minimum 권리금 instalment each Sunday
}

// Shop upgrades for this flow (the original flow keeps ../data.js UPGRADES). The old "인테리어 +15%"
// upgrade is replaced by the 6 interior stages below; tables go 2 → 4.
export const SELF_UPGRADES = [
  { id: 'pots', name: '냄비 추가', emoji: '🍲', desc: '동시에 끓일 수 있는 냄비 +1', start: 1, multiples: [1.5, 3, 6] },
  { id: 'fire', name: '화력 강화', emoji: '🔥', desc: '조리 시간 -1초', start: 0, multiples: [1, 2, 4] },
  { id: 'seats', name: '좌석 확장', emoji: '🪑', desc: '식탁 +1 (최대 4개)', start: 2, multiples: [2, 4] },
]
export const SELF_UPGRADE_BY_ID = Object.fromEntries(SELF_UPGRADES.map((u) => [u.id, u]))

// Interior stages (design/game-brief.md §인테리어 6단계, production/epics/shop-growth/story-005): bought in order,
// each from its unlock day (business days). Atmosphere effects only — tables and cooking speed stay with the
// seat and fire upgrades. Background art: tools/art/scene_shop.py --stage N → img/scene-shop-N.png.
export const INTERIOR_STAGES = [
  { id: 'wallpaper', name: '벽지', emoji: '🎀', desc: '핑크 줄무늬 벽지 · 매일 아침 평판 소폭 ↑', unlockDay: 1, multiple: 1 },
  { id: 'floor', name: '바닥', emoji: '🧩', desc: '크림·핑크 체크 바닥 · 손님 인내심 ↑', unlockDay: 3, multiple: 1.5 },
  { id: 'lighting', name: '조명', emoji: '💡', desc: '핑크 펜던트 조명 · 식사 후 팁 ↑', unlockDay: 5, multiple: 2 },
  { id: 'door', name: '문·포토존', emoji: '💗', desc: '핑크 문과 네온 하트 · 손님 방문 ↑', unlockDay: 7, multiple: 3 },
  { id: 'furniture', name: '의자·식탁', emoji: '🪑', desc: '흰 식탁 + 민트 의자 · 식사 후 평판 ↑', unlockDay: 9, multiple: 4 },
  { id: 'kitchen', name: '주방', emoji: '🍳', desc: '핑크 주방 · 새 냉장 설비 · 채소 시듦 느리게', unlockDay: 12, multiple: 5 },
]
/** Effect sizes (tuning): each applies once the stage with that number is bought. */
export const INTERIOR_EFFECT = {
  morningRating: 0.1, // 1 벽지: rating + this at the start of every day
  patience: 1.1, // 2 바닥: customer patience ×
  tip: 1.15, // 3 조명: tips ×
  visits: 1.1, // 4 문·포토존: customers arrive this much more often
  serveRating: 1.25, // 5 의자·식탁: rating gained from a good serve ×
  wilt: 0.8, // 6 주방: shelf vegetables age at this speed
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
