// Day-change calendar (request 2026-09-28): when a new business day or Sunday begins, a tear-off calendar shows
// for a moment — yesterday's page is torn off and falls, today's page is underneath with the week, the weekday
// and a countdown to the Sunday ledger. Pure screen dressing: main.js holds the day clock while it shows, and a
// click or any key skips it. With reduced motion the page simply appears.
import { PART1_LAST_DAY, WEEKDAY_LABEL, daysUntilRent, isSunday, weekOf, weekdayOf } from './data.js'

/** How long the calendar stays up, in ms (the tear takes most of it). */
export const DAY_INTRO_MS = 2300
/** …and with reduced motion, where there is no tear to watch. */
export const DAY_INTRO_REDUCED_MS = 900

const ENTRY_PHASES = new Set(['day', 'sunday'])

/**
 * What today's calendar page says.
 * @param {number} day
 * @returns {{ day: number, prevDay: number | null, title: string, sub: string, isSunday: boolean, note: string }}
 */
export function dayIntroInfo(day) {
  const sunday = isSunday(day)
  const left = daysUntilRent(day)
  const note = day === PART1_LAST_DAY ? '판다 사장님 오시는 날'
    : sunday ? '오늘은 장부 정리하는 날'
      : left === 1 ? '내일은 일요일 — 장부 정리!'
        : `일요일 장부까지 ${left}일`
  return {
    day,
    prevDay: day > 1 ? day - 1 : null,
    title: `DAY ${day}`,
    sub: `${weekOf(day)}주차 ${WEEKDAY_LABEL[weekdayOf(day)]}요일`,
    isSunday: sunday,
    note,
  }
}

/**
 * True the moment a new day's screen opens: entering 'day' or 'sunday' from another phase, on a day whose
 * calendar has not been shown yet (so re-renders, and a Sunday that falls back to the shop, never repeat it).
 */
export const shouldShowDayIntro = (s, prevPhase, shownDay) =>
  ENTRY_PHASES.has(s.phase) && prevPhase !== s.phase && s.day !== shownDay

const pageHtml = (cls, day, isSun) => `
      <div class="cal-page ${cls}${isSun ? ' sun' : ''}">
        <i class="cal-rings"></i><b class="cal-head">마라부자</b>
        <span class="cal-num">${day}</span>
      </div>`

/** The calendar card: yesterday's page on top (torn off by CSS), today's underneath, then the two lines. */
export function dayIntroHtml(info) {
  const old = info.prevDay === null ? '' : pageHtml('old', info.prevDay, isSunday(info.prevDay))
  return `
    <div class="day-intro-card">
      <div class="cal-pad">${pageHtml('new', info.day, info.isSunday)}${old}</div>
      <p class="cal-title">${info.title} · ${info.sub}</p>
      <p class="cal-note">${info.note}</p>
    </div>`
}

/**
 * Adds the (hidden) calendar layer to the page, above the game. show() puts up a day's page; hide() takes it
 * down. Clicking the layer calls onSkip.
 * @param {Document} doc
 * @param {() => void} onSkip
 */
export function mountDayIntro(doc, onSkip) {
  const layer = doc.createElement('div')
  layer.className = 'day-intro'
  layer.setAttribute('aria-live', 'polite')
  layer.addEventListener('click', onSkip)
  doc.body.appendChild(layer)
  return {
    /** @param {(html: string) => string} [translate] the current language's translator (ui.js translatorFor) */
    show(info, translate = (html) => html) {
      layer.innerHTML = translate(dayIntroHtml(info))
      layer.classList.add('on')
    },
    hide() {
      layer.classList.remove('on')
      layer.innerHTML = ''
    },
  }
}
