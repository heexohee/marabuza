// LEGACY — owner-scoop flow (the owner fills bowls). Retired 2026-09-25 in favour of the
// self-serve flow (src/self-serve.html, src/js/self-serve/). Kept runnable as a demo, including
// the Kakao cloud-save demo (slot 'legacy'). Do not add features here — see docs/flows.md.
// Entry point: owns the current state, maps UI actions to logic, runs the loop.
import {
  addScoop, addToast, adjustCharge, buyPack, buyUpgrade, clearBowl, confirmCharge, createNewGame,
  fadeToasts, openShop, removeScoop, resetCharge, selectCustomer, servePot, setPrice, setSpice,
  startCooking, startDay, startNextDay, tick, unlockIngredient,
} from './logic.js'
import { connectCloud } from './cloud.js'
import { hasSave, isValidSave, loadGame, saveGame } from './save.js'
import { render } from './ui.js'

const MAX_FRAME_SEC = 0.1
const root = document.getElementById('app')

let state = createNewGame()
// view.cloud: { enabled, signedIn, name, message } — enabled only when cloud-config.js is filled in.
let view = { hover: null, paused: false, help: false, hasSave: hasSave(), cloud: { enabled: false } }
let cloud = null // null when cloud saves are not configured or unreachable
let cloudSave = null // latest valid save pulled from / pushed to the cloud

const setCloudView = (patch) => { view = { ...view, cloud: { ...view.cloud, ...patch } } }

/** Saves locally, then mirrors to the cloud in the background when signed in. */
function persist(s) {
  const data = saveGame(s)
  if (!data) return addToast(s, '저장에 실패했어요 (브라우저 저장소를 확인하세요)', 'bad')
  if (cloud?.isSignedIn()) {
    cloud.pushSave(data).then((ok) => {
      if (ok) cloudSave = data
      else state = addToast(state, '클라우드 저장에 실패했어요. 이 기기에는 저장됐어요', 'bad')
    })
  }
  return s
}

async function startCloud() {
  cloud = await connectCloud({ isValidSave, slot: 'legacy' })
  if (!cloud) return
  setCloudView({ enabled: true, signedIn: cloud.isSignedIn(), name: cloud.displayName() })
  cloud.onChange(async (user) => {
    setCloudView({ signedIn: user !== null, name: cloud.displayName(), message: '' })
    cloudSave = user ? await cloud.pullSave() : null
    view = { ...view, hasSave: hasSave(cloudSave) }
  })
}

// Login / logout leave the synchronous game loop, so they are handled outside gameActions.
const cloudActions = {
  login: async () => {
    setCloudView({ message: '카카오 로그인 화면으로 이동해요…' })
    const error = await cloud?.signIn(window.location.origin + window.location.pathname)
    if (error) setCloudView({ message: `로그인에 실패했어요: ${error}` })
  },
  logout: async () => {
    await cloud?.signOut()
    cloudSave = null
    setCloudView({ signedIn: false, name: '', message: '로그아웃했어요' })
    view = { ...view, hasSave: hasSave() }
  },
}

const gameActions = {
  select: (s, arg) => selectCustomer(s, Number(arg)),
  scoop: (s, arg) => addScoop(s, arg),
  remove: (s, arg) => removeScoop(s, arg),
  spice: (s, arg) => setSpice(s, Number(arg)),
  clear: (s) => clearBowl(s),
  cook: (s) => startCooking(s),
  serve: (s, arg) => servePot(s, Number(arg)),
  charge: (s, arg) => adjustCharge(s, Number(arg)),
  chargeReset: (s) => resetCharge(s),
  chargeConfirm: (s) => confirmCharge(s),
  toShop: (s) => persist(openShop(s)),
  buy: (s, arg) => persist(buyPack(s, arg)),
  unlock: (s, arg) => persist(unlockIngredient(s, arg)),
  upgrade: (s, arg) => persist(buyUpgrade(s, arg)),
  price: (s, arg) => persist(setPrice(s, s.pricePer100g + Number(arg))),
  nextDay: (s) => startNextDay(persist(s)),
  new: () => startDay(createNewGame()),
  continue: (s) => {
    const loaded = loadGame(cloudSave) // newest of this device's save and the cloud save
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
    view = { ...view, paused: false, help: false, hasSave: hasSave(cloudSave) }
    return
  }
  if (cloudActions[action]) {
    cloudActions[action]()
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

window.addEventListener('keydown', (e) => {
  if (state.phase !== 'day') return
  if (e.code === 'Enter' && state.pendingCheckout) {
    e.preventDefault()
    run('chargeConfirm')
  } else if (e.code === 'Space') {
    e.preventDefault()
    run('cook')
  } else if (e.code === 'Escape') {
    run('pause')
  }
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
startCloud()
