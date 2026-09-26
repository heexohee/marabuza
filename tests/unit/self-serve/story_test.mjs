// Protagonist creation + opening story + daily lines for the self-serve variant.
// design/quick-specs/story-character-2026-09-25.md
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  APRON_BASE_KEY, APRON_COLORS, APRON_TONE_KEYS, CHARACTER_H, CHARACTER_W, DEFAULT_CHARACTER, HAIR_BASE_KEY, HAIR_COLORS,
  HAIR_STYLES, HAIR_TONE_KEYS, characterGrid, characterPalette, normalizeCharacter, sanitizeName, toneScale, withCharacterOption,
} from '../../../src/js/self-serve/character.js'
import { HERO_BODY, HERO_HAIR, HERO_NECK_Y } from '../../../src/js/self-serve/hero-art.js'
import {
  CREATE_AT_SCENE, OPENING_SCENES, STAGE, castSpot, dayEndLine, dayStartLine, lineText, sceneBg, sceneCast, speakerName,
  storyName,
} from '../../../src/js/self-serve/story.js'
import {
  advanceStory, beginNewGame, finishCharacter, ownerLineText, setCharacterName, setCharacterOption, skipStory, tick,
} from '../../../src/js/self-serve/logic.js'
import { loadGame, saveGame } from '../../../src/js/self-serve/save.js'
import { DAY_LINE_SEC, NAME_MAX_LEN, SAVE_KEY } from '../../../src/js/self-serve/data.js'

function memoryStorage() {
  const store = new Map()
  return { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) }
}
beforeEach(() => { globalThis.localStorage = memoryStorage() })

const totalLines = OPENING_SCENES.reduce((n, sc) => n + sc.lines.length, 0)

// ---------- character ----------

test('test_character_every_look_is_a_full_64x112_grid', () => {
  assert.equal(CHARACTER_W, 64)
  assert.equal(CHARACTER_H, 112)
  for (const hair of HAIR_STYLES) {
    const grid = characterGrid({ ...DEFAULT_CHARACTER, hair: hair.id })
    assert.equal(grid.length, CHARACTER_H)
    grid.forEach((row, y) => assert.equal([...row].length, CHARACTER_W, `${hair.id} row ${y}`))
  }
})

test('test_character_options_are_the_three_reference_girls', () => {
  assert.deepEqual(HAIR_STYLES.map((o) => o.id), ['bob', 'long', 'pony'])
  assert.deepEqual(HAIR_COLORS.map((o) => o.id), ['brown', 'black', 'gold'])
  assert.deepEqual(APRON_COLORS.map((o) => o.id), ['pink', 'mint', 'yellow'])
  assert.deepEqual(DEFAULT_CHARACTER, { name: '초아', hair: 'bob', hairColor: 'brown', apron: 'pink' })
})

test('test_character_old_save_with_removed_colours_falls_back_to_defaults', () => {
  const look = normalizeCharacter({ name: '민지', hair: 'pony', hairColor: 'orange', apron: 'red' })
  assert.deepEqual(look, { name: '민지', hair: 'pony', hairColor: 'brown', apron: 'pink' })
})

test('test_character_styles_share_one_body_and_only_swap_the_hair_layer', () => {
  for (const hair of HAIR_STYLES) {
    const grid = characterGrid({ ...DEFAULT_CHARACTER, hair: hair.id })
    const layer = HERO_HAIR[hair.id]
    grid.forEach((row, y) => [...row].forEach((k, x) => {
      const h = layer[y][x]
      const b = HERO_BODY[y][x]
      const want = y <= HERO_NECK_Y ? (h !== '.' ? h : b) : (b !== '.' ? b : h)
      assert.equal(k, want, `${hair.id} (${x},${y})`)
    }))
  }
})

test('test_character_body_below_the_hair_is_identical_for_every_style', () => {
  const skirtDown = (id) => characterGrid({ ...DEFAULT_CHARACTER, hair: id }).slice(-40).join('\n')
  const drawn = new Set(HAIR_STYLES.map((h) => skirtDown(h.id)))
  assert.equal(drawn.size, 1)
})

test('test_character_hair_styles_draw_differently', () => {
  const drawn = HAIR_STYLES.map((h) => characterGrid({ ...DEFAULT_CHARACTER, hair: h.id }).join('\n'))
  assert.equal(new Set(drawn).size, HAIR_STYLES.length)
})

test('test_character_palette_follows_hair_and_apron_choice', () => {
  const look = { ...DEFAULT_CHARACTER, hairColor: HAIR_COLORS[2].id, apron: APRON_COLORS[2].id }
  const pal = characterPalette(look)
  assert.equal(pal[HAIR_BASE_KEY], HAIR_COLORS[2].hex, 'middle hair tone is the swatch colour')
  assert.equal(pal[APRON_BASE_KEY], APRON_COLORS[2].hex, 'middle apron tone is the swatch colour')
  for (const hair of HAIR_STYLES) {
    const used = new Set(characterGrid({ ...look, hair: hair.id }).join('').replace(/\./g, ''))
    used.forEach((ch) => assert.ok(pal[ch], `${hair.id}: palette has colour for "${ch}"`))
  }
})

test('test_character_hair_and_apron_colours_each_have_light_base_shade_tones', () => {
  const HEX = /^#[0-9a-f]{6}$/
  for (const opt of [...HAIR_COLORS, ...APRON_COLORS]) {
    assert.equal(opt.ramp.length, 3, opt.id)
    opt.ramp.forEach((c) => assert.match(c, HEX, opt.id))
    assert.equal(opt.ramp[1], opt.hex, `${opt.id}: swatch shows the base tone`)
  }
})

test('test_character_tone_scale_runs_dark_to_light_through_the_ramp', () => {
  const [light, base, shade] = ['#fee9a5', '#eab782', '#b98a58']
  const scale = toneScale([light, base, shade], 7)
  assert.equal(scale.length, 7)
  assert.equal(scale[3], base, 'the middle tone is the base colour')
  const lum = (hex) => [1, 3, 5].reduce((s, i, k) => s + parseInt(hex.slice(i, i + 2), 16) * [0.299, 0.587, 0.114][k], 0)
  scale.slice(1).forEach((c, i) => assert.ok(lum(c) > lum(scale[i]), `tone ${i + 1} is lighter than tone ${i}`))
})

test('test_character_palette_maps_every_tone_key_to_the_chosen_colour', () => {
  const pal = characterPalette({ ...DEFAULT_CHARACTER, hairColor: 'black', apron: 'mint' })
  const black = toneScale(HAIR_COLORS.find((o) => o.id === 'black').ramp, HAIR_TONE_KEYS.length)
  const mint = toneScale(APRON_COLORS.find((o) => o.id === 'mint').ramp, APRON_TONE_KEYS.length)
  assert.deepEqual([...HAIR_TONE_KEYS].map((k) => pal[k]), black)
  assert.deepEqual([...APRON_TONE_KEYS].map((k) => pal[k]), mint)
})

test('test_character_every_hair_style_recolours_hair_and_apron', () => {
  for (const hair of HAIR_STYLES) {
    const used = characterGrid({ ...DEFAULT_CHARACTER, hair: hair.id }).join('')
    assert.ok([...HAIR_TONE_KEYS].filter((k) => used.includes(k)).length >= 5, `${hair.id} hair uses most tones`)
    assert.ok([...APRON_TONE_KEYS].filter((k) => used.includes(k)).length >= 4, `${hair.id} apron uses most tones`)
  }
})

test('test_character_option_rejects_unknown_keys_and_values', () => {
  const c = DEFAULT_CHARACTER
  assert.equal(withCharacterOption(c, 'hair', 'pony').hair, 'pony')
  assert.equal(withCharacterOption(c, 'hair', 'mohawk'), c)
  assert.equal(withCharacterOption(c, 'name', 'x'), c, 'name goes through sanitizeName, not options')
})

test('test_character_name_is_trimmed_capped_and_never_blank', () => {
  assert.equal(sanitizeName('  하나  '), '하나')
  assert.equal([...sanitizeName('가나다라마바사아자차')].length, NAME_MAX_LEN)
  assert.equal(sanitizeName('   '), DEFAULT_CHARACTER.name)
  assert.equal(sanitizeName(undefined), DEFAULT_CHARACTER.name)
})

test('test_character_normalize_repairs_bad_saved_data', () => {
  assert.deepEqual(normalizeCharacter(undefined), DEFAULT_CHARACTER)
  assert.deepEqual(normalizeCharacter({ name: '민지', hair: 'long', hairColor: 'nope', apron: 'mint' }),
    { ...DEFAULT_CHARACTER, name: '민지', hair: 'long', apron: 'mint' })
})

// ---------- story data ----------

test('test_story_opening_has_four_scenes_with_lines', () => {
  assert.equal(OPENING_SCENES.length, 4)
  // props may be empty when the scene's background is a painted image (scene-office, scene-regular)
  OPENING_SCENES.forEach((sc) => assert.ok(sc.lines.length > 0 && sc.bg && Array.isArray(sc.props)))
})

test('test_story_name_placeholder_and_speaker', () => {
  assert.equal(lineText('{name}의 마라탕!', '하나'), '하나의 마라탕!')
  assert.equal(speakerName('me', '하나'), '하나')
  assert.equal(speakerName('panda', '하나'), '판다 사장님')
  assert.ok(OPENING_SCENES.flatMap((sc) => sc.lines).some((l) => l.text.includes('{name}')))
})

test('test_story_day_lines_exist_for_any_day_and_result', () => {
  ;[1, 2, 3, 4, 30].forEach((d) => assert.ok(dayStartLine(d).length > 0))
  const base = { served: 5, left: 0, exactCharges: 5, overchargeCount: 0, undercharge: 0, wasted: 0 }
  assert.match(dayEndLine(base), /완벽/)
  assert.match(dayEndLine({ ...base, exactCharges: 3, undercharge: 800, wasted: 4 }), /시들/)
  assert.notEqual(dayEndLine({ ...base, exactCharges: 3, left: 3 }), dayEndLine(base))
})

// ---------- flow ----------

const linesBeforeCreate = OPENING_SCENES.slice(0, CREATE_AT_SCENE).reduce((n, sc) => n + sc.lines.length, 0)
const advance = (s, n) => Array.from({ length: n }).reduce((cur) => advanceStory(cur), s)
const toCreation = () => advance(beginNewGame(), linesBeforeCreate)

test('test_flow_character_is_created_right_before_the_takeover_day', () => {
  assert.equal(OPENING_SCENES[CREATE_AT_SCENE].id, 'takeover', 'creation sits between the notice and the takeover')
  assert.match(OPENING_SCENES[CREATE_AT_SCENE].bg, /^scene-takeover/, 'she takes over the same shop (its morning version)')
})

test('test_story_opening_tells_the_takeover_of_mara_panda', () => {
  const text = OPENING_SCENES.flatMap((sc) => sc.lines.map((l) => l.text)).join('\n')
  assert.match(text, /마라판다/)
  assert.match(text, /권리금/)
  assert.match(text, /임대료/)
  assert.doesNotMatch(text, /동물 마을 골목|창업 대출/, 'no new shop in another place any more')
  assert.ok(OPENING_SCENES[CREATE_AT_SCENE].cast.includes('panda'), 'the panda hands over the apron')
})

test('test_flow_new_game_starts_with_the_opening_as_the_default_protagonist', () => {
  const s = beginNewGame()
  assert.equal(s.phase, 'opening')
  assert.deepEqual(s.story, { scene: 0, line: 0 })
  assert.deepEqual(s.character, DEFAULT_CHARACTER)
})

test('test_flow_opening_pauses_for_character_creation_before_the_alley', () => {
  assert.equal(advance(beginNewGame(), linesBeforeCreate - 1).phase, 'opening')
  const s = toCreation()
  assert.equal(s.phase, 'create')
  assert.deepEqual(s.story, { scene: CREATE_AT_SCENE, line: 0 })
})

test('test_flow_character_options_only_apply_while_creating', () => {
  assert.equal(setCharacterOption(beginNewGame(), 'apron', 'mint').character.apron, DEFAULT_CHARACTER.apron)
  const s = setCharacterName(setCharacterOption(toCreation(), 'apron', 'mint'), '  민지 ')
  assert.equal(s.character.apron, 'mint')
  const opening = finishCharacter(s)
  assert.equal(opening.character.name, '민지')
  assert.equal(opening.phase, 'opening')
  assert.deepEqual(opening.story, { scene: CREATE_AT_SCENE, line: 0 }, 'resumes at the alley')
  assert.equal(setCharacterOption(opening, 'apron', 'pink').character.apron, 'mint')
})

test('test_flow_opening_plays_every_line_then_opens_day_one', () => {
  const resumed = finishCharacter(toCreation())
  const rest = totalLines - linesBeforeCreate
  assert.equal(advance(resumed, rest - 1).phase, 'opening')
  const day = advance(resumed, rest)
  assert.equal(day.phase, 'day')
  assert.equal(day.day, 1)
  assert.equal(day.story, null)
})

test('test_flow_skip_before_creation_goes_to_creation_after_it_to_day_one', () => {
  const skipped = skipStory(beginNewGame())
  assert.equal(skipped.phase, 'create', 'the protagonist is always created')
  assert.deepEqual(skipped.story, { scene: CREATE_AT_SCENE, line: 0 })
  assert.equal(skipStory(finishCharacter(skipped)).phase, 'day')
})

test('test_flow_protagonist_is_off_screen_until_created', () => {
  // 1–3: first-person — only the background and the panda; she first appears on the takeover day
  for (let i = 0; i < CREATE_AT_SCENE; i++) assert.ok(!sceneCast(i).includes('me'), `scene ${i} hides her`)
  assert.ok(sceneCast(CREATE_AT_SCENE).includes('me'))
  assert.deepEqual(sceneCast(1), ['panda'])
})

test('test_story_cast_stands_on_the_same_stage_spot_in_every_scene', () => {
  const seen = {}
  OPENING_SCENES.forEach((_, i) => sceneCast(i).forEach((who) => {
    const spot = castSpot(who)
    assert.ok(spot.x >= 0 && spot.x + spot.w <= STAGE.w, `${who} inside the stage in scene ${i}`)
    seen[who] ??= spot
    assert.deepEqual(spot, seen[who], `${who} does not move between scenes`)
  }))
  const me = castSpot('me')
  const panda = castSpot('panda')
  assert.ok(me.x + me.w <= panda.x, 'side by side, never overlapping')
})

test('test_story_time_skips_open_with_a_caption', () => {
  const notice = OPENING_SCENES.findIndex((sc) => sc.id === 'notice')
  for (const i of [notice, CREATE_AT_SCENE]) {
    const first = OPENING_SCENES[i].lines[0]
    assert.equal(first.who, 'caption', `${OPENING_SCENES[i].id} opens with a caption`)
    assert.equal(speakerName(first.who, '초아'), '', 'captions have no speaker tag')
  }
  assert.match(OPENING_SCENES[notice].lines[0].text, /며칠 뒤/)
})

test('test_story_panda_walks_in_after_she_finds_the_notice', () => {
  const i = OPENING_SCENES.findIndex((sc) => sc.id === 'notice')
  const lines = OPENING_SCENES[i].lines
  const enter = OPENING_SCENES[i].enter.panda
  assert.ok(!sceneCast(i, 0).includes('panda'), 'nobody at the closed shop at first')
  assert.ok(!sceneCast(i, enter - 1).includes('panda'))
  assert.ok(sceneCast(i, enter).includes('panda'), 'he appears from his first line')
  assert.equal(lines[enter].who, 'panda')
  assert.ok(lines.slice(0, enter).some((l) => l.who === 'notice'), 'the notice is read before he comes')
  assert.deepEqual(OPENING_SCENES[i].props, [], 'painted background, no emoji props')
})

test('test_story_takeover_day_panda_hands_over_then_leaves_her_alone', () => {
  const i = CREATE_AT_SCENE
  const sc = OPENING_SCENES[i]
  const leave = sc.leave.panda
  assert.ok(sceneCast(i, 1).includes('panda') && sceneCast(i, 1).includes('me'), 'both there for the apron')
  assert.equal(sc.lines[leave - 1].who, 'panda', 'his goodbye is the last thing he says')
  assert.deepEqual(sceneCast(i, leave), ['me'], 'then she is alone')
  sc.lines.slice(leave).forEach((l) => assert.notEqual(l.who, 'panda', 'no lines after he left'))
})

test('test_story_takeover_opens_the_shop_on_the_last_line', () => {
  const i = CREATE_AT_SCENE
  const last = OPENING_SCENES[i].lines.length - 1
  assert.equal(sceneBg(i, 0), 'scene-takeover', 'morning, sign says 준비중')
  assert.equal(sceneBg(i, last - 1), 'scene-takeover')
  assert.equal(sceneBg(i, last), 'scene-takeover-open', 'the sign flips to 영업중 as she opens')
  assert.equal(sceneBg(1, 0), 'scene-regular', 'scenes without changes keep their bg')
})

test('test_flow_protagonist_is_called_me_until_created', () => {
  assert.equal(storyName(0, '초아'), '나')
  assert.equal(storyName(CREATE_AT_SCENE - 1, '초아'), '나')
  assert.equal(storyName(CREATE_AT_SCENE, '초아'), '초아')
  OPENING_SCENES.slice(0, CREATE_AT_SCENE).flatMap((sc) => sc.lines)
    .forEach((l) => assert.ok(!l.text.includes('{name}'), `no name before creation: ${l.text}`))
})

test('test_flow_day_start_line_shows_then_fades', () => {
  const day = skipStory(finishCharacter(skipStory(beginNewGame())))
  assert.equal(ownerLineText(day), dayStartLine(1))
  const later = tick({ ...day, spawnTimer: 999 }, DAY_LINE_SEC + 0.1, () => 0.5)
  assert.equal(ownerLineText(later), null)
})

// ---------- save ----------

test('test_save_keeps_the_protagonist', () => {
  const s = finishCharacter(setCharacterName(setCharacterOption(skipStory(beginNewGame()), 'hair', 'long'), '하나'))
  saveGame(s)
  const loaded = loadGame()
  assert.deepEqual(loaded.character, { ...DEFAULT_CHARACTER, name: '하나', hair: 'long' })
})

test('test_save_from_before_characters_loads_with_default_protagonist', () => {
  const legacy = { version: 1, day: 2, money: 100, rating: 3, pricePer100g: 2200, stock: { noodle: 1 }, unlocked: ['noodle'], upgrades: { pots: 1 } }
  localStorage.setItem(SAVE_KEY, JSON.stringify(legacy))
  assert.deepEqual(loadGame().character, DEFAULT_CHARACTER)
})
