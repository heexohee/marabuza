// First-day tutorial (request 2026-10-02, Steam build): the panda walks the player through one customer —
// dig → ticket → prepay → cook → (shelf while it boils) → pick up → serve — with a bubble and a highlight on
// the thing to press. While it runs the day clock, spawning, patience and wilting stand still; only the pot
// keeps boiling. Once it is finished or skipped it never shows again, unless 설정 → 튜토리얼 다시 보기 arms it
// for the next business day. Pure state helpers plus the storage flag; ui.js draws the bubble.
import { fadeToasts, spawnCustomer } from './logic.js'

const DONE_KEY = 'marabuza.tutorialDone'

/** How far the tutorial customer's order has got — each step is done once this reaches its `until`. */
const PAID = 1
const COOKING = 2
const COOKED = 3
const HELD = 4
const SERVED = 5

/**
 * The steps, in order. `until`: done once orderProgress reaches it (paying early skips dig and ticket).
 * `on`: also done by doing that action. `next`: a button moves on. `at`: where the bubble sits ('hall' | 'kitchen').
 * `focus`: CSS selector of what to highlight.
 */
export const TUTORIAL_STEPS = [
  { id: 'intro', text: '첫 손님이 왔어! 오늘 첫 그릇은 내가 옆에서 알려 줄게.', focus: '.ss-counter .bubble.say', next: '좋아요 ▶', until: PAID },
  { id: 'dig', text: '먼저 그릇을 뒤적여 봐. 고기랑 꼬치는 채소 밑에 숨어 있거든!', key: 'Space', focus: '.ss-counter .dig', on: ['dig'], until: PAID },
  { id: 'ticket', text: '손님 말대로 주문표에 마라탕·샹궈와 맵기를 골라 줘.', focus: '.ss-counter .ticket-row, .ss-counter .spice-pick', next: '다 골랐어요 ▶', until: PAID },
  { id: 'charge', text: '저울 금액에 고기·꼬치·고수 추가금을 더해서 선결제!', key: 'Enter', focus: '.ss-counter .keys, .ss-counter .btn.cook', until: PAID },
  { id: 'cook', text: '주문표가 걸렸지? 눌러서 냄비에 넣자.', key: 'C', focus: '[data-slot="rail"] .ticket', until: COOKING },
  { id: 'shelf', text: '끓는 동안 진열대! 칸을 누르면 창고에서 채워. 너무 채우면 채소가 시들어.', focus: '[data-slot="shelf"]', until: COOKED },
  { id: 'pick', text: '다 끓었다! 냄비를 눌러서 들어.', focus: '[data-slot="pots"]', until: HELD },
  { id: 'serve', text: '같은 🎫 번호 식탁을 누르면 서빙 끝!', focus: '[data-slot="tables"] .ss-table', until: SERVED, at: 'kitchen' },
  { id: 'done', text: '잘했어! 이제 손님이 계속 올 거야. 헷갈리면 P → 게임방법!', next: '영업 시작!' },
]

/** @returns {number} 0 before paying, then PAID … SERVED as the first order moves along */
function orderProgress(s) {
  if (s.stats.served > 0) return SERVED
  if (s.heldPot !== null) return HELD
  if (s.pots.some((p) => p && p.remaining <= 0)) return COOKED
  if (s.pots.some(Boolean)) return COOKING
  return s.rail.length > 0 || s.tables.some(Boolean) ? PAID : 0
}

/** The step showing now, or null when no tutorial is running. */
export const tutorialStep = (s) => (s.tutorial ? TUTORIAL_STEPS[s.tutorial.step] ?? null : null)

/** Moves past every step the order has already gone beyond. */
export function advanceTutorial(s) {
  let next = s
  for (let step = tutorialStep(next); step?.until !== undefined && orderProgress(next) >= step.until; step = tutorialStep(next)) {
    next = { ...next, tutorial: { step: next.tutorial.step + 1 } }
  }
  return next
}

/**
 * Starts the tutorial on a business day that has just opened: the first customer walks straight in (unless the
 * day already has one — a resumed save), and the morning line gives way to the panda's bubble. If the shelf is
 * too bare for a bowl, it does not start (and nobody walks out) — it waits for a day with stock.
 * @param {() => number} [rng]
 */
export function startTutorial(s, rng = Math.random) {
  if (s.phase !== 'day') return s
  const isFresh = s.queue.length === 0 && s.rail.length === 0 && s.tables.every((t) => t === null) && s.pots.every((p) => p === null)
  const withCustomer = isFresh && s.stats.served === 0 ? spawnCustomer(s, rng) : s
  if (isFresh && withCustomer.queue.length === 0) return s
  return advanceTutorial({ ...withCustomer, ownerLine: null, tutorial: { step: 0 } })
}

/** The tutorial's frame: the pot boils and the hands free up, but the clock, spawning, patience and wilting wait. */
export function tutorialTick(s, dt) {
  const aged = {
    ...fadeToasts(s, dt),
    busy: Math.max(0, s.busy - dt),
    pots: s.pots.map((p) => (p ? { ...p, remaining: Math.max(0, p.remaining - dt) } : p)),
  }
  return advanceTutorial(aged)
}

/** After a game action: a step waiting for that action moves on if it did something. */
export function tutorialAfterAction(prev, next, action) {
  const step = tutorialStep(next)
  if (!step) return next
  const didIt = step.on?.includes(action) && next !== prev
  return advanceTutorial(didIt ? { ...next, tutorial: { step: next.tutorial.step + 1 } } : next)
}

/** The bubble's button: the next step, or the end of the tutorial after the last one. */
export function nextTutorialStep(s) {
  const step = tutorialStep(s)
  if (!step?.next) return s
  const at = s.tutorial.step + 1
  return at >= TUTORIAL_STEPS.length ? { ...s, tutorial: null } : advanceTutorial({ ...s, tutorial: { step: at } })
}

/** 건너뛰기: the day goes on from here as a normal day. */
export const skipTutorial = (s) => ({ ...s, tutorial: null })

/** @param {Storage|undefined} storage @returns {boolean} whether the tutorial has been finished or skipped */
export function isTutorialDone(storage) {
  try {
    return storage?.getItem(DONE_KEY) === '1'
  } catch {
    return false // unreadable storage: showing it again is the safe side
  }
}

/** @param {Storage|undefined} storage @param {boolean} done false arms it again (설정 → 튜토리얼 다시 보기) */
export function setTutorialDone(storage, done) {
  try {
    if (done) storage?.setItem(DONE_KEY, '1')
    else storage?.removeItem(DONE_KEY)
    return true
  } catch {
    return false
  }
}
