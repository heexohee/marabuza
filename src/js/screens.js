// Full-screen / modal HTML: title, help, end-of-day summary, shop.
import { CUSTOMER_FACES, INGREDIENTS, PACK_SIZE, PRICE, UPGRADES } from './data.js'
import { demandFactor, upgradeCost } from './logic.js'
import { spriteImg } from './sprites.js'
import { stars, won } from './ui.js'

/** Title screen. */
export function menuHtml(view) {
  const parade = CUSTOMER_FACES.slice(0, 8).map((f, i) =>
    `<span class="parade-item" style="animation-delay:${i * 0.15}s">${spriteImg(f, 20, 'parade-img')}</span>`).join('')
  return `
    <div class="title-screen">
      <h1 class="title-logo">마라부자</h1>
      <p class="title-sub">: 마라탕 가게 키우기</p>
      <div class="title-bowl">${spriteImg('🍲', 24, 'title-bowl-img')}</div>
      <div class="parade">${parade}</div>
      <div class="title-buttons">
        <button class="bubble-btn" data-action="new">게임하기</button>
        <button class="bubble-btn alt" data-action="continue" ${view.hasSave ? '' : 'disabled'}>이어하기</button>
        <button class="bubble-btn alt2" data-action="help">게임방법</button>
      </div>
    </div>`
}

/** How-to-play modal. */
export function helpHtml() {
  return `
    <div class="overlay"><div class="modal">
      <h2>게임방법</h2>
      <ol class="help-list">
        <li>손님을 클릭하면 <b>말풍선에 주문</b>이 보여요 (재료 × 개수, 🌶 맵기).</li>
        <li>아래 <b>재료 칸</b>을 눌러 그릇에 담아요. 그릇 칩을 누르면 하나 빼요.</li>
        <li><b>맵기</b>를 고르고 <b>조리하기!</b> (Space) → 빈 냄비에서 끓어요.</li>
        <li>냄비가 완성되면 <b>서빙</b>! 계산대가 <b>저울 금액</b>은 자동으로 찍어줘요. <b>소고기 1개 3,000 / 양고기 1개 4,000 / 꼬치·고수 1,000</b> 같은 추가 재료만 직접 더해서 청구해요.</li>
        <li>더 받으면 컴플레인, 덜 받으면 손해! 정확하게 청구하세요.</li>
        <li>정확하고 빠를수록 팁 💰과 평판 ⭐이 올라요. 너무 틀리면 결제 거부!</li>
        <li>마감 후 상점에서 재료를 사고, 가게를 업그레이드하고, 가격을 정해요.</li>
      </ol>
      <button class="btn big" data-action="closeHelp">알겠어요!</button>
    </div></div>`
}

/** End-of-day summary modal. */
export function summaryHtml(s) {
  const st = s.stats
  return `
    <div class="overlay"><div class="modal">
      <h2>DAY ${s.day} 마감!</h2>
      <table class="summary">
        <tr><td>${spriteImg('😋', 16, 'stat-img')} 만족한 손님</td><td>${st.served}명</td></tr>
        <tr><td>${spriteImg('😤', 16, 'stat-img')} 떠난 손님</td><td>${st.left}명</td></tr>
        <tr><td>${spriteImg('😡', 16, 'stat-img')} 결제 거부</td><td>${st.refused}명</td></tr>
        <tr><td>${spriteImg('💵', 16, 'stat-img')} 매출</td><td>${won(st.revenue)}</td></tr>
        <tr><td>${spriteImg('💰', 16, 'stat-img')} 팁</td><td>${won(st.tips)}</td></tr>
        <tr class="total"><td>오늘 번 돈</td><td>${won(st.revenue + st.tips)}</td></tr>
        <tr><td>평판</td><td>${stars(s.rating)} ${s.rating.toFixed(1)}</td></tr>
      </table>
      <button class="btn big" data-action="toShop">상점으로 →</button>
    </div></div>`
}

function ingredientCard(s, ing) {
  const locked = !s.unlocked.includes(ing.id)
  const action = locked
    ? `<button class="btn buy" data-action="unlock" data-arg="${ing.id}" ${s.money < ing.unlockCost ? 'disabled' : ''}><span>🔓 해금</span><span>${won(ing.unlockCost)}</span></button>`
    : `<button class="btn buy" data-action="buy" data-arg="${ing.id}" ${s.money < ing.packCost ? 'disabled' : ''}><span>+${PACK_SIZE}개</span><span>${won(ing.packCost)}</span></button>`
  return `
    <div class="card ing-card ${locked ? 'locked' : ''}">
      <div class="card-art">${spriteImg(ing.emoji, 16, 'card-img')}</div>
      <div class="card-name">${ing.name}</div>
      <div class="card-sub">${locked ? '신메뉴' : `재고 ${s.stock[ing.id]}개`} · ${ing.grams}g</div>
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

/** Between-days shop screen. */
export function shopHtml(s) {
  const toasts = s.toasts.map((t) => `<div class="toast ${t.kind}">${t.text}</div>`).join('')
  return `
    <div class="shop-screen">
      <header class="shop-head">
        <h1 class="title-logo small">마라부자 <span>: 상점</span></h1>
        <div class="shop-money">${spriteImg('🪙', 16, 'stat-img')} × ${s.money.toLocaleString()}</div>
      </header>
      <section class="shop-section">
        <h2>가게 업그레이드</h2>
        <div class="cards">${UPGRADES.map((u) => upgradeCard(s, u)).join('')}${priceBox(s)}</div>
      </section>
      <section class="shop-section orange">
        <h2>재료 사기 <small>(10스쿱 묶음)</small></h2>
        <div class="cards ing">${INGREDIENTS.map((i) => ingredientCard(s, i)).join('')}</div>
      </section>
      <footer class="shop-foot">
        <button class="bubble-btn alt2" data-action="menu">타이틀</button>
        <button class="bubble-btn" data-action="nextDay">DAY ${s.day + 1} 영업 시작!</button>
      </footer>
      <div class="toasts shop-toasts">${toasts}</div>
    </div>`
}
