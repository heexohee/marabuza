// Shelf (진열대) rules: warehouse → shelf restocking, FIFO self-serve, wilting.
// A shelf maps ingredient id → batches [{ qty, age }], oldest first. All functions are pure.
import { BOX_SIZE, PERISHABLE_IDS, SHELF_CAPACITY, WILT_SEC } from './data.js'

/** Units of one ingredient currently on the shelf. */
export const shelfQty = (shelf, id) => (shelf[id] ?? []).reduce((sum, b) => sum + b.qty, 0)

/** Moves up to one box from warehouse to shelf as a fresh batch; `moved` is 0 when nothing fits. */
export function restockShelf(stock, shelf, id) {
  const moved = Math.max(0, Math.min(BOX_SIZE, stock[id] ?? 0, SHELF_CAPACITY - shelfQty(shelf, id)))
  if (moved === 0) return { stock, shelf, moved }
  return {
    stock: { ...stock, [id]: stock[id] - moved },
    shelf: { ...shelf, [id]: [...(shelf[id] ?? []), { qty: moved, age: 0 }] },
    moved,
  }
}

/** Opening prep: one box of every unlocked ingredient goes onto an empty shelf. */
export const openShelf = (stock, unlocked) =>
  unlocked.reduce(({ stock: st, shelf }, id) => {
    const r = restockShelf(st, shelf, id)
    return { stock: r.stock, shelf: r.shelf }
  }, { stock, shelf: {} })

/** Takes up to n units, oldest batch first. */
export function takeFromShelf(shelf, id, n) {
  let need = n
  const batches = (shelf[id] ?? []).flatMap((b) => {
    const take = Math.min(need, b.qty)
    need -= take
    return b.qty - take > 0 ? [{ ...b, qty: b.qty - take }] : []
  })
  return { shelf: { ...shelf, [id]: batches }, taken: n - need }
}

/** Ages every batch by dt; perishable batches reaching WILT_SEC are removed and reported. */
export function ageShelf(shelf, dt) {
  const wilted = {}
  const next = Object.fromEntries(Object.entries(shelf).map(([id, batches]) => {
    const aged = batches.map((b) => ({ ...b, age: b.age + dt }))
    if (!PERISHABLE_IDS.has(id)) return [id, aged]
    const lost = aged.filter((b) => b.age >= WILT_SEC).reduce((sum, b) => sum + b.qty, 0)
    if (lost > 0) wilted[id] = lost
    return [id, aged.filter((b) => b.age < WILT_SEC)]
  }))
  return { shelf: next, wilted }
}

/** Closing: everything still on the shelf goes back to the warehouse. */
export const closeShelf = (stock, shelf) =>
  Object.keys(shelf).reduce((acc, id) => ({ ...acc, [id]: (acc[id] ?? 0) + shelfQty(shelf, id) }), stock)

/**
 * A customer scoops their wish list from the shelf (FIFO). Units that were sold
 * out are replaced one by one with random other ingredients still on the shelf,
 * chosen only from `substitutes` (defaults to every shelf id).
 * `missing` lists wished ingredients the customer got none of.
 */
export function fillBowl(shelf, wish, rng, substitutes = Object.keys(shelf)) {
  let cur = shelf
  let deficit = 0
  const items = {}
  const missing = []
  const add = (id, q) => { items[id] = (items[id] ?? 0) + q }
  for (const [id, want] of Object.entries(wish)) {
    const r = takeFromShelf(cur, id, want)
    cur = r.shelf
    deficit += want - r.taken
    if (r.taken > 0) add(id, r.taken)
    else missing.push(id)
  }
  for (; deficit > 0; deficit -= 1) {
    const available = substitutes.filter((id) => shelfQty(cur, id) > 0)
    if (available.length === 0) break
    const id = available[Math.floor(rng() * available.length)]
    cur = takeFromShelf(cur, id, 1).shelf
    add(id, 1)
  }
  const total = Object.values(items).reduce((a, b) => a + b, 0)
  return { shelf: cur, items, missing, total }
}
