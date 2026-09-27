// Entry point for the self-serve variant: owns the current state, maps UI actions to logic, runs the loop.
import {
  addToast, adjustCharge, advanceEnding, advanceStory, advanceSunday, advanceTeaser, afterSummary, beginNewGame, buyInterior, buyPack, buySidePack, buyUpgrade, confirmCharge, cookNext, createNewGame, dig,
  fadeToasts, finishCharacter, finishCredits, finishTeaser, isEndingDone, isSundayDone, isTeaserDone, openSide, payPremium, pickPot, resetCharge, restock, resumeShop, serveTable, setCharacterName,
  setCharacterOption, setMenuPrice, setTicketMode, setTicketSpice, skipStory, startCooking, startNextDay, tick,
  unlockIngredient,
} from './logic.js'
import { clearSave, hasSave, loadGame, saveGame } from './save.js'
import { render } from './ui.js'
import { DEV_ACTIONS, isDevMode, mountDevBar } from './dev.js'
import { mountStageFit } from './fit.js'
import { mountTitleAnim } from './title-anim.js'
import { DEFAULT_SHOP_TAB, TITLE_MENU, defaultTitleSel, titleItemEnabled } from './screens.js'
import { VOLUME_STEP, changeVolume, createAudioPlayer, loadAudioPrefs, saveAudioPrefs, toggleMuted, toggleSfxMuted } from './audio.js'
import { sfxForAction } from './sfx.js'

const MAX_FRAME_SEC = 0.1
const root = document.getElementById('app')

// localStorage can throw on access (blocked site data); the audio prefs module treats undefined as "no storage"
function storageOrUndefined() {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}
const storage = storageOrUndefined()

let state = createNewGame()
let view = { hover: null, paused: false, help: false, settings: false, credits: false, ledger: false, hasSave: hasSave(), shopTab: DEFAULT_SHOP_TAB, audio: loadAudioPrefs(storage) }
view = { ...view, titleSel: defaultTitleSel(view) }

const audio = createAudioPlayer({
  AudioContextClass: window.AudioContext ?? window.webkitAudioContext,
  fetchFn: (url) => fetch(url),
  onError: (msg) => { state = addToast(state, msg, 'bad') },
})
audio.setPrefs(view.audio)

function setAudioPrefs(prefs) {
  view = { ...view, audio: prefs }
  audio.setPrefs(prefs)
  saveAudioPrefs(storage, prefs) // a failed save only loses the preference next launch
}

// Browsers keep audio locked until the first user gesture.
window.addEventListener('pointerdown', () => audio.unlock(), { capture: true })
window.addEventListener('keydown', () => audio.unlock(), { capture: true })

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
  toShop: (s) => persist(afterSummary(s)),
  buy: (s, arg) => persist(buyPack(s, arg)),
  unlock: (s, arg) => persist(unlockIngredient(s, arg)),
  upgrade: (s, arg) => persist(buyUpgrade(s, arg)),
  interior: (s) => persist(buyInterior(s)),
  sidePack: (s, arg) => persist(buySidePack(s, arg)),
  openSide: (s, arg) => persist(openSide(s, arg)),
  price: (s, arg) => {
    const [mode, delta] = String(arg).split(':')
    return persist(setMenuPrice(s, mode, s.prices[mode] + Number(delta)))
  },
  // the first morning after the ending plays the part-2 teaser (story N003); it is saved on entry so it plays once
  nextDay: (s) => {
    const next = startNextDay(persist(s))
    return next.phase === 'teaser' ? persist(next) : next
  },
  new: () => beginNewGame(),
  charOpt: (s, arg) => {
    const [key, value] = String(arg).split(':')
    return setCharacterOption(s, key, value)
  },
  charDone: (s) => finishCharacter(s),
  storyNext: (s) => advanceStory(s),
  storySkip: (s) => skipStory(s),
  sundayNext: (s) => (isSundayDone(s) ? persist(afterSummary(s)) : advanceSunday(s)),
  // 권리금 (economy E004): 더 갚기 on the Sunday ledger, and the day-28 ending's beats
  payPremium: (s, arg) => persist(payPremium(s, arg === 'all' ? 'all' : Number(arg))),
  endingNext: (s) => (isEndingDone(s) ? persist(afterSummary(s)) : advanceEnding(s)),
  teaserNext: (s) => (isTeaserDone(s) ? finishTeaser(s) : advanceTeaser(s)),
  creditsDone: (s) => persist(finishCredits(s)), // end-of-part-1 credits → the day-28 shop
  continue: (s) => {
    const loaded = loadGame()
    return loaded ? resumeShop(loaded) : addToast(s, '저장된 게임이 없어요', 'bad')
  },
}

const viewActions = {
  pause: (v) => ({ ...v, paused: !v.paused }),
  help: (v) => ({ ...v, help: true, settings: false }),
  settings: (v) => ({ ...v, settings: true }),
  closeSettings: (v) => ({ ...v, settings: false }),
  closeHelp: (v) => ({ ...v, help: false }),
  credits: (v) => ({ ...v, credits: true, settings: false }),
  closeCredits: (v) => ({ ...v, credits: false, settings: true }), // back to the settings it was opened from
  shopTab: (v, arg) => ({ ...v, shopTab: arg }),
  ledger: (v) => ({ ...v, ledger: !v.ledger }), // the shop's 📒 장부 popup (playtest 2026-09-27 #7)
  closeLedger: (v) => ({ ...v, ledger: false }),
}

function run(action, arg) {
  if (action === 'menu') {
    state = createNewGame()
    view = { ...view, paused: false, help: false, settings: false, credits: false, ledger: false, hasSave: hasSave() }
    view = { ...view, titleSel: defaultTitleSel(view) }
    return
  }
  if (action === 'fullscreen') {
    toggleFullscreen()
    return
  }
  if (action === 'musicToggle') return setAudioPrefs(toggleMuted(view.audio))
  if (action === 'musicVol') return setAudioPrefs(changeVolume(view.audio, Number(arg) * VOLUME_STEP))
  if (action === 'sfxToggle') {
    setAudioPrefs(toggleSfxMuted(view.audio))
    return audio.playSfx('tap') // a sample when turning sounds on (silent when turning them off)
  }
  if (viewActions[action]) {
    view = viewActions[action](view, arg)
    return
  }
  if (!gameActions[action]) return
  const isBlocked = state.phase === 'day' && (view.paused || view.help)
  if (isBlocked) return
  const prev = state
  state = gameActions[action](state, arg)
  audio.playSfx(sfxForAction(action, prev, state))
  if (state.phase !== 'shop' && view.ledger) view = { ...view, ledger: false } // the popup belongs to this shop visit
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
  const item = e.target.closest('[data-title-sel]')
  if (item && !item.disabled && Number(item.dataset.titleSel) !== view.titleSel) view = { ...view, titleSel: Number(item.dataset.titleSel) }
  const target = e.target.closest('[data-hover]')
  const hover = target ? target.dataset.hover : null
  if (hover !== view.hover) view = { ...view, hover }
})

const KEY_ACTIONS = {
  // e.code = physical key, so P / C also work while a Korean IME is on (ㅔ / ㅊ)
  day: { Enter: 'chargeConfirm', Space: 'dig', Escape: 'pause', KeyP: 'pause', KeyC: 'cookNext' },
  opening: { Enter: 'storyNext', Space: 'storyNext', Escape: 'storySkip' },
  sunday: { Enter: 'sundayNext', Space: 'sundayNext' },
  ending: { Enter: 'endingNext', Space: 'endingNext' },
  teaser: { Enter: 'teaserNext', Space: 'teaserNext' },
  credits: { Enter: 'creditsDone' },
  shop: { Escape: 'closeLedger' },
}

// Title menu by keyboard: ↑/↓ move between the items that can be chosen, Enter/Space runs the highlighted one.
function titleKey(code) {
  if (code === 'Escape' && (view.help || view.settings || view.credits)) return run(view.credits ? 'closeCredits' : view.help ? 'closeHelp' : 'closeSettings'), true
  if (view.help || view.settings || view.credits) return false
  const usable = TITLE_MENU.map((it, i) => (titleItemEnabled(it, view) ? i : -1)).filter((i) => i >= 0)
  const at = usable.indexOf(view.titleSel)
  if (code === 'ArrowDown' || code === 'ArrowUp') {
    const step = code === 'ArrowDown' ? 1 : -1
    view = { ...view, titleSel: usable[(Math.max(at, 0) + step + usable.length) % usable.length] }
    return true
  }
  if ((code === 'Enter' || code === 'Space') && at >= 0) return run(TITLE_MENU[view.titleSel].action), true
  return false
}

function toggleFullscreen() {
  const doc = document
  const req = doc.fullscreenElement ? doc.exitFullscreen?.() : doc.documentElement.requestFullscreen?.()
  req?.catch?.(() => { state = addToast(state, '이 브라우저에서는 전체화면을 쓸 수 없어요', 'bad') })
}

window.addEventListener('keydown', (e) => {
  // M mutes music anywhere, except while typing (the shop owner's name field)
  if (e.code === 'KeyM' && !e.target.closest?.('input, textarea')) {
    e.preventDefault()
    return run('musicToggle')
  }
  if (state.phase === 'menu') {
    if (titleKey(e.code)) e.preventDefault()
    return
  }
  const action = KEY_ACTIONS[state.phase]?.[e.code]
  if (!action) return
  e.preventDefault()
  run(action)
})

// Dev mode (localhost or ?dev): auto-play days and add money to check between-day UI quickly.
// Results land on the summary screen; "상점으로" then saves them like a played day.
mountStageFit(window)
mountTitleAnim(window) // the still title-bg.png stays behind if its art fails to load

if (isDevMode()) {
  mountDevBar(document, (action) => {
    if (!DEV_ACTIONS[action]) return
    const next = DEV_ACTIONS[action](state)
    state = next.phase === 'shop' ? persist(next) : next
    view = { ...view, paused: false, help: false, settings: false, credits: false, ledger: false }
  })
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden && state.phase === 'day') view = { ...view, paused: true }
})

let last = performance.now()
let lastPhase = state.phase
function frame(now) {
  const dt = Math.min(MAX_FRAME_SEC, (now - last) / 1000)
  last = now
  const isRunning = state.phase === 'day' && !view.paused && !view.help
  state = isRunning ? tick(state, dt) : fadeToasts(state, dt)
  // every visit to the shop starts on the order tab
  if (state.phase === 'shop' && lastPhase !== 'shop') view = { ...view, shopTab: DEFAULT_SHOP_TAB }
  // a closed-down shop ends the run: drop the save so "이어하기" cannot skip past it (economy E003)
  if (state.phase === 'closed' && lastPhase !== 'closed' && clearSave()) view = { ...view, hasSave: false, titleSel: defaultTitleSel({ hasSave: false }) }
  lastPhase = state.phase
  audio.setPhase(state.phase)
  render(root, state, view)
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
