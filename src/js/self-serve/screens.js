// Full-screen / modal HTML specific to the self-serve variant: title, help, end-of-day summary.
// The shop screen is shared with the original flow (../screens.js).
import { CUSTOMER_FACES } from '../data.js'
import { spriteImg } from '../sprites.js'
import { stars, won } from '../ui.js'
import { BOX_SIZE, WILT_SEC } from './data.js'

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
        <a class="variant-link" href="index.html">← 기존 흐름(사장이 담기)으로</a>
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
        <li>저울 금액에 <b>소고기 3,000 / 양고기 4,000 / 꼬치·고수 1,000</b>을 더해 <b>선결제</b>(Enter). 새우는 2마리 = 꼬치 1개!</li>
        <li>결제하면 <b>번호표</b>를 받고 테이블에 앉아요. 주문표를 눌러 냄비에 넣고, 완성되면 냄비를 집어 <b>같은 번호 테이블</b>에 서빙!</li>
        <li>틈틈이 진열대 칸을 눌러 창고에서 <b>${BOX_SIZE}개씩 보충</b>하세요. 보충하는 동안은 손이 묶여요.</li>
        <li>채소·버섯은 진열대에 <b>${WILT_SEC}초</b> 넘게 두면 시들어 버려요. 너무 많이 채우지 마세요!</li>
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
