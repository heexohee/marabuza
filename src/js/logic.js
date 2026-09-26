// Pure game rules. Every exported action takes a state and returns a new state.
import {
  CHECKOUT_PRICE, COOK_TIME_BASE_SEC, COOK_TIME_PER_FIRE_LEVEL, CUSTOMER_FACES, DAY_LENGTH_SEC,
  EXTRA_ITEM_PENALTY, INGREDIENTS, INGREDIENT_BY_ID, MAX_EXTRA_PENALTY, MAX_RATING,
  MAX_TIP_RATIO, ORDER, PACK_SIZE, PATIENCE_BASE_SEC, PATIENCE_DECAY_PER_DAY,
  PATIENCE_MIN_SEC, PATIENCE_PER_INTERIOR, PRICE, RATING_DELTA, REFUSE_BELOW_ACCURACY,
  SPAWN, SPICE_LEVELS, SPICE_PENALTY, START_MONEY, START_RATING, START_STOCK,
  UPGRADES, UPGRADE_BY_ID,
} from './data.js'

const MIN_COOK_TIME_SEC = 2
const COOKING_PATIENCE_RATE = 0.5
const FULL_SEATS_RETRY_SEC = 1
const TOAST_TTL_SEC = 2.5
const MAX_TOASTS = 4
const FAST_SERVICE_RATIO = 0.5
const DEFAULT_SPICE = 2

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
export const round100 = (v) => Math.round(v / 100) * 100
const randInt = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1))

// ---------- creation ----------

const emptyBowl = (spice = DEFAULT_SPICE) => ({ items: {}, spice })
const emptyStats = () => ({
  served: 0, left: 0, refused: 0, revenue: 0, tips: 0,
  exactCharges: 0, overcharge: 0, overchargeCount: 0, undercharge: 0,
})

export function createNewGame() {
  const starters = INGREDIENTS.filter((i) => i.unlockCost === 0).map((i) => i.id)
  return {
    phase: 'menu',
    day: 1,
    money: START_MONEY,
    rating: START_RATING,
    pricePer100g: PRICE.base,
    stock: Object.fromEntries(INGREDIENTS.map((i) => [i.id, starters.includes(i.id) ? START_STOCK : 0])),
    unlocked: starters,
    upgrades: Object.fromEntries(UPGRADES.map((u) => [u.id, u.start])),
    toasts: [],
    nextToastId: 1,
    ...emptyDay(1),
  }
}

function emptyDay(potCount) {
  return {
    dayTime: 0,
    customers: [],
    selectedCustomerId: null,
    bowl: emptyBowl(),
    pots: Array.from({ length: potCount }, () => null),
    spawnTimer: SPAWN.firstDelaySec,
    nextCustomerId: 1,
    pendingCheckout: null,
    stats: emptyStats(),
  }
}

// ---------- derived values ----------

export const cookTime = (s) =>
  Math.max(MIN_COOK_TIME_SEC, COOK_TIME_BASE_SEC - s.upgrades.fire * COOK_TIME_PER_FIRE_LEVEL)

export const maxPatience = (s) =>
  Math.max(PATIENCE_MIN_SEC, PATIENCE_BASE_SEC - (s.day - 1) * PATIENCE_DECAY_PER_DAY) *
  (1 + s.upgrades.interior * PATIENCE_PER_INTERIOR)

export const demandFactor = (price) =>
  clamp((PRICE.base / price) ** 1.5, SPAWN.demandMin, SPAWN.demandMax)

export const spawnInterval = (s) =>
  Math.max(
    SPAWN.minIntervalSec,
    SPAWN.baseIntervalSec - (s.day - 1) * SPAWN.perDay - s.rating * SPAWN.perRating,
  ) / demandFactor(s.pricePer100g)

export const isClosing = (s) => s.dayTime >= DAY_LENGTH_SEC

export const bowlWeight = (bowl) =>
  Object.entries(bowl.items).reduce((sum, [id, qty]) => sum + INGREDIENT_BY_ID[id].grams * qty, 0)

export const bowlPrice = (bowl, pricePer100g) => round100((bowlWeight(bowl) / 100) * pricePer100g)

export const isBowlEmpty = (bowl) => Object.values(bowl.items).every((q) => q <= 0)

export const upgradeCost = (s, id) => {
  const u = UPGRADE_BY_ID[id]
  return u.costs[s.upgrades[id] - u.start] ?? null
}

export const freePotIndex = (s) => s.pots.findIndex((p) => p === null)

// ---------- orders & scoring ----------

export function generateOrder(unlocked, rng) {
  const pool = [...unlocked]
  const count = Math.min(pool.length, randInt(rng, ORDER.minItems, ORDER.maxItems))
  const items = {}
  for (let n = 0; n < count; n += 1) {
    const [id] = pool.splice(randInt(rng, 0, pool.length - 1), 1)
    items[id] = randInt(rng, 1, ORDER.maxQty)
  }
  return { items, spice: randInt(rng, 0, SPICE_LEVELS.length - 1) }
}

export function scoreBowl(order, bowl) {
  const required = Object.values(order.items).reduce((a, b) => a + b, 0)
  const matched = Object.entries(order.items)
    .reduce((sum, [id, q]) => sum + Math.min(q, bowl.items[id] ?? 0), 0)
  const extra = Object.entries(bowl.items)
    .reduce((sum, [id, q]) => sum + Math.max(0, q - (order.items[id] ?? 0)), 0)
  const spiceDiff = Math.abs(order.spice - bowl.spice)
  const itemScore = required > 0 ? matched / required : 0
  const penalty = Math.min(MAX_EXTRA_PENALTY, extra * EXTRA_ITEM_PENALTY) + SPICE_PENALTY[spiceDiff]
  return { accuracy: clamp(itemScore - penalty, 0, 1), matched, required, extra, spiceDiff }
}

// ---------- helpers ----------

export function addToast(s, text, kind = 'info') {
  const toast = { id: s.nextToastId, text, kind, ttl: TOAST_TTL_SEC }
  return { ...s, toasts: [...s.toasts, toast].slice(-MAX_TOASTS), nextToastId: s.nextToastId + 1 }
}

const withRating = (s, delta) => ({ ...s, rating: clamp(s.rating + delta, 0, MAX_RATING) })
const withStat = (s, key, add) => ({ ...s, stats: { ...s.stats, [key]: s.stats[key] + add } })
const findCustomer = (s, id) => s.customers.find((c) => c.id === id)
const firstWaitingId = (customers) => customers.find((c) => c.status === 'waiting')?.id ?? null

// ---------- day flow ----------

export const startDay = (s) => ({ ...s, phase: 'day', ...emptyDay(s.upgrades.pots) })
export const openShop = (s) => ({ ...s, phase: 'shop' })
export const startNextDay = (s) => startDay({ ...s, day: s.day + 1 })

function spawnCustomer(s, rng) {
  const patience = maxPatience(s)
  const customer = {
    id: s.nextCustomerId,
    face: CUSTOMER_FACES[randInt(rng, 0, CUSTOMER_FACES.length - 1)],
    order: generateOrder(s.unlocked, rng),
    patience,
    maxPatience: patience,
    status: 'waiting',
  }
  return {
    ...s,
    customers: [...s.customers, customer],
    nextCustomerId: s.nextCustomerId + 1,
    selectedCustomerId: s.selectedCustomerId ?? customer.id,
  }
}

function departCustomers(s) {
  const leaving = s.customers.filter((c) => c.patience <= 0)
  if (leaving.length === 0) return s
  const leftIds = new Set(leaving.map((c) => c.id))
  const customers = s.customers.filter((c) => !leftIds.has(c.id))
  const next = {
    ...s,
    customers,
    pots: s.pots.map((p) => (p && leftIds.has(p.customerId) ? null : p)),
    selectedCustomerId: leftIds.has(s.selectedCustomerId) ? firstWaitingId(customers) : s.selectedCustomerId,
  }
  const rated = withRating(withStat(next, 'left', leaving.length), RATING_DELTA.leave * leaving.length)
  return addToast(rated, `손님 ${leaving.length}명이 기다리다 떠났어요 😤`, 'bad')
}

function advanceSpawn(s, dt, rng) {
  if (isClosing(s)) return s
  const timer = s.spawnTimer - dt
  if (timer > 0) return { ...s, spawnTimer: timer }
  if (s.customers.length >= s.upgrades.seats) return { ...s, spawnTimer: FULL_SEATS_RETRY_SEC }
  return { ...spawnCustomer(s, rng), spawnTimer: spawnInterval(s) }
}

export function tick(s, dt, rng = Math.random) {
  if (s.phase !== 'day') return s
  const aged = {
    ...s,
    dayTime: s.dayTime + dt,
    pots: s.pots.map((p) => (p ? { ...p, remaining: Math.max(0, p.remaining - dt) } : p)),
    customers: s.customers.map((c) => ({
      ...c,
      patience: c.patience - dt * (c.status === 'cooking' ? COOKING_PATIENCE_RATE : 1),
    })),
    toasts: s.toasts.map((t) => ({ ...t, ttl: t.ttl - dt })).filter((t) => t.ttl > 0),
  }
  const next = advanceSpawn(departCustomers(aged), dt, rng)
  const isDayOver = isClosing(next) && next.customers.length === 0 && !next.pendingCheckout
  return isDayOver ? { ...returnBowlToStock(next), phase: 'summary' } : next
}

// Toasts keep fading on non-day screens (shop feedback).
export function fadeToasts(s, dt) {
  if (s.toasts.length === 0) return s
  return { ...s, toasts: s.toasts.map((t) => ({ ...t, ttl: t.ttl - dt })).filter((t) => t.ttl > 0) }
}

// ---------- bowl actions ----------

export function selectCustomer(s, id) {
  const c = findCustomer(s, id)
  return c && c.status === 'waiting' ? { ...s, selectedCustomerId: id } : s
}

export function addScoop(s, id) {
  if (s.phase !== 'day' || !s.unlocked.includes(id)) return s
  if ((s.stock[id] ?? 0) <= 0) {
    return addToast(s, `${INGREDIENT_BY_ID[id].name} 재고가 없어요! 마감 후 상점에서 사세요`, 'bad')
  }
  return {
    ...s,
    stock: { ...s.stock, [id]: s.stock[id] - 1 },
    bowl: { ...s.bowl, items: { ...s.bowl.items, [id]: (s.bowl.items[id] ?? 0) + 1 } },
  }
}

export function removeScoop(s, id) {
  const qty = s.bowl.items[id] ?? 0
  if (qty <= 0) return s
  const { [id]: _removed, ...rest } = s.bowl.items
  const items = qty > 1 ? { ...rest, [id]: qty - 1 } : rest
  return { ...s, stock: { ...s.stock, [id]: s.stock[id] + 1 }, bowl: { ...s.bowl, items } }
}

function returnBowlToStock(s) {
  const stock = Object.entries(s.bowl.items)
    .reduce((acc, [id, q]) => ({ ...acc, [id]: acc[id] + q }), s.stock)
  return { ...s, stock, bowl: emptyBowl(s.bowl.spice) }
}

export const clearBowl = (s) => returnBowlToStock(s)

export const setSpice = (s, level) =>
  ({ ...s, bowl: { ...s.bowl, spice: clamp(level, 0, SPICE_LEVELS.length - 1) } })

export function startCooking(s) {
  const customer = findCustomer(s, s.selectedCustomerId)
  if (!customer || customer.status !== 'waiting') return addToast(s, '먼저 주문할 손님을 골라주세요', 'bad')
  if (isBowlEmpty(s.bowl)) return addToast(s, '그릇이 비어 있어요', 'bad')
  const potIdx = freePotIndex(s)
  if (potIdx < 0) return addToast(s, '빈 냄비가 없어요! 완성된 냄비를 먼저 서빙하세요', 'bad')
  const time = cookTime(s)
  const pot = { customerId: customer.id, bowl: s.bowl, remaining: time, total: time }
  const customers = s.customers.map((c) => (c.id === customer.id ? { ...c, status: 'cooking' } : c))
  return {
    ...s,
    customers,
    pots: s.pots.map((p, i) => (i === potIdx ? pot : p)),
    bowl: emptyBowl(s.bowl.spice),
    selectedCustomerId: firstWaitingId(customers),
  }
}

/**
 * Serves a finished pot. An accepted bowl does not pay yet: it opens
 * `pendingCheckout` with the weight price already printed, and the owner
 * adds the non-weight extras (meat, skewers, cilantro) and confirms.
 */
export function servePot(s, potIdx) {
  const pot = s.pots[potIdx]
  if (!pot || pot.remaining > 0) return s
  if (s.pendingCheckout) return addToast(s, '계산대에 손님이 기다려요! 먼저 계산하세요', 'bad')
  const customer = findCustomer(s, pot.customerId)
  const cleared = {
    ...s,
    pots: s.pots.map((p, i) => (i === potIdx ? null : p)),
    customers: s.customers.filter((c) => c.id !== pot.customerId),
  }
  if (!customer) return cleared
  const { accuracy } = scoreBowl(customer.order, pot.bowl)
  if (accuracy < REFUSE_BELOW_ACCURACY) {
    const refused = withRating(withStat(cleared, 'refused', 1), RATING_DELTA.refuse)
    return addToast(refused, '"이거 제가 시킨 거 아닌데요?" 결제 거부 😡', 'bad')
  }
  const patienceRatio = clamp(customer.patience / customer.maxPatience, 0, 1)
  const checkoutBowl = toCheckoutBowl(pot.bowl)
  const correctPrice = checkoutBowlPrice(checkoutBowl)
  const basePrice = checkoutBasePrice(checkoutBowl)
  const priceMood = clamp(PRICE.base / s.pricePer100g, 0.5, 1.2)
  const tip = round100(correctPrice * MAX_TIP_RATIO * accuracy * patienceRatio * priceMood)
  const ratingDelta = (accuracy - RATING_DELTA.servePivot) * RATING_DELTA.serveScale +
    (patienceRatio > FAST_SERVICE_RATIO ? RATING_DELTA.fastBonus : 0)
  const pendingCheckout = {
    customerId: customer.id, face: customer.face, bowl: checkoutBowl,
    weight: checkoutBowlWeight(checkoutBowl), basePrice, correctPrice,
    charged: basePrice, // register prints the weight price; the owner adds meat/skewers/cilantro
    tip, accuracy, ratingDelta,
  }
  return { ...withStat(cleared, 'served', 1), pendingCheckout }
}

/** Changes the amount the owner is about to charge (never below 0). */
export function adjustCharge(s, delta) {
  if (!s.pendingCheckout) return s
  const charged = Math.max(0, s.pendingCheckout.charged + delta)
  return { ...s, pendingCheckout: { ...s.pendingCheckout, charged } }
}

/** Resets the punched-in amount back to the printed weight price. */
export const resetCharge = (s) =>
  (s.pendingCheckout ? { ...s, pendingCheckout: { ...s.pendingCheckout, charged: s.pendingCheckout.basePrice } } : s)

// Stat updates per checkout outcome; story-004 turns these into complaints / rating at settlement.
const OUTCOME_STATS = {
  exact: (s) => withStat(s, 'exactCharges', 1),
  overcharge: (s, diff) => withStat(withStat(s, 'overcharge', diff), 'overchargeCount', 1),
  undercharge: (s, diff) => withStat(s, 'undercharge', diff),
}

/** Owner confirms the charge: pays charged + tip and records exact / over / under. */
export function confirmCharge(s) {
  const pc = s.pendingCheckout
  if (!pc) return s
  const { type, difference } = checkoutOutcome(pc.correctPrice, pc.charged)
  const recorded = OUTCOME_STATS[type](s, difference)
  const counted = withStat(withStat(recorded, 'revenue', pc.charged), 'tips', pc.tip)
  const paid = withRating({ ...counted, money: s.money + pc.charged + pc.tip, pendingCheckout: null }, pc.ratingDelta)
  const mood = pc.accuracy >= 0.95 ? '완벽해요! 😍' : pc.accuracy >= 0.7 ? '맛있어요 😋' : '음… 그럭저럭 😐'
  const tipText = pc.tip > 0 ? ` + 팁 ${pc.tip.toLocaleString()}원` : ''
  return addToast(paid, `${mood} ${pc.charged.toLocaleString()}원${tipText}`, pc.accuracy >= 0.7 ? 'good' : 'info')
}

// ---------- shop actions ----------

function spend(s, cost, apply, successText) {
  if (s.money < cost) return addToast(s, '돈이 부족해요 💸', 'bad')
  return addToast(apply({ ...s, money: s.money - cost }), successText, 'good')
}

export function buyPack(s, id) {
  const ing = INGREDIENT_BY_ID[id]
  if (!ing || !s.unlocked.includes(id)) return s
  return spend(s, ing.packCost, (n) => ({ ...n, stock: { ...n.stock, [id]: n.stock[id] + PACK_SIZE } }),
    `${ing.name} ${PACK_SIZE}개 구매`)
}

export function unlockIngredient(s, id) {
  const ing = INGREDIENT_BY_ID[id]
  if (!ing || s.unlocked.includes(id)) return s
  return spend(s, ing.unlockCost,
    (n) => ({ ...n, unlocked: [...n.unlocked, id], stock: { ...n.stock, [id]: n.stock[id] + PACK_SIZE } }),
    `신메뉴 ${ing.name} 해금! (첫 ${PACK_SIZE}개 무료)`)
}

export function buyUpgrade(s, id) {
  const cost = upgradeCost(s, id)
  if (cost === null) return addToast(s, '이미 최대 레벨이에요', 'info')
  return spend(s, cost, (n) => ({ ...n, upgrades: { ...n.upgrades, [id]: n.upgrades[id] + 1 } }),
    `${UPGRADE_BY_ID[id].name} 완료!`)
}

export const setPrice = (s, price) => ({
  ...s,
  pricePer100g: clamp(Math.round(price / PRICE.step) * PRICE.step, PRICE.min, PRICE.max),
})

// ---------- checkout pricing (story-001) ----------
// checkoutBowl shape: { weighed: { ingredientId: qty }, mode: 'maratang'|'shanguo',
//                       beef: portions, lamb: portions, skewers: { skewerItemId: count }, cilantro: bool }

const MEAT_IDS = new Set(['beef', 'lamb'])

/** Meat portions in a checkout bowl; a legacy boolean `true` counts as one portion. */
export const meatPortions = (value) => Math.max(0, Number(value) || 0)

/**
 * Maps today's scoop bowl ({ items, spice }) onto the checkout shape.
 * Meat scoops become portion counts (each portion is charged); mode, skewers and
 * cilantro stay default until story-002 (order mode) and story-003 (skewers) supply them.
 */
export function toCheckoutBowl(bowl, mode = 'maratang') {
  const weighed = Object.fromEntries(Object.entries(bowl.items).filter(([id, q]) => !MEAT_IDS.has(id) && q > 0))
  return {
    weighed, mode,
    beef: meatPortions(bowl.items.beef),
    lamb: meatPortions(bowl.items.lamb),
    skewers: {}, cilantro: false,
  }
}

/** Sum of weighed-ingredient grams only — meat and skewers never count toward weight. */
export const checkoutBowlWeight = (bowl) =>
  Object.entries(bowl.weighed)
    .filter(([id]) => !MEAT_IDS.has(id))
    .reduce((sum, [id, qty]) => sum + INGREDIENT_BY_ID[id].grams * qty, 0)

/**
 * Weight-only price (what the register prints on its own): weighed grams × mode rate, rounded to 100.
 * `rates` defaults to the fixed register rate (classic flow); self-serve passes its own adjustable
 * per-mode prices (story-001: menu-prices) so the register always charges against the same numbers
 * shown in its shop.
 */
export const checkoutBasePrice = (bowl, rates = CHECKOUT_PRICE.ratePer100g) =>
  round100((checkoutBowlWeight(bowl) / 100) * rates[bowl.mode])

/** Full checkout price: weight price plus per-portion meat, per-skewer and cilantro surcharges. */
export function checkoutBowlPrice(bowl, rates = CHECKOUT_PRICE.ratePer100g) {
  const base = checkoutBasePrice(bowl, rates)
  const meat = meatPortions(bowl.beef) * CHECKOUT_PRICE.beefSurcharge +
    meatPortions(bowl.lamb) * CHECKOUT_PRICE.lambSurcharge
  const skewerCount = Object.values(bowl.skewers).reduce((a, b) => a + b, 0)
  const cilantro = bowl.cilantro ? CHECKOUT_PRICE.cilantroSurcharge : 0
  return base + meat + skewerCount * CHECKOUT_PRICE.skewerPrice + cilantro
}

/** Compares a charged amount to the correct price: exact / overcharge / undercharge outcome. */
export function checkoutOutcome(correctPrice, chargedAmount) {
  if (chargedAmount === correctPrice) return { type: 'exact', difference: 0 }
  if (chargedAmount > correctPrice) return { type: 'overcharge', difference: chargedAmount - correctPrice }
  return { type: 'undercharge', difference: correctPrice - chargedAmount }
}
