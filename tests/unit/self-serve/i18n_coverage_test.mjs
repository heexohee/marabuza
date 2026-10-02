// English coverage (request 2026-10-02): every screen the game can build, run through the English translator, must
// come out without Hangul. A failure lists the Korean that has no entry in src/js/self-serve/i18n-en.js yet.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createTranslator } from '../../../src/js/self-serve/i18n.js'
import { EN } from '../../../src/js/self-serve/i18n-en.js'
import { createNewGame, startDay } from '../../../src/js/self-serve/logic.js'
import {
  SHOP_TABS, closedHtml, creditsHtml, helpHtml, menuHtml, musicControlsHtml, settingsHtml, shopHtml, shopLedgerHtml, summaryHtml,
} from '../../../src/js/self-serve/screens.js'
import { createHtml, endingHtml, openingHtml, sundayHtml, teaserHtml, wallFrameHtml } from '../../../src/js/self-serve/story-ui.js'
import {
  ENDING_LINE_COUNT, OPENING_SCENES, PART2_TEASER_LINE_COUNT, REGULARS, SUNDAY_LAST_STEP, dayEndLine, dayStartLine, regularVisits,
} from '../../../src/js/self-serve/story.js'
import { dayIntroHtml, dayIntroInfo } from '../../../src/js/self-serve/day-intro.js'
import { TUTORIAL_STEPS } from '../../../src/js/self-serve/tutorial.js'
import { SIDE_ITEMS, SHELF_ITEM_BY_ID, SELF_UPGRADES, INTERIOR_STAGES } from '../../../src/js/self-serve/data.js'
import { SPICE_LEVELS } from '../../../src/js/data.js'

// spriteImg / the hero sprite paint on a canvas; node has none, so a blank one stands in (only the markup matters)
function fakeCanvas() {
  const canvas = { width: 0, height: 0, toDataURL: () => 'data:,' }
  const ctx = {
    fillText() {}, fillRect() {}, drawImage() {}, putImageData() {},
    getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(w, canvas.width) * Math.max(h, canvas.height) * 4) }),
  }
  canvas.getContext = () => ctx
  return canvas
}
globalThis.document ??= { createElement: () => fakeCanvas() }
globalThis.ImageData ??= class { constructor(data, w, h) { Object.assign(this, { data, width: w, height: h }) } }

const tr = createTranslator(EN)
const HANGUL_RUN = /[가-힣][가-힣\s·,.!?~…]*/g

/** Korean left after translation, deduplicated, so a failure reads as a to-do list. */
function leftovers(htmlList) {
  const found = new Set()
  htmlList.forEach((html) => (tr(html).match(HANGUL_RUN) ?? []).forEach((k) => found.add(k.trim())))
  return [...found]
}

const AUDIO = { muted: false, sfxMuted: true, volume: 0.7 }
const VIEW = { hasSave: true, titleSel: 0, audio: AUDIO }
const STATS = { served: 5, left: 1, revenue: 50000, tips: 2000, refunds: 0, exactCharges: 4, overcharge: 500, overchargeCount: 1, undercharge: 300, wasted: 2, wasteCost: 400 }

function shopState(day, extra = {}) {
  return { ...createNewGame(), phase: 'shop', day, stats: STATS, ...extra }
}

test('test_i18n_coverage_title_settings_help_credits', () => {
  assert.deepEqual(leftovers([
    menuHtml(VIEW), menuHtml({ ...VIEW, hasSave: false }), settingsHtml(AUDIO, true), settingsHtml(AUDIO, false),
    musicControlsHtml({ ...AUDIO, muted: true, sfxMuted: false }), helpHtml(), creditsHtml(), creditsHtml({ action: 'creditsDone', label: '29일차 준비 →' }),
  ]), [])
})

test('test_i18n_coverage_summary_and_closed', () => {
  const day = { ...startDay(createNewGame()), phase: 'summary', stats: STATS }
  const lines = [
    { ...STATS, exactCharges: 5, left: 0 }, { ...STATS, wasted: 0 }, { ...STATS, wasted: 0, left: 0 }, { ...STATS, wasted: 0, left: 0, exactCharges: 5 },
    { served: 0, left: 0, exactCharges: 0, wasted: 0 },
  ].map(dayEndLine)
  assert.deepEqual(leftovers([
    summaryHtml(day), ...lines, closedHtml({ closedReason: 'rating' }), closedHtml({ closedReason: 'rent' }),
  ]), [])
})

test('test_i18n_coverage_shop_tabs_and_ledger_across_days', () => {
  const html = [1, 7, 9, 11, 12, 20].flatMap((day) => {
    const s = shopState(day, { interior: day > 10 ? 2 : 0, sideGifts: day > 10 ? ['drink'] : [], rentOverdue: day === 20 ? 1 : 0 })
    return [...SHOP_TABS.map((t) => shopHtml(s, t.id, true)), shopLedgerHtml({ ...s, money: 0 })]
  })
  assert.deepEqual(leftovers(html), [])
})

test('test_i18n_coverage_catalog_names_and_descriptions', () => {
  const items = Object.values(SHELF_ITEM_BY_ID).flatMap((i) => [i.name, i.desc, i.shortName ?? ''])
  const rest = [...SIDE_ITEMS.map((i) => i.name), ...SELF_UPGRADES.flatMap((u) => [u.name, u.desc]),
    ...INTERIOR_STAGES.flatMap((i) => [i.name, i.desc]), ...SPICE_LEVELS.flatMap((l) => [l.label, l.note])]
  assert.deepEqual(leftovers([...items, ...rest].map((t) => `<b>${t}</b>`)), [])
})

test('test_i18n_coverage_character_creation_and_opening', () => {
  const s = { ...createNewGame(), phase: 'opening' }
  const lines = OPENING_SCENES.flatMap((scene, sceneIdx) =>
    scene.lines.map((_, line) => openingHtml({ ...s, story: { scene: sceneIdx, line } })))
  assert.deepEqual(leftovers([createHtml(s), ...lines]), [])
})

test('test_i18n_coverage_sundays_ending_and_teaser', () => {
  const base = { ...createNewGame(), phase: 'sunday', money: 120000, premiumLeft: 500000 }
  const ledgers = [
    { weekRevenue: 600000, rentDue: 194000, rentPaid: true, premiumDue: 266800, premiumPaid: 266800 },
    { weekRevenue: 100000, rentDue: 194000, rentPaid: false, premiumDue: 266800, premiumPaid: 0 },
    { weekRevenue: 0, rentDue: 388000, rentPaid: false, bankrupt: true },
    { weekRevenue: 600000, rentDue: 194000, rentPaid: true, premiumSettled: true, premiumDue: 0 },
  ]
  const sundays = [7, 14, 21, 28].flatMap((day) => ledgers.flatMap((ledger) =>
    Array.from({ length: SUNDAY_LAST_STEP + 1 }, (_, step) => sundayHtml({ ...base, day, ledger: { ...ledger, day }, sundayStep: step }))))
  const endings = [true, false].flatMap((paid) => Array.from({ length: ENDING_LINE_COUNT }, (_, step) =>
    endingHtml({ ...base, day: 28, endingStep: step, premiumPaidInFull: paid })))
  const teaser = Array.from({ length: PART2_TEASER_LINE_COUNT }, (_, step) => teaserHtml({ ...base, day: 29, teaserStep: step }))
  assert.deepEqual(leftovers([...sundays, ...endings, ...teaser, wallFrameHtml(true), wallFrameHtml(false)]), [])
})

// The owner's bubble is two lines tall (feedback 2026-09-27). Every English line was measured in the browser at
// 1280×884 on 2026-10-02 and fits; these are the longest that fit then, so a longer rewrite gets measured again.
const OWNER_LINE_MAX = 59
const REGULAR_LINE_MAX = 55 // the regular's name shares the bubble

test('test_i18n_owner_bubble_lines_stay_within_the_measured_length', () => {
  const sides = SIDE_ITEMS.map((i) => i.id)
  for (let d = 1; d <= 40; d++) {
    for (const open of [sides, []]) {
      const line = tr(dayStartLine(d, open))
      assert.ok(line.length <= OWNER_LINE_MAX, `day ${d}: ${line}`)
    }
  }
  for (let d = 1; d <= 30; d++) {
    regularVisits(d).forEach((v) => {
      const line = `${tr(REGULARS[v.who].name)} ${tr(v.text)}`
      assert.ok(line.length <= REGULAR_LINE_MAX, `day ${d}: ${line}`)
    })
  }
})

test('test_i18n_coverage_mornings_regulars_calendar_tutorial', () => {
  const sides = SIDE_ITEMS.map((i) => i.id)
  const mornings = Array.from({ length: 40 }, (_, i) => [dayStartLine(i + 1, sides), dayStartLine(i + 1, [])]).flat()
  const regulars = Array.from({ length: 30 }, (_, i) => regularVisits(i + 1).map((v) => v.text)).flat()
  const calendar = Array.from({ length: 30 }, (_, i) => dayIntroHtml(dayIntroInfo(i + 1)))
  const tutorial = TUTORIAL_STEPS.flatMap((step) => [step.text, step.next ?? ''])
  assert.deepEqual(leftovers([...mornings, ...regulars, ...calendar, ...tutorial].map((t) => `<p>${t}</p>`)), [])
})
