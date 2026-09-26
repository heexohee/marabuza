// Dev mode for the self-serve flow: a small fixed bar with shortcuts for checking between-day UI
// (interior, pots, shop) without playing every day by hand. On by default on localhost; `?dev` turns it
// on anywhere, `?dev=0` turns it off (e.g. for clean evidence screenshots).
import { addToast } from './logic.js'
import { autoPlayDay, autoPlayDays } from './autoplay.js'

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]']
export const DEV_MONEY_STEP = 100000
const WEEK_DAYS = 6 // 월~토 business days (design/game-brief.md §경제 레벨링)

/** True when the dev bar should show for this page location. */
export function isDevMode(loc = window.location) {
  const flag = new URLSearchParams(loc.search).get('dev')
  if (flag !== null) return flag !== '0'
  return LOCAL_HOSTS.includes(loc.hostname)
}

const PLAYABLE = new Set(['day', 'summary', 'shop'])
const notPlayable = (s) => addToast(s, '영업·정산·상점 화면에서만 쓸 수 있어요 (개발 모드)', 'info')

// Plays `days` business days from the current screen and stops on the last day's summary.
// From a business day the rest of today counts as the first day.
const autoPlay = (days) => (s) => {
  if (!PLAYABLE.has(s.phase)) return notPlayable(s)
  if (s.phase === 'day') return autoPlayDays(autoPlayDay(s), days - 1)
  return autoPlayDays(s, days)
}

/** Dev actions: state in, state out. */
export const DEV_ACTIONS = {
  autoDay: autoPlay(1),
  autoWeek: autoPlay(WEEK_DAYS),
  money: (s) => addToast({ ...s, money: s.money + DEV_MONEY_STEP }, `개발 모드: +${DEV_MONEY_STEP.toLocaleString()}원`, 'good'),
}

const BAR_HTML = `
  <span class="dev-tag">DEV</span>
  <button type="button" data-dev="autoDay" title="오늘(상점에서는 다음 날) 영업을 봇이 끝까지 진행하고 정산으로">⏩ 하루 자동</button>
  <button type="button" data-dev="autoWeek" title="영업 ${WEEK_DAYS}일을 연달아 자동 진행 (날 사이 창고 재료만 보충)">⏩ ${WEEK_DAYS}일 자동</button>
  <button type="button" data-dev="money" title="돈 +${DEV_MONEY_STEP.toLocaleString()}원">💰 +10만</button>`

/**
 * Adds the dev bar to the page (outside the game root, so screen re-renders never remove it).
 * @param {Document} doc
 * @param {(action: string) => void} onAction called with a DEV_ACTIONS key
 */
export function mountDevBar(doc, onAction) {
  const bar = doc.createElement('div')
  bar.className = 'dev-bar'
  bar.setAttribute('role', 'toolbar')
  bar.setAttribute('aria-label', '개발 모드')
  bar.innerHTML = BAR_HTML
  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-dev]')
    if (btn) onAction(btn.dataset.dev)
  })
  doc.body.appendChild(bar)
  return bar
}
