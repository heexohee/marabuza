// localStorage persistence for the self-serve variant, in its own slot so it never
// touches the original flow's save. Validation is shared with ../save.js.
import { isValidSave } from '../save.js'
import { createNewGame } from './logic.js'
import { SAVE_KEY } from './data.js'

const SAVE_VERSION = 1 // same between-days shape as ../save.js, so isValidSave applies

/** Saves between-days progress; returns false when storage is unavailable. */
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
