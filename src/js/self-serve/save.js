// localStorage persistence for the self-serve variant, in its own slot so it never
// touches the original flow's save. Only the between-days progress is saved.
// Has its own validator: the warehouse here also holds skewer/cilantro stock, which the
// original flow's validator (../save.js) does not know about.
import { INGREDIENT_BY_ID, MAX_RATING, UPGRADE_BY_ID } from '../data.js'
import {
  DROPPED_INGREDIENT_IDS, INTERIOR_STAGES, MENU_PRICE, SAVE_KEY, SELF_UPGRADES, SHELF_ITEM_BY_ID, SIDE_BY_ID, SIDE_STOCK_IDS,
} from './data.js'
import { createNewGame, setMenuPrice } from './logic.js'
import { normalizeCharacter } from './character.js'

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
    isSideGifts(d.sideGifts)
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
  }
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

/** Returns a playable state from the save, or null when there is no valid save. */
export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
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
    }
  } catch {
    return null
  }
}

export const hasSave = () => loadGame() !== null
