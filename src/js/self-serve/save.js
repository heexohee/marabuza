// Save persistence for the self-serve variant (localStorage on the web, a save file in the desktop app — save-store.js),
// in its own slot so it never touches the original flow's save. Only the between-days progress is saved.
// Has its own validator: the warehouse here also holds skewer/cilantro stock, which the
// original flow's validator (../save.js) does not know about.
import { INGREDIENT_BY_ID, MAX_RATING, UPGRADE_BY_ID } from '../data.js'
import {
  DROPPED_INGREDIENT_IDS, INTERIOR_STAGES, MENU_PRICE, SAVE_KEY, SELF_UPGRADES, SHELF_ITEM_BY_ID, SIDE_BY_ID, SIDE_STOCK_IDS, PART1_LAST_DAY, PREMIUM_TOTAL,
} from './data.js'
import { createNewGame, setMenuPrice } from './logic.js'
import { normalizeCharacter } from './character.js'
import { saveStore } from './save-store.js'

const SAVE_VERSION = 1

const isNonNegInt = (v) => Number.isInteger(v) && v >= 0

// Saves made before weighed shrimp was dropped still carry a `shrimp` stock key: accept it, then strip it on load.
const SAVEABLE_STOCK_IDS = {
  ...SHELF_ITEM_BY_ID,
  ...Object.fromEntries([...DROPPED_INGREDIENT_IDS, ...SIDE_STOCK_IDS].map((id) => [id, true])),
}
// Side menu (side-menu story 001): saves from before carry no side stock and no gifts — 0 and [] on load.
const isSideGifts = (g) => g === undefined || (Array.isArray(g) && g.every((id) => SIDE_BY_ID[id] !== undefined))
const isDropped = (id) => DROPPED_INGREDIENT_IDS.includes(id)
const withoutDropped = (map) => Object.fromEntries(Object.entries(map).filter(([id]) => !isDropped(id)))
// Menu prices (story-001: menu-prices). Saves from before carry a single `pricePer100g` and no `prices`:
// they stay valid and load with the default prices; out-of-range prices are clamped on load, not rejected.
const isPriceMap = (p) => p === undefined ||
  (p !== null && typeof p === 'object' && Object.keys(MENU_PRICE).filter((k) => k !== 'step').every((m) => Number.isInteger(p[m])))
const loadPrices = (fresh, p) => (p === undefined ? fresh : Object.keys(fresh.prices).reduce((s, m) => setMenuPrice(s, m, p[m]), fresh)).prices

// Upgrades (economy E002, shop-growth 005): saves may still carry the old `interior` upgrade level — accepted,
// then dropped (interior stages start at 0). Levels are clamped into this flow's ranges (tables 2–4).
const clampLevel = (u, level) => Math.min(u.start + u.multiples.length, Math.max(u.start, level ?? u.start))
const loadUpgrades = (d) => Object.fromEntries(SELF_UPGRADES.map((u) => [u.id, clampLevel(u, d[u.id])]))
const isInterior = (v) => v === undefined || (Number.isInteger(v) && v >= 0 && v <= INTERIOR_STAGES.length)

// Weekly rent (economy E003). Saves from before carry neither field — 0 on load, same as a fresh game.
const isRentOverdue = (v) => v === undefined || v === 0 || v === 1
const isWeekRevenue = (v) => v === undefined || isNonNegInt(v)
// 권리금 + part-1 ending (economy E004). Saves from before carry none of these — see loadPremium.
const isOptNonNegInt = (v) => v === undefined || isNonNegInt(v)
const isOptBool = (v) => v === undefined || typeof v === 'boolean'
// A save made while the 'sunday' screen was open keeps that phase + its frozen ledger, so reopening the
// game resumes there instead of skipping ahead to the shop (every other phase resumes at the shop — see
// `resumeShop` in logic.js). No other phase is ever saved.
// 'ready': saved right after character creation, before day 1 opened (decision 2026-09-29) — resumes at day 1
// 'day' / 'summary': saved mid-day (decision 2026-09-29) with the running day in `snapshot` — resumes at that
// exact moment, so quitting to the title cannot re-roll a bad day
const DAY_PHASES = new Set(['day', 'summary'])
const isSavedPhase = (p) => p === undefined || p === 'sunday' || p === 'ready' || DAY_PHASES.has(p)
/** The running day's own fields (logic.js startDay / tick); everything else is saved as for a shop save. */
const DAY_FIELDS = [
  'dayTime', 'shelf', 'queue', 'counter', 'tables', 'rail', 'pots', 'heldPot', 'busy', 'wiltedAt',
  'ownerLine', 'regularsDue', 'spawnTimer', 'nextCustomerId', 'nextTicketNo', 'stats',
]
const isDaySnapshot = (v) => v !== null && typeof v === 'object' && Number.isFinite(v.dayTime) && v.dayTime >= 0 &&
  Array.isArray(v.queue) && Array.isArray(v.tables) && Array.isArray(v.pots) && v.stats !== null && typeof v.stats === 'object'
const pickDay = (s) => Object.fromEntries(DAY_FIELDS.filter((k) => s[k] !== undefined).map((k) => [k, s[k]]))
const isLedger = (l) => l === undefined || l === null ||
  (typeof l === 'object' && isNonNegInt(l.weekRevenue) && isNonNegInt(l.rentDue) && typeof l.rentPaid === 'boolean')

const isNumberMap = (obj, validKeys, check) =>
  obj !== null && typeof obj === 'object' &&
  Object.entries(obj).every(([k, v]) => validKeys[k] !== undefined && check(v))

/** Validates untrusted save data; true only for a well-formed v1 self-serve save. */
export function isValidSave(d) {
  return d !== null && typeof d === 'object' &&
    d.version === SAVE_VERSION &&
    Number.isInteger(d.day) && d.day >= 1 &&
    isNonNegInt(d.money) &&
    typeof d.rating === 'number' && d.rating >= 0 && d.rating <= MAX_RATING &&
    isPriceMap(d.prices) &&
    isNumberMap(d.stock, SAVEABLE_STOCK_IDS, isNonNegInt) &&
    Array.isArray(d.unlocked) && d.unlocked.every((id) => INGREDIENT_BY_ID[id] !== undefined) &&
    isNumberMap(d.upgrades, UPGRADE_BY_ID, isNonNegInt) &&
    isInterior(d.interior) &&
    isSideGifts(d.sideGifts) &&
    isRentOverdue(d.rentOverdue) &&
    isWeekRevenue(d.weekRevenue) &&
    isOptNonNegInt(d.premiumLeft) && isOptNonNegInt(d.premiumCarry) &&
    isOptBool(d.endingSeen) && isOptBool(d.premiumPaidInFull) && isOptBool(d.part2TeaserSeen) &&
    isSavedPhase(d.phase) &&
    (!DAY_PHASES.has(d.phase) || isDaySnapshot(d.snapshot)) &&
    isLedger(d.ledger)
}

/** Saves between-days progress; returns false when storage is unavailable. */
export function saveGame(s) {
  const data = {
    version: SAVE_VERSION,
    day: s.day,
    money: s.money,
    rating: s.rating,
    prices: s.prices,
    stock: s.stock,
    unlocked: s.unlocked,
    upgrades: s.upgrades,
    interior: s.interior,
    sideGifts: s.sideGifts,
    character: s.character,
    rentOverdue: s.rentOverdue,
    weekRevenue: s.weekRevenue,
    premiumLeft: s.premiumLeft,
    premiumCarry: s.premiumCarry,
    endingSeen: s.endingSeen,
    premiumPaidInFull: s.premiumPaidInFull,
    part2TeaserSeen: s.part2TeaserSeen,
    // Only the 'sunday' screen and the rest of the opening (saved as 'ready': day 1 not yet opened) are saved
    // as their own phase (see isSavedPhase) — every other phase resumes at the shop via resumeShop.
    ...(s.phase === 'sunday' ? { phase: 'sunday', ledger: s.ledger } : {}),
    ...(s.phase === 'opening' ? { phase: 'ready' } : {}),
    // a day without its running fields saves like a shop save rather than writing one that cannot load
    ...(DAY_PHASES.has(s.phase) && isDaySnapshot(pickDay(s)) ? { phase: s.phase, snapshot: pickDay(s) } : {}),
  }
  try {
    return saveStore().setItem(SAVE_KEY, JSON.stringify(data)) !== false
  } catch {
    return false
  }
}

/** Returns a playable state from the save, or null when there is no valid save. */
export function loadGame() {
  try {
    const raw = saveStore().getItem(SAVE_KEY)
    if (!raw) return null
    const d = JSON.parse(raw)
    if (!isValidSave(d)) return null
    const fresh = createNewGame()
    return {
      ...fresh,
      day: d.day,
      money: d.money,
      rating: d.rating,
      prices: loadPrices(fresh, d.prices),
      stock: { ...fresh.stock, ...withoutDropped(d.stock) },
      unlocked: d.unlocked.filter((id) => !isDropped(id)),
      upgrades: loadUpgrades(d.upgrades),
      interior: d.interior ?? 0,
      sideGifts: d.sideGifts ?? [],
      character: normalizeCharacter(d.character), // saves from before characters get the default
      rentOverdue: d.rentOverdue ?? 0,
      weekRevenue: d.weekRevenue ?? 0,
      ...loadPremium(d),
      // part-2 teaser (story N003): saves from before it count it as seen once day 28 is behind them
      part2TeaserSeen: d.part2TeaserSeen ?? d.day > PART1_LAST_DAY,
      ...(d.phase === 'sunday' ? { phase: 'sunday', ledger: d.ledger ?? null } : {}),
      ...(d.phase === 'ready' ? { phase: 'ready' } : {}),
      ...(DAY_PHASES.has(d.phase) ? { phase: d.phase, ...pickDay(d.snapshot) } : {}),
    }
  } catch {
    return null
  }
}

/**
 * 권리금 state from a save. A save from before E004 has none: before day 28 it starts from the full
 * 권리금 (nothing was ever collected under the old rule); past day 28 part 1 counts as over, since
 * its Sunday has already gone by.
 */
function loadPremium(d) {
  if (d.premiumLeft !== undefined) {
    return {
      premiumLeft: d.premiumLeft,
      premiumCarry: d.premiumCarry ?? 0,
      endingSeen: d.endingSeen ?? false,
      premiumPaidInFull: d.premiumPaidInFull ?? false,
    }
  }
  const past = d.day > PART1_LAST_DAY
  return { premiumLeft: past ? 0 : PREMIUM_TOTAL, premiumCarry: 0, endingSeen: past, premiumPaidInFull: false }
}

export const hasSave = () => loadGame() !== null

/** Deletes the save (economy E003: a closed-down shop ends the run — "이어하기" must not bring it back). */
export function clearSave() {
  try {
    return saveStore().removeItem(SAVE_KEY) !== false
  } catch {
    return false
  }
}
