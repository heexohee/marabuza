// Entry point for the self-serve variant: owns the current state, maps UI actions to logic, runs the loop.
import {
  addToast, adjustCharge, buyPack, buyUpgrade, confirmCharge, createNewGame, dig, fadeToasts, openShop, pickPot,
  resetCharge, restock, serveTable, setPrice, setTicketMode, setTicketSpice, startCooking, startDay, startNextDay,
  tick, unlockIngredient,
} from './logic.js'
import { hasSave, loadGame, saveGame } from './save.js'
import { render } from './ui.js'

const MAX_FRAME_SEC = 0.1
const root = document.getElementById('app')

let state = createNewGame()
let view = { hover: null, paused: false, help: false, hasSave: hasSave() }

function persist(s) {
  return saveGame(s) ? s : addToast(s, '저장에 실패했어요 (브라우저 저장소를 확인하세요)', 'bad')
}

const gameActions = {
  restock: (s, arg) => restock(s, arg),
  dig: (s) => dig(s),
  mode: (s, arg) => setTicketMode(s, arg),
  spice: (s, arg) => setTicketSpice(s, Number(arg)),
  charge: (s, arg) => adjustCharge(s, Number(arg)),
  chargeReset: (s) => resetCharge(s),
  chargeConfirm: (s) => confirmCharge(s),
  cook: (s, arg) => startCooking(s, Number(arg)),
  pick: (s, arg) => pickPot(s, Number(arg)),
  table: (s, arg) => serveTable(s, Number(arg)),
  toShop: (s) => persist(openShop(s)),
  buy: (s, arg) => persist(buyPack(s, arg)),
  unlock: (s, arg) => persist(unlockIngredient(s, arg)),
  upgrade: (s, arg) => persist(buyUpgrade(s, arg)),
  price: (s, arg) => persist(setPrice(s, s.pricePer100g + Number(arg))),
  nextDay: (s) => startNextDay(persist(s)),
  new: () => startDay(createNewGame()),
  continue: (s) => {
    const loaded = loadGame()
    return loaded ? openShop(loaded) : addToast(s, '저장된 게임이 없어요', 'bad')
  },
}

const viewActions = {
  pause: (v) => ({ ...v, paused: !v.paused }),
  help: (v) => ({ ...v, help: true }),
  closeHelp: (v) => ({ ...v, help: false }),
}

function run(action, arg) {
  if (action === 'menu') {
    state = createNewGame()
    view = { ...view, paused: false, help: false, hasSave: hasSave() }
    return
  }
  if (viewActions[action]) {
    view = viewActions[action](view)
    return
  }
  if (!gameActions[action]) return
  const isBlocked = state.phase === 'day' && (view.paused || view.help)
  if (!isBlocked) state = gameActions[action](state, arg)
}

root.addEventListener('click', (e) => {
  const target = e.target.closest('[data-action]')
  if (target && !target.disabled) run(target.dataset.action, target.dataset.arg)
})

root.addEventListener('mouseover', (e) => {
  const target = e.target.closest('[data-hover]')
  const hover = target ? target.dataset.hover : null
  if (hover !== view.hover) view = { ...view, hover }
})

const KEY_ACTIONS = { Enter: 'chargeConfirm', Space: 'dig', Escape: 'pause' }

window.addEventListener('keydown', (e) => {
  if (state.phase !== 'day' || !KEY_ACTIONS[e.code]) return
  e.preventDefault()
  run(KEY_ACTIONS[e.code])
})

document.addEventListener('visibilitychange', () => {
  if (document.hidden && state.phase === 'day') view = { ...view, paused: true }
})

let last = performance.now()
function frame(now) {
  const dt = Math.min(MAX_FRAME_SEC, (now - last) / 1000)
  last = now
  const isRunning = state.phase === 'day' && !view.paused && !view.help
  state = isRunning ? tick(state, dt) : fadeToasts(state, dt)
  render(root, state, view)
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
