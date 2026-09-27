// Story script for the self-serve variant: opening cutscene + one line at the start and end of each day.
// Pure data and text helpers; `{name}` is replaced with the protagonist's name.
// design/game-brief.md "Story — 최애 한 그릇" · design/quick-specs/story-character-2026-09-25.md §B, §C

import { PART1_LAST_DAY } from './data.js'

const SPEAKERS = { panda: '판다 사장님', notice: '📜 안내문', landlord: '🏢 건물주', rabbit: '시험기간 토끼' }

/**
 * Opening scenes in order. bg = CSS scene class, props = emoji sprites drawn in the scene,
 * cast = who stands in it ('me' = protagonist, 'panda'), enter / leave = { who: line index they appear
 * from / are gone from }, bgAt = { line index: bg class from that line on }.
 * who = speaker of each line; 'caption' is untagged narration (time skips).
 */
export const OPENING_SCENES = [
  {
    id: 'office', bg: 'scene-office', props: [], cast: ['me'], // painted background carries the moon and city
    lines: [
      { who: 'me', text: '새벽 2시… 오늘도 야근이다.' },
      { who: 'me', text: '그래도 버틸 수 있는 건, 퇴근길 마라판다의 마라탕 한 그릇 덕분이야.' },
    ],
  },
  {
    id: 'regular', bg: 'scene-regular', props: [], cast: ['me', 'panda'], // painted background carries bowls and lanterns
    lines: [
      { who: 'panda', text: '늦었네? 오늘도 3단계, 고수 듬뿍 맞지?' },
      { who: 'me', text: '사장님 마라탕이 제 하루의 유일한 낙이에요….' },
    ],
  },
  {
    // first-person at the dark, rainy shop door; the panda only walks in once she has read the notice
    id: 'notice', bg: 'scene-notice', props: [], cast: ['me', 'panda'], enter: { panda: 4 },
    lines: [
      { who: 'caption', text: '며칠 뒤, 회사를 그만둔 날.' },
      { who: 'me', text: '퇴사하고 제일 먼저 달려온 곳인데… 불이 꺼져 있네.' },
      { who: 'notice', text: '그동안 감사했습니다. 고향으로 내려갑니다. 가게 넘깁니다. — 마라판다' },
      { who: 'me', text: '이 맛마저 없어지면… 난 뭘로 버티지?' },
      { who: 'panda', text: '…왔구나, 우리 단골.' },
      { who: 'panda', text: '자네가 해 볼 텐가? 권리금은 천천히 갚아도 돼.' },
      { who: 'me', text: '퇴직금 전부 걸게요. 이 가게, 제가 지킬게요!' },
    ],
  },
  {
    // same shop as the regular scene, the morning she takes it over: he hands her the apron and leaves,
    // and on the last line the window sign flips from 준비중 to 영업중 and the shop board becomes her "마라부자"
    id: 'takeover', bg: 'scene-takeover', bgAt: { 7: 'scene-takeover-open' }, props: [], cast: ['me', 'panda'],
    leave: { panda: 5 },
    lines: [
      { who: 'caption', text: '그리고, 인수 첫날 아침.' },
      { who: 'panda', text: '내가 쓰던 앞치마야. 오늘부터 {name} 사장이네.' },
      { who: 'me', text: '임대료는 매주, 권리금은 조금씩… 꼭 다 갚을게요.' },
      { who: 'panda', text: '천천히 해. 대신 손님 그릇은 꼭 뒤적여 봐. 고기랑 꼬치가 숨어 있거든.' },
      { who: 'panda', text: '난 이만 간다. 가끔 손님으로 올게.' },
      { who: 'me', text: '…이제 진짜 혼자네.' },
      { who: 'me', text: '이번엔 내가 누군가의 "버티게 해주는 한 그릇"이 되어 줄 거야.' },
      { who: 'me', text: '{name} 사장의 마라부자, 첫 영업 시작!' },
    ],
  },
]

/**
 * The protagonist is created right before this scene (the takeover day, when she puts on the apron):
 * the office-worker prologue plays first with the default look, then she picks name, hair and apron.
 */
export const CREATE_AT_SCENE = OPENING_SCENES.findIndex((sc) => sc.id === 'takeover')

/**
 * The scene is a fixed-ratio stage: background art 384×152 shown at ×2 = STAGE (w×h) in stage px.
 * Backgrounds, cast spots and cast sizes are all stage px, so everything scales together and a character
 * stands on the same painted spot (her by the fridge, him by the counter) on any screen size.
 */
export const STAGE = { w: 768, h: 304, floor: 18 }
const CAST_SPOTS = {
  me: { x: 236, w: 64, h: 112 }, // protagonist sprite ×1, in front of the ingredient fridge
  panda: { x: 408, w: 96, h: 160 }, // panda owner sprite ×1, in front of the kitchen counter
}

/** Where a cast member stands (stage px) — one spot for every scene, so nobody jumps around. */
export const castSpot = (who) => CAST_SPOTS[who]

/**
 * Who is drawn at a line of a scene (no line: everyone who appears in the scene at some point). Before creation the scenes are
 * first-person ("나" speaks off-screen), so the protagonist first appears on the takeover day, in the apron;
 * others appear from their `enter` line and are gone from their `leave` line.
 */
export function sceneCast(sceneIdx, lineIdx) {
  const scene = OPENING_SCENES[sceneIdx]
  const onStage = (who) => lineIdx === undefined
    || (lineIdx >= (scene.enter?.[who] ?? 0) && lineIdx < (scene.leave?.[who] ?? scene.lines.length))
  return scene.cast.filter((who) => (who !== 'me' || sceneIdx >= CREATE_AT_SCENE) && onStage(who))
}

/** Background class at a line: the scene's bg, or the latest bgAt change at or before that line. */
export function sceneBg(sceneIdx, lineIdx) {
  const { bg, bgAt = {} } = OPENING_SCENES[sceneIdx]
  const from = Object.keys(bgAt).map(Number).filter((i) => i <= lineIdx).sort((a, b) => b - a)[0]
  return from === undefined ? bg : bgAt[from]
}

/** Before creation the protagonist has no chosen name yet, so she is just "나". */
export const storyName = (sceneIdx, name) => (sceneIdx < CREATE_AT_SCENE ? '나' : name)

/** Display name of a line's speaker ('me' is the protagonist; captions have none). */
export const speakerName = (who, name) => (who === 'me' ? name : SPEAKERS[who] ?? '')

/** Line text with the protagonist's name filled in. */
export const lineText = (text, name) => text.replaceAll('{name}', name)

// Days 1–3: the retired panda owner's tips. After that the protagonist's own lines rotate.
// The panda's face on the counter shows who is talking (dayStartSpeaker), so the tips carry no name prefix
// and stay within two lines of the owner's bubble (feedback 2026-09-27).
const TIPS = [
  '손님 그릇은 꼭 뒤적여 봐. 고기랑 꼬치가 숨어 있거든!',
  '진열대가 깜빡이면 채울 때! 너무 채우면 채소가 시들어.',
  '샹궈는 100g당 더 비싸! 주문표 조리 방식부터 확인해.',
]

// Days 4–27 (story N001): one fixed line per business day, part 1's story told a morning at a time —
// design/quick-specs/part1-28-days-2026-09-27.md §B. Sundays (7·14·21·28) have no business day; the panda
// only phones in ("(메시지)") until he visits on day 28. Every line fits the owner's two-line bubble.
// Days 8/10/12 announce a side menu, which the player adds in the shop (playtest 2026-09-27 #2): `side` names it and
// `notAdded` is said instead when it is not on the menu that morning (BUG-001).
export const DAILY_LINES = {
  4: { who: 'me', text: '오늘부터 진짜 혼자다. 배운 대로만 하자!' },
  5: { who: 'me', text: '불금이다! 퇴근 손님 오기 전에 진열대부터.' },
  6: { who: 'me', text: '내일은 첫 일요일. 장부 정리하는 날!' },
  8: { who: 'me', text: '판다 사장님이 음료 한 박스를 보내 주셨어!', side: 'drink', notAdded: '오늘부터 음료를 팔 수 있대. 상점에서 추가해 볼까?' },
  9: { who: 'me', text: '너구리 손님, 오늘도 오시려나.' },
  10: { who: 'me', text: '웍이 생겼다! 볶음밥은 알아서 볶아져. 계산만 정확히!', side: 'friedrice', notAdded: '볶음밥도 팔 수 있대! 상점에서 추가하면 웍이 생겨.' },
  11: { who: 'me', text: '이 골목 사람들 입맛, 조금씩 알 것 같아.' },
  12: { who: 'me', text: '꿔바로우까지! 이제 진짜 우리 가게 메뉴판이야.', side: 'guobao', notAdded: '꿔바로우도 팔 수 있대. 상점에서 메뉴판 채워 볼까?' },
  13: { who: 'me', text: '토요일 점심은 전쟁이야. 냄비부터 비워 두자.' },
  15: { who: 'me', text: '월요일 러시… 손이 세 개였으면.' },
  16: { who: 'me', text: '어제 마감하고 그대로 잠들었어.' },
  17: { who: 'me', text: '계산하고, 끓이고, 채우고… 회사 다닐 때 같아.' },
  18: { who: 'panda', text: '(메시지) 혼자 다 하려고 하지 마. 쉬는 것도 장사야.' },
  19: { who: 'me', text: '오늘은 무리하지 말고, 한 그릇씩만.' },
  20: { who: 'me', text: '혼자 다 하지 않기. 내일은 푹 쉬자.' },
  22: { who: 'panda', text: '(메시지) 다음 주 일요일에 가게 한번 들를게.' },
  23: { who: 'me', text: '판다 사장님 오시기 전에 가게 반짝반짝하게!' },
  24: { who: 'me', text: '처음 인수하던 날이 벌써 까마득해.' },
  25: { who: 'me', text: '오늘 너구리 손님은 표정이 밝던데?' },
  26: { who: 'me', text: '4주 전의 나한테 이 가게를 보여 주고 싶다.' },
  27: { who: 'me', text: '내일은 판다 사장님 오시는 날. 마지막 영업도 한 그릇씩!' },
}

// ---------- regulars (story N002) ----------
// Three customers with their own small story across part 1 (design §B 단골 방문 열). On a visit day one of the
// day's customers comes as the regular: their face in the queue, their line in the counter's top bubble.
export const REGULARS = {
  raccoon: { face: '🦝', name: '야근 너구리' },
  rabbit: { face: '🐰', name: '시험기간 토끼' },
  bear: { face: '🐻', name: '택배 곰' },
}
const TOMORROW = '내일 사장님 오신다면서요?'
const REGULAR_VISITS = {
  4: [{ who: 'raccoon', text: '여기… 아직 하나요? 맛이 그대로네요.' }],
  9: [{ who: 'rabbit', text: '시험 기간엔 여기 마라탕이 최고예요!' }],
  11: [{ who: 'raccoon', text: '오늘도 야근이에요. 4단계로 주세요…' }],
  13: [{ who: 'bear', text: '배달 사이에 후루룩 하고 갑니다!' }],
  16: [{ who: 'rabbit', text: '사장님, 요즘 피곤해 보여요…' }],
  18: [{ who: 'raccoon', text: '사장님 덕분에 버텨요. 저도 곧 그만두려고요.' }],
  20: [{ who: 'bear', text: '사장님도 밥은 드시고 하세요!' }],
  23: [{ who: 'bear', text: '소문 듣고 동료들 데려왔어요!' }],
  24: [{ who: 'rabbit', text: '시험 끝났어요! 오늘은 샹궈로 축하할래요.' }],
  25: [{ who: 'raccoon', text: '저 퇴사했어요. 오늘은 야근 없는 마라탕!' }],
  27: [{ who: 'raccoon', text: TOMORROW }, { who: 'rabbit', text: TOMORROW }, { who: 'bear', text: TOMORROW }],
}

/** The regulars who come on `day`, in arrival order ([] on other days and from part 2 on). */
export const regularVisits = (day) => REGULAR_VISITS[day] ?? []

/** Who says the start-of-day line: the panda for his first tips and messages, else the protagonist herself. */
export const dayStartSpeaker = (day) => (day <= TIPS.length ? 'panda' : DAILY_LINES[day]?.who ?? 'me')
const OWN_LINES = [
  '오늘도 누군가의 한 그릇이 되어 보자!',
  '점심 러시 오기 전에 진열대부터 채워 두자.',
  '단골 얼굴이 하나둘 보이기 시작했어.',
  '대출 갚는 날까지, 한 그릇씩!',
]

/**
 * One line said at the start of `day`: tips (1–3), the part-1 table (4–27), then OWN_LINES in turn (29+).
 * @param {number} day
 * @param {string[]} [sideIds] side menus on the menu that morning; without it a side day keeps its table line
 * @returns {string}
 */
export const dayStartLine = (day, sideIds) => {
  if (day <= TIPS.length) return TIPS[day - 1]
  const entry = DAILY_LINES[day]
  if (entry) return entry.side && Array.isArray(sideIds) && !sideIds.includes(entry.side) ? entry.notAdded : entry.text
  return OWN_LINES[(day - TIPS.length - 1) % OWN_LINES.length]
}

// ---------- Sunday off day (economy E003) ----------
// A short scene in the closed shop (scene-sunday: her board, "휴무" in the window, lanterns off), played
// like the opening: a caption, her line, the week's ledger, then who has the last word. Rent goes to the
// landlord (건물주) — the panda only collects 권리금 (E004), so he stays out of this scene.
export const SUNDAY_BG = 'scene-sunday'
export const SUNDAY_LEDGER_STEP = 2
export const SUNDAY_LAST_STEP = 3

/**
 * The Sunday scene's line at `step` (the ledger step has none), given the week's settled ledger and the
 * Sunday's day number — day 28 closes part 1's four weeks, so she looks back on the month (feedback 2026-09-28).
 */
export function sundayLine(step, ledger, day = 0) {
  if (step === 0) return { who: 'caption', text: '오늘은 일요일! 쉬는 날.' }
  if (step === 1) return { who: 'me', text: `${day === PART1_LAST_DAY ? '한 달' : '한 주'} 동안 수고했어. 장부부터 정리하자.` }
  if (step === SUNDAY_LEDGER_STEP) return null
  if (ledger?.bankrupt) return { who: 'landlord', text: '두 주 연속이면… 더는 어렵겠어요. 가게를 비워 주셔야겠어요.' }
  return ledger?.rentPaid === false
    ? { who: 'landlord', text: '임대료가 모자라네요… 이번 주는 봐 드릴게요. 다음 주엔 두 주 치, 꼭이요!' }
    : { who: 'me', text: '임대료 완납! 이번 주도 잘 버텼다.' }
}

/** One line at closing time, picked from how the finished day went (its stats). */
export function dayEndLine(st) {
  if (st.served > 0 && st.exactCharges >= st.served && st.left === 0) return '오늘 계산 완벽! 판다 사장님도 칭찬해 주시겠지?'
  if (st.wasted > 0) return '채소가 좀 시들어 버렸네… 내일은 딱 필요한 만큼만 채우자.'
  if (st.left > 0) return '기다리다 가신 손님이 있었어. 내일은 더 빨리!'
  if (st.exactCharges < st.served) return '계산이 몇 번 틀렸어. 뒤적이기를 잊지 말자.'
  return '오늘도 수고했어. 내일도 한 그릇씩!'
}

// ---------- 권리금 + part-1 ending (economy E004, design/quick-specs/part1-28-days-2026-09-27.md §A·§C) ----------
// The panda collects 권리금 on the Sunday ledger by phone — he only walks into the shop for the ending.
const PREMIUM_WEEK_LINES = {
  7: '첫 할부 잘 받았어. 천천히 해~',
  14: '반 왔네. 가게 냄새가 좋아졌다던데?',
  21: '하나 남았다. 무리하지 말고.',
}

/** The panda's word on the ledger's 권리금 row, or null (no row, or day 28 — the ending speaks instead). */
export function premiumLine(l) {
  if (!l || l.day >= 28) return null
  if (l.premiumSettled) return { who: 'panda', text: '벌써? 28일에 보자.' }
  if (l.premiumDue === undefined) return null
  if (l.premiumPaid < l.premiumDue) return { who: 'panda', text: '괜찮아, 다음 주에 같이 줘.' }
  const text = PREMIUM_WEEK_LINES[l.day]
  return text ? { who: 'panda', text } : null
}

// Day 28, Sunday evening: the panda comes in for the first time since the takeover. Paid in full or not,
// the scene runs the same — only lines 1–3 change (and the frame gets a "완납" plate when paid).
const ENDING_LINES = [
  { who: 'caption', text: '28일차, 일요일 저녁.' },
  { who: 'panda', paid: '장부 봤어. …다 갚았네.', forgiven: '장부 봤어. 조금 남았네.' },
  { who: 'me', paid: '사장님 덕분이에요.', forgiven: '죄송해요… 조금만 더 시간을 주시면—' },
  { who: 'panda', paid: '아니. 이제 네 가게구나.', forgiven: '됐어. 나머지는 그동안 손님들한테 내준 한 그릇으로 받았다 치자. …이제 네 가게구나.' },
  { who: 'panda', text: '이건 가져가려다 말았어. 여기 두는 게 맞겠다.' },
  { who: 'me', text: '{name} 사장의 마라부자. 내일도 한 그릇씩!' },
  { who: 'caption', text: '마라부자 1부 — 끝' },
]
export const ENDING_LINE_COUNT = ENDING_LINES.length
/** Beat where the old "마라판다" sign goes up as a frame on the wall. */
export const ENDING_FRAME_STEP = 4

/** Line `step` of the ending, in the paid-in-full or forgiven branch. */
export function endingLine(step, paidInFull) {
  const l = ENDING_LINES[Math.min(Math.max(step, 0), ENDING_LINES.length - 1)]
  return { who: l.who, text: l.text ?? (paidInFull ? l.paid : l.forgiven) }
}

// ---------- part-2 teaser (story N003, design/quick-specs/part1-28-days-2026-09-27.md §D) ----------
// Day 29's morning, once, after the ending: the rabbit brings a "알바 구함" flyer, and a franchise's
// "오픈 예정" banner goes up across the street (from PART2_BANNER_STEP on).
const PART2_TEASER_LINES = [
  { who: 'caption', text: '29일차, 월요일 아침.' },
  { who: 'rabbit', text: '사장님, 저 여기서 일해도 돼요?' },
  { who: 'me', text: '(문밖을 보며) …저기도 마라탕?' },
  { who: 'caption', text: '마라부자 2부 — 준비 중' },
]
export const PART2_TEASER_LINE_COUNT = PART2_TEASER_LINES.length
/** Beat where the franchise banner across the street comes into view. */
export const PART2_BANNER_STEP = 2

/** Line `step` of the part-2 teaser. */
export const teaserLine = (step) => PART2_TEASER_LINES[Math.min(Math.max(step, 0), PART2_TEASER_LINES.length - 1)]
