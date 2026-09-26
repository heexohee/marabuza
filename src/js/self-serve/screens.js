// Full-screen / modal HTML specific to the self-serve variant: title, help, summary and shop.
// The shop mirrors the original flow's layout (../screens.js) but also sells skewers and cilantro.
import { CUSTOMER_FACES, PACK_SIZE, PRICE, UPGRADES } from '../data.js'
import { spriteImg } from '../sprites.js'
import { stars, won } from '../ui.js'
import { BOX_SIZE, PERISHABLE_IDS, SHELF_EXTRAS, VARIANT_INGREDIENTS, WILT_SEC } from './data.js'
import { demandFactor, upgradeCost } from './logic.js'
import { dayEndLine } from './story.js'
import { esc, heroImg } from './story-ui.js'

/** Title screen, with a link back to the original flow for side-by-side playtests. */
export function menuHtml(view) {
  const parade = CUSTOMER_FACES.slice(0, 8).map((f, i) =>
    `<span class="parade-item" style="animation-delay:${i * 0.15}s">${spriteImg(f, 20, 'parade-img')}</span>`).join('')
  return `
    <div class="title-screen">
      <h1 class="title-logo">마라부자</h1>
      <p class="title-sub">: 셀프 담기 버전 <small class="variant-tag">실험</small></p>
      <div class="title-bowl">${spriteImg('🍲', 24, 'title-bowl-img')}</div>
      <div class="parade">${parade}</div>
      <div class="title-buttons">
        <button class="bubble-btn" data-action="new">게임하기</button>
        <button class="bubble-btn alt" data-action="continue" ${view.hasSave ? '' : 'disabled'}>이어하기</button>
        <button class="bubble-btn alt2" data-action="help">게임방법</button>
        <a class="variant-link" href="index.html?classic">← 기존 흐름(사장이 담기)으로</a>
      </div>
    </div>`
}

/** How-to-play modal for the self-serve flow. */
export function helpHtml() {
  return `
    <div class="overlay"><div class="modal">
      <h2>게임방법 · 셀프 담기</h2>
      <ol class="help-list">
        <li>손님이 <b>진열대</b>에서 직접 재료를 담아 <b>계산대</b>에 줄을 서요.</li>
        <li>그릇을 <b>🥢 뒤적이기</b>(Space)로 확인하세요. 고기·꼬치는 채소 밑에 숨어 있어요!</li>
        <li>손님 말대로 <b>주문표</b>에 조리 방식(마라탕/샹궈)과 맵기를 적어요. 조리 방식에 따라 저울 단가가 바뀌어요.</li>
        <li>저울 금액에 <b>소고기 3,000 / 양고기 4,000 / 꼬치·고수 1,000</b>을 더해 <b>선결제</b>(Enter). 꼬치는 종류 상관없이 1개당 1,000원!</li>
        <li>결제하면 <b>번호표</b>를 받고 테이블에 앉아요. 주문표를 누르거나 <b>C</b>키로 가장 오래 기다린 주문을 냄비에 넣고, 완성되면 냄비를 집어 <b>같은 번호 테이블</b>에 서빙!</li>
        <li>틈틈이 진열대 칸을 눌러 창고에서 <b>${BOX_SIZE}개씩 보충</b>하세요. 꼬치·고수도 진열대에 있어요. 보충하는 동안은 손이 묶여요.</li>
        <li>채소·버섯·고수는 진열대에 <b>${WILT_SEC}초</b> 넘게 두면 시들어 버려요. 너무 많이 채우지 마세요!</li>
        <li>창고가 비면 마감 후 <b>상점</b>에서 재료·꼬치·고수를 발주하세요.</li>
        <li>영업 중 <b>P</b>(또는 Esc)로 일시정지 · 다시 누르면 계속.</li>
      </ol>
      <button class="btn big" data-action="closeHelp">알겠어요!</button>
    </div></div>`
}

/** End-of-day summary: sales, register accuracy and shelf waste. */
export function summaryHtml(s) {
  const st = s.stats
  const net = st.revenue + st.tips - st.refunds
  return `
    <div class="overlay"><div class="modal">
      <h2>DAY ${s.day} 마감!</h2>
      <p class="end-line">${heroImg(s.character, 'hero-small')}<span><b>${esc(s.character.name)}</b> "${esc(dayEndLine(st))}"</span></p>
      <table class="summary">
        <tr><td>${spriteImg('😋', 16, 'stat-img')} 서빙한 손님</td><td>${st.served}명</td></tr>
        <tr><td>${spriteImg('😤', 16, 'stat-img')} 떠난 손님</td><td>${st.left}명</td></tr>
        <tr><td>${spriteImg('💵', 16, 'stat-img')} 매출 (선결제)</td><td>${won(st.revenue)}</td></tr>
        <tr><td>${spriteImg('💰', 16, 'stat-img')} 팁</td><td>${won(st.tips)}</td></tr>
        <tr><td>💸 환불</td><td>−${won(st.refunds)}</td></tr>
        <tr class="total"><td>오늘 번 돈</td><td>${won(net)}</td></tr>
        <tr><td>🧾 정확한 계산</td><td>${st.exactCharges}건</td></tr>
        <tr><td>📈 더 받음 (컴플레인 위험)</td><td>${st.overchargeCount}건 · ${won(st.overcharge)}</td></tr>
        <tr><td>📉 덜 받음 (손해)</td><td>${won(st.undercharge)}</td></tr>
        <tr><td>🥀 시들어 버린 재료</td><td>${st.wasted}개 · ${won(st.wasteCost)}</td></tr>
        <tr><td>평판</td><td>${stars(s.rating)} ${s.rating.toFixed(1)}</td></tr>
      </table>
      <button class="btn big" data-action="toShop">상점으로 →</button>
    </div></div>`
}

// ---------- shop ----------

/** Warehouse item card: unlock (ingredients only) or buy PACK_SIZE units. */
function stockCard(s, item) {
  const isLocked = item.unlockCost > 0 && !s.unlocked.includes(item.id)
  const action = isLocked
    ? `<button class="btn buy" data-action="unlock" data-arg="${item.id}" ${s.money < item.unlockCost ? 'disabled' : ''}><span>🔓 해금</span><span>${won(item.unlockCost)}</span></button>`
    : `<button class="btn buy" data-action="buy" data-arg="${item.id}" ${s.money < item.packCost ? 'disabled' : ''}><span>+${PACK_SIZE}개</span><span>${won(item.packCost)}</span></button>`
  const sub = isLocked ? '신메뉴' : `창고 ${s.stock[item.id] ?? 0}개`
  const tag = item.grams ? `${item.grams}g` : item.kind === 'skewer' ? '꼬치' : '토핑'
  return `
    <div class="card ing-card ${isLocked ? 'locked' : ''}">
      <div class="card-art">${spriteImg(item.emoji, 16, 'card-img')}</div>
      <div class="card-name">${item.name}</div>
      <div class="card-sub">${sub} · ${tag}${PERISHABLE_IDS.has(item.id) ? ' · ⏳' : ''}</div>
      ${action}
    </div>`
}

function upgradeCard(s, u) {
  const level = s.upgrades[u.id] - u.start
  const cost = upgradeCost(s, u.id)
  const pips = u.costs.map((_, i) => `<i class="${i < level ? 'on' : ''}"></i>`).join('')
  const btn = cost === null
    ? '<button class="btn buy" disabled>MAX</button>'
    : `<button class="btn buy" data-action="upgrade" data-arg="${u.id}" ${s.money < cost ? 'disabled' : ''}>${won(cost)}</button>`
  return `
    <div class="card up-card">
      <div class="card-art big">${spriteImg(u.emoji, 20, 'card-img')}</div>
      <div class="card-name">${u.name}</div>
      <div class="card-desc">${u.desc}</div>
      <div class="pips">${pips}</div>
      ${btn}
    </div>`
}

function priceBox(s) {
  const demand = demandFactor(s.pricePer100g)
  const mood = demand >= 1.15 ? '손님 폭주! 💨' : demand >= 0.9 ? '적당해요 🙂' : demand >= 0.7 ? '조금 비싸요 😕' : '너무 비싸요 😱'
  return `
    <div class="price-box">
      <div class="price-title">100g당 가격</div>
      <div class="price-row">
        <button class="btn round" data-action="price" data-arg="-${PRICE.step}" ${s.pricePer100g <= PRICE.min ? 'disabled' : ''}>−</button>
        <span class="price-value">${won(s.pricePer100g)}</span>
        <button class="btn round" data-action="price" data-arg="${PRICE.step}" ${s.pricePer100g >= PRICE.max ? 'disabled' : ''}>+</button>
      </div>
      <div class="price-hint">손님 방문 ×${demand.toFixed(2)} · ${mood}</div>
    </div>`
}

/** Between-days shop: upgrades, ingredient orders and skewer/cilantro orders into the warehouse. */
export function shopHtml(s) {
  const toasts = s.toasts.map((t) => `<div class="toast ${t.kind}">${t.text}</div>`).join('')
  return `
    <div class="shop-screen">
      <header class="shop-head">
        <h1 class="title-logo small">마라부자 <span>: 상점 · 셀프 담기</span></h1>
        <div class="shop-money">${spriteImg('🪙', 16, 'stat-img')} × ${s.money.toLocaleString()}</div>
      </header>
      <section class="shop-section">
        <h2>가게 업그레이드</h2>
        <div class="cards">${UPGRADES.map((u) => upgradeCard(s, u)).join('')}${priceBox(s)}</div>
      </section>
      <section class="shop-section orange">
        <h2>재료 발주 <small>(${PACK_SIZE}개 묶음 → 창고)</small></h2>
        <div class="cards ing">${VARIANT_INGREDIENTS.map((i) => stockCard(s, i)).join('')}</div>
      </section>
      <section class="shop-section orange">
        <h2>꼬치 · 고수 발주 <small>(${PACK_SIZE}개 묶음 → 창고)</small></h2>
        <div class="cards ing">${SHELF_EXTRAS.map((i) => stockCard(s, i)).join('')}</div>
      </section>
      <footer class="shop-foot">
        <button class="bubble-btn alt2" data-action="menu">타이틀</button>
        <button class="bubble-btn" data-action="nextDay">DAY ${s.day + 1} 영업 시작!</button>
      </footer>
      <div class="toasts shop-toasts">${toasts}</div>
    </div>`
}
