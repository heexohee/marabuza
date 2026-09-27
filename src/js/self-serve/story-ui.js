// Story screens for the self-serve variant: character creation, opening cutscene, and the
// protagonist sprite used on the counter and in the day summary.
// design/quick-specs/story-character-2026-09-25.md
import { spriteImg } from '../sprites.js'
import { won } from '../ui.js'
import { APRON_COLORS, HAIR_COLORS, HAIR_STYLES, characterSprite } from './character.js'
import { NAME_MAX_LEN, PREMIUM_EXTRA_STEPS, PREMIUM_TOTAL, RENT, WEEKDAY_LABEL, weekOf, weekdayOf } from './data.js'
import {
  ENDING_FRAME_STEP, ENDING_LINE_COUNT, OPENING_SCENES, STAGE, SUNDAY_BG, endingLine, premiumLine, SUNDAY_LAST_STEP, SUNDAY_LEDGER_STEP, castSpot, lineText, sceneBg, sceneCast,
  speakerName, storyName, sundayLine,
} from './story.js'

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

/** Escapes player-typed text (the protagonist's name) before it goes into HTML. */
export const esc = (text) => String(text).replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch])

/** <img> of the protagonist; size it with a CSS class (it is 16×20 px, drawn pixelated). */
export const heroImg = (look, cls = '') =>
  `<img class="hero-sprite ${cls}" src="${characterSprite(look)}" alt="${esc(look.name)}" draggable="false">`

// ---------- character creation ----------

function optionRow(title, key, list, current, isSwatch) {
  const buttons = list.map((o) => `
    <button class="opt-btn ${o.id === current ? 'on' : ''}" data-action="charOpt" data-arg="${key}:${o.id}" title="${o.label}">
      ${isSwatch ? `<i class="swatch" style="background:${o.hex}"></i>` : ''}${o.label}
    </button>`).join('')
  return `<div class="opt-row"><span class="opt-title">${title}</span><div class="opt-btns">${buttons}</div></div>`
}

/** Character creation screen. The name input is not part of the re-render key, so typing keeps focus. */
export function createHtml(s) {
  const c = s.character
  return `
    <div class="create-screen">
      <h1 class="title-logo small">사장님 준비</h1>
      <p class="create-sub">마라판다를 인수했다! 이름과 모습을 정하고, 사장님이 건넨 앞치마를 골라요.</p>
      <div class="create-body">
        <div class="create-preview">${heroImg(c, 'hero-big')}<span class="preview-note">앞치마 착용 완료!</span></div>
        <div class="create-options">
          <label class="opt-row"><span class="opt-title">이름</span>
            <input class="name-input" data-input="name" maxlength="${NAME_MAX_LEN}" value="${esc(c.name)}" placeholder="이름 (최대 ${NAME_MAX_LEN}자)" autocomplete="off">
          </label>
          ${optionRow('머리 기장', 'hair', HAIR_STYLES, c.hair, false)}
          ${optionRow('머리색', 'hairColor', HAIR_COLORS, c.hairColor, true)}
          ${optionRow('앞치마', 'apron', APRON_COLORS, c.apron, true)}
        </div>
      </div>
      <button class="bubble-btn" data-action="charDone">앞치마 입고 가게로!</button>
    </div>`
}

export const createKey = (s) => `create|${s.character.hair}|${s.character.hairColor}|${s.character.apron}`

// ---------- opening cutscene ----------

// panda owner: 96×160 pixel sprite painted by tools/art/panda_sprite.py; bump ?v= when regenerating
const PANDA_IMG = '<img class="panda-sprite" src="img/panda.png?v=2" alt="판다 사장님" draggable="false">'
const pct = (v, of) => `${((v / of) * 100).toFixed(3)}%`
/** Stage px → % of the scene, so the cast scales with the background and keeps its painted spot. */
const castStyle = (who) => {
  const { x, w } = castSpot(who)
  return `left:${pct(x, STAGE.w)};width:${pct(w, STAGE.w)};bottom:${pct(STAGE.floor, STAGE.h)}`
}
const castSprite = (who, look) => (who === 'me' ? heroImg(look, 'hero-scene') : PANDA_IMG)

const DIALOGUE_KIND = { notice: 'is-notice', caption: 'is-caption' }

/** One line of the opening: scene art on top, dialogue box below. Clicking anywhere advances. */
export function openingHtml(s) {
  const { scene: sceneIdx, line: lineIdx } = s.story
  const scene = OPENING_SCENES[sceneIdx]
  const line = scene.lines[lineIdx]
  const props = scene.props.map((p, i) => `<span class="prop prop-${i}">${spriteImg(p, 20, 'prop-img')}</span>`).join('')
  const cast = sceneCast(sceneIdx, lineIdx).map((who) =>
    `<span class="cast cast-${who} ${line.who === who ? 'talking' : ''}" style="${castStyle(who)}">${castSprite(who, s.character)}</span>`).join('')
  const dots = OPENING_SCENES.map((_, i) => `<i class="${i === sceneIdx ? 'on' : ''}"></i>`).join('')
  return `
    <div class="opening-screen" data-action="storyNext">
      <div class="scene ${sceneBg(sceneIdx, lineIdx)}">${props}${cast}</div>
      <div class="dialogue ${DIALOGUE_KIND[line.who] ?? ''}">
        ${line.who === 'caption' ? '' : `<b class="speaker">${esc(speakerName(line.who, storyName(sceneIdx, s.character.name)))}</b>`}
        <p>${esc(lineText(line.text, s.character.name))}</p>
        <span class="next-hint">▶ 클릭 / Space</span>
      </div>
      <div class="opening-foot">
        <div class="scene-dots">${dots}</div>
        <button class="btn ghost skip-btn" data-action="storySkip">건너뛰기 ⏭</button>
      </div>
    </div>`
}

export const openingKey = (s) => `opening|${s.story.scene}|${s.story.line}`

// ---------- Sunday off day (economy E003) ----------

// The week's ledger, one row at a time (CSS animation-delay stamps each row in turn). Rent is already
// settled (logic.js enterSunday); this only shows the frozen snapshot in s.ledger.
function ledgerHtml(s) {
  const { weekRevenue, rentDue, rentPaid, bankrupt } = s.ledger ?? { weekRevenue: 0, rentDue: RENT, rentPaid: true }
  const stamp = rentPaid ? '완납 ✓' : bankrupt ? '폐업' : '연체 !'
  const rows = [
    [`${weekOf(s.day)}주차 매출 (월~토)`, won(weekRevenue), ''],
    ['임대료 (건물주)', `−${won(rentDue)}`, stamp],
    ...premiumRows(s),
  ]
  const rowsHtml = rows.map(([label, value, stamp], i) => `
        <tr class="ledger-row" style="animation-delay:${i * 0.35}s">
          <td>${label}</td><td>${value}</td>
          <td>${stamp ? `<span class="stamp ${stamp.startsWith('완납') ? 'ok' : 'bad'}">${stamp}</span>` : ''}</td>
        </tr>`).join('')
  return `
      <div class="ledger-panel">
        <b class="speaker">📒 장부</b>
        <table class="summary ledger">${rowsHtml}
          <tr class="total ledger-row" style="animation-delay:${rows.length * 0.35}s"><td colspan="2">남은 돈</td><td>${won(s.money)}</td></tr>
        </table>${premiumNoteHtml(s)}
        <span class="next-hint">▶ 클릭 / Space</span>
      </div>`
}

// ---------- 권리금 on the ledger (economy E004) ----------

/** The ledger's 권리금 row: nothing after part 1, "완납 ✓" once all paid, else paid vs due with a stamp. */
function premiumRows(s) {
  const l = s.ledger ?? {}
  if (l.premiumDue === undefined) return []
  if (l.premiumSettled) return [['권리금 (판다 사장님)', '—', '완납 ✓']]
  const short = l.premiumPaid < l.premiumDue
  return [['권리금 할부 (판다 사장님)', `−${won(l.premiumPaid)}`, short ? '이월 !' : '완납 ✓']]
}

/** Remaining 권리금 as a bar (part 1 only), shared by the Sunday ledger and the shop header. */
export function premiumBarHtml(s) {
  if (s.endingSeen) return ''
  const paid = PREMIUM_TOTAL - s.premiumLeft
  const pct = Math.round((paid / PREMIUM_TOTAL) * 100)
  return `
        <div class="premium-bar" title="권리금 ${won(paid)} / ${won(PREMIUM_TOTAL)}">
          <span class="premium-label">권리금</span>
          <i class="premium-track"><b style="width:${pct}%"></b></i>
          <span class="premium-left">남은 ${won(s.premiumLeft)}</span>
        </div>`
}

/** The panda's word on the 권리금 row (by phone), under the ledger. */
function premiumNoteHtml(s) {
  const line = premiumLine({ day: s.day, ...(s.ledger ?? {}) })
  const note = line ? `<p class="premium-note">🐼 ${esc(line.text)}</p>` : ''
  const bar = premiumBarHtml(s)
  return note || bar ? `<div class="premium-foot">${note}${bar}</div>` : ''
}

/** "더 갚기" on the Sunday scene's last beat, while 권리금 is left in part 1. */
function payExtraHtml(s) {
  if (s.endingSeen || s.premiumLeft <= 0 || s.ledger?.bankrupt || s.ledger?.premiumDue === undefined) return ''
  const buttons = PREMIUM_EXTRA_STEPS.map((v) => {
    const label = v === 'all' ? '가능한 만큼' : `+${v / 10_000}만`
    const disabled = s.money <= 0 || (v !== 'all' && s.money < Math.min(v, s.premiumLeft))
    return `<button class="btn key pay-extra" data-action="payPremium" data-arg="${v}" ${disabled ? 'disabled' : ''}>${label}</button>`
  }).join('')
  return `<div class="pay-extra-row"><span>권리금 더 갚기</span>${buttons}</div>`
}

/**
 * Sunday off day, played like the opening in the closed shop: caption → her line → the ledger → who has
 * the last word (her, or the landlord when rent was short). Clicking advances; on the last beat it goes on
 * to the shop.
 */
export function sundayHtml(s) {
  const step = s.sundayStep ?? 0
  const line = sundayLine(step, s.ledger)
  const isLast = step >= SUNDAY_LAST_STEP
  const cast = `<span class="cast cast-me ${line?.who === 'me' ? 'talking' : ''}" style="${castStyle('me')}">${castSprite('me', s.character)}</span>`
  const body = step === SUNDAY_LEDGER_STEP ? ledgerHtml(s) : `
      <div class="dialogue ${DIALOGUE_KIND[line.who] ?? ''}">
        ${line.who === 'caption' ? '' : `<b class="speaker">${esc(speakerName(line.who, s.character.name))}</b>`}
        <p>${esc(lineText(line.text, s.character.name))}</p>
        <span class="next-hint">${isLast ? '' : '▶ 클릭 / Space'}</span>
      </div>`
  return `
    <div class="opening-screen sunday-screen" data-action="${isLast ? 'toShop' : 'sundayNext'}">
      <div class="scene ${SUNDAY_BG}">${cast}<span class="day-tag">DAY ${s.day} · ${weekOf(s.day)}주차 ${WEEKDAY_LABEL[weekdayOf(s.day)]}요일</span></div>
      ${body}
      <div class="opening-foot">
        ${isLast ? payExtraHtml(s) : '<span></span>'}
        ${isLast ? `<button class="bubble-btn" data-action="toShop">${s.ledger?.bankrupt ? '…' : s.day === 28 && !s.endingSeen ? '…' : '상점으로 →'}</button>` : ''}
      </div>
    </div>`
}

export const sundayKey = (s) => `sunday|${s.day}|${s.sundayStep ?? 0}|${s.money}|${s.premiumLeft}`

// ---------- day-28 ending (economy E004, design/quick-specs/part1-28-days-2026-09-27.md §C) ----------

// The old "마라판다" sign as a frame on the wall (CSS-drawn for now; pixel art is a later art task).
const endingFrameHtml = (paidInFull) => `
      <span class="ending-frame"><b>마라판다</b>${paidInFull ? '<i class="ending-plate">완납</i>' : ''}</span>`

/**
 * The part-1 ending: the panda walks into the closed Sunday shop for the first time since the takeover.
 * Same stage and dialogue box as the Sunday scene; the frame goes up at ENDING_FRAME_STEP.
 */
export function endingHtml(s) {
  const step = s.endingStep ?? 0
  const line = endingLine(step, s.premiumPaidInFull)
  const isLast = step >= ENDING_LINE_COUNT - 1
  const talking = (who) => (line.who === who ? 'talking' : '')
  const cast = `
      <span class="cast cast-me ${talking('me')}" style="${castStyle('me')}">${castSprite('me', s.character)}</span>
      ${step >= 1 ? `<span class="cast cast-panda ${talking('panda')}" style="${castStyle('panda')}">${castSprite('panda')}</span>` : ''}`
  return `
    <div class="opening-screen sunday-screen ending-screen" data-action="endingNext">
      <div class="scene ${SUNDAY_BG}">${step >= ENDING_FRAME_STEP ? endingFrameHtml(s.premiumPaidInFull) : ''}${cast}</div>
      <div class="dialogue ${DIALOGUE_KIND[line.who] ?? ''}">
        ${line.who === 'caption' ? '' : `<b class="speaker">${esc(speakerName(line.who, s.character.name))}</b>`}
        <p>${esc(lineText(line.text, s.character.name))}</p>
        <span class="next-hint">${isLast ? '' : '▶ 클릭 / Space'}</span>
      </div>
      <div class="opening-foot">
        <span></span>
        ${isLast ? '<button class="bubble-btn" data-action="endingNext">계속 영업하기 →</button>' : ''}
      </div>
    </div>`
}

export const endingKey = (s) => `ending|${s.endingStep ?? 0}|${s.premiumPaidInFull}`

/**
 * The shop closed for missed rent: the same closed Sunday shop behind the closed-down modal, so the run
 * ends where it was decided (reputation closures stay over the business screen).
 */
export function closedSceneHtml(s, modal) {
  const cast = `<span class="cast cast-me" style="${castStyle('me')}">${castSprite('me', s.character)}</span>`
  return `
    <div class="opening-screen sunday-screen">
      <div class="scene ${SUNDAY_BG}">${cast}</div>
    </div>${modal}`
}
