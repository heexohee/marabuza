// localStorage persistence. Only the between-days progress is saved.
import { INGREDIENT_BY_ID, MAX_RATING, PRICE, UPGRADE_BY_ID } from './data.js'
import { createNewGame } from './logic.js'

const SAVE_KEY = 'maratang-save-v1'
const SAVE_VERSION = 1

const isNonNegInt = (v) => Number.isInteger(v) && v >= 0
const isNumberMap = (obj, validKeys, check) =>
  obj !== null && typeof obj === 'object' &&
  Object.entries(obj).every(([k, v]) => validKeys[k] !== undefined && check(v))

/** Validates untrusted save data; returns true only for a well-formed v1 save. */
export function isValidSave(d) {
  return d !== null && typeof d === 'object' &&
    d.version === SAVE_VERSION &&
    Number.isInteger(d.day) && d.day >= 1 &&
    isNonNegInt(d.money) &&
    typeof d.rating === 'number' && d.rating >= 0 && d.rating <= MAX_RATING &&
    Number.isInteger(d.pricePer100g) && d.pricePer100g >= PRICE.min && d.pricePer100g <= PRICE.max &&
    isNumberMap(d.stock, INGREDIENT_BY_ID, isNonNegInt) &&
    Array.isArray(d.unlocked) && d.unlocked.every((id) => INGREDIENT_BY_ID[id] !== undefined) &&
    isNumberMap(d.upgrades, UPGRADE_BY_ID, isNonNegInt)
}

/** Saves progress; returns false when storage is unavailable (private mode, quota). */
export function saveGame(s) {
  const data = {
    version: SAVE_VERSION,
    day: s.day,
    money: s.money,
    rating: s.rating,
    pricePer100g: s.pricePer100g,
    stock: s.stock,
    unlocked: s.unlocked,
    upgrades: s.upgrades,
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
      pricePer100g: d.pricePer100g,
      stock: { ...fresh.stock, ...d.stock },
      unlocked: d.unlocked,
      upgrades: { ...fresh.upgrades, ...d.upgrades },
    }
  } catch {
    return null
  }
}

export const hasSave = () => loadGame() !== null
