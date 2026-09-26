// DOM rendering for the self-serve variant. Sections re-render only when their key changes;
// bars (patience, cooking, freshness, busy) update every frame.
// Reuses the shared sprites, CSS classes and shop screen; never edits them.
import {
  CHARGE_STEPS, CHECKOUT_PRICE, DAY_LENGTH_SEC, INGREDIENT_BY_ID, PACK_SIZE,
  SPICE_LEVELS,
} from '../data.js'
import { spriteImg } from '../sprites.js'
import { chiliRow, stars, won } from '../ui.js'
import {
  EXTRA_IDS, MODE_LABEL, PERISHABLE_IDS, RESTOCK_BUSY_SEC, SHELF_CAPACITY, SHELF_EXTRAS, SHELF_ITEM_BY_ID, VARIANT_INGREDIENTS,
  WILT_SEC,
} from './data.js'
import {
  checkoutBowlWeight, counterPrice, frontCustomer, hiddenItemLabel, hiddenItems, isClosing, isJustWilted, meatCount,
  ownerLineText,
} from './logic.js'
import { helpHtml, menuHtml, shopHtml, summaryHtml } from './screens.js'
import { isWilting, shelfQty } from './shelf.js'
import { createHtml, createKey, esc, heroImg, openingHtml, openingKey } from './story-ui.js'

const LOW_SHELF = 2

/** Re-renders el only when key changed (keeps buttons stable between clicks). */
function patch(el, key, html) {
  if (!el || el.__key === key) return
  el.__key = key
  el.innerHTML = html()
}

const slot = (root, name) => root.querySelector(`[data-slot="${name}"]`)
const spiceSay = (level) => (level === 0 ? '안 맵게' : `${level}단계`)

/** Bowl contents as ingredient ids → qty (weighed items plus meat, for floating art). */
const bowlItems = (bowl) => ({
  ...bowl.weighed,
  ...Object.fromEntries(['beef', 'lamb'].map((id) => [id, meatCount(bowl, id)]).filter(([, n]) => n > 0)),
})

// Deterministic scatter so floating ingredients do not jump between renders.
function floating(items, px) {
  const list = Object.entries(items).flatMap(([id, q]) => Array.from({ length: q }, () => id))
  return list.map((id, i) => {
    const x = 16 + ((i * 37) % 60)
    const y = 14 + ((i * 53) % 44)
    return `<span class="float" style="left:${x}%;top:${y}%;animation-delay:${(i % 5) * 0.3}s">${spriteImg(INGREDIENT_BY_ID[id].emoji, px, 'float-img')}</span>`
  }).join('')
}

// Three columns so the whole shop fits one screen: shelf (left) · tables + kitchen (centre) · counter (right).
// Stats sit in the top bar instead of a side column. Layout lives in self-serve.css (.game.ss).
const GAME_SKELETON = `
<div class="game ss">
  <header class="topbar ss-top">
    <div class="day-badge" data-slot="day"></div>
    <div class="clock"><div class="clock-fill" data-bar="clock"></div><span class="clock-text" data-text="clock"></span></div>
    <div class="ss-stats" data-slot="side"></div>
  </header>
  <section class="shelf-panel ss-shelf">
    <div class="panel-title">진열대 <small>눌러서 창고에서 보충</small></div>
    <div class="busy" data-busy><i class="busy-track"><b data-bar="busy"></b></i><em>보충 중…</em></div>
    <div class="shelf" data-slot="shelf"></div>
    <div class="info" data-slot="info"></div>
  </section>
  <main class="ss-center">
    <section class="hall">
      <div class="hall-sign">麻辣烫 · 테이블 <small>냄비를 들고 같은 번호 테이블을 누르세요</small></div>
      <div class="seats" data-slot="tables"></div>
    </section>
    <section class="ss-kitchen">
      <div class="rail" data-slot="rail"></div>
      <div class="pots" data-slot="pots"></div>
    </section>
  </main>
  <section class="bowl-panel counter ss-counter" data-slot="counter"></section>
  <div class="toasts" data-slot="toasts"></div>
  <div class="overlay-slot" data-slot="overlay"></div>
</div>`

// ---------- hall: tables ----------

function tablesHtml(s) {
  const isHolding = s.heldPot !== null
  return s.tables.map((t, i) => {
    if (!t) return '<div class="seat empty"><div class="stool"></div><span class="seat-tag">빈 테이블</span></div>'
    return `
      <button class="seat ss-table ${isHolding ? 'can-serve' : ''}" data-action="table" data-arg="${i}">
        <div class="ticket-badge">🎫 ${t.ticketNo}</div>
        <div class="animal">${spriteImg(t.face, 20, 'animal-img')}</div>
        <div class="patience"><div class="patience-fill" data-bar="table-${t.ticketNo}"></div></div>
        <span class="seat-tag">${isHolding ? '여기로 서빙?' : '음식 기다리는 중'}</span>
      </button>`
  }).join('')
}

const tablesKey = (s) => `${s.tables.map((t) => (t ? t.ticketNo : '-')).join(',')}|${s.heldPot !== null}`

// ---------- kitchen: ticket rail + pots ----------

// Compact spice mark for rail tickets: one chili + level, so every ticket fits on one line.
const spiceTag = (level) => (level === 0 ? '순한' : `${spriteImg('🌶️', 10, 'chili')}${level}`)

// The rail holds at most one ticket per table (paid customers are seated), and tables top out
// at 5, so the rail is laid out as 5 fixed slots and never needs to scroll.
function railHtml(s) {
  const tickets = s.rail.map((o) => `
    <button class="ticket" data-action="cook" data-arg="${o.ticketNo}" title="눌러서 냄비에 넣기 · ${MODE_LABEL[o.mode]} ${o.spice}단계">
      <b>🎫${o.ticketNo}</b>${spriteImg(o.face, 16, 'mini-face')}
      <span>${MODE_LABEL[o.mode]}</span><span class="tspice">${spiceTag(o.spice)}</span>
    </button>`).join('')
  return `<div class="rail-title">주문표 <kbd>C</kbd></div>${tickets || '<span class="hint">결제하면 주문표가 여기 걸려요</span>'}`
}

/** Stainless pot on a burner (same art classes as the original flow). */
function potArt(p) {
  const isDone = p && p.remaining <= 0
  const broth = p
    ? `<div class="broth spice-${p.order.spice}">${floating(bowlItems(p.order.bowl), 12)}<i class="bubbles"></i></div>`
    : '<div class="broth off"></div>'
  const flames = p && !isDone ? '<div class="flames"><i></i><i></i><i></i></div>' : ''
  return `
    <div class="pot-art">
      <i class="pot-handle left"></i><i class="pot-handle right"></i>
      <div class="pot-rim">${broth}</div>
      <div class="pot-body"><i class="pot-shine"></i></div>
      <div class="burner">${flames}</div>
    </div>`
}

function potsHtml(s) {
  return s.pots.map((p, i) => {
    if (!p) return `<div class="pot empty"><div class="steam"></div>${potArt(null)}<div class="pot-label">빈 냄비</div></div>`
    const isDone = p.remaining <= 0
    const isHeld = s.heldPot === i
    const label = isDone
      ? `<button class="btn serve ${isHeld ? 'held' : ''}" data-action="pick" data-arg="${i}">${isHeld ? '✋ 들고 있어요' : `🎫${p.ticketNo} 완성! 집기`}</button>`
      : `<span>🎫${p.ticketNo} 보글보글…</span>`
    return `
      <div class="pot ${isDone ? 'done' : 'cooking'} ${isHeld ? 'is-held' : ''}">
        <div class="steam">${isDone ? '♨' : ''}</div>
        ${potArt(p)}
        <div class="pot-bar"><div class="pot-fill" data-bar="pot-${i}"></div></div>
        <div class="pot-label">${label}</div>
      </div>`
  }).join('')
}

const potsKey = (s) => `${s.pots.map((p) => (p ? `${p.ticketNo}:${p.remaining <= 0}` : '-')).join('|')}|${s.heldPot}`

// ---------- counter ----------

function queueHtml(s) {
  return `<div class="q-line">${s.queue.map((c, i) => `
    <span class="q-face ${i === 0 ? 'front' : ''}">${spriteImg(c.face, 16, 'mini-face')}
      <i class="q-bar"><b data-bar="queue-${c.id}"></b></i></span>`).join('') || '<span class="hint">줄이 비었어요</span>'}</div>`
}

/** A dug-out meat or skewer, labelled in the unit it is charged in (every skewer kind = 1,000원 each). */
const foundChip = (item) =>
  `<span class="chip found">${spriteImg(SHELF_ITEM_BY_ID[item.id].emoji, 16, 'chip-img')}${hiddenItemLabel(item)}</span>`

/** The protagonist behind the counter, with her start-of-day line in a speech bubble. */
function ownerHtml(s) {
  const line = ownerLineText(s)
  return `
    <div class="owner">
      ${heroImg(s.character, 'hero-owner')}
      <span class="owner-name">사장 ${esc(s.character.name)}</span>
      ${line ? `<span class="owner-say">${esc(line)}</span>` : ''}
    </div>`
}

function counterHtml(s) {
  const c = frontCustomer(s)
  if (!c) return `${ownerHtml(s)}${queueHtml(s)}<p class="hint center counter-idle">손님이 재료를 담는 중이에요…</p>`
  const { base, charged } = counterPrice(s)
  const hidden = hiddenItems(c.bowl)
  const found = hidden.slice(0, s.counter.revealed).map(foundChip).join('')
  const weighed = Object.entries(c.bowl.weighed).map(([id, q]) =>
    `<span class="chip">${spriteImg(INGREDIENT_BY_ID[id].emoji, 16, 'chip-img')}×${q}</span>`).join('')
  const cilantro = c.bowl.cilantro ? '<span class="chip found">🌿 고수</span>' : ''
  const modes = Object.keys(MODE_LABEL).map((m) =>
    `<button class="mode-btn ${s.counter.mode === m ? 'on' : ''}" data-action="mode" data-arg="${m}">${MODE_LABEL[m]}</button>`).join('')
  const spice = SPICE_LEVELS.map((l) =>
    `<button class="spice-btn lv-${l.level} ${s.counter.spice === l.level ? 'on' : ''}" data-action="spice" data-arg="${l.level}" title="${l.note}">${l.level}</button>`).join('')
  const plus = CHARGE_STEPS.map((v) => `<button class="btn key" data-action="charge" data-arg="${v}">+${v.toLocaleString()}</button>`).join('')
  const minus = CHARGE_STEPS.map((v) => `<button class="btn key ghost" data-action="charge" data-arg="-${v}">−${v.toLocaleString()}</button>`).join('')
  return `
    ${ownerHtml(s)}
    ${queueHtml(s)}
    <div class="bubble say">${spriteImg(c.face, 16, 'mini-face')} "${MODE_LABEL[c.mode]} ${spiceSay(c.spice)}요!"${c.bowl.cilantro ? ' 고수 넣어주세요🌿' : ''}</div>
    <div class="bowl-art small">
      <div class="bowl-rim"><div class="broth spice-0">${floating(c.bowl.weighed, 12)}</div></div>
      <div class="bowl-body"><div class="bowl-inner"><i class="bowl-band"></i></div></div>
      <div class="bowl-foot"></div>
    </div>
    <div class="chips">${found}${cilantro}${weighed}</div>
    <div class="dig-row">
      <span class="bowl-meta">⚖ ${checkoutBowlWeight(c.bowl)}g</span>
      <button class="btn ghost dig" data-action="dig">🥢 뒤적이기 <kbd>Space</kbd></button>
    </div>
    <div class="ticket-row"><span>주문표</span>${modes}</div>
    <div class="spice-pick"><span>맵기</span>${spice}</div>
    <div class="receipt"><span>저울 (${MODE_LABEL[s.counter.mode]} ${won(CHECKOUT_PRICE.ratePer100g[s.counter.mode])}/100g)</span><b>${won(base)}</b></div>
    <div class="till"><small>청구 금액</small> ${won(charged)}</div>
    <div class="keys">${plus}</div>
    <div class="keys">${minus}</div>
    <div class="bowl-actions">
      <button class="btn ghost" data-action="chargeReset">추가금 지우기</button>
      <button class="btn cook" data-action="chargeConfirm">선결제 <kbd>Enter</kbd></button>
    </div>`
}

const counterKey = (s) => `${s.queue.map((c) => c.id).join(',')}|${JSON.stringify(s.counter)}|${ownerLineText(s) ? 'say' : ''}`

// ---------- shelf ----------

// Every shelf slot in display order: ingredients first, then skewers and cilantro.
const SHELF_SLOTS = [...VARIANT_INGREDIENTS, ...SHELF_EXTRAS]
const isSlotLocked = (s, id) => !EXTRA_IDS.includes(id) && !s.unlocked.includes(id)

// Locked ingredients cannot be restocked during the day, so their slots are left off the shelf
// (they are unlocked in the shop); keeps the shelf column short enough to fit the screen.
function shelfHtml(s, view) {
  return SHELF_SLOTS.filter((ing) => !isSlotLocked(s, ing.id)).map((ing) => {
    const qty = shelfQty(s.shelf, ing.id)
    const wilting = isWilting(s.shelf, ing.id)
    const cls = [
      qty === 0 && 'out', qty > 0 && qty <= LOW_SHELF && 'low', wilting && 'wilting',
      isJustWilted(s, ing.id) && 'just-wilted', view.hover === ing.id && 'hover',
    ].filter(Boolean).join(' ')
    const fresh = PERISHABLE_IDS.has(ing.id) && qty > 0 ? `<i class="fresh"><b data-bar="fresh-${ing.id}"></b></i>` : ''
    return `
      <button class="slot ${cls}" data-action="restock" data-arg="${ing.id}" data-hover="${ing.id}" aria-label="${ing.name} 보충">
        ${fresh}
        ${spriteImg(ing.emoji, 16, 'slot-img')}
        <span class="slot-name">${ing.name}</span>
        <span class="stock">${qty}/${SHELF_CAPACITY}</span>
        <span class="wh">창고 ${s.stock[ing.id]}</span>
        ${wilting ? '<span class="wilt-tag">🥀 곧 시듦</span>' : ''}
      </button>`
  }).join('')
}

// Wilt warnings change with time, not stock, so they are part of the re-render key.
const shelfKey = (s, view) =>
  `${SHELF_SLOTS.map((i) => `${shelfQty(s.shelf, i.id)}:${isWilting(s.shelf, i.id) ? 'w' : ''}${isJustWilted(s, i.id) ? 'x' : ''}`).join(',')}|${JSON.stringify(s.stock)}|${s.unlocked}|${view.hover}`

/** Price hint for the hovered shelf item: weighed scoop, meat surcharge, skewer or cilantro. */
function priceLineFor(item) {
  if (item.kind === 'skewer') return `꼬치 1개 ${won(CHECKOUT_PRICE.skewerPrice)} (무게 제외)`
  if (item.kind === 'cilantro') return `고수 ${won(CHECKOUT_PRICE.cilantroSurcharge)} (무게 제외)`
  const meat = { beef: CHECKOUT_PRICE.beefSurcharge, lamb: CHECKOUT_PRICE.lambSurcharge }[item.id]
  return meat ? `고기 추가 ${won(meat)} (무게 제외)` : `1스쿱 ${item.grams}g`
}

function infoHtml(s, view) {
  const ing = SHELF_ITEM_BY_ID[view.hover]
  if (!ing) {
    return '<p><b>사장님, 영업 시작!</b> 손님이 담아 온 그릇을 <b>뒤적여</b> 확인하고, 주문표를 적고 <b>선결제</b>를 받으세요.<br>진열대가 비면 손님이 투덜대고, 너무 채우면 채소가 시들어요.</p>'
  }
  const isLocked = isSlotLocked(s, ing.id)
  const priceLine = priceLineFor(ing)
  const freshLine = PERISHABLE_IDS.has(ing.id) ? ` · ⏳ 진열 ${WILT_SEC}초 후 시듦` : ''
  return `<p><b>${ing.desc}</b></p>
    <p>${priceLine}${freshLine}</p>
    <p>원가 ${won(ing.packCost / PACK_SIZE)} / 개 · ${isLocked ? `🔒 상점에서 ${won(ing.unlockCost)}에 해금` : `진열대 ${shelfQty(s.shelf, ing.id)} · 창고 ${s.stock[ing.id]}`}</p>`
}

/** One-line stats strip for the top bar (replaces the original flow's side column). */
function sideHtml(s, view) {
  return `
    <div class="stat" title="돈">${spriteImg('🪙', 16, 'stat-img')}<span>${s.money.toLocaleString()}</span></div>
    <div class="stat rating" title="평판">${stars(s.rating)}<small>${s.rating.toFixed(1)}</small></div>
    <div class="stat" title="서빙한 손님">${spriteImg('😋', 16, 'stat-img')}<span>${s.stats.served}</span></div>
    <div class="stat" title="떠난 손님">${spriteImg('😤', 16, 'stat-img')}<span>${s.stats.left}</span></div>
    <div class="stat" title="시든 재료">🥀<span>${s.stats.wasted}</span></div>
    <button class="btn pause" data-action="pause" title="일시정지 (P / Esc)">${view.paused ? '▶' : '⏸'}</button>`
}

function overlayHtml(s, view) {
  if (s.phase === 'summary') return summaryHtml(s)
  if (view.help) return helpHtml()
  if (view.paused) {
    return '<div class="overlay"><div class="modal small"><h2>일시정지</h2><button class="btn big" data-action="pause">계속하기</button><button class="btn ghost" data-action="menu">타이틀로</button></div></div>'
  }
  return ''
}

// ---------- per-frame bars ----------

function setBar(root, name, ratio) {
  const el = root.querySelector(`[data-bar="${name}"]`)
  if (el) el.style.width = `${Math.max(0, Math.min(1, ratio)) * 100}%`
  return el
}

function setLevelBar(root, name, ratio) {
  const el = setBar(root, name, ratio)
  if (el) el.dataset.level = ratio > 0.5 ? 'ok' : ratio > 0.25 ? 'warn' : 'bad'
}

function updateBars(root, s) {
  const left = Math.max(0, DAY_LENGTH_SEC - s.dayTime)
  setBar(root, 'clock', left / DAY_LENGTH_SEC)
  const clockText = root.querySelector('[data-text="clock"]')
  if (clockText) clockText.textContent = isClosing(s) ? '마감! 남은 손님만 받아요' : `영업 ${Math.ceil(left)}초 남음`
  s.queue.forEach((c) => setLevelBar(root, `queue-${c.id}`, c.patience / c.maxPatience))
  s.tables.forEach((t) => t && setLevelBar(root, `table-${t.ticketNo}`, t.patience / t.maxPatience))
  s.pots.forEach((p, i) => p && setBar(root, `pot-${i}`, 1 - p.remaining / p.total))
  Object.entries(s.shelf).forEach(([id, batches]) =>
    batches[0] && PERISHABLE_IDS.has(id) && setLevelBar(root, `fresh-${id}`, 1 - batches[0].age / WILT_SEC))
  const busy = root.querySelector('[data-busy]')
  if (busy) busy.classList.toggle('on', s.busy > 0)
  setBar(root, 'busy', s.busy / RESTOCK_BUSY_SEC)
}

// ---------- entry ----------

/** Renders the current phase into root. `view` holds UI-only state (hover, pause, help). */
export function render(root, s, view) {
  const screen = ['menu', 'shop', 'create', 'opening'].includes(s.phase) ? s.phase : 'game'
  if (root.dataset.screen !== screen) {
    root.dataset.screen = screen
    root.__key = null
    root.innerHTML = screen === 'game' ? GAME_SKELETON : ''
  }
  if (screen === 'menu') {
    return patch(root, `menu|${view.hasSave}|${view.help}`, () => menuHtml(view) + (view.help ? helpHtml() : ''))
  }
  if (screen === 'create') return patch(root, createKey(s), () => createHtml(s))
  if (screen === 'opening') return patch(root, openingKey(s), () => openingHtml(s))
  if (screen === 'shop') {
    const key = `shop|${s.money}|${s.pricePer100g}|${JSON.stringify(s.stock)}|${s.unlocked}|${JSON.stringify(s.upgrades)}|${s.toasts.map((t) => t.id)}`
    return patch(root, key, () => shopHtml(s))
  }
  patch(slot(root, 'day'), `${s.day}`, () => `DAY ${s.day}`)
  patch(slot(root, 'tables'), tablesKey(s), () => tablesHtml(s))
  patch(slot(root, 'rail'), s.rail.map((o) => o.ticketNo).join(','), () => railHtml(s))
  patch(slot(root, 'pots'), potsKey(s), () => potsHtml(s))
  patch(slot(root, 'counter'), counterKey(s), () => counterHtml(s))
  patch(slot(root, 'shelf'), shelfKey(s, view), () => shelfHtml(s, view))
  patch(slot(root, 'info'), `${view.hover}|${shelfKey(s, view)}`, () => infoHtml(s, view))
  patch(slot(root, 'side'), `${s.money}|${s.rating.toFixed(2)}|${JSON.stringify(s.stats)}|${view.paused}`, () => sideHtml(s, view))
  patch(slot(root, 'toasts'), s.toasts.map((t) => t.id).join(','), () =>
    s.toasts.map((t) => `<div class="toast ${t.kind}">${t.text}</div>`).join(''))
  patch(slot(root, 'overlay'), `${s.phase}|${view.paused}|${view.help}`, () => overlayHtml(s, view))
  return updateBars(root, s)
}
