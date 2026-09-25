// Story script for the self-serve variant: opening cutscene + one line at the start and end of each day.
// Pure data and text helpers; `{name}` is replaced with the protagonist's name.
// design/game-brief.md "Story — 최애 한 그릇" · design/quick-specs/story-character-2026-09-25.md §B, §C

const SPEAKERS = { panda: '판다 사장님', notice: '📜 안내문' }

/**
 * Opening scenes in order. bg = CSS scene class, props = emoji sprites drawn in the scene,
 * cast = who stands in it ('me' = protagonist, 'panda'). who = speaker of each line.
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
    id: 'notice', bg: 'scene-notice', props: ['📜', '🌧️'], cast: ['me', 'panda'],
    lines: [
      { who: 'me', text: '회사를 그만둔 날, 제일 먼저 달려온 곳인데….' },
      { who: 'notice', text: '그동안 감사했습니다. 고향으로 내려갑니다. 가게 넘깁니다. — 마라판다' },
      { who: 'me', text: '이 맛마저 없어지면… 난 뭘로 버티지?' },
      { who: 'panda', text: '…자네가 해 볼 텐가? 권리금은 천천히 갚아도 돼.' },
      { who: 'me', text: '퇴직금 전부 걸게요. 이 가게, 제가 지킬게요!' },
    ],
  },
  {
    // same shop as the regular scene: she takes over the very place that kept her going
    id: 'takeover', bg: 'scene-regular', props: [], cast: ['me', 'panda'],
    lines: [
      { who: 'panda', text: '내가 쓰던 앞치마야. 오늘부터 {name} 사장이네.' },
      { who: 'me', text: '월세는 매주, 권리금은 조금씩… 꼭 다 갚을게요.' },
      { who: 'panda', text: '천천히 해. 대신 손님 그릇은 꼭 뒤적여 봐.' },
      { who: 'me', text: '이번엔 내가 누군가의 "버티게 해주는 한 그릇"이 되어 줄 거야.' },
      { who: 'me', text: '{name} 사장의 마라판다, 첫 영업 시작!' },
    ],
  },
]

/**
 * The protagonist is created right before this scene (the takeover day, when she puts on the apron):
 * the office-worker prologue plays first with the default look, then she picks name, hair and apron.
 */
export const CREATE_AT_SCENE = OPENING_SCENES.findIndex((sc) => sc.id === 'takeover')

/** Before creation the protagonist has no chosen name yet, so she is just "나". */
export const storyName = (sceneIdx, name) => (sceneIdx < CREATE_AT_SCENE ? '나' : name)

/** Display name of a line's speaker ('me' is the protagonist). */
export const speakerName = (who, name) => (who === 'me' ? name : SPEAKERS[who] ?? '')

/** Line text with the protagonist's name filled in. */
export const lineText = (text, name) => text.replaceAll('{name}', name)

// Days 1–3: the retired panda owner's tips. After that the protagonist's own lines rotate.
const TIPS = [
  '판다 사장님: "손님 그릇은 꼭 뒤적여 봐. 고기랑 꼬치가 숨어 있거든!"',
  '판다 사장님: "진열대가 깜빡이면 채울 때야. 채소는 너무 많이 채우면 시들고."',
  '판다 사장님: "샹궈는 100g당 더 비싸! 주문표 조리 방식부터 확인해."',
]
const OWN_LINES = [
  '오늘도 누군가의 한 그릇이 되어 보자!',
  '점심 러시 오기 전에 진열대부터 채워 두자.',
  '단골 얼굴이 하나둘 보이기 시작했어.',
  '대출 갚는 날까지, 한 그릇씩!',
]

/** One line said at the start of `day`. */
export const dayStartLine = (day) =>
  (day <= TIPS.length ? TIPS[day - 1] : OWN_LINES[(day - TIPS.length - 1) % OWN_LINES.length])

/** One line at closing time, picked from how the finished day went (its stats). */
export function dayEndLine(st) {
  if (st.served > 0 && st.exactCharges >= st.served && st.left === 0) return '오늘 계산 완벽! 판다 사장님도 칭찬해 주시겠지?'
  if (st.wasted > 0) return '채소가 좀 시들어 버렸네… 내일은 딱 필요한 만큼만 채우자.'
  if (st.left > 0) return '기다리다 가신 손님이 있었어. 내일은 더 빨리!'
  if (st.exactCharges < st.served) return '계산이 몇 번 틀렸어. 뒤적이기를 잊지 말자.'
  return '오늘도 수고했어. 내일도 한 그릇씩!'
}
