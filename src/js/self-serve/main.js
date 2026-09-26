// Entry point for the self-serve variant: owns the current state, maps UI actions to logic, runs the loop.
import {
  addToast, adjustCharge, advanceStory, beginNewGame, buyInterior, buyPack, buySidePack, buyUpgrade, confirmCharge, cookNext, createNewGame, dig,
  fadeToasts, finishCharacter, openShop, pickPot, resetCharge, restock, serveTable, setCharacterName,
  setCharacterOption, setMenuPrice, setTicketMode, setTicketSpice, skipStory, startCooking, startNextDay, tick,
  unlockIngredient,
} from './logic.js'
import { hasSave, loadGame, saveGame } from './save.js'
import { render } from './ui.js'
import { DEV_ACTIONS, isDevMode, mountDevBar } from './dev.js'
import { mountStageFit } from './fit.js'

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
  cookNext: (s) => cookNext(s),
  pick: (s, arg) => pickPot(s, Number(arg)),
  table: (s, arg) => serveTable(s, Number(arg)),
  toShop: (s) => persist(openShop(s)),
  buy: (s, arg) => persist(buyPack(s, arg)),
  unlock: (s, arg) => persist(unlockIngredient(s, arg)),
  upgrade: (s, arg) => persist(buyUpgrade(s, arg)),
  interior: (s) => persist(buyInterior(s)),
  sidePack: (s, arg) => persist(buySidePack(s, arg)),
  price: (s, arg) => {
    const [mode, delta] = String(arg).split(':')
    return persist(setMenuPrice(s, mode, s.prices[mode] + Number(delta)))
  },
  nextDay: (s) => startNextDay(persist(s)),
  new: () => beginNewGame(),
  charOpt: (s, arg) => {
    const [key, value] = String(arg).split(':')
    return setCharacterOption(s, key, value)
  },
  charDone: (s) => finishCharacter(s),
  storyNext: (s) => advanceStory(s),
  storySkip: (s) => skipStory(s),
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

// The name field updates state directly; the creation screen does not re-render on typing.
root.addEventListener('input', (e) => {
  if (e.target.dataset.input === 'name') state = setCharacterName(state, e.target.value)
})

root.addEventListener('mouseover', (e) => {
  const target = e.target.closest('[data-hover]')
  const hover = target ? target.dataset.hover : null
  if (hover !== view.hover) view = { ...view, hover }
})

const KEY_ACTIONS = {
  // e.code = physical key, so P / C also work while a Korean IME is on (ㅔ / ㅊ)
  day: { Enter: 'chargeConfirm', Space: 'dig', Escape: 'pause', KeyP: 'pause', KeyC: 'cookNext' },
  opening: { Enter: 'storyNext', Space: 'storyNext', Escape: 'storySkip' },
}

window.addEventListener('keydown', (e) => {
  const action = KEY_ACTIONS[state.phase]?.[e.code]
  if (!action) return
  e.preventDefault()
  run(action)
})

// Dev mode (localhost or ?dev): auto-play days and add money to check between-day UI quickly.
// Results land on the summary screen; "상점으로" then saves them like a played day.
mountStageFit(window)

if (isDevMode()) {
  mountDevBar(document, (action) => {
    if (!DEV_ACTIONS[action]) return
    const next = DEV_ACTIONS[action](state)
    state = next.phase === 'shop' ? persist(next) : next
    view = { ...view, paused: false, help: false }
  })
}

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
