// DOM rendering for the self-serve variant. Sections re-render only when their key changes;
// bars (patience, cooking, freshness, busy) update every frame.
// Reuses the shared sprites, CSS classes and shop screen; never edits them.
import {
  CHARGE_STEPS, CHECKOUT_PRICE, DAY_LENGTH_SEC, INGREDIENT_BY_ID, PACK_SIZE,
  SPICE_LEVELS,
} from '../data.js'
import { spriteImg } from '../sprites.js'
import { queueFaceImg, seatedCustomerHtml } from './animal-faces.js?v=4'
import { chiliRow, stars, won } from '../ui.js'
import {
  EXTRA_IDS, MODE_LABEL, PERISHABLE_IDS, SIDE_BY_ID, RESTOCK_BUSY_SEC, SHELF_CAPACITY, SHELF_EXTRAS, SHELF_ITEM_BY_ID, VARIANT_INGREDIENTS,
  WEEKDAY_LABEL, WILT_SEC, weekdayOf,
} from './data.js'
import {
  checkoutBowlWeight, counterPrice, frontCustomer, hiddenItemLabel, hiddenItems, isClosing, isJustWilted, meatCount,
  frontRegular, hasWok, ownerLineText, ownerLineWho,
} from './logic.js'
import { REGULARS } from './story.js'
import { closedHtml, creditsHtml, helpHtml, menuHtml, musicControlsHtml, settingsHtml, shopHtml, summaryHtml } from './screens.js'
import { spriteText } from './emoji-text.js'
import { potZoom, tableSpots } from './shop-stage.js'
import { tutorialStep } from './tutorial.js'
import { isWilting, shelfQty } from './shelf.js'
import {
  createHtml, createKey, esc, heroImg, closedSceneHtml, endingHtml, endingKey, openingHtml, openingKey, sundayHtml, sundayKey, teaserHtml, teaserKey,
  wallFrameHtml,
} from './story-ui.js'

const LOW_SHELF = 2

/** Re-renders el only when key changed (keeps buttons stable between clicks); emoji in text become sprites. */
function patch(el, key, html) {
  if (!el || el.__key === key) return
  el.__key = key
  el.innerHTML = spriteText(html())
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

// Counter bowl (feedback 2026-09-27): the scooped ingredients bob on their own layer (not masked by the broth, where the
// rim hid them), but inside the bowl's mouth — the broth ellipse spans ~7–93% × 14–79% of the rim art, so with 20px
// icons on the 164×56 rim they sit at 16–70% across and 14–41% down (feedback 2026-09-27: they floated above the bowl).
function floatAbove(items, px) {
  const list = Object.entries(items).flatMap(([id, q]) => Array.from({ length: q }, () => id))
  return list.map((id, i) => {
    const x = 16 + ((i * 23) % 55) // 23 and 17 step far apart mod 55/28, so neighbours never stack
    const y = 14 + ((i * 17) % 28)
    return `<span class="float" style="left:${x}%;top:${y}%;animation-delay:${(i % 5) * 0.3}s">${spriteImg(INGREDIENT_BY_ID[id].emoji, px, 'float-img')}</span>`
  }).join('')
}

// Layout (feedback 2026-09-27): hall · ticket rail · kitchen strip on the left, counter on the right, shelf along the bottom.
// Stats sit in the top bar instead of a side column. Layout lives in self-serve.css (.game.ss).
const GAME_SKELETON = `
<div class="game ss">
  <header class="topbar ss-top">
    <div class="day-badge" data-slot="day"></div>
    <div class="clock"><div class="clock-fill" data-bar="clock"></div><span class="clock-text" data-text="clock"></span></div>
    <div class="ss-stats" data-slot="side"></div>
  </header>
  <main class="ss-center">
    <section class="shop-scene" aria-label="마라부자 홀 — 식탁">
      <div class="shop-stage">
        <div class="open-board" data-slot="open-board"></div>
        <div class="wall-frame-slot" data-slot="wall-frame"></div>
        <div class="seats" data-slot="tables"></div>
      </div>
    </section>
    <div class="rail" data-slot="rail"></div>
    <section class="ss-kitchen" aria-label="주방 — 냄비와 웍">
      <div class="pots" data-slot="pots"></div>
      <div class="wok" data-slot="wok"></div>
    </section>
    <p class="shop-hint">완성된 냄비를 눌러 들고 → 같은 🎫 번호 식탁을 누르세요</p>
  </main>
  <section class="bowl-panel counter ss-counter" data-slot="counter"></section>
  <section class="shelf-panel ss-shelf">
    <div class="panel-title">진열대 <small>눌러서 창고에서 보충</small></div>
    <div class="busy" data-busy><i class="busy-track"><b data-bar="busy"></b></i><em>보충 중…</em></div>
    <div class="shelf" data-slot="shelf"></div>
    <div class="info" data-slot="info"></div>
  </section>
  <div class="tutorial-slot" data-slot="tutorial"></div>
  <div class="toasts" data-slot="toasts"></div>
  <div class="overlay-slot" data-slot="overlay"></div>
</div>`

// ---------- hall: tables ----------

// Front-facing furniture; the tabletop conceals the customer's lower torso.
// Spots come from tableSpots (art px); CSS multiplies by one art px (--apx) so they scale with the stage.
const TABLE_FURNITURE = '<i class="chair"></i><i class="table-top"></i>'

function tablesHtml(s) {
  const isHolding = s.heldPot !== null
  const spots = tableSpots(s.tables.length)
  return s.tables.map((t, i) => {
    const spot = `style="--x:${spots[i].x};--w:${spots[i].w}"`
    const plate = `<b class="table-no">${i + 1}</b>`
    if (!t) return `<div class="seat empty" ${spot}>${TABLE_FURNITURE}${plate}</div>`
    return `
      <button class="seat ss-table ${isHolding ? 'can-serve' : ''}" data-action="table" data-arg="${i}" ${spot}
        aria-label="${i + 1}번 식탁 · 주문표 ${t.ticketNo}${isHolding ? ' · 여기로 서빙' : ''}">
        <div class="patience"><div class="patience-fill" data-bar="table-${t.ticketNo}"></div></div>
        <div class="ticket-badge">🎫${t.ticketNo}</div>
        ${TABLE_FURNITURE}
        ${seatedCustomerHtml(t.face)}
        ${plate}
      </button>`
  }).join('')
}

const tablesKey = (s) => `${s.tables.map((t) => (t ? `${t.ticketNo}:${t.face}` : '-')).join(',')}|${s.heldPot !== null}`

// ---------- kitchen: ticket rail + pots ----------

// Compact spice mark for rail tickets: one chili + level, so every ticket fits on one line.
const spiceTag = (level) => (level === 0 ? '순한' : `${spriteImg('🌶️', 10, 'chili')}${level}`)

// The rail holds at most one ticket per table (paid customers are seated), and tables top out
// at 4. The rail has spare room and never needs to scroll.
function railHtml(s) {
  const tickets = s.rail.map((o) => `
    <button class="ticket" data-action="cook" data-arg="${o.ticketNo}" title="눌러서 냄비에 넣기 · ${MODE_LABEL[o.mode]} ${o.spice}단계">
      <b>🎫${o.ticketNo}</b>${queueFaceImg(o.face)}${o.side ? spriteImg(SIDE_BY_ID[o.side].emoji, 14, 'mini-face') : ''}
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

// Each pot stands on the kitchen counter (.pot-stand, art scaled by --pot-zoom) with its cooking bar and label
// on the counter front (.pot-meta). A finished pot is itself the pick button, so the whole pot is the target.
function potsHtml(s) {
  return s.pots.map((p, i) => {
    if (!p) return `<div class="pot empty"><div class="pot-stand"><div class="steam"></div>${potArt(null)}</div><div class="pot-meta"><div class="pot-label">빈 냄비</div></div></div>`
    const isDone = p.remaining <= 0
    const isHeld = s.heldPot === i
    const label = isDone
      ? `<span>🎫${p.ticketNo}</span><span class="btn serve ${isHeld ? 'held' : ''}">${isHeld ? '들었음' : '집기'}</span>`
      : `<span>🎫${p.ticketNo}</span>`
    const tag = isDone ? 'button' : 'div'
    const action = isDone ? `data-action="pick" data-arg="${i}" aria-label="${p.ticketNo}번 냄비 ${isHeld ? '들고 있음' : '집기'}"` : ''
    return `
      <${tag} class="pot ${isDone ? 'done' : 'cooking'} ${isHeld ? 'is-held' : ''}" ${action}>
        <div class="pot-stand"><div class="steam">${isDone ? '♨' : ''}</div>${potArt(p)}</div>
        <div class="pot-meta">
          <div class="pot-bar"><div class="pot-fill" data-bar="pot-${i}"></div></div>
          <div class="pot-label">${label}</div>
        </div>
      </${tag}>`
  }).join('')
}

/** Keeps the pots side by side on the counter: --pot-zoom follows the counter width and the pot count. */
function fitPots(el, count) {
  if (!el) return
  // width comes from the observer, not a layout read each frame
  if (el.__width === undefined) {
    el.__width = el.clientWidth
    if (typeof ResizeObserver !== 'undefined') {
      el.__resize = new ResizeObserver(([entry]) => { el.__width = entry.contentRect.width })
      el.__resize.observe(el)
    }
  }
  const width = Math.round(el.__width)
  const key = `${width}|${count}`
  if (el.__zoomKey === key) return
  el.__zoomKey = key
  el.style.setProperty('--pot-zoom', String(potZoom(width, count)))
}

/** The wok (side-menu story 001): shows once a cooked side is on the menu; lit while a pot cooks an order with a cooked side. */
const isWokCooking = (s) => s.pots.some((p) => p && p.remaining > 0 && p.order.side && SIDE_BY_ID[p.order.side].cooked)
const wokKey = (s) => `${hasWok(s)}|${isWokCooking(s)}`
function wokHtml(s) {
  if (!hasWok(s)) return ''
  const on = isWokCooking(s)
  return `<div class="wok-art ${on ? 'on' : ''}" title="사이드는 냄비와 함께 자동 조리돼요">${spriteImg('🥘', 20, 'wok-img')}${on ? '<i class="wok-fire"></i>' : ''}</div>`
}

/** 준비중 / 영업중 board on the back wall; it flips to 준비중 once the day is closing. */
const openBoardHtml = (isOpen) => `<span class="${isOpen ? 'on' : 'off'}">${isOpen ? '영업중' : '준비중'}</span>`

const potsKey = (s) => `${s.pots.map((p) => (p ? `${p.ticketNo}:${p.remaining <= 0}` : '-')).join('|')}|${s.heldPot}`

// ---------- counter ----------

function queueHtml(s) {
  return `<div class="q-line">${s.queue.map((c, i) => `
    <span class="q-face ${i === 0 ? 'front' : ''}">${queueFaceImg(c.face)}
      <i class="q-bar"><b data-bar="queue-${c.id}"></b></i></span>`).join('') || '<span class="hint">줄이 비었어요</span>'}</div>`
}

/** A dug-out meat or skewer, labelled in the unit it is charged in (every skewer kind = 1,000원 each). */
// Found items show icon + count like the vegetables, on an orange background — but that colour alone
// didn't read as "this is a skewer, not weight" (feedback 2026-09-27), so skewers also spell it out
// ("🦐꼬지×1"), and meat says its name too ("🥩소고기×1", feedback 2026-09-27). Full name stays in the hover title.
const FOUND_LABEL_SUFFIX = { skewer: () => '꼬지', meat: (item) => SHELF_ITEM_BY_ID[item.id].name }
const SIDE_CHIP_LABEL = { friedrice: '볶음밥', guobao: '꿔바로우' } // the drink (🥤) needs no word
const foundChip = (item) =>
  `<span class="chip found" title="${hiddenItemLabel(item)}">${spriteImg(SHELF_ITEM_BY_ID[item.id].emoji, 16, 'chip-img')}${FOUND_LABEL_SUFFIX[item.kind]?.(item) ?? ''}×${item.count}</span>`

/** The protagonist behind the counter, with her start-of-day line in a speech bubble. */
// The owner's row: a round face frame (the protagonist, or the panda while he gives his first tips) and her
// start-of-day line in a speech bubble pointing at it (feedback 2026-09-27: the full sprite felt cramped).
const PANDA_FACE = '<img class="owner-face-img panda" src="img/animal-faces/panda.png?v=1" alt="판다 사장님" draggable="false">'

function ownerHtml(s) {
  // a regular at the front of the queue takes the row: their face in the frame, name + line in the bubble (story N002)
  const regular = frontRegular(s)
  if (regular) {
    const { face, name } = REGULARS[regular.who]
    return `
    <div class="owner regular-say">
      <span class="owner-face">${spriteImg(face, 32, 'owner-face-img regular', name)}</span>
      <span class="owner-say"><b class="regular-name">${esc(name)}</b> ${esc(regular.text)}</span>
    </div>`
  }
  const line = ownerLineText(s)
  const face = ownerLineWho(s) === 'panda' ? PANDA_FACE : heroImg(s.character, 'owner-face-img')
  return `
    <div class="owner">
      <span class="owner-face">${face}</span>
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
    `<span class="chip" title="${INGREDIENT_BY_ID[id].name}">${spriteImg(INGREDIENT_BY_ID[id].emoji, 16, 'chip-img')}×${q}</span>`).join('')
  // cilantro spells itself out like the skewers ("🌿고수×1"); sides too ("🍳볶음밥×1") so 🍖 is not read as 🥩 —
  // only the drink keeps just its icon ("🥤×1"). Full name stays in the title.
  const cilantro = c.bowl.cilantro ? `<span class="chip found" title="고수">${spriteImg('🌿', 16, 'chip-img')}고수×1</span>` : ''
  const side = c.side ? `<span class="chip found side" title="${SIDE_BY_ID[c.side].name}">${spriteImg(SIDE_BY_ID[c.side].emoji, 16, 'chip-img')}${SIDE_CHIP_LABEL[c.side] ?? ''}×1</span>` : ''
  const modes = Object.keys(MODE_LABEL).map((m) =>
    `<button class="mode-btn ${s.counter.mode === m ? 'on' : ''}" data-action="mode" data-arg="${m}">${MODE_LABEL[m]}</button>`).join('')
  const spice = SPICE_LEVELS.map((l) =>
    `<button class="spice-btn lv-${l.level} ${s.counter.spice === l.level ? 'on' : ''}" data-action="spice" data-arg="${l.level}" title="${l.note}">${l.level}</button>`).join('')
  const plus = CHARGE_STEPS.map((v) => `<button class="btn key" data-action="charge" data-arg="${v}">+${v.toLocaleString()}</button>`).join('')
  const minus = CHARGE_STEPS.map((v) => `<button class="btn key ghost" data-action="charge" data-arg="-${v}">−${v.toLocaleString()}</button>`).join('')
  return `
    ${ownerHtml(s)}
    ${queueHtml(s)}
    <div class="bubble say">"${MODE_LABEL[c.mode]} ${spiceSay(c.spice)}요!"${c.bowl.cilantro ? ' 고수 넣어주세요🌿' : ''}${c.side ? ` ${SIDE_BY_ID[c.side].name}도 주세요!` : ''}
      <i class="front-patience" title="기다릴 수 있는 시간"><b data-bar="front-patience"></b></i></div>
    <div class="bowl-art small">
      <div class="bowl-rim"><div class="broth spice-0"></div><div class="bowl-floats">${floatAbove(c.bowl.weighed, 12)}</div></div>
      <div class="bowl-body"><div class="bowl-inner"><i class="bowl-band"></i></div></div>
      <div class="bowl-foot"></div>
    </div>
    <div class="chips">${side}${found}${cilantro}${weighed}</div>
    <div class="dig-row">
      <span class="bowl-meta">⚖ ${checkoutBowlWeight(c.bowl)}g</span>
      <button class="btn ghost dig" data-action="dig">🥢 뒤적이기 <kbd>Space</kbd></button>
    </div>
    <div class="ticket-row"><span>주문표</span>${modes}</div>
    <div class="spice-pick"><span>맵기</span>${spice}</div>
    <div class="receipt"><span>저울 (${MODE_LABEL[s.counter.mode]} ${won(s.prices[s.counter.mode])}/100g)</span><b>${won(base)}</b></div>
    <div class="till"><small>청구 금액</small> ${won(charged)}</div>
    <div class="keys">${plus}</div>
    <div class="keys">${minus}</div>
    <div class="bowl-actions">
      <button class="btn ghost" data-action="chargeReset">추가금 지우기</button>
      <button class="btn cook" data-action="chargeConfirm">선결제 <kbd>Enter</kbd></button>
    </div>`
}

const counterKey = (s) => `${s.queue.map((c) => c.id).join(',')}|${JSON.stringify(s.counter)}|${ownerLineText(s) ? `say-${ownerLineWho(s)}` : ''}`

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
        <span class="slot-name">${ing.shortName ?? ing.name}</span>
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
  if (s.phase === 'closed') return closedHtml(s)
  if (view.help) return helpHtml()
  // 타이틀로 mid-day asks first (decision 2026-09-29): the day is saved as it stands, and 이어하기 resumes it here
  if (view.paused && view.confirmTitle) {
    return `<div class="overlay"><div class="modal small confirm-title"><h2>타이틀로 갈까요?</h2><p>지금 장사 상황이 그대로 저장돼요.<br><b>이어서 하기</b>를 누르면<br>DAY ${s.day}의 이 순간부터 이어져요.</p><button class="btn big" data-action="menuCancel">계속 장사하기</button><button class="btn ghost" data-action="menu">타이틀로</button></div></div>`
  }
  if (view.paused) {
    return `<div class="overlay"><div class="modal small"><h2>일시정지</h2><button class="btn big" data-action="pause">계속하기</button><button class="btn big" data-action="help">게임방법</button>${musicControlsHtml(view.audio)}<button class="btn ghost" data-action="menu">타이틀로</button></div></div>`
  }
  return ''
}

// ---------- first-day tutorial (tutorial.js) ----------

const TUTORIAL_FOCUS = 'tut-focus'

/** The panda's tutorial bubble: the step's line, its key, and its button or 건너뛰기. */
function tutorialHtml(s) {
  const step = tutorialStep(s)
  if (!step) return ''
  const key = step.key ? ` <kbd>${step.key}</kbd>` : ''
  const next = step.next ? `<button class="btn tut-next" data-action="tutorialNext">${step.next}</button>` : ''
  const isLast = step.id === 'done'
  return `
    <div class="tut-bubble" data-at="${step.at ?? 'hall'}" role="status" aria-live="polite">
      <span class="owner-face">${PANDA_FACE}</span>
      <p class="tut-text">${esc(step.text)}${key}</p>
      <div class="tut-actions">${isLast ? '' : '<button class="btn ghost tut-skip" data-action="tutorialSkip">튜토리얼 건너뛰기</button>'}${next}</div>
    </div>`
}

/** Outlines what the current step asks for (sections re-render, so this runs every frame). */
function markTutorialFocus(root, s) {
  const selector = tutorialStep(s)?.focus
  const want = new Set(selector ? root.querySelectorAll(selector) : [])
  root.querySelectorAll(`.${TUTORIAL_FOCUS}`).forEach((el) => !want.has(el) && el.classList.remove(TUTORIAL_FOCUS))
  want.forEach((el) => el.classList.add(TUTORIAL_FOCUS))
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
  // the customer being charged gets a big gauge in their order bubble (playtest 2026-09-27 #3)
  const front = frontCustomer(s)
  if (front) setLevelBar(root, 'front-patience', front.patience / front.maxPatience)
  s.tables.forEach((t) => t && setLevelBar(root, `table-${t.ticketNo}`, t.patience / t.maxPatience))
  s.pots.forEach((p, i) => p && setBar(root, `pot-${i}`, 1 - p.remaining / p.total))
  Object.entries(s.shelf).forEach(([id, batches]) =>
    batches[0] && PERISHABLE_IDS.has(id) && setLevelBar(root, `fresh-${id}`, 1 - batches[0].age / WILT_SEC))
  const busy = root.querySelector('[data-busy]')
  if (busy) busy.classList.toggle('on', s.busy > 0)
  setBar(root, 'busy', s.busy / RESTOCK_BUSY_SEC)
}

// ---------- entry ----------

const audioKey = (view) => `${view.audio.muted}|${view.audio.sfxMuted}|${view.audio.volume}`

/** Renders the current phase into root. `view` holds UI-only state (hover, pause, help). */
export function render(root, s, view) {
  const isRentClosed = s.phase === 'closed' && s.closedReason === 'rent'
  const screen = isRentClosed ? 'closed' : ['menu', 'shop', 'create', 'opening', 'sunday', 'ending', 'teaser', 'credits'].includes(s.phase) ? s.phase : 'game'
  if (root.dataset.screen !== screen) {
    root.dataset.screen = screen
    document.documentElement.dataset.screen = screen // the title's background covers the whole window
    root.__key = null
    root.innerHTML = screen === 'game' ? spriteText(GAME_SKELETON) : ''
  }
  if (screen === 'menu') {
    return patch(root, `menu|${view.hasSave}|${view.help}|${view.settings}|${view.credits}|${view.titleSel}|${audioKey(view)}|${view.tutorialDone}`, () =>
      menuHtml(view) + (view.settings ? settingsHtml(view.audio, view.tutorialDone) : '') + (view.help ? helpHtml() : '') + (view.credits ? creditsHtml() : ''))
  }
  if (screen === 'create') return patch(root, createKey(s), () => createHtml(s))
  if (screen === 'opening') return patch(root, openingKey(s), () => openingHtml(s))
  if (screen === 'sunday') return patch(root, sundayKey(s), () => sundayHtml(s))
  if (screen === 'ending') return patch(root, endingKey(s), () => endingHtml(s))
  if (screen === 'teaser') return patch(root, teaserKey(s), () => teaserHtml(s))
  // end of part 1 (story N003): ending → teaser → these credits → the day-28 shop
  if (screen === 'credits') return patch(root, 'credits|part1', () => creditsHtml({ action: 'creditsDone', label: '29일차 준비 →' }))
  if (screen === 'closed') return patch(root, 'closed|rent', () => closedSceneHtml(s, closedHtml(s)))
  if (screen === 'shop') {
    const key = `shop|${view.shopTab}|${s.money}|${JSON.stringify(s.prices)}|${JSON.stringify(s.stock)}|${s.unlocked}|${JSON.stringify(s.upgrades)}|${s.interior}|${s.day}|${s.sideGifts}|${view.ledger}|${s.toasts.map((t) => t.id)}`
    return patch(root, key, () => shopHtml(s, view.shopTab, view.ledger))
  }
  patch(slot(root, 'day'), `${s.day}`, () => `DAY ${s.day} <small>${WEEKDAY_LABEL[weekdayOf(s.day)]}</small>`)
  patch(slot(root, 'tables'), tablesKey(s), () => tablesHtml(s))
  patch(slot(root, 'rail'), s.rail.map((o) => o.ticketNo).join(','), () => railHtml(s))
  patch(slot(root, 'pots'), potsKey(s), () => potsHtml(s))
  fitPots(slot(root, 'pots'), s.pots.length)
  patch(slot(root, 'wok'), wokKey(s), () => wokHtml(s))
  // interior stage → hall background, furniture and kitchen-strip colours (.ss-center[data-interior], shop-growth 005)
  const centre = root.querySelector('.ss-center')
  if (centre && centre.dataset.interior !== String(s.interior ?? 0)) centre.dataset.interior = String(s.interior ?? 0)
  patch(slot(root, 'open-board'), `${!isClosing(s)}`, () => openBoardHtml(!isClosing(s)))
  // after the part-1 ending the old 마라판다 frame hangs under the sign; the open board steps down under it (economy E004)
  patch(slot(root, 'wall-frame'), `${s.endingSeen}|${s.premiumPaidInFull}`, () => (s.endingSeen ? wallFrameHtml(s.premiumPaidInFull) : ''))
  patch(slot(root, 'counter'), counterKey(s), () => counterHtml(s))
  patch(slot(root, 'shelf'), shelfKey(s, view), () => shelfHtml(s, view))
  patch(slot(root, 'info'), `${view.hover}|${shelfKey(s, view)}`, () => infoHtml(s, view))
  patch(slot(root, 'side'), `${s.money}|${s.rating.toFixed(2)}|${JSON.stringify(s.stats)}|${view.paused}`, () => sideHtml(s, view))
  patch(slot(root, 'toasts'), s.toasts.map((t) => t.id).join(','), () =>
    s.toasts.map((t) => `<div class="toast ${t.kind}">${t.text}</div>`).join(''))
  patch(slot(root, 'overlay'), `${s.phase}|${view.paused}|${view.confirmTitle}|${view.help}|${audioKey(view)}`, () => overlayHtml(s, view))
  patch(slot(root, 'tutorial'), tutorialStep(s)?.id ?? '', () => tutorialHtml(s))
  markTutorialFocus(root, s)
  return updateBars(root, s)
}
