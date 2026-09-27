// Self-serve flow variant: pure game rules, every action takes a state and returns a new one.
// Flow: self-serve → counter (dig, ticket, prepay) → rail → pot → table, plus shelf restocking.
// design/quick-specs/self-serve-restock-flow-2026-09-24.md
//
// Lives beside the original flow (../logic.js) so both can be played and compared.
// Pricing, shop and timing helpers are shared by import — never duplicated or modified here.
import {
  CHECKOUT_PRICE, CUSTOMER_FACES, MAX_RATING, MAX_TIP_RATIO, ORDER, PACK_SIZE,
  SPAWN, SPICE_LEVELS, START_RATING,
} from '../data.js'
import {
  addToast, checkoutBasePrice, checkoutBowlPrice, checkoutBowlWeight, checkoutOutcome, clamp, cookTime, freePotIndex, isClosing,
  maxPatience as sharedMaxPatience, openShop, round100, toCheckoutBowl, unlockIngredient as unlockSharedIngredient,
} from '../logic.js'
import {
  CILANTRO_CHANCE, DAY_LINE_SEC, INTERIOR_EFFECT, INTERIOR_STAGES, DIG_BUSY_SEC, NAME_MAX_LEN, EXTRA_IDS, FEEDBACK_TOAST_SEC, MENU_PRICE, MODE_LABEL, WILT_FLASH_SEC, MAX_SKEWERS, MIN_BOWL_ITEMS, QUEUE_MAX, RATING_DELTA, REGULAR_FROM_CUSTOMER,
  PART1_LAST_DAY, PREMIUM_INSTALMENT, PREMIUM_TOTAL, RENT, SELF_SKEWER_ITEMS, SELF_START_MONEY, SPAWN_PER_DAY, RESTOCK_BUSY_SEC, SELF_UPGRADES, SELF_UPGRADE_BY_ID, SHANGUO_CHANCE, SIDE_BY_ID, SIDE_CHANCE, SIDE_GIFT, SIDE_ITEMS, SHELF_EXTRAS, SHELF_ITEM_BY_ID, SKEWER_CHANCE, START_WAREHOUSE_STOCK,
  VARIANT_INGREDIENTS, VARIANT_INGREDIENT_BY_ID, priceOf, sideStockId, weekdayOf,
} from './data.js'
import { ageShelf, closeShelf, fillBowl, openShelf, restockShelf, takeFromShelf } from './shelf.js'
import { DEFAULT_CHARACTER, sanitizeName, withCharacterOption } from './character.js'
import {
  CREATE_AT_SCENE, ENDING_LINE_COUNT, OPENING_SCENES, PART2_TEASER_LINE_COUNT, REGULARS, SUNDAY_LAST_STEP, dayStartLine, dayStartSpeaker,
  regularVisits,
} from './story.js'

// Shared, flow-independent actions re-exported so the variant UI imports from one place.
// `setPrice`/`demandFactor` are NOT re-exported: this variant has its own mode-aware versions
// below (story-001: menu-prices) so shop price adjustments actually drive the register.
export {
  addToast, checkoutBowlWeight, cookTime, fadeToasts, isClosing, openShop,
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
  const starters = VARIANT_INGREDIENTS.filter((i) => i.unlockCost === 0).map((i) => i.id)
  return {
    phase: 'menu',
    day: 1,
    money: SELF_START_MONEY,
    rating: START_RATING,
    prices: { maratang: CHECKOUT_PRICE.ratePer100g.maratang, shanguo: CHECKOUT_PRICE.ratePer100g.shanguo },
    stock: {
      ...Object.fromEntries(VARIANT_INGREDIENTS.map((i) => [i.id, starters.includes(i.id) ? START_WAREHOUSE_STOCK : 0])),
      ...Object.fromEntries(SHELF_EXTRAS.map((i) => [i.id, i.startStock])),
      ...Object.fromEntries(SIDE_ITEMS.map((i) => [sideStockId(i.id), 0])),
    },
    unlocked: starters,
    upgrades: Object.fromEntries(SELF_UPGRADES.map((u) => [u.id, u.start])),
    interior: 0, // interior stages bought, 0–6 (INTERIOR_STAGES)
    sideGifts: [], // side ids added in the shop (each came with the panda's gift box) — the open side menu
    rentOverdue: 0, // 1 after a missed Sunday payment — this week owes double, another miss closes the shop
    weekRevenue: 0, // this week's net so far (revenue+tips−refunds), accumulated at each day's close
    ledger: null, // { weekRevenue, rentDue, rentPaid, premiumDue?, premiumPaid?, premiumSettled? } on the 'sunday' screen
    premiumLeft: PREMIUM_TOTAL, // 권리금 still owed to the panda (economy E004)
    premiumCarry: 0, // instalments missed so far — added to the next Sunday's, never a reason to close
    endingSeen: false, // the day-28 part-1 ending has played
    premiumPaidInFull: false, // …and 권리금 was fully paid by then (false = forgiven)
    part2TeaserSeen: false, // the day-29 part-2 teaser has played (story N003)
    closedReason: null, // 'rent' | 'rating' — which failure closed the shop (phase 'closed')
    toasts: [],
    nextToastId: 1,
    character: DEFAULT_CHARACTER,
    story: null, // { scene, line } while the opening cutscene plays
    ...emptyDay(SELF_UPGRADE_BY_ID.pots.start, SELF_UPGRADE_BY_ID.seats.start),
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
    wiltedAt: {}, // shelf id → dayTime of its last wilt (drives the slot flash)
    ownerLine: null, // { text, who, until } — the start-of-day line and who says it ('panda' | 'me')
    regularsDue: [], // regulars still to come today, in order (story N002)
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

/** Counter label for a dug-out item, always in charge units: "새우 꼬지 ×2", "소고기 ×2". */
export const hiddenItemLabel = (item) => `${SHELF_ITEM_BY_ID[item.id].name} ×${item.count}`

/**
 * Register numbers for the front customer: POS base (ticket mode), charged, and the correct
 * price (real mode). Both prices come from the shop-adjustable `s.prices` (story-001:
 * menu-prices) so the receipt and the correct-price check always agree on the same rate.
 */
export function counterPrice(s) {
  const c = frontCustomer(s)
  if (!c) return { base: 0, charged: 0, correct: 0 }
  const base = checkoutBasePrice({ ...c.bowl, mode: s.counter.mode }, s.prices)
  return { base, charged: Math.max(0, base + s.counter.extra), correct: checkoutBowlPrice(c.bowl, s.prices) + sidePrice(c) }
}

/** Sets a menu price (100g rate for one mode), clamped and rounded to MENU_PRICE's bounds/step. */
export function setMenuPrice(s, mode, price) {
  if (!MENU_PRICE[mode]) return s
  const { min, max } = MENU_PRICE[mode]
  const clamped = clamp(Math.round(price / MENU_PRICE.step) * MENU_PRICE.step, min, max)
  return { ...s, prices: { ...s.prices, [mode]: clamped } }
}

/**
 * This variant's own demand curve (the shared `demandFactor` takes one price; here there are
 * two). Each mode's factor mirrors the shared formula against its own default rate, then the two
 * are combined weighted by how often each mode is ordered (SHANGUO_CHANCE).
 */
export function demandFactor(s) {
  const modeFactor = (mode) =>
    clamp((CHECKOUT_PRICE.ratePer100g[mode] / s.prices[mode]) ** 1.5, SPAWN.demandMin, SPAWN.demandMax)
  const combined = modeFactor('maratang') * (1 - SHANGUO_CHANCE) + modeFactor('shanguo') * SHANGUO_CHANCE
  return clamp(combined, SPAWN.demandMin, SPAWN.demandMax)
}

/** True once interior stage `n` (1 = 벽지 … 6 = 주방) is bought. */
export const hasInterior = (s, n) => (s.interior ?? 0) >= n
const interiorFactor = (s, n, factor) => (hasInterior(s, n) ? factor : 1)

/** Mirrors ../logic.js's spawnInterval against this variant's two-mode demand (+ the 문·포토존 stage). */
function spawnInterval(s) {
  return Math.max(
    SPAWN.minIntervalSec,
    SPAWN.baseIntervalSec - (s.day - 1) * SPAWN_PER_DAY - s.rating * SPAWN.perRating,
  ) / (demandFactor(s) * interiorFactor(s, 4, INTERIOR_EFFECT.visits))
}

// ---------- side menu (production/epics/side-menu/story-001) ----------

/** Sides the player has added in the shop (`sideGifts` = added ids; each came with its gift box). */
export const openSides = (s) => SIDE_ITEMS.filter((i) => (s.sideGifts ?? []).includes(i.id))
/** True when the shop can add this side now: from the night before its first business day, once. */
export const canOpenSide = (s, side) => s.day + 1 >= side.unlockDay && !(s.sideGifts ?? []).includes(side.id)
/** True once a cooked side is on the menu: the wok stands in the kitchen. */
export const hasWok = (s) => openSides(s).some((i) => i.cooked)
/** Price the register must add for a customer's side (0 without one). */
export const sidePrice = (c) => (c?.side ? SIDE_BY_ID[c.side].price : 0)

/** 메뉴 추가 in the shop (playtest 2026-09-27 #2): pays openCost, adds the side and the panda's gift box. */
export function openSide(s, id) {
  const side = SIDE_BY_ID[id]
  if (!side || (s.sideGifts ?? []).includes(id)) return s
  if (!canOpenSide(s, side)) return addToast(s, `${side.name}는 ${side.unlockDay - 1}일차 상점부터 추가할 수 있어요`, 'info')
  if (s.money < side.openCost) return addToast(s, '돈이 부족해요 💸', 'bad')
  const key = sideStockId(id)
  return addToast({
    ...s,
    money: s.money - side.openCost,
    stock: { ...s.stock, [key]: (s.stock[key] ?? 0) + SIDE_GIFT },
    sideGifts: [...(s.sideGifts ?? []), id],
  }, `새 메뉴 ${side.emoji} ${side.name} 추가! 첫 박스 ${SIDE_GIFT}개는 판다 사장님 선물 🎁`, 'good')
}

/**
 * Maybe adds an open side to a new customer's order. No randomness is used before the first side opens,
 * so early days play exactly as before. Out of stock (counting sides already ordered in the queue) → they grumble.
 */
function withSide(s, customer, rng) {
  const open = openSides(s)
  if (open.length === 0 || rng() >= SIDE_CHANCE) return { customer, missingSide: null }
  const side = open[Math.floor(rng() * open.length)]
  const ordered = s.queue.filter((c) => c.side === side.id).length
  if ((s.stock[sideStockId(side.id)] ?? 0) - ordered <= 0) return { customer, missingSide: side }
  return { customer: { ...customer, side: side.id }, missingSide: null }
}

/** Buys a box of an open side's stock for the warehouse. */
export function buySidePack(s, id) {
  const side = SIDE_BY_ID[id]
  if (!side || !(s.sideGifts ?? []).includes(id)) return s
  if (s.money < side.packCost) return addToast(s, '돈이 부족해요 💸', 'bad')
  const key = sideStockId(id)
  return addToast({ ...s, money: s.money - side.packCost, stock: { ...s.stock, [key]: (s.stock[key] ?? 0) + PACK_SIZE } },
    `${side.name} ${PACK_SIZE}개 창고 입고`, 'good')
}

/** Customer patience: the shared day curve (without the old interior upgrade) × the 바닥 stage. */
export const maxPatience = (s) =>
  sharedMaxPatience({ ...s, upgrades: { ...s.upgrades, interior: 0 } }) * interiorFactor(s, 2, INTERIOR_EFFECT.patience)

/** True for a short moment after a shelf slot lost a batch to wilting (UI flash). */
export const isJustWilted = (s, id) =>
  s.wiltedAt?.[id] !== undefined && s.dayTime - s.wiltedAt[id] < WILT_FLASH_SEC

/** The correct price of a bowl, line by line: scale, meat, skewers, cilantro. */
export function chargeBreakdown(bowl, prices, side = null) {
  const skewers = sum(Object.values(bowl.skewers))
  const beef = meatCount(bowl, 'beef')
  const lamb = meatCount(bowl, 'lamb')
  return [
    { label: `저울 ${MODE_LABEL[bowl.mode]} ${checkoutBowlWeight(bowl)}g`, amount: checkoutBasePrice(bowl, prices) },
    ...(beef > 0 ? [{ label: `소고기 ×${beef}`, amount: beef * CHECKOUT_PRICE.beefSurcharge }] : []),
    ...(lamb > 0 ? [{ label: `양고기 ×${lamb}`, amount: lamb * CHECKOUT_PRICE.lambSurcharge }] : []),
    ...(skewers > 0 ? [{ label: `꼬치 ×${skewers}`, amount: skewers * CHECKOUT_PRICE.skewerPrice }] : []),
    ...(bowl.cilantro ? [{ label: '고수', amount: CHECKOUT_PRICE.cilantroSurcharge }] : []),
    ...(side ? [{ label: SIDE_BY_ID[side].name, amount: SIDE_BY_ID[side].price }] : []),
  ]
}

/**
 * Why the register total is off for the front customer: 'mode' (ticket mode ≠ what they asked),
 * 'undug' (buried items never found), 'extras' (surcharges punched wrong), or null when exact.
 */
export function chargeMistake(s) {
  const c = frontCustomer(s)
  if (!c) return null
  const { charged, correct } = counterPrice(s)
  if (charged === correct) return null
  if (s.counter.mode !== c.mode) return 'mode'
  if (s.counter.revealed < hiddenItems(c.bowl).length) return 'undug'
  return 'extras'
}

const MISTAKE_TEXT = {
  mode: (c) => `주문표 조리 방식이 달라요 (손님은 ${MODE_LABEL[c.mode]})`,
  undug: () => '숨은 재료를 다 못 찾았어요 — 뒤적이기!',
  extras: () => '추가금 계산이 달라요',
}

/** Register result line shown right after prepay: praise, or how much was off and why. */
function chargeFeedback(c, type, difference, mistake, correct, ticketNo, prices) {
  if (type === 'exact') return `🎫 ${ticketNo}번 ${correct.toLocaleString()}원 — 딱 맞게 받았어요 👍`
  const breakdown = chargeBreakdown(c.bowl, prices, c.side).map((l) => `${l.label} ${l.amount.toLocaleString()}`).join(' + ')
  const head = type === 'undercharge'
    ? `💸 ${difference.toLocaleString()}원 덜 받았어요`
    : `😠 ${difference.toLocaleString()}원 더 받았어요 — 손님 컴플레인!`
  return `${head} · ${MISTAKE_TEXT[mistake](c)} (정답 ${correct.toLocaleString()}원 = ${breakdown})`
}

/** Makes the most recent toast stay up for `sec` seconds. */
const lingerLastToast = (s, sec) => ({ ...s, toasts: s.toasts.map((t, i, all) => (i === all.length - 1 ? { ...t, ttl: sec } : t)) })

// ---------- helpers ----------

const withRating = (s, delta) => ({ ...s, rating: clamp(s.rating + delta, 0, MAX_RATING) })
const withStat = (s, key, add) => ({ ...s, stats: { ...s.stats, [key]: (s.stats[key] ?? 0) + add } })
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
  const ownerLine = { text: dayStartLine(s.day), who: dayStartSpeaker(s.day), until: DAY_LINE_SEC }
  const rating = hasInterior(s, 1) ? clamp(s.rating + INTERIOR_EFFECT.morningRating, 0, MAX_RATING) : s.rating
  const regularsDue = regularVisits(s.day).map((v) => v.who)
  return { ...s, phase: 'day', story: null, rating, ...day, ownerLine, regularsDue, ...openShelf(s.stock, shelfIds(s)) }
}

/** The owner's start-of-day line while it is still showing, else null. */
export const ownerLineText = (s) => (s.ownerLine && s.dayTime < s.ownerLine.until ? s.ownerLine.text : null)

/**
 * The regular at the front of the counter queue and their line for today (story N002), else null.
 * @returns {{ who: string, text: string } | null}
 */
export function frontRegular(s) {
  const c = frontCustomer(s)
  if (!c?.regular) return null
  return regularVisits(s.day).find((v) => v.who === c.regular) ?? null
}

/** Who is talking in the owner's row: the line's speaker while it shows, else the protagonist. */
export const ownerLineWho = (s) => (ownerLineText(s) ? s.ownerLine.who ?? 'me' : 'me')

// ---------- protagonist & opening story (design/quick-specs/story-character-2026-09-25.md) ----------

const AT_CREATION = { scene: CREATE_AT_SCENE, line: 0 }
const toCreation = (s) => ({ ...s, phase: 'create', story: AT_CREATION })

/** New game begins with the opening prologue, played by the default protagonist. */
export const beginNewGame = () => ({ ...createNewGame(), phase: 'opening', story: { scene: 0, line: 0 } })

/** Changes one appearance option (hair / hairColor / apron) while creating the character. */
export const setCharacterOption = (s, key, value) =>
  (s.phase === 'create' ? { ...s, character: withCharacterOption(s.character, key, value) } : s)

/** Updates the name as typed (capped; trimmed and defaulted when creation finishes). */
export const setCharacterName = (s, raw) =>
  (s.phase === 'create' ? { ...s, character: { ...s.character, name: [...String(raw ?? '')].slice(0, NAME_MAX_LEN).join('') } } : s)

/** Confirms the character and resumes the opening at the scene where she opens her shop. */
export const finishCharacter = (s) =>
  (s.phase === 'create'
    ? { ...s, phase: 'opening', story: AT_CREATION, character: { ...s.character, name: sanitizeName(s.character.name) } }
    : s)

/** Next line of the opening; creation interrupts before CREATE_AT_SCENE, and after the last line day 1 opens. */
export function advanceStory(s) {
  if (s.phase !== 'opening' || !s.story) return s
  const { scene, line } = s.story
  if (line + 1 < OPENING_SCENES[scene].lines.length) return { ...s, story: { scene, line: line + 1 } }
  if (scene + 1 === CREATE_AT_SCENE) return toCreation(s)
  if (scene + 1 < OPENING_SCENES.length) return { ...s, story: { scene: scene + 1, line: 0 } }
  return startDay(s)
}

/** Skips ahead: from the prologue to character creation (never skipped), after it straight into day 1. */
export function skipStory(s) {
  if (s.phase !== 'opening' || !s.story) return s
  return s.story.scene < CREATE_AT_SCENE ? toCreation(s) : startDay(s)
}

/**
 * Opens the next business day — except the first morning after the part-1 ending, when the part-2 teaser
 * (story N003) plays first. The teaser keeps day 28's number (day 29 opens when it ends) and marks itself seen
 * on entry, so a save made then never replays it.
 */
export const startNextDay = (s) =>
  (isPart2TeaserDue(s) ? { ...s, phase: 'teaser', teaserStep: 0, part2TeaserSeen: true } : startDay({ ...s, day: s.day + 1 }))

const isPart2TeaserDue = (s) => s.endingSeen && !s.part2TeaserSeen && s.day >= PART1_LAST_DAY

// ---------- part-2 teaser (story N003) ----------

/** Next beat of the teaser; stays on the last one (leaving is finishTeaser's job). */
export const advanceTeaser = (s) =>
  (s.phase === 'teaser' ? { ...s, teaserStep: Math.min((s.teaserStep ?? 0) + 1, PART2_TEASER_LINE_COUNT - 1) } : s)

/** True on the teaser's last beat, where a click opens day 29. */
export const isTeaserDone = (s) => (s.teaserStep ?? 0) >= PART2_TEASER_LINE_COUNT - 1

/** Leaves the teaser into the next day's business, same loop as before (part 2 content comes later). */
export const finishTeaser = (s) => (s.phase === 'teaser' ? startDay({ ...s, day: s.day + 1, teaserStep: 0 }) : s)

// ---------- weekly rent + Sunday off day (economy story E003) ----------

/**
 * Settles the week's rent and enters the 'sunday' screen. On a second miss running the ledger is marked
 * bankrupt, and leaving the scene (afterSummary) closes the shop instead of opening it.
 * The whole week's arithmetic resolves in this one pure step; the ledger screen just displays it, stamp by
 * stamp. `s.day` must already be the Sunday's own day number.
 */
export function enterSunday(s) {
  const due = RENT * (s.rentOverdue ? 2 : 1)
  const rentPaid = s.money >= due
  const bankrupt = !rentPaid && s.rentOverdue === 1
  const afterRent = {
    ...s,
    money: rentPaid ? s.money - due : s.money,
    rentOverdue: bankrupt ? s.rentOverdue : (rentPaid ? 0 : 1),
  }
  // A second miss still plays the Sunday scene (its ledger stamps 폐업); leaving it closes the shop.
  const { state, premium } = settlePremium(afterRent, rentPaid)
  return {
    ...state,
    phase: 'sunday',
    ledger: { weekRevenue: s.weekRevenue ?? 0, rentDue: due, rentPaid, bankrupt, ...premium },
    weekRevenue: 0,
    sundayStep: 0, // which beat of the Sunday scene is showing (story.js sundayLine)
  }
}

// ---------- 권리금 4주 분할 (economy E004, design/quick-specs/part1-28-days-2026-09-27.md §A) ----------

/**
 * The Sunday's 권리금 row, taken after rent. Rent comes first: when rent was short, all the money stays owed
 * to the landlord and the whole instalment carries over. A short instalment pays what it can and carries the
 * rest to next Sunday — 권리금 never closes the shop. Day 28 takes everything left (the ending forgives any
 * remainder). After part 1 there is no row at all.
 */
function settlePremium(s, rentPaid) {
  if (s.endingSeen || s.day > PART1_LAST_DAY) return { state: s, premium: {} }
  if (s.premiumLeft <= 0) return { state: s, premium: { premiumDue: 0, premiumPaid: 0, premiumSettled: true } }
  const isLastWeek = s.day >= PART1_LAST_DAY
  const premiumDue = premiumDueOn(s, s.day)
  const premiumPaid = rentPaid ? Math.min(premiumDue, s.money) : 0
  return {
    state: {
      ...s,
      money: s.money - premiumPaid,
      premiumLeft: s.premiumLeft - premiumPaid,
      premiumCarry: isLastWeek ? 0 : premiumDue - premiumPaid,
    },
    premium: { premiumDue, premiumPaid },
  }
}

/** 권리금 the Sunday `sunday` will ask for (day 28 takes the whole rest), or null when there is no row to pay. */
function premiumDueOn(s, sunday) {
  if (s.endingSeen || sunday > PART1_LAST_DAY || s.premiumLeft <= 0) return null
  return sunday >= PART1_LAST_DAY ? s.premiumLeft : Math.min(s.premiumLeft, PREMIUM_INSTALMENT + s.premiumCarry)
}

/**
 * The shop's 📒 장부 (playtest 2026-09-27 #7): what the coming Sunday will take, from the shop after `s.day`.
 * @returns {{ sunday: number, daysLeft: number, rent: number, rentOverdue: boolean, premium: number|null,
 *   premiumLeft: number, money: number, shortfall: number }} premium null = no 권리금 row that Sunday
 */
export function upcomingSunday(s) {
  const sunday = (Math.floor(s.day / 7) + 1) * 7
  const rent = RENT * (s.rentOverdue ? 2 : 1)
  const premium = premiumDueOn(s, sunday)
  return {
    sunday,
    daysLeft: sunday - s.day,
    rent,
    rentOverdue: Boolean(s.rentOverdue),
    premium,
    premiumLeft: s.endingSeen ? 0 : Math.max(0, s.premiumLeft ?? 0),
    money: s.money,
    shortfall: Math.max(0, rent + (premium ?? 0) - s.money),
  }
}

/**
 * "더 갚기" on the Sunday ledger: pays `amount` (or 'all') toward 권리금, capped by money and the balance.
 * Clears carried-over arrears first. Only on the Sunday screen during part 1.
 */
export function payPremium(s, amount) {
  if (s.phase !== 'sunday' || s.endingSeen || s.premiumLeft <= 0) return s
  const want = amount === 'all' ? Infinity : Math.max(0, Number(amount) || 0)
  const paid = Math.min(want, s.money, s.premiumLeft)
  if (paid <= 0) return s
  return {
    ...s,
    money: s.money - paid,
    premiumLeft: s.premiumLeft - paid,
    premiumCarry: Math.max(0, s.premiumCarry - paid),
  }
}

/**
 * Day 28's ledger closes part 1: the panda walks in. Whatever 권리금 is left is forgiven (the scene runs the
 * same either way; story.js endingLine picks the branch).
 */
function enterEnding(s) {
  return {
    ...s,
    phase: 'ending',
    endingStep: 0,
    endingSeen: true,
    premiumPaidInFull: s.premiumLeft <= 0,
    premiumLeft: 0,
    premiumCarry: 0,
  }
}

/** Next beat of the ending scene; stays on the last one (leaving is afterSummary's job). */
export const advanceEnding = (s) =>
  (s.phase === 'ending' ? { ...s, endingStep: Math.min((s.endingStep ?? 0) + 1, ENDING_LINE_COUNT - 1) } : s)

/** True on the ending's last beat, where a click leaves for the shop. */
export const isEndingDone = (s) => (s.endingStep ?? 0) >= ENDING_LINE_COUNT - 1

/** Next beat of the Sunday scene; stays on the last one (leaving is afterSummary's job). */
export const advanceSunday = (s) =>
  (s.phase === 'sunday' ? { ...s, sundayStep: Math.min((s.sundayStep ?? 0) + 1, SUNDAY_LAST_STEP) } : s)

/** True on the Sunday scene's last beat, where a click leaves for the shop. */
export const isSundayDone = (s) => (s.sundayStep ?? 0) >= SUNDAY_LAST_STEP

/**
 * From a day's summary to the shop — unless the day just finished was Saturday, in which case the week's
 * Sunday settlement comes first. Also the way out of the 'sunday' screen itself: called again from there
 * (day is already Sunday's own number, so it just falls through to the shop).
 */
export function afterSummary(s) {
  if (s.phase === 'sunday' && s.ledger?.bankrupt) return { ...s, phase: 'closed', closedReason: 'rent' }
  if (s.phase === 'sunday' && s.day === PART1_LAST_DAY && !s.endingSeen) return enterEnding(s)
  if (s.phase === 'ending') return openShop(s)
  return weekdayOf(s.day) === 6 ? enterSunday({ ...s, day: s.day + 1 }) : openShop(s)
}

/** Resumes a save into the shop, unless it was made mid-'sunday' (that phase is saved as-is; see save.js). */
export const resumeShop = (s) => (s.phase === 'sunday' ? s : openShop(s))

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
    () => SELF_SKEWER_ITEMS[randInt(rng, 0, SELF_SKEWER_ITEMS.length - 1)].id)
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
  // a regular due today takes this customer's place (same wish, bowl and order — only the face and a line differ)
  const regular = id >= REGULAR_FROM_CUSTOMER ? (s.regularsDue ?? [])[0] ?? null : null
  const customer = {
    id,
    face: regular ? REGULARS[regular].face : CUSTOMER_FACES[randInt(rng, 0, CUSTOMER_FACES.length - 1)],
    ...(regular ? { regular } : {}),
    mode,
    spice: randInt(rng, 0, SPICE_LEVELS.length - 1),
    missing,
    bowl: { ...toCheckoutBowl({ items: filled.items }, mode), skewers: skewered.skewers, cilantro: topped.cilantro },
    patience,
    maxPatience: patience,
  }
  const { customer: ordering, missingSide } = withSide(s, customer, rng)
  const regularsDue = regular ? s.regularsDue.slice(1) : s.regularsDue
  const queued = syncCounter({ ...next, shelf: topped.shelf, queue: [...s.queue, ordering], regularsDue })
  const names = [...missing.map((m) => SHELF_ITEM_BY_ID[m].name), ...(missingSide ? [missingSide.name] : [])]
  if (names.length === 0) return queued
  return addToast(withRating(queued, RATING_DELTA.grumble * names.length), `"${names.join(', ')} 없네…" 😕`, 'bad')
}

function advanceSpawn(s, dt, rng) {
  if (isClosing(s)) return s
  const timer = s.spawnTimer - dt
  if (timer > 0) return { ...s, spawnTimer: timer }
  if (s.queue.length >= QUEUE_MAX) return { ...s, spawnTimer: FULL_QUEUE_RETRY_SEC }
  return { ...spawnCustomer(s, rng), spawnTimer: spawnInterval(s) }
}

function wiltShelf(s, dt) {
  const { shelf, wilted } = ageShelf(s.shelf, dt * interiorFactor(s, 6, INTERIOR_EFFECT.wilt))
  const entries = Object.entries(wilted)
  if (entries.length === 0) return { ...s, shelf }
  const count = sum(entries.map(([, q]) => q))
  const cost = Math.round(sum(entries.map(([id, q]) => (q * SHELF_ITEM_BY_ID[id].packCost) / PACK_SIZE)))
  const names = entries.map(([id, q]) => `${SHELF_ITEM_BY_ID[id].name} ${q}개`).join(', ')
  const wiltedAt = { ...s.wiltedAt, ...Object.fromEntries(entries.map(([id]) => [id, s.dayTime])) }
  const wasted = withStat(withStat({ ...s, shelf, wiltedAt }, 'wasted', count), 'wasteCost', cost)
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
  // Reputation hitting 0 closes the shop outright (economy E003), same screen as two missed rents.
  if (next.rating <= 0) return { ...next, phase: 'closed', closedReason: 'rating' }
  if (!isClosing(next) || !isEveryoneGone(next)) return next
  const net = next.stats.revenue + next.stats.tips - next.stats.refunds
  return {
    ...next, phase: 'summary', stock: closeShelf(next.stock, next.shelf), shelf: {}, heldPot: null,
    weekRevenue: (s.weekRevenue ?? 0) + net,
  }
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

/** Price of the next level of a shop upgrade, or null at max level. */
export function upgradeCost(s, id) {
  const u = SELF_UPGRADE_BY_ID[id]
  if (!u) return null
  const multiple = u.multiples[s.upgrades[id] - u.start]
  return multiple === undefined ? null : priceOf(multiple)
}

/** Buys the next level of a shop upgrade (pots, fire, seats). */
export function buyUpgrade(s, id) {
  const cost = upgradeCost(s, id)
  if (cost === null) return addToast(s, '이미 최대 레벨이에요', 'info')
  if (s.money < cost) return addToast(s, '돈이 부족해요 💸', 'bad')
  const bought = { ...s, money: s.money - cost, upgrades: { ...s.upgrades, [id]: s.upgrades[id] + 1 } }
  return addToast(bought, `${SELF_UPGRADE_BY_ID[id].name} 완료!`, 'good')
}

/** The next interior stage to buy with its price and whether it is open yet; null once all 6 are done. */
export function nextInterior(s) {
  const stage = INTERIOR_STAGES[s.interior ?? 0]
  if (!stage) return null
  return { ...stage, number: (s.interior ?? 0) + 1, cost: priceOf(stage.multiple), isOpen: s.day >= stage.unlockDay }
}

/** Buys the next interior stage: in order, from its unlock day, if the money is there. */
export function buyInterior(s) {
  const next = nextInterior(s)
  if (!next) return addToast(s, '인테리어를 모두 마쳤어요 🎀', 'info')
  if (!next.isOpen) return addToast(s, `${next.name}는 ${next.unlockDay}일차에 열려요`, 'info')
  if (s.money < next.cost) return addToast(s, '돈이 부족해요 💸', 'bad')
  return addToast({ ...s, money: s.money - next.cost, interior: next.number }, `인테리어 ${next.name} 완료! ${next.emoji}`, 'good')
}

/** Unlocks a new ingredient; ingredients this variant does not sell (weighed shrimp) are refused. */
export const unlockIngredient = (s, id) => (VARIANT_INGREDIENT_BY_ID[id] ? unlockSharedIngredient(s, id) : s)

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
    const mistake = chargeMistake(free)
    const ticketNo = free.nextTicketNo
    const patience = maxPatience(free)
    const table = {
      customerId: c.id, face: c.face, ticketNo, mode: c.mode, spice: c.spice,
      paid: charged, correctPrice: correct, patience, maxPatience: patience, side: c.side ?? null,
    }
    const order = { ticketNo, face: c.face, bowl: c.bowl, mode: free.counter.mode, spice: free.counter.spice, side: c.side ?? null }
    // the side leaves the warehouse when it is paid for (a drink is handed over right here)
    const sideKey = c.side ? sideStockId(c.side) : null
    const stocked = sideKey ? { ...free, stock: { ...free.stock, [sideKey]: Math.max(0, free.stock[sideKey] - 1) } } : free
    const recorded = withStat(OUTCOME_STATS[type](stocked, difference), 'revenue', charged)
    const rated = type === 'overcharge' ? withRating(recorded, RATING_DELTA.overcharge) : recorded
    const seated = syncCounter({
      ...rated,
      money: free.money + charged,
      queue: free.queue.slice(1),
      tables: free.tables.map((t, i) => (i === tableIdx ? table : t)),
      rail: [...free.rail, order],
      nextTicketNo: ticketNo + 1,
    })
    const text = chargeFeedback(c, type, difference, mistake, correct, ticketNo, free.prices)
    return lingerLastToast(addToast(seated, text, type === 'exact' ? 'good' : 'bad'), FEEDBACK_TOAST_SEC)
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

/** Puts the longest-waiting ticket on the rail into a free pot (keyboard shortcut for the rail). */
export function cookNext(s) {
  if (s.phase !== 'day') return s
  const oldest = s.rail[0]
  return oldest ? startCooking(s, oldest.ticketNo) : addToast(s, '대기 중인 주문표가 없어요', 'bad')
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
    const tip = isRight ? round100(table.correctPrice * MAX_TIP_RATIO * patienceRatio * interiorFactor(free, 3, INTERIOR_EFFECT.tip)) : 0
    const ratingDelta = isRight
      ? (RATING_DELTA.serveGood + (patienceRatio > FAST_SERVICE_RATIO ? RATING_DELTA.fastBonus : 0)) *
        interiorFactor(free, 5, INTERIOR_EFFECT.serveRating)
      : RATING_DELTA.serveWrong
    const cleared = {
      ...free,
      money: free.money + tip,
      tables: free.tables.map((t, i) => (i === tableIdx ? null : t)),
      pots: free.pots.map((p, i) => (i === free.heldPot ? null : p)),
      heldPot: null,
    }
    const withSides = table.side ? withStat(cleared, 'sides', 1) : cleared
    const served = withRating(withStat(withStat(withSides, 'served', 1), 'tips', tip), ratingDelta)
    const sideTag = table.side ? ` + ${SIDE_BY_ID[table.side].emoji}` : ''
    const text = isRight
      ? `맛있어요 😋${sideTag}${tip > 0 ? ` 팁 ${tip.toLocaleString()}원` : ''}`
      : `"${pot.order.mode !== table.mode ? '조리 방식' : '맵기'}이 달라요!" 😡`
    return addToast(served, text, isRight ? 'good' : 'bad')
  })
}
