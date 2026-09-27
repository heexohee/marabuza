// Part-1 balance run (economy story B001, design/quick-specs/part1-28-days-2026-09-27.md §E): a new game played
// by the dev bot from day 1 to the day-28 ending, at three skill tiers, over several seeds. Prints a weekly
// ledger per run and a summary per tier against the §E goals.
//
// Run: node tools/sim/part1_run.mjs [--start=10000] [--seeds=8] [--verbose]
//
// Tiers differ in register slips (autoplay.js mistake plans) and in how they spend between days:
// Each tier also has a human think time between actions (autoplay.js BOT_PACE_SEC), so a day's throughput is
// about what a person manages (~11–15 customers), not what arrives.
//   clumsy  — many slips, keeps back only the rent, decorates first, never pays extra 권리금
//   normal  — the bot's usual slips, keeps back rent + this week's instalment, then decorates
//   good    — no slips, pays 권리금 off first (keeps the whole balance back, pays it on Sundays), then decorates
// Deterministic (seeded). Observations only — the §E goals are printed next to the numbers, not judged here.
import { PACK_SIZE } from '../../src/js/data.js'
import { BASELINE_D, PREMIUM_INSTALMENT, PREMIUM_TOTAL, RENT, VARIANT_INGREDIENTS } from '../../src/js/self-serve/data.js'
import {
  afterSummary, buyInterior, buyUpgrade, createNewGame, finishTeaser, nextInterior, payPremium, startNextDay,
  unlockIngredient, upgradeCost,
} from '../../src/js/self-serve/logic.js'
import { BOT_MISTAKES, BOT_PACE_SEC, NO_MISTAKES, autoPlayDay, restockWarehouse } from '../../src/js/self-serve/autoplay.js'

/** A careless player: several undercharges a day and an overcharge or two. */
export const CLUMSY_MISTAKES = {
  undercharge: { count: [3, 5], amount: [3000, 12000], step: 1000 },
  overcharge: { count: [1, 2], amount: 3000 },
  within: 10,
}
const RESTOCK_BUFFER = Math.round(BASELINE_D / 2) // kept back for the next shop order
const MAX_BUSINESS_DAYS = 40 // guard: part 1 has 24

export const TIERS = {
  clumsy: { mistakes: CLUMSY_MISTAKES, pace: BOT_PACE_SEC.clumsy, keepPremium: false, payExtra: false },
  normal: { mistakes: BOT_MISTAKES, pace: BOT_PACE_SEC.normal, keepPremium: true, payExtra: false },
  good: { mistakes: NO_MISTAKES, pace: BOT_PACE_SEC.good, keepPremium: 'all', payExtra: true },
}

function seeded(seed) {
  let x = seed
  return () => (x = (x * 16807) % 2147483647) / 2147483647
}

/** What the coming Sunday will take, as this tier sees it, plus money for the next shop order. */
function reserveFor(s, tier) {
  const rent = RENT * (s.rentOverdue ? 2 : 1)
  const owed = s.premiumLeft > 0 && !s.endingSeen ? s.premiumLeft : 0
  // 'all' = pays 권리금 off first: the whole balance is kept back until it is gone
  const premium = tier.keepPremium === 'all' ? owed : tier.keepPremium ? Math.min(owed, PREMIUM_INSTALMENT + s.premiumCarry) : 0
  return rent + premium + RESTOCK_BUFFER
}

/** Runs `buy` only if the money left afterwards still covers `reserve`; the bought state, or null. */
function tryBuy(s, cost, reserve, buy) {
  if (cost === null || cost === undefined || s.money - cost < reserve) return null
  const next = buy(s)
  return next.money < s.money ? next : null
}

/** Between days: unlock ingredients, then interior, then seats / pots / fire, while the reserve allows. */
function shopPolicy(s, tier) {
  let cur = s
  const reserve = reserveFor(cur, tier)
  for (const ing of VARIANT_INGREDIENTS.filter((i) => i.unlockCost > 0 && !cur.unlocked.includes(i.id))) {
    cur = tryBuy(cur, ing.unlockCost, reserve, (x) => unlockIngredient(x, ing.id)) ?? cur
  }
  for (let bought = true; bought;) {
    bought = false
    const stage = nextInterior(cur)
    const steps = [
      ...(stage?.isOpen ? [[stage.cost, buyInterior]] : []),
      ...['seats', 'pots', 'fire'].map((id) => [upgradeCost(cur, id), (x) => buyUpgrade(x, id)]),
    ]
    for (const [cost, buy] of steps) {
      const next = tryBuy(cur, cost, reserve, buy)
      if (next) { cur = next; bought = true; break }
    }
  }
  return cur
}

const weekRow = (s) => ({
  day: s.day, ...s.ledger, premiumLeft: s.premiumLeft, interior: s.interior, money: s.money,
  seats: s.upgrades.seats, pots: s.upgrades.pots, rating: s.rating,
})

/**
 * One new game from day 1 to the day-28 ending (or the day the shop closed).
 * @returns {{ tierName: string, seed: number, weeks: object[], ending?: 'paid'|'forgiven', closed?: string, day?: number }}
 */
export function playPart1(tierName, seed, startMoney = createNewGame().money) {
  const tier = TIERS[tierName]
  const rng = seeded(seed)
  let s = { ...createNewGame(), phase: 'shop', money: startMoney }
  const weeks = []
  for (let d = 0; d < MAX_BUSINESS_DAYS; d++) {
    s = shopPolicy(restockWarehouse(s), tier)
    s = startNextDay(s)
    if (s.phase === 'teaser') s = finishTeaser(s)
    s = afterSummary(autoPlayDay(s, rng, tier.mistakes, tier.pace))
    if (s.phase === 'sunday') {
      if (tier.payExtra) s = payPremium(s, Math.max(0, s.money - RENT - RESTOCK_BUFFER))
      weeks.push(weekRow(s))
      s = afterSummary(s)
    }
    if (s.phase === 'closed') return { tierName, seed, weeks, closed: s.closedReason, day: s.day }
    if (s.phase === 'ending') return { tierName, seed, weeks, ending: s.premiumPaidInFull ? 'paid' : 'forgiven' }
  }
  return { tierName, seed, weeks, stuck: true }
}

/** §E observations for one tier's runs (counts out of `runs`). */
export function summarise(runs) {
  const count = (f) => runs.filter(f).length
  const instalments = (r) => r.weeks.filter((w) => w.premiumDue !== undefined && !w.premiumSettled)
  const allWeeks = runs.flatMap((r) => r.weeks)
  return {
    runs: runs.length,
    closed: count((r) => r.closed),
    endingPaid: count((r) => r.ending === 'paid'),
    endingForgiven: count((r) => r.ending === 'forgiven'),
    premiumOnTimeAll: count((r) => instalments(r).every((w) => w.premiumPaid >= w.premiumDue)),
    premiumCarriedAny: count((r) => instalments(r).some((w) => w.premiumPaid < w.premiumDue)),
    rentLateAny: count((r) => r.weeks.some((w) => !w.rentPaid)),
    interiorAtLeast3: count((r) => (r.weeks.at(-1)?.interior ?? 0) >= 3),
    paidOffBy21: count((r) => (r.weeks.find((w) => w.day === 21)?.premiumLeft ?? Infinity) <= 0),
    avgInterior: +(runs.reduce((a, r) => a + (r.weeks.at(-1)?.interior ?? 0), 0) / runs.length).toFixed(1),
    avgWeekRevenue: Math.round(allWeeks.reduce((a, w) => a + w.weekRevenue, 0) / Math.max(1, allWeeks.length)),
  }
}

const k = (n) => `${Math.round(n / 1000).toLocaleString()}k`

function printRun(r) {
  console.log(`\n[${r.tierName} seed ${r.seed}] ${r.closed ? `CLOSED (${r.closed}) on day ${r.day}` : `ending: ${r.ending ?? 'none'}`}`)
  console.log('  day | week rev | rent | 권리금 due/paid | left  | int | seats pots | rating | money')
  for (const w of r.weeks) {
    const prem = w.premiumDue === undefined ? '—' : `${k(w.premiumDue)}/${k(w.premiumPaid)}`
    const rent = w.rentPaid ? 'ok  ' : w.bankrupt ? 'BUST' : 'late'
    console.log(`  ${String(w.day).padStart(3)} | ${k(w.weekRevenue).padStart(8)} | ${rent} | ${prem.padStart(15)} | ${k(w.premiumLeft).padStart(5)} | ${String(w.interior).padStart(3)} | ${String(w.seats).padStart(5)} ${String(w.pots).padStart(4)} | ${w.rating.toFixed(2).padStart(6)} | ${k(w.money)}`)
  }
}

if (process.argv[1]?.endsWith('part1_run.mjs')) {
  const num = (name, fallback) => Number(process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1] ?? fallback)
  const start = num('start', createNewGame().money)
  const seeds = num('seeds', 8)
  const verbose = process.argv.includes('--verbose')
  console.log(`part-1 run · start ${start.toLocaleString()}원 · D ${BASELINE_D.toLocaleString()} · rent ${RENT.toLocaleString()}/wk · 권리금 ${PREMIUM_TOTAL.toLocaleString()} (${PREMIUM_INSTALMENT.toLocaleString()} × 4) · pack ${PACK_SIZE} · ${seeds} seeds`)
  console.log('§E goals: normal = every instalment on time + interior ≥3 + no late rent · clumsy = some carry → forgiven, never closed · good = paid off by day 21')
  for (const name of Object.keys(TIERS)) {
    const runs = Array.from({ length: seeds }, (_, i) => playPart1(name, 100 + i, start))
    ;(verbose ? runs : runs.slice(0, 1)).forEach(printRun)
    console.log(`  → ${name}:`, summarise(runs))
  }
}
