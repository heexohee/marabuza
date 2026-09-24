// Self-serve flow variant: pure game rules, every action takes a state and returns a new one.
// Flow: self-serve → counter (dig, ticket, prepay) → rail → pot → table, plus shelf restocking.
// design/quick-specs/self-serve-restock-flow-2026-09-24.md
//
// Lives beside the original flow (../logic.js) so both can be played and compared.
// Pricing, shop and timing helpers are shared by import — never duplicated or modified here.
import {
  CHECKOUT_PRICE, CUSTOMER_FACES, INGREDIENTS, MAX_RATING, MAX_TIP_RATIO, ORDER, PACK_SIZE,
  PRICE, SKEWER_ITEMS, SPAWN, SPICE_LEVELS, START_MONEY, START_RATING, UPGRADES, UPGRADE_BY_ID,
} from '../data.js'
import {
  addToast, checkoutBasePrice, checkoutBowlPrice, checkoutOutcome, clamp, cookTime, freePotIndex, isClosing,
  maxPatience, round100, spawnInterval, toCheckoutBowl,
} from '../logic.js'
import {
  CILANTRO_CHANCE, DIG_BUSY_SEC, EXTRA_IDS, MAX_SKEWERS, MIN_BOWL_ITEMS, QUEUE_MAX, RATING_DELTA,
  RESTOCK_BUSY_SEC, SHANGUO_CHANCE, SHELF_EXTRAS, SHELF_ITEM_BY_ID, SKEWER_CHANCE, START_WAREHOUSE_STOCK,
} from './data.js'
import { ageShelf, closeShelf, fillBowl, openShelf, restockShelf, takeFromShelf } from './shelf.js'

// Shared, flow-independent actions re-exported so the variant UI imports from one place.
export {
  addToast, buyUpgrade, checkoutBowlWeight, cookTime, demandFactor, fadeToasts, isClosing, openShop,
  setPrice, unlockIngredient, upgradeCost,
} from '../logic.js'

const SEATED_PATIENCE_RATE = 0.5
const FULL_QUEUE_RETRY_SEC = 1
const FAST_SERVICE_RATIO = 0.5
const DEFAULT_SPICE = 2
const DEFAULT_MODE = 'maratang'

const randInt = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1))
const sum = (values) => values.reduce((a, b) => a + b, 0)

// ---------- creation ----------

const emptyStats = () => ({
  served: 0, left: 0, revenue: 0, tips: 0, refunds: 0,
  exactCharges: 0, overcharge: 0, overchargeCount: 0, undercharge: 0,
  wasted: 0, wasteCost: 0,
})

/** Counter state for the customer at the front of the queue (reset per customer). */
const freshCounter = (customerId = null) =>
  ({ customerId, mode: DEFAULT_MODE, spice: DEFAULT_SPICE, extra: 0, revealed: 0 })

export function createNewGame() {
  const starters = INGREDIENTS.filter((i) => i.unlockCost === 0).map((i) => i.id)
  return {
    phase: 'menu',
    day: 1,
    money: START_MONEY,
    rating: START_RATING,
    pricePer100g: PRICE.base,
    stock: {
      ...Object.fromEntries(INGREDIENTS.map((i) => [i.id, starters.includes(i.id) ? START_WAREHOUSE_STOCK : 0])),
      ...Object.fromEntries(SHELF_EXTRAS.map((i) => [i.id, i.startStock])),
    },
    unlocked: starters,
    upgrades: Object.fromEntries(UPGRADES.map((u) => [u.id, u.start])),
    toasts: [],
    nextToastId: 1,
    ...emptyDay(UPGRADE_BY_ID.pots.start, UPGRADE_BY_ID.seats.start),
  }
}

function emptyDay(potCount, seatCount) {
  return {
    dayTime: 0,
    shelf: {},
    queue: [],
    counter: freshCounter(),
    tables: Array.from({ length: seatCount }, () => null),
    rail: [],
    pots: Array.from({ length: potCount }, () => null),
    heldPot: null,
    busy: 0,
    spawnTimer: SPAWN.firstDelaySec,
    nextCustomerId: 1,
    nextTicketNo: 1,
    stats: emptyStats(),
  }
}

// ---------- derived values ----------

/** The customer currently at the counter, or null. */
export const frontCustomer = (s) => s.queue[0] ?? null

/** Everything that lives on the shelf today: unlocked ingredients plus skewers and cilantro. */
export const shelfIds = (s) => [...s.unlocked, ...EXTRA_IDS]

/** Meat portions in a checkout bowl (the shared shape allows a flag or a portion count). */
export const meatCount = (bowl, id) => Number(bowl[id] ?? 0)

/** Meat and skewers are buried under the vegetables until the owner digs them out. */
export function hiddenItems(bowl) {
  return [
    ...['beef', 'lamb'].filter((id) => meatCount(bowl, id) > 0)
      .map((id) => ({ kind: 'meat', id, count: meatCount(bowl, id) })),
    ...Object.entries(bowl.skewers).filter(([, n]) => n > 0).map(([id, count]) => ({ kind: 'skewer', id, count })),
  ]
}

/** Register numbers for the front customer: POS base (ticket mode), charged, and the correct price (real mode). */
export function counterPrice(s) {
  const c = frontCustomer(s)
  if (!c) return { base: 0, charged: 0, correct: 0 }
  const base = checkoutBasePrice({ ...c.bowl, mode: s.counter.mode })
  return { base, charged: Math.max(0, base + s.counter.extra), correct: checkoutBowlPrice(c.bowl) }
}

// ---------- helpers ----------

const withRating = (s, delta) => ({ ...s, rating: clamp(s.rating + delta, 0, MAX_RATING) })
const withStat = (s, key, add) => ({ ...s, stats: { ...s.stats, [key]: s.stats[key] + add } })
const withCounter = (s, patch) => ({ ...s, counter: { ...s.counter, ...patch } })

/** Resets the counter whenever a different customer reaches the front of the queue. */
function syncCounter(s) {
  const frontId = frontCustomer(s)?.id ?? null
  return s.counter.customerId === frontId ? s : { ...s, counter: freshCounter(frontId) }
}

/** Runs an owner action only when their hands are free (not restocking / digging). */
function whenFree(s, action) {
  if (s.phase !== 'day') return s
  return s.busy > 0 ? addToast(s, '손이 바빠요! 잠깐만요 🏃', 'bad') : action(s)
}

// ---------- day flow ----------

/** Opens the shop for the day: fresh day state plus one box of every unlocked ingredient on the shelf. */
export function startDay(s) {
  const day = emptyDay(s.upgrades.pots, s.upgrades.seats)
  return { ...s, phase: 'day', ...day, ...openShelf(s.stock, shelfIds(s)) }
}
export const startNextDay = (s) => startDay({ ...s, day: s.day + 1 })

/** Picks the ingredients a new customer would like: distinct unlocked ids × 1..maxQty. */
export function generateWish(unlocked, rng) {
  const pool = [...unlocked]
  const count = Math.min(pool.length, randInt(rng, ORDER.minItems, ORDER.maxItems))
  return Object.fromEntries(Array.from({ length: count }, () => {
    const [id] = pool.splice(randInt(rng, 0, pool.length - 1), 1)
    return [id, randInt(rng, 1, ORDER.maxQty)]
  }))
}

/**
 * The customer takes 1..MAX_SKEWERS skewer sticks from the shelf (maybe). A stick of a
 * sold-out kind is simply not taken and that kind is reported as missing.
 */
function takeSkewers(shelf, rng) {
  if (rng() >= SKEWER_CHANCE) return { shelf, skewers: {}, missing: [] }
  const wanted = Array.from({ length: randInt(rng, 1, MAX_SKEWERS) },
    () => SKEWER_ITEMS[randInt(rng, 0, SKEWER_ITEMS.length - 1)].id)
  return wanted.reduce((acc, id) => {
    const r = takeFromShelf(acc.shelf, id, 1)
    if (r.taken === 0) return { ...acc, missing: acc.missing.includes(id) ? acc.missing : [...acc.missing, id] }
    return { ...acc, shelf: r.shelf, skewers: { ...acc.skewers, [id]: (acc.skewers[id] ?? 0) + 1 } }
  }, { shelf, skewers: {}, missing: [] })
}

/** The customer adds a handful of cilantro from the shelf (maybe), if there is any left. */
function takeCilantro(shelf, rng) {
  if (rng() >= CILANTRO_CHANCE) return { shelf, cilantro: false, missing: [] }
  const r = takeFromShelf(shelf, 'cilantro', 1)
  return r.taken > 0 ? { shelf: r.shelf, cilantro: true, missing: [] } : { shelf, cilantro: false, missing: ['cilantro'] }
}

/** A customer arrives, fills a bowl from the shelf, and joins the counter queue (or walks out). */
export function spawnCustomer(s, rng) {
  const id = s.nextCustomerId
  const next = { ...s, nextCustomerId: id + 1 }
  const filled = fillBowl(s.shelf, generateWish(s.unlocked, rng), rng, s.unlocked)
  if (filled.total < MIN_BOWL_ITEMS) {
    const left = withRating(withStat(next, 'left', 1), RATING_DELTA.stockoutLeave)
    return addToast(left, '"담을 게 없네…" 손님이 그냥 나갔어요 🚪', 'bad')
  }
  const skewered = takeSkewers(filled.shelf, rng)
  const topped = takeCilantro(skewered.shelf, rng)
  const missing = [...filled.missing, ...skewered.missing, ...topped.missing]
  const mode = rng() < SHANGUO_CHANCE ? 'shanguo' : 'maratang'
  const patience = maxPatience(s)
  const customer = {
    id,
    face: CUSTOMER_FACES[randInt(rng, 0, CUSTOMER_FACES.length - 1)],
    mode,
    spice: randInt(rng, 0, SPICE_LEVELS.length - 1),
    missing,
    bowl: { ...toCheckoutBowl({ items: filled.items }, mode), skewers: skewered.skewers, cilantro: topped.cilantro },
    patience,
    maxPatience: patience,
  }
  const queued = syncCounter({ ...next, shelf: topped.shelf, queue: [...s.queue, customer] })
  if (missing.length === 0) return queued
  const names = missing.map((m) => SHELF_ITEM_BY_ID[m].name).join(', ')
  return addToast(withRating(queued, RATING_DELTA.grumble * missing.length), `"${names} 없네…" 😕`, 'bad')
}

function advanceSpawn(s, dt, rng) {
  if (isClosing(s)) return s
  const timer = s.spawnTimer - dt
  if (timer > 0) return { ...s, spawnTimer: timer }
  if (s.queue.length >= QUEUE_MAX) return { ...s, spawnTimer: FULL_QUEUE_RETRY_SEC }
  return { ...spawnCustomer(s, rng), spawnTimer: spawnInterval(s) }
}

function wiltShelf(s, dt) {
  const { shelf, wilted } = ageShelf(s.shelf, dt)
  const entries = Object.entries(wilted)
  if (entries.length === 0) return { ...s, shelf }
  const count = sum(entries.map(([, q]) => q))
  const cost = Math.round(sum(entries.map(([id, q]) => (q * SHELF_ITEM_BY_ID[id].packCost) / PACK_SIZE)))
  const names = entries.map(([id, q]) => `${SHELF_ITEM_BY_ID[id].name} ${q}개`).join(', ')
  const wasted = withStat(withStat({ ...s, shelf }, 'wasted', count), 'wasteCost', cost)
  return addToast(wasted, `🥀 ${names}가 시들어 버렸어요`, 'bad')
}

function departQueue(s) {
  const leaving = s.queue.filter((c) => c.patience <= 0)
  if (leaving.length === 0) return s
  const next = { ...s, queue: s.queue.filter((c) => c.patience > 0) }
  const rated = withRating(withStat(next, 'left', leaving.length), RATING_DELTA.leave * leaving.length)
  return addToast(rated, `계산 줄에서 ${leaving.length}명이 기다리다 떠났어요 😤`, 'bad')
}

/** Seated customers who give up get their money back; their order is dropped from rail and pots. */
function departTables(s) {
  const leaving = s.tables.filter((t) => t && t.patience <= 0)
  if (leaving.length === 0) return s
  const gone = new Set(leaving.map((t) => t.ticketNo))
  const refund = sum(leaving.map((t) => t.paid))
  const isHeldGone = s.heldPot !== null && gone.has(s.pots[s.heldPot]?.ticketNo)
  const next = {
    ...s,
    money: s.money - refund,
    tables: s.tables.map((t) => (t && gone.has(t.ticketNo) ? null : t)),
    rail: s.rail.filter((o) => !gone.has(o.ticketNo)),
    pots: s.pots.map((p) => (p && gone.has(p.ticketNo) ? null : p)),
    heldPot: isHeldGone ? null : s.heldPot,
  }
  const counted = withStat(withStat(next, 'left', leaving.length), 'refunds', refund)
  return addToast(withRating(counted, RATING_DELTA.leave * leaving.length), `"너무 늦어요!" 환불 ${refund.toLocaleString()}원 💸`, 'bad')
}

const isEveryoneGone = (s) =>
  s.queue.length === 0 && s.rail.length === 0 && s.tables.every((t) => t === null) && s.pots.every((p) => p === null)

/** Advances the day by dt seconds: timers, wilting, departures, spawning and closing. */
export function tick(s, dt, rng = Math.random) {
  if (s.phase !== 'day') return s
  const aged = {
    ...s,
    dayTime: s.dayTime + dt,
    busy: Math.max(0, s.busy - dt),
    pots: s.pots.map((p) => (p ? { ...p, remaining: Math.max(0, p.remaining - dt) } : p)),
    queue: s.queue.map((c) => ({ ...c, patience: c.patience - dt })),
    tables: s.tables.map((t) => (t ? { ...t, patience: t.patience - dt * SEATED_PATIENCE_RATE } : t)),
    toasts: s.toasts.map((t) => ({ ...t, ttl: t.ttl - dt })).filter((t) => t.ttl > 0),
  }
  const next = advanceSpawn(syncCounter(departTables(departQueue(wiltShelf(aged, dt)))), dt, rng)
  if (!isClosing(next) || !isEveryoneGone(next)) return next
  return { ...next, phase: 'summary', stock: closeShelf(next.stock, next.shelf), shelf: {}, heldPot: null }
}

// ---------- restock ----------

/** Owner carries one box from the warehouse to a shelf slot (keeps them busy for a moment). */
export function restock(s, id) {
  if (!shelfIds(s).includes(id)) return s
  return whenFree(s, (free) => {
    const r = restockShelf(free.stock, free.shelf, id)
    if (r.moved > 0) return { ...free, stock: r.stock, shelf: r.shelf, busy: RESTOCK_BUSY_SEC }
    const name = SHELF_ITEM_BY_ID[id].name
    const reason = (free.stock[id] ?? 0) <= 0 ? `창고에 ${name} 재고가 없어요! 마감 후 상점에서 사세요` : `${name} 칸이 꽉 찼어요`
    return addToast(free, reason, 'bad')
  })
}

// ---------- shop ----------

/**
 * Buys PACK_SIZE units into the warehouse. Unlike the shared buyPack this also sells skewers
 * and cilantro; ingredients still need to be unlocked first.
 */
export function buyPack(s, id) {
  const item = SHELF_ITEM_BY_ID[id]
  const isBuyable = item && (EXTRA_IDS.includes(id) || s.unlocked.includes(id))
  if (!isBuyable) return s
  if (s.money < item.packCost) return addToast(s, '돈이 부족해요 💸', 'bad')
  const bought = { ...s, money: s.money - item.packCost, stock: { ...s.stock, [id]: (s.stock[id] ?? 0) + PACK_SIZE } }
  return addToast(bought, `${item.name} ${PACK_SIZE}개 창고 입고`, 'good')
}

// ---------- counter ----------

/** Digs through the front customer's bowl: reveals one more buried item. */
export function dig(s) {
  return whenFree(s, (free) => {
    const c = frontCustomer(free)
    if (!c) return free
    const busy = { ...free, busy: DIG_BUSY_SEC }
    if (free.counter.revealed >= hiddenItems(c.bowl).length) return addToast(busy, '바닥까지 확인했어요 👌', 'info')
    return withCounter(busy, { revealed: free.counter.revealed + 1 })
  })
}

/** Writes the cooking mode on the order ticket (also changes the POS weight rate). */
export const setTicketMode = (s, mode) =>
  (CHECKOUT_PRICE.ratePer100g[mode] === undefined ? s : whenFree(s, (free) => withCounter(free, { mode })))

/** Writes the spice level on the order ticket. */
export const setTicketSpice = (s, level) =>
  whenFree(s, (free) => withCounter(free, { spice: clamp(level, 0, SPICE_LEVELS.length - 1) }))

/** Adds a surcharge key press on top of the POS weight price (the total never goes below 0). */
export function adjustCharge(s, delta) {
  if (!frontCustomer(s)) return s
  return whenFree(s, (free) =>
    withCounter(free, { extra: Math.max(-counterPrice(free).base, free.counter.extra + delta) }))
}

/** Clears the punched-in extras back to the POS weight price. */
export const resetCharge = (s) => (frontCustomer(s) ? whenFree(s, (free) => withCounter(free, { extra: 0 })) : s)

// Stat updates per checkout outcome.
const OUTCOME_STATS = {
  exact: (s) => withStat(s, 'exactCharges', 1),
  overcharge: (s, diff) => withStat(withStat(s, 'overcharge', diff), 'overchargeCount', 1),
  undercharge: (s, diff) => withStat(s, 'undercharge', diff),
}

/** Prepay: takes the charged amount now, hands out a ticket, seats the customer and sends the order to the rail. */
export function confirmCharge(s) {
  return whenFree(s, (free) => {
    const c = frontCustomer(free)
    if (!c) return free
    const tableIdx = free.tables.findIndex((t) => t === null)
    if (tableIdx < 0) return addToast(free, '빈 테이블이 없어요! 먼저 서빙하세요', 'bad')
    const { charged, correct } = counterPrice(free)
    const { type, difference } = checkoutOutcome(correct, charged)
    const ticketNo = free.nextTicketNo
    const patience = maxPatience(free)
    const table = {
      customerId: c.id, face: c.face, ticketNo, mode: c.mode, spice: c.spice,
      paid: charged, correctPrice: correct, patience, maxPatience: patience,
    }
    const order = { ticketNo, face: c.face, bowl: c.bowl, mode: free.counter.mode, spice: free.counter.spice }
    const recorded = withStat(OUTCOME_STATS[type](free, difference), 'revenue', charged)
    const seated = syncCounter({
      ...recorded,
      money: free.money + charged,
      queue: free.queue.slice(1),
      tables: free.tables.map((t, i) => (i === tableIdx ? table : t)),
      rail: [...free.rail, order],
      nextTicketNo: ticketNo + 1,
    })
    return addToast(seated, `🎫 ${ticketNo}번 결제 ${charged.toLocaleString()}원`, 'good')
  })
}

// ---------- kitchen ----------

/** Puts a rail ticket into the first empty pot. */
export function startCooking(s, ticketNo) {
  return whenFree(s, (free) => {
    const order = free.rail.find((o) => o.ticketNo === ticketNo)
    if (!order) return free
    const potIdx = freePotIndex(free)
    if (potIdx < 0) return addToast(free, '빈 냄비가 없어요! 완성된 냄비를 먼저 서빙하세요', 'bad')
    const time = cookTime(free)
    const pot = { ticketNo, order, remaining: time, total: time }
    return {
      ...free,
      rail: free.rail.filter((o) => o.ticketNo !== ticketNo),
      pots: free.pots.map((p, i) => (i === potIdx ? pot : p)),
    }
  })
}

/** Picks up (or puts back) a finished pot. */
export function pickPot(s, potIdx) {
  return whenFree(s, (free) => {
    const pot = free.pots[potIdx]
    if (!pot || pot.remaining > 0) return free
    return { ...free, heldPot: free.heldPot === potIdx ? null : potIdx }
  })
}

/** Brings the held pot to a table: it must match the ticket; tip and rating depend on the ticket matching the request. */
export function serveTable(s, tableIdx) {
  return whenFree(s, (free) => {
    const table = free.tables[tableIdx]
    if (!table) return free
    if (free.heldPot === null) return addToast(free, '먼저 완성된 냄비를 집어 주세요', 'info')
    const pot = free.pots[free.heldPot]
    if (pot.ticketNo !== table.ticketNo) {
      return addToast(withRating(free, RATING_DELTA.wrongTable), `"저는 ${table.ticketNo}번인데요?" 🤨`, 'bad')
    }
    const isRight = pot.order.mode === table.mode && pot.order.spice === table.spice
    const patienceRatio = clamp(table.patience / table.maxPatience, 0, 1)
    const tip = isRight ? round100(table.correctPrice * MAX_TIP_RATIO * patienceRatio) : 0
    const ratingDelta = isRight
      ? RATING_DELTA.serveGood + (patienceRatio > FAST_SERVICE_RATIO ? RATING_DELTA.fastBonus : 0)
      : RATING_DELTA.serveWrong
    const cleared = {
      ...free,
      money: free.money + tip,
      tables: free.tables.map((t, i) => (i === tableIdx ? null : t)),
      pots: free.pots.map((p, i) => (i === free.heldPot ? null : p)),
      heldPot: null,
    }
    const served = withRating(withStat(withStat(cleared, 'served', 1), 'tips', tip), ratingDelta)
    const text = isRight
      ? `맛있어요 😋${tip > 0 ? ` 팁 ${tip.toLocaleString()}원` : ''}`
      : `"${pot.order.mode !== table.mode ? '조리 방식' : '맵기'}이 달라요!" 😡`
    return addToast(served, text, isRight ? 'good' : 'bad')
  })
}
