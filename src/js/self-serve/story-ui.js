// Story screens for the self-serve variant: character creation, opening cutscene, and the
// protagonist sprite used on the counter and in the day summary.
// design/quick-specs/story-character-2026-09-25.md
import { spriteImg } from '../sprites.js'
import { won } from '../ui.js'
import { APRON_COLORS, HAIR_COLORS, HAIR_STYLES, characterSprite } from './character.js'
import { NAME_MAX_LEN, PREMIUM_EXTRA_STEPS, PREMIUM_TOTAL, RENT, WEEKDAY_LABEL, weekOf, weekdayOf } from './data.js'
import {
  ENDING_FRAME_STEP, ENDING_LINE_COUNT, OPENING_SCENES, PART2_BANNER_STEP, PART2_TEASER_LINE_COUNT, STAGE, SUNDAY_BG, endingLine, premiumLine,
  SUNDAY_LAST_STEP, SUNDAY_LEDGER_STEP, castSpot, lineText, speakerName, storyName, sundayLine, teaserLine,
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

// Approved A design, 96×160; tools/art/panda_sprite.py restores the approved PNG.
const PANDA_IMG = '<img class="panda-sprite" src="img/panda.png?v=3" alt="판다 사장님" draggable="false">'
const pct = (v, of) => `${((v / of) * 100).toFixed(3)}%`
/** Stage px → % of the scene, so the cast scales with the background and keeps its painted spot. */
const castStyle = (who) => {
  const { x, w } = castSpot(who)
  return `left:${pct(x, STAGE.w)};width:${pct(w, STAGE.w)};bottom:${pct(STAGE.floor, STAGE.h)}`
}
const castSprite = (who, look) => (who === 'me' ? heroImg(look, 'hero-scene') : PANDA_IMG)

const DIALOGUE_KIND = { notice: 'is-notice', caption: 'is-caption' }

// Illustrated story beats; line thresholds preserve the script's entrances and departures.
const OPENING_ART = {
  office: [[0, '01-office', '야근을 마치고 마라판다로 걸어가는 주인공']],
  regular: [[0, '02-regular', '단골 주인공을 반기는 판다 사장님']],
  notice: [[0, '03-notice', '불 꺼진 가게의 안내문을 읽는 주인공'], [4, '04-offer', '가게 인수를 제안하는 판다 사장님']],
  takeover: [[0, '05-apron', '판다 사장님에게 앞치마를 받는 주인공'], [5, '06-alone', '가게에 혼자 남은 주인공'], [7, '07-open', '마라부자의 첫 영업을 시작하는 주인공']],
}

// Both rainy beats share the approved 1672×941 plate; only the transparent cast moves.
const RAIN_CAST = {
  '03-notice': [['reading', 1070, 447, 198]],
  '04-offer': [['talk-protagonist', 150, 368, 205], ['talk-panda', 355, 368, 441]],
}

function openingArtHtml(art, alt) {
  const cast = RAIN_CAST[art]
  if (!cast) return `<div class="scene opening-illustration"><img src="img/opening-approved/${art}.png" alt="${alt}" draggable="false" fetchpriority="high"></div>`
  return `<div class="scene opening-illustration opening-layered" role="img" aria-label="${alt}">
    <img class="opening-plate" src="img/opening-approved/rain-background.png" alt="" draggable="false" fetchpriority="high">
    ${cast.map(([file, x, y, width]) => `<img class="opening-cast" src="img/opening-approved/layers/${file}.png" alt="" draggable="false" style="left:${pct(x, 1672)};top:${pct(y, 941)};width:${pct(width, 1672)}">`).join('')}
  </div>`
}

/** One line of the opening: scene art on top, dialogue box below. Clicking anywhere advances. */
export function openingHtml(s) {
  const { scene: sceneIdx, line: lineIdx } = s.story
  const scene = OPENING_SCENES[sceneIdx]
  const line = scene.lines[lineIdx]
  const [, art, alt] = OPENING_ART[scene.id].filter(([from]) => lineIdx >= from).at(-1)
  const dots = OPENING_SCENES.map((_, i) => `<i class="${i === sceneIdx ? 'on' : ''}"></i>`).join('')
  return `
    <div class="opening-screen" data-action="storyNext">
      ${openingArtHtml(art, alt)}
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
  const line = sundayLine(step, s.ledger, s.day)
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

/**
 * The framed culinary succession certificate stays on the hall wall after the ending.
 * @param {boolean} paidInFull shows the gold "완납" plate
 * @param {boolean} [drop] plays the hang-up animation (only the moment it goes up in the ending)
 */
export const wallFrameHtml = (paidInFull, drop = false) =>
  `<span class="wall-frame${drop ? ' drop' : ''}"><b>마라판다의 맛 · 전수증</b><small>마라판다 주인장</small><svg class="certificate-paw" viewBox="0 0 40 40" aria-hidden="true"><ellipse cx="20" cy="27" rx="11" ry="9"/><ellipse cx="7" cy="16" rx="4" ry="6"/><ellipse cx="15" cy="9" rx="4" ry="6"/><ellipse cx="25" cy="9" rx="4" ry="6"/><ellipse cx="33" cy="16" rx="4" ry="6"/></svg>${paidInFull ? '<i class="wall-plate">완납</i>' : ''}</span>`

/**
 * Illustrated part-1 ending: ledger, settlement, then the succession certificate.
 * The paid and forgiven dialogue branches share the art; only full repayment earns the badge.
 */
export function endingHtml(s) {
  const step = s.endingStep ?? 0
  const line = endingLine(step, s.premiumPaidInFull)
  const isLast = step >= ENDING_LINE_COUNT - 1
  const art = step >= ENDING_FRAME_STEP ? '08-certificate' : step >= 1 ? '02-settlement' : '01-ledger'
  const alt = step >= ENDING_FRAME_STEP ? '붉은 발바닥 도장이 찍힌 마라판다의 맛 전수증을 전하는 판다 사장님' : step >= 1 ? '마지막 장부를 함께 확인하는 주인공과 판다 사장님' : '일요일 저녁 마지막 정산을 하는 주인공'
  const paidBadge = s.premiumPaidInFull && step >= 1 ? '<span class="ending-paid">권리금 완납</span>' : ''
  return `
    <div class="opening-screen sunday-screen ending-screen" data-action="endingNext">
      <div class="scene opening-illustration ending-illustration"><img src="img/story-v2/ending/${art}.png" alt="${alt}" draggable="false">${paidBadge}</div>
      <div class="dialogue ${DIALOGUE_KIND[line.who] ?? ''}">
        ${line.who === 'caption' ? '' : `<b class="speaker">${esc(speakerName(line.who, s.character.name))}</b>`}
        <p>${esc(lineText(line.text, s.character.name))}</p>
        <span class="next-hint">${isLast ? '' : '▶ 클릭 / Space'}</span>
      </div>
      <div class="opening-foot">
        <span></span>
        ${isLast ? '<button class="bubble-btn" data-action="endingNext">계속 →</button>' : ''}
      </div>
    </div>`
}

export const endingKey = (s) => `ending|${s.endingStep ?? 0}|${s.premiumPaidInFull}`

// ---------- part-2 teaser (story N003, design/quick-specs/part1-28-days-2026-09-27.md §D) ----------

/** Day 29: a small, cute rabbit applies, then the rival storefront is revealed before the credits. */
export function teaserHtml(s) {
  const step = s.teaserStep ?? 0
  const line = teaserLine(step)
  const isLast = step >= PART2_TEASER_LINE_COUNT - 1
  const art = step >= PART2_BANNER_STEP ? '05-franchise' : '04-rabbit'
  const alt = step >= PART2_BANNER_STEP ? '창밖 맞은편의 새 마라탕 가게를 바라보는 주인공과 작은 토끼' : '월요일 아침 가게에 찾아온 귀여운 토끼 알바 지원자'
  const banner = step >= PART2_BANNER_STEP
    ? `<span class="franchise-banner">대형 마라탕 프랜차이즈<b>오픈 예정</b></span>`
    : ''
  return `
    <div class="opening-screen sunday-screen ending-screen teaser-screen" data-action="teaserNext">
      <div class="scene opening-illustration ending-illustration"><img src="img/story-v2/ending/${art}.png" alt="${alt}" draggable="false">${banner}</div>
      <div class="dialogue ${DIALOGUE_KIND[line.who] ?? ''}">
        ${line.who === 'caption' ? '' : `<b class="speaker">${esc(speakerName(line.who, s.character.name))}</b>`}
        <p>${esc(lineText(line.text, s.character.name))}</p>
        <span class="next-hint">${isLast ? '' : '▶ 클릭 / Space'}</span>
      </div>
      <div class="opening-foot">
        <span></span>
        ${isLast ? '<button class="bubble-btn" data-action="teaserNext">엔딩 크레딧 →</button>' : ''}
      </div>
    </div>`
}

export const teaserKey = (s) => `teaser|${s.teaserStep ?? 0}`

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
