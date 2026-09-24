// DOM rendering. Sections re-render only when their key changes; bars update every frame.
import {
  CHARGE_STEPS, CHECKOUT_PRICE, DAY_LENGTH_SEC, INGREDIENTS, INGREDIENT_BY_ID, MAX_RATING, PACK_SIZE,
  SKEWER_ITEM_BY_ID, SPICE_LEVELS,
} from './data.js'
import { checkoutBowlWeight, isBowlEmpty, isClosing, meatPortions, toCheckoutBowl } from './logic.js'
import { spriteImg } from './sprites.js'
import { helpHtml, menuHtml, shopHtml, summaryHtml } from './screens.js'

export const won = (n) => `${n.toLocaleString()}원`

/** Re-renders el only when key changed (keeps buttons stable between clicks). */
function patch(el, key, html) {
  if (!el || el.__key === key) return
  el.__key = key
  el.innerHTML = html()
}

const slot = (root, name) => root.querySelector(`[data-slot="${name}"]`)

/** Chili sprites for a spice level (0 shows "순한맛"). */
export function chiliRow(level, px = 12) {
  if (level === 0) return '<span class="mild">순한맛</span>'
  return `${Array.from({ length: level }, () => spriteImg('🌶️', px, 'chili')).join('')}<span class="spice-lv">${level}단계</span>`
}

// Deterministic scatter so floating ingredients do not jump between renders.
function floating(items, px) {
  const list = Object.entries(items).flatMap(([id, q]) => Array.from({ length: q }, () => id))
  // Kept inside the oval broth surface (edges are clipped by the rim's rounded shape).
  return list.map((id, i) => {
    const x = 16 + ((i * 37) % 60)
    const y = 14 + ((i * 53) % 44)
    return `<span class="float" style="left:${x}%;top:${y}%;animation-delay:${(i % 5) * 0.3}s">${spriteImg(INGREDIENT_BY_ID[id].emoji, px, 'float-img')}</span>`
  }).join('')
}

const GAME_SKELETON = `
<div class="game">
  <main class="stage">
    <header class="topbar">
      <div class="day-badge" data-slot="day"></div>
      <div class="clock"><div class="clock-fill" data-bar="clock"></div><span class="clock-text" data-text="clock"></span></div>
      <span class="hourglass">⌛</span>
    </header>
    <section class="hall">
      <div class="hall-sign">麻辣烫 · 마라탕</div>
      <div class="seats" data-slot="seats"></div>
    </section>
    <section class="kitchen">
      <div class="pots" data-slot="pots"></div>
      <div class="bowl-panel" data-slot="bowl"></div>
    </section>
    <section class="shelf-panel">
      <div class="panel-title">재료 선택 <small>클릭해서 그릇에 담기</small></div>
      <div class="shelf" data-slot="shelf"></div>
      <div class="info" data-slot="info"></div>
    </section>
  </main>
  <aside class="side" data-slot="side"></aside>
  <div class="toasts" data-slot="toasts"></div>
  <div class="overlay-slot" data-slot="overlay"></div>
</div>`

// ---------- sections ----------

function seatsHtml(s) {
  const selected = s.customers.find((c) => c.id === s.selectedCustomerId)
  const cards = Array.from({ length: s.upgrades.seats }, (_, i) => {
    const c = s.customers[i]
    if (!c) return '<div class="seat empty"><div class="stool"></div><span class="seat-tag">빈 자리</span></div>'
    const isSel = c === selected
    const items = Object.entries(c.order.items).map(([id, q]) => {
      const done = isSel && (s.bowl.items[id] ?? 0) >= q
      return `<span class="oi ${done ? 'ok' : ''}">${spriteImg(INGREDIENT_BY_ID[id].emoji, 16, 'oi-img', INGREDIENT_BY_ID[id].name)}<b>×${q}</b></span>`
    }).join('')
    const spiceOk = isSel && s.bowl.spice === c.order.spice
    const tag = isSel ? '▼ 주문 받는 중' : c.status === 'cooking' ? '🍲 조리중…' : '대기중'
    return `
      <button class="seat ${isSel ? 'is-selected' : ''} ${c.status === 'cooking' ? 'is-cooking' : ''}" data-action="select" data-arg="${c.id}">
        <div class="bubble"><div class="order-items">${items}</div><div class="order-spice ${spiceOk ? 'ok' : ''}">${chiliRow(c.order.spice)}</div></div>
        <div class="animal">${spriteImg(c.face, 20, 'animal-img')}</div>
        <div class="patience"><div class="patience-fill" data-bar="patience-${c.id}"></div></div>
        <span class="seat-tag">${tag}</span>
      </button>`
  })
  return cards.join('')
}

function seatsKey(s) {
  const cs = s.customers.map((c) => `${c.id}:${c.status}`).join(',')
  return `${s.upgrades.seats}|${cs}|${s.selectedCustomerId}|${JSON.stringify(s.bowl)}`
}

/** Stainless pot on a burner: handles, broth surface, body, and flames while cooking. */
function potArt(p) {
  const done = p && p.remaining <= 0
  const broth = p
    ? `<div class="broth spice-${p.bowl.spice}">${floating(p.bowl.items, 12)}<i class="bubbles"></i></div>`
    : '<div class="broth off"></div>'
  const flames = p && !done ? '<div class="flames"><i></i><i></i><i></i></div>' : ''
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
    const c = s.customers.find((x) => x.id === p.customerId)
    const done = p.remaining <= 0
    const face = c ? spriteImg(c.face, 16, 'mini-face') : ''
    const label = done
      ? `<button class="btn serve" data-action="serve" data-arg="${i}">완성! 서빙 ${face}</button>`
      : `<span>${face} 보글보글…</span>`
    return `
      <div class="pot ${done ? 'done' : 'cooking'}">
        <div class="steam">${done ? '♨' : ''}</div>
        ${potArt(p)}
        <div class="pot-bar"><div class="pot-fill" data-bar="pot-${i}"></div></div>
        <div class="pot-label">${label}</div>
      </div>`
  }).join('')
}

const potsKey = (s) => s.pots.map((p) => (p ? `${p.customerId}:${p.remaining <= 0}` : '-')).join('|') +
  `|${s.customers.map((c) => c.id).join(',')}`

function bowlHtml(s) {
  const c = s.customers.find((x) => x.id === s.selectedCustomerId)
  const title = c ? `${spriteImg(c.face, 16, 'mini-face')} 손님 그릇` : '손님을 먼저 골라주세요'
  const chips = Object.entries(s.bowl.items).map(([id, q]) =>
    `<button class="chip" data-action="remove" data-arg="${id}" title="하나 빼기">${spriteImg(INGREDIENT_BY_ID[id].emoji, 16, 'chip-img')}×${q}</button>`).join('')
  const spice = SPICE_LEVELS.map((l) =>
    `<button class="spice-btn lv-${l.level} ${s.bowl.spice === l.level ? 'on' : ''}" data-action="spice" data-arg="${l.level}" title="${l.note}">${l.level}</button>`).join('')
  const empty = isBowlEmpty(s.bowl)
  return `
    <div class="bowl-title">${title}</div>
    <div class="bowl-art">
      <div class="bowl-rim"><div class="broth spice-${s.bowl.spice}">${floating(s.bowl.items, 12)}</div></div>
      <div class="bowl-body"><div class="bowl-inner"><i class="bowl-band"></i></div></div>
      <div class="bowl-foot"></div>
    </div>
    <div class="chips">${chips || '<span class="hint">재료를 담아주세요</span>'}</div>
    <div class="bowl-meta">⚖ ${checkoutBowlWeight(toCheckoutBowl(s.bowl))}g <small>(고기 제외)</small></div>
    <div class="spice-pick"><span>맵기</span>${spice}</div>
    <div class="bowl-actions">
      <button class="btn ghost" data-action="clear" ${empty ? 'disabled' : ''}>비우기</button>
      <button class="btn cook" data-action="cook" ${empty || !c ? 'disabled' : ''}>조리하기! <kbd>Space</kbd></button>
    </div>`
}

function shelfHtml(s, view) {
  return INGREDIENTS.map((ing) => {
    const locked = !s.unlocked.includes(ing.id)
    const stock = s.stock[ing.id]
    return `
      <button class="slot ${locked ? 'locked' : ''} ${!locked && stock === 0 ? 'out' : ''} ${view.hover === ing.id ? 'hover' : ''}"
        data-action="scoop" data-arg="${ing.id}" data-hover="${ing.id}" ${locked ? 'disabled' : ''} aria-label="${ing.name}">
        ${spriteImg(ing.emoji, 16, 'slot-img')}
        <span class="slot-name">${ing.name}</span>
        <span class="stock">${locked ? '🔒' : stock}</span>
      </button>`
  }).join('')
}

function infoHtml(s, view) {
  const ing = INGREDIENT_BY_ID[view.hover]
  if (!ing) return '<p><b>사장님, 영업 시작!</b> 손님 말풍선의 재료와 맵기대로 담고 조리하세요.<br>서빙하면 <b>계산대</b>가 저울 금액을 찍어줘요. 고기·꼬치 추가금만 직접 더하세요!</p>'
  const locked = !s.unlocked.includes(ing.id)
  const meat = { beef: CHECKOUT_PRICE.beefSurcharge, lamb: CHECKOUT_PRICE.lambSurcharge }[ing.id]
  const priceLine = meat ? `1개당 ${won(meat)} 추가 (무게 제외)` : `1스쿱 ${ing.grams}g`
  return `<p><b>${ing.desc}</b></p>
    <p>${priceLine}</p>
    <p>원가 : ${won(ing.packCost / PACK_SIZE)} / 스쿱 · ${locked ? `🔒 상점에서 ${won(ing.unlockCost)}에 해금` : `재고 ${s.stock[ing.id]}개`}</p>`
}

/** Star row for a 0–5 rating. */
export function stars(rating) {
  return Array.from({ length: MAX_RATING }, (_, i) =>
    `<span class="star ${rating >= i + 0.75 ? 'full' : rating >= i + 0.25 ? 'half' : ''}">★</span>`).join('')
}

function sideHtml(s, view) {
  return `
    <div class="logo">마라<br>부자</div>
    <div class="stat">${spriteImg('🪙', 16, 'stat-img')}<span>× ${s.money.toLocaleString()}</span></div>
    <div class="stat rating">${stars(s.rating)}<small>${s.rating.toFixed(1)}</small></div>
    <div class="stat">${spriteImg('😋', 16, 'stat-img')}<span>× ${s.stats.served}</span></div>
    <div class="stat">${spriteImg('😤', 16, 'stat-img')}<span>× ${s.stats.left + s.stats.refused}</span></div>
    <div class="stat price">100g당 ${won(s.pricePer100g)}</div>
    <button class="btn pause" data-action="pause">${view.paused ? '계속하기' : '일시정지'}</button>
    <div class="coins" aria-hidden="true">${'<i></i>'.repeat(14)}</div>`
}

const MODE_LABEL = { maratang: '마라탕', shanguo: '샹궈' }

/** Register modal: the owner reads the scale and extras, then punches in the charge. */
function checkoutHtml(pc) {
  const b = pc.bowl
  const extras = [
    meatPortions(b.beef) > 0 && `🥩 소고기 ×${meatPortions(b.beef)}`,
    meatPortions(b.lamb) > 0 && `🍖 양고기 ×${meatPortions(b.lamb)}`,
    ...Object.entries(b.skewers).filter(([, n]) => n > 0)
      .map(([id, n]) => `${SKEWER_ITEM_BY_ID[id].emoji} ${SKEWER_ITEM_BY_ID[id].name} 꼬치 ×${n}`),
    b.cilantro && '🌿 고수',
  ].filter(Boolean)
  const steps = CHARGE_STEPS.map((v) =>
    `<button class="btn key" data-action="charge" data-arg="${v}">+${v.toLocaleString()}</button>`).join('')
  const minus = CHARGE_STEPS.map((v) =>
    `<button class="btn key ghost" data-action="charge" data-arg="-${v}">−${v.toLocaleString()}</button>`).join('')
  const rate = CHECKOUT_PRICE.ratePer100g[b.mode]
  return `
    <div class="overlay light"><div class="modal register">
      <h2>${spriteImg(pc.face, 16, 'mini-face')} 계산대</h2>
      <div class="scale">⚖ <b>${pc.weight}g</b> · ${MODE_LABEL[b.mode]} <small>(100g당 ${won(rate)})</small></div>
      <div class="receipt"><span>저울 금액 (자동)</span><b>${won(pc.basePrice)}</b></div>
      <div class="extras-title">추가 재료 — 직접 더하세요</div>
      <ul class="extras">${extras.map((e) => `<li>${e}</li>`).join('') || '<li class="hint">추가 재료 없음</li>'}</ul>
      <p class="price-note">소고기 1개 ${won(CHECKOUT_PRICE.beefSurcharge)} · 양고기 1개 ${won(CHECKOUT_PRICE.lambSurcharge)} · 꼬치 1개 ${won(CHECKOUT_PRICE.skewerPrice)} · 고수 ${won(CHECKOUT_PRICE.cilantroSurcharge)}</p>
      <div class="till"><small>청구 금액</small> ${won(pc.charged)}</div>
      <div class="keys">${steps}</div>
      <div class="keys">${minus}</div>
      <div class="bowl-actions">
        <button class="btn ghost" data-action="chargeReset">추가금 지우기</button>
        <button class="btn cook" data-action="chargeConfirm">청구하기 <kbd>Enter</kbd></button>
      </div>
    </div></div>`
}

function overlayHtml(s, view) {
  if (s.phase === 'summary') return summaryHtml(s)
  if (s.pendingCheckout && !view.paused && !view.help) return checkoutHtml(s.pendingCheckout)
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

function updateBars(root, s) {
  const left = Math.max(0, DAY_LENGTH_SEC - s.dayTime)
  setBar(root, 'clock', left / DAY_LENGTH_SEC)
  const clockText = root.querySelector('[data-text="clock"]')
  if (clockText) clockText.textContent = isClosing(s) ? '마감! 남은 손님만 받아요' : `영업 ${Math.ceil(left)}초 남음`
  s.customers.forEach((c) => {
    const ratio = c.patience / c.maxPatience
    const el = setBar(root, `patience-${c.id}`, ratio)
    if (el) el.dataset.level = ratio > 0.5 ? 'ok' : ratio > 0.25 ? 'warn' : 'bad'
  })
  s.pots.forEach((p, i) => p && setBar(root, `pot-${i}`, 1 - p.remaining / p.total))
}

// ---------- entry ----------

/** Renders the current phase into root. `view` holds UI-only state (hover, pause, help). */
export function render(root, s, view) {
  const screen = s.phase === 'menu' || s.phase === 'shop' ? s.phase : 'game'
  if (root.dataset.screen !== screen) {
    root.dataset.screen = screen
    root.__key = null
    root.innerHTML = screen === 'game' ? GAME_SKELETON : ''
  }
  if (screen === 'menu') {
    return patch(root, `menu|${view.hasSave}|${view.help}`, () => menuHtml(view) + (view.help ? helpHtml() : ''))
  }
  if (screen === 'shop') {
    const key = `shop|${s.money}|${s.pricePer100g}|${JSON.stringify(s.stock)}|${s.unlocked}|${JSON.stringify(s.upgrades)}|${s.toasts.map((t) => t.id)}`
    return patch(root, key, () => shopHtml(s))
  }
  patch(slot(root, 'day'), `${s.day}`, () => `DAY ${s.day}`)
  patch(slot(root, 'seats'), seatsKey(s), () => seatsHtml(s))
  patch(slot(root, 'pots'), potsKey(s), () => potsHtml(s))
  patch(slot(root, 'bowl'), `${JSON.stringify(s.bowl)}|${s.selectedCustomerId}|${s.pricePer100g}`, () => bowlHtml(s))
  patch(slot(root, 'shelf'), `${JSON.stringify(s.stock)}|${s.unlocked}|${view.hover}`, () => shelfHtml(s, view))
  patch(slot(root, 'info'), `${view.hover}|${JSON.stringify(s.stock)}`, () => infoHtml(s, view))
  patch(slot(root, 'side'), `${s.money}|${s.rating.toFixed(2)}|${JSON.stringify(s.stats)}|${s.pricePer100g}|${view.paused}`, () => sideHtml(s, view))
  patch(slot(root, 'toasts'), s.toasts.map((t) => t.id).join(','), () =>
    s.toasts.map((t) => `<div class="toast ${t.kind}">${t.text}</div>`).join(''))
  const checkoutKey = s.pendingCheckout ? `${s.pendingCheckout.customerId}:${s.pendingCheckout.charged}` : '-'
  patch(slot(root, 'overlay'), `${s.phase}|${view.paused}|${view.help}|${checkoutKey}`, () => overlayHtml(s, view))
  return updateBars(root, s)
}
