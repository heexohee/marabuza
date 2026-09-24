// Static game data and balance constants. Tune numbers here, not in logic.

export const DAY_LENGTH_SEC = 120
export const START_MONEY = 10000
export const START_RATING = 3
export const MAX_RATING = 5
export const PACK_SIZE = 10
export const START_STOCK = 10

export const PRICE = { min: 1500, max: 3500, step: 100, base: 2200 }

export const SPICE_LEVELS = [
  { level: 0, label: '0단계', note: '순한맛' },
  { level: 1, label: '1단계', note: '신라면' },
  { level: 2, label: '2단계', note: '기본' },
  { level: 3, label: '3단계', note: '매운맛' },
  { level: 4, label: '4단계', note: '지옥' },
]

// Penalty by how many spice levels the bowl is off from the order.
export const SPICE_PENALTY = [0, 0.15, 0.35, 0.6, 0.8]

export const EXTRA_ITEM_PENALTY = 0.1
export const MAX_EXTRA_PENALTY = 0.5
export const REFUSE_BELOW_ACCURACY = 0.3
export const MAX_TIP_RATIO = 0.25

export const RATING_DELTA = {
  leave: -0.25,
  refuse: -0.3,
  // Served: (accuracy - pivot) * scale, plus a small bonus for fast service.
  servePivot: 0.6,
  serveScale: 0.35,
  fastBonus: 0.05,
}

export const COOK_TIME_BASE_SEC = 6
export const COOK_TIME_PER_FIRE_LEVEL = 1
export const PATIENCE_BASE_SEC = 50
export const PATIENCE_MIN_SEC = 28
export const PATIENCE_DECAY_PER_DAY = 2
export const PATIENCE_PER_INTERIOR = 0.15

export const SPAWN = {
  firstDelaySec: 2,
  baseIntervalSec: 12,
  perDay: 0.4,
  perRating: 0.9,
  minIntervalSec: 4,
  demandMin: 0.5,
  demandMax: 1.6,
}

export const ORDER = { minItems: 3, maxItems: 5, maxQty: 2 }

// grams = weight of one scoop; packCost = price of PACK_SIZE scoops.
export const INGREDIENTS = [
  { id: 'bokchoy', name: '청경채', emoji: '🥬', grams: 40, packCost: 1200, unlockCost: 0, desc: '아삭아삭 청경채! 국물 맛을 시원하게 잡아줘요' },
  { id: 'sprout', name: '숙주', emoji: '🌱', grams: 50, packCost: 800, unlockCost: 0, desc: '숙주입니다~ 싸고 가벼워서 양을 채우기 좋아요' },
  { id: 'enoki', name: '팽이버섯', emoji: 'px:enoki', grams: 40, packCost: 1200, unlockCost: 0, desc: '쫄깃한 팽이버섯! 마라 국물을 쏙쏙 빨아들여요' },
  { id: 'woodear', name: '목이버섯', emoji: 'px:woodear', grams: 30, packCost: 1500, unlockCost: 0, desc: '꼬들꼬들 목이버섯! 가볍지만 식감이 최고예요' },
  { id: 'tofuskin', name: '푸주', emoji: 'px:tofuskin', grams: 40, packCost: 1800, unlockCost: 0, desc: '푸주입니다! 쫀득쫀득 마라탕의 필수템' },
  { id: 'noodle', name: '옥수수면', emoji: '🍜', grams: 80, packCost: 2000, unlockCost: 0, desc: '옥수수면! 무겁지만 손님들이 제일 좋아해요' },
  { id: 'fishcake', name: '어묵', emoji: '🍥', grams: 50, packCost: 2400, unlockCost: 0, desc: '탱글탱글 어묵! 아이 손님들한테 인기 만점' },
  { id: 'bunmoja', name: '분모자', emoji: '⚪', grams: 60, packCost: 2800, unlockCost: 2500, desc: '분모자! 쫀득함의 끝판왕, 무게도 꽤 나가요' },
  { id: 'quail', name: '메추리알', emoji: '🥚', grams: 40, packCost: 3200, unlockCost: 3000, desc: '메추리알입니다~ 한입에 쏙! 단골들이 찾아요' },
  { id: 'shrimp', name: '새우', emoji: '🦐', grams: 40, packCost: 6000, unlockCost: 5000, desc: '통통한 새우! 비싸지만 고급 손님이 좋아해요' },
  { id: 'beef', name: '소고기', emoji: '🥩', grams: 50, packCost: 7000, unlockCost: 6000, desc: '소고기! 마라탕의 꽃, 가장 비싼 재료예요' },
  { id: 'lamb', name: '양고기', emoji: '🍖', grams: 50, packCost: 7500, unlockCost: 8000, desc: '양고기! 마라와 찰떡궁합, 진짜 마라 러버용' },
]

export const INGREDIENT_BY_ID = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]))

// Each upgrade: cost for the next level is costs[currentLevel - start].
export const UPGRADES = [
  { id: 'pots', name: '냄비 추가', emoji: '🍲', desc: '동시에 끓일 수 있는 냄비 +1', start: 1, costs: [3000, 7000, 14000] },
  { id: 'fire', name: '화력 강화', emoji: '🔥', desc: '조리 시간 -1초', start: 0, costs: [2500, 5000, 9000] },
  { id: 'interior', name: '인테리어', emoji: '🏮', desc: '손님 인내심 +15%', start: 0, costs: [4000, 8000, 15000] },
  { id: 'seats', name: '좌석 확장', emoji: '🪑', desc: '동시에 받을 수 있는 손님 +1', start: 2, costs: [3500, 8000, 16000] },
]

export const UPGRADE_BY_ID = Object.fromEntries(UPGRADES.map((u) => [u.id, u]))

export const CUSTOMER_FACES = ['🐷', '🐱', '🐻', '🐰', '🐼', '🐧', '🐸', '🐶', '🦊', '🐨', '🐯', '🐹']

// Checkout pricing (story-001). Weighed-item rate depends on cooking mode;
// meat/skewer/cilantro are flat surcharges layered on top.
export const CHECKOUT_PRICE = {
  ratePer100g: { maratang: 1800, shanguo: 3000 },
  beefSurcharge: 3000,
  lambSurcharge: 4000,
  skewerPrice: 1000,
  cilantroSurcharge: 1000,
}

// Register buttons for adding non-weight extras on top of the printed weight price
// (skewer/cilantro 1,000 · beef 3,000 · lamb 4,000 — the owner works out which).
export const CHARGE_STEPS = [1000, 3000, 4000]

// Skewer-unit catalog (counted per skewer serving, not weighed).
// NOTE: 'shrimp' also exists in INGREDIENTS as a weighed scoop from the old
// self-serve model — the two coexist for now and will be reconciled once
// story-003 rewrites ingredient stocking.
export const SKEWER_ITEMS = [
  { id: 'skewer_shrimp', name: '새우', emoji: '🦐', unitsPerSkewer: 2 },
  { id: 'skewer_fishcake_deluxe', name: '고급 어묵', emoji: '🍥', unitsPerSkewer: 3 },
  { id: 'skewer_sausage_deluxe', name: '고급 소시지', emoji: '🌭', unitsPerSkewer: 3 },
]

export const SKEWER_ITEM_BY_ID = Object.fromEntries(SKEWER_ITEMS.map((i) => [i.id, i]))
