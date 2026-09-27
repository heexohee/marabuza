// LEGACY — save format of the retired owner-scoop flow (src/index.html); the self-serve flow
// has its own src/js/self-serve/save.js. Do not extend — see docs/flows.md.
// Save data: pure (de)serialization shared by localStorage and the cloud, plus the
// localStorage adapter. Only the between-days progress is saved.
import { INGREDIENT_BY_ID, MAX_RATING, PRICE, UPGRADE_BY_ID } from './data.js'
import { createNewGame } from './logic.js'

const SAVE_KEY = 'maratang-save-v1'
const SAVE_VERSION = 1

const isNonNegInt = (v) => Number.isInteger(v) && v >= 0
const isNumberMap = (obj, validKeys, check) =>
  obj !== null && typeof obj === 'object' &&
  Object.entries(obj).every(([k, v]) => validKeys[k] !== undefined && check(v))
// savedAt (ms since epoch) was added for local-vs-cloud selection; older saves lack it.
const isSavedAt = (v) => v === undefined || (Number.isFinite(v) && v >= 0)

/** Validates untrusted save data (local or cloud); true only for a well-formed v1 save. */
export function isValidSave(d) {
  return d !== null && typeof d === 'object' &&
    d.version === SAVE_VERSION &&
    Number.isInteger(d.day) && d.day >= 1 &&
    isNonNegInt(d.money) &&
    typeof d.rating === 'number' && d.rating >= 0 && d.rating <= MAX_RATING &&
    Number.isInteger(d.pricePer100g) && d.pricePer100g >= PRICE.min && d.pricePer100g <= PRICE.max &&
    isNumberMap(d.stock, INGREDIENT_BY_ID, isNonNegInt) &&
    Array.isArray(d.unlocked) && d.unlocked.every((id) => INGREDIENT_BY_ID[id] !== undefined) &&
    isNumberMap(d.upgrades, UPGRADE_BY_ID, isNonNegInt) &&
    isSavedAt(d.savedAt)
}

/** The persistent part of a game state, stamped with when it was saved. */
export function serializeSave(s, savedAt) {
  return {
    version: SAVE_VERSION,
    day: s.day,
    money: s.money,
    rating: s.rating,
    pricePer100g: s.pricePer100g,
    stock: s.stock,
    unlocked: s.unlocked,
    upgrades: s.upgrades,
    savedAt,
  }
}

/** Turns save data into a playable state, or null when the data is not a valid save. */
export function restoreSave(d) {
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
}

/** Of two candidate saves (either may be missing or invalid), the most recently saved valid one. */
export function pickNewest(a, b) {
  const valid = [a, b].filter(isValidSave)
  if (valid.length === 0) return null
  return valid.reduce((best, d) => ((d.savedAt ?? 0) > (best.savedAt ?? 0) ? d : best))
}

// ---------- localStorage adapter ----------

/** Saves progress locally; returns the saved data, or null when storage is unavailable (private mode, quota). */
export function saveGame(s, now = Date.now()) {
  const data = serializeSave(s, now)
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data))
    return data
  } catch {
    return null
  }
}

/** The valid local save data, or null. */
export function loadLocalSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const d = JSON.parse(raw)
    return isValidSave(d) ? d : null
  } catch {
    return null
  }
}

/** Playable state from the newest of the local save and an optional cloud save, or null. */
export const loadGame = (cloudSave = null) => restoreSave(pickNewest(loadLocalSave(), cloudSave))

export const hasSave = (cloudSave = null) => pickNewest(loadLocalSave(), cloudSave) !== null
