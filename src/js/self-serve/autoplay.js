// Autoplay bot for the self-serve flow (dev mode): plays a whole business day with the same actions a
// player has — charge, cook, serve, restock — and makes a realistic player's register slips (a few
// undercharges, sometimes one overcharge), so interior, pots and other between-day UI can be
// checked without playing every day by hand. Pure: state in, state out. Also a baseline for economy
// story E002 (measuring the average daily profit D).
import { DAY_LENGTH_SEC } from '../data.js'
import {
  adjustCharge, buyPack, buySidePack, confirmCharge, cookNext, counterPrice, frontCustomer, openShop, pickPot, restock, serveTable,
  openSides, setTicketMode, setTicketSpice, shelfIds, startNextDay, tick,
} from './logic.js'
import { sideStockId } from './data.js'
import { shelfQty } from './shelf.js'

export const AUTOPLAY_STEP_SEC = 0.25
const RESTOCK_BELOW = 3 // a shelf slot with fewer units than this gets a box from the warehouse
const MAX_ACTIONS_PER_STEP = 8
const OVERTIME_SEC = 300 // after closing, seated customers still finish; stop anyway after this
const WAREHOUSE_TARGET = 30 // between days the bot orders packs until each shelf item has this many in stock

/**
 * A realistic day of register slips (tuning, feedback 2026-09-27): 1–2 customers undercharged by a few
 * thousand to ~10,000원, and 0–1 customer overcharged by 3,000원. Slips land on customers among the first
 * `within` charges of the day so they happen even on a quiet day.
 */
export const BOT_MISTAKES = {
  undercharge: { count: [1, 2], amount: [2000, 10000], step: 1000 },
  overcharge: { count: [0, 1], amount: 3000 },
  within: 8,
}
export const NO_MISTAKES = { undercharge: { count: [0, 0], amount: [0, 0], step: 1000 }, overcharge: { count: [0, 0], amount: 0 }, within: 0 }

const MIN_CHARGE = 1000 // a slip never makes the bot charge less than this

const randInt = (rng, [lo, hi]) => lo + Math.floor(rng() * (hi - lo + 1))

/** Which of today's charges (0 = first) get a slip, and by how much (+ over, − under). */
export function planMistakes(rng, m = BOT_MISTAKES) {
  const slots = Array.from({ length: m.within }, (_, i) => i)
  const pick = () => slots.splice(Math.floor(rng() * slots.length), 1)[0]
  const plan = new Map()
  const under = Math.min(randInt(rng, m.undercharge.count), slots.length)
  for (let i = 0; i < under; i++) {
    const [lo, hi] = m.undercharge.amount
    const steps = randInt(rng, [lo / m.undercharge.step, hi / m.undercharge.step])
    plan.set(pick(), -steps * m.undercharge.step)
  }
  const over = Math.min(randInt(rng, m.overcharge.count), slots.length)
  for (let i = 0; i < over; i++) plan.set(pick(), m.overcharge.amount)
  return plan
}

const tableFor = (s, ticketNo) => s.tables.findIndex((t) => t && t.ticketNo === ticketNo)

// Each rule returns the next state, or null when it does not apply right now. First match wins.
// `slipFor(s, correct)` says how far off the bot charges the customer at the counter (0 = exact).
const makeRules = (slipFor) => [
  function serveHeldPot(s) {
    if (s.heldPot === null) return null
    const table = tableFor(s, s.pots[s.heldPot].ticketNo)
    return table < 0 ? null : serveTable(s, table)
  },
  function pickDonePot(s) {
    if (s.heldPot !== null) return null
    const potIdx = s.pots.findIndex((p) => p && p.remaining <= 0 && tableFor(s, p.ticketNo) >= 0)
    return potIdx < 0 ? null : pickPot(s, potIdx)
  },
  function cookWaitingTicket(s) {
    return s.rail.length > 0 && s.pots.some((p) => p === null) ? cookNext(s) : null
  },
  function chargeFrontCustomer(s) {
    const c = frontCustomer(s)
    if (!c || !s.tables.includes(null)) return null
    if (s.counter.mode !== c.mode) return setTicketMode(s, c.mode)
    if (s.counter.spice !== c.spice) return setTicketSpice(s, c.spice)
    const { charged, correct } = counterPrice(s)
    const target = correct + slipFor(s, correct)
    return charged !== target ? adjustCharge(s, target - charged) : confirmCharge(s)
  },
  function restockLowShelf(s) {
    const id = shelfIds(s).find((i) => shelfQty(s.shelf, i) < RESTOCK_BELOW && (s.stock[i] ?? 0) > 0)
    return id === undefined ? null : restock(s, id)
  },
]

function act(s, rules) {
  if (s.busy > 0) return s
  for (const rule of rules) {
    const next = rule(s)
    if (next && next !== s) return next
  }
  return s
}

/** Runs the bot's actions until none applies (or the owner becomes busy). */
function actAll(s, rules) {
  let cur = s
  for (let i = 0; i < MAX_ACTIONS_PER_STEP; i++) {
    const next = act(cur, rules)
    if (next === cur) return cur
    cur = next
  }
  return cur
}

/**
 * Plays the current business day to its end-of-day summary.
 * @param {object} s state in phase 'day'
 * @param {() => number} rng random source for customers and slips (Math.random by default; seeded in tests)
 * @param {object} mistakes register-slip plan (BOT_MISTAKES by default; NO_MISTAKES for a perfect player)
 * @returns {object} state in phase 'summary' (or unchanged if `s` is not a business day)
 */
export function autoPlayDay(s, rng = Math.random, mistakes = BOT_MISTAKES) {
  if (s.phase !== 'day') return s
  const plan = planMistakes(rng, mistakes)
  const firstTicket = s.nextTicketNo // ticket numbers count today's charges
  // An undercharge too big for this bowl (it would charge under MIN_CHARGE) moves to the next customer,
  // so every planned slip lands at its full amount. The plan is local to this run.
  const slipFor = (cur, correct) => {
    const idx = cur.nextTicketNo - firstTicket
    const slip = plan.get(idx) ?? 0
    if (slip >= 0 || correct + slip >= MIN_CHARGE) return slip
    plan.delete(idx)
    let next = idx + 1
    while (plan.has(next)) next++
    plan.set(next, slip)
    return 0
  }
  const rules = makeRules(slipFor)
  const maxSteps = Math.ceil((DAY_LENGTH_SEC + OVERTIME_SEC) / AUTOPLAY_STEP_SEC)
  let cur = s
  for (let i = 0; i < maxSteps && cur.phase === 'day'; i++) {
    cur = tick(actAll(cur, rules), AUTOPLAY_STEP_SEC, rng)
  }
  return cur
}

/** Between days: orders packs of every shelf item and open side that runs low, while the money lasts (a sensible player). */
export function restockWarehouse(s) {
  let cur = s
  for (const id of shelfIds(s)) {
    while ((cur.stock[id] ?? 0) < WAREHOUSE_TARGET) {
      const next = buyPack(cur, id)
      if (next.money === cur.money) break // not buyable or out of money
      cur = next
    }
  }
  for (const side of openSides(cur)) {
    while ((cur.stock[sideStockId(side.id)] ?? 0) < WAREHOUSE_TARGET) {
      const next = buySidePack(cur, side.id)
      if (next.money === cur.money) break
      cur = next
    }
  }
  return { ...cur, toasts: s.toasts }
}

/**
 * Plays `days` business days in a row from a day, summary or shop state; ends on the last day's summary.
 * Between days the shop is opened, the warehouse is topped up (restockWarehouse), and nothing else is bought.
 */
export function autoPlayDays(s, days = 1, rng = Math.random, mistakes = BOT_MISTAKES) {
  let cur = s
  for (let d = 0; d < days; d++) {
    if (cur.phase === 'summary') cur = openShop(cur)
    if (cur.phase === 'shop') cur = startNextDay(restockWarehouse(cur))
    if (cur.phase !== 'day') return cur
    cur = autoPlayDay(cur, rng, mistakes)
  }
  return cur
}
