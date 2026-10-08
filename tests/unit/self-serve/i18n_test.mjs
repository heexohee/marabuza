// Translation engine (request 2026-10-02): Korean markup in, English markup out.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createTranslator, keepKorean, loadLang, otherLang, saveLang } from '../../../src/js/self-serve/i18n.js'

const DICT = {
  청경채: 'Bok choy',
  월: 'Mon',
  곰: 'Bear',
  '오늘도 야근이에요. 4단계로 주세요…': 'Working late again. Spice 4, please…',
  '{n}단계': 'Lv {n}',
  '{n}주차 {w}요일': 'Week {n} · {w}',
  '{w} {n}개가 시들어 버렸어요': '{w} ×{n} wilted',
  '{m}': '{m}',
  '{w} 손님': '{w} customer',
  '"버티게 해주는 한 그릇"': '"the bowl that keeps you going"',
}

function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial))
  return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, String(v)) }
}

test('test_i18n_text_without_hangul_is_returned_as_is', () => {
  const tr = createTranslator(DICT)
  const html = '<b class="x">DAY 3</b>'
  assert.equal(tr(html), html)
})

test('test_i18n_pattern_captures_are_translated_too', () => {
  const tr = createTranslator(DICT)
  assert.equal(tr('<div class="toast">청경채 2개가 시들어 버렸어요</div>'), '<div class="toast">Bok choy ×2 wilted</div>')
})

test('test_i18n_whole_sentence_wins_over_a_short_pattern_inside_it', () => {
  const tr = createTranslator(DICT)
  assert.equal(tr('<p>오늘도 야근이에요. 4단계로 주세요…</p>'), '<p>Working late again. Spice 4, please…</p>')
  assert.equal(tr('<span>3단계</span>'), '<span>Lv 3</span>')
})

test('test_i18n_money_becomes_won_sign', () => {
  const tr = createTranslator(DICT)
  assert.equal(tr('<td>12,000원</td>'), '<td>₩12,000</td>')
})

test('test_i18n_one_syllable_entries_only_replace_a_whole_run', () => {
  const tr = createTranslator(DICT)
  assert.equal(tr('DAY 4 <small>월</small>'), 'DAY 4 <small>Mon</small>')
  assert.equal(tr('<span>1주차 월요일</span>'), '<span>Week 1 · Mon</span>')
  assert.equal(tr('<img alt="곰 손님">'), '<img alt="Bear customer">')
})

test('test_i18n_escaped_quotes_in_story_lines_still_match', () => {
  const tr = createTranslator(DICT)
  assert.equal(tr('<p>&quot;버티게 해주는 한 그릇&quot;</p>'), '<p>&quot;the bowl that keeps you going&quot;</p>')
})

test('test_i18n_dollar_signs_in_a_captured_name_stay_as_typed', () => {
  // code review 2026-10-09: a string replacement read "$&" / "$'" in a player's name as replacement patterns
  const tr = createTranslator({ '{t} 사장의 마라부자': "Boss {t}'s Marabuza" })
  assert.equal(tr('<p>A$&B 사장의 마라부자</p>'), "<p>Boss A$&B's Marabuza</p>")
  assert.equal(tr("<p>Z$'Q 사장의 마라부자</p>"), "<p>Boss Z$'Q's Marabuza</p>")
})

test('test_i18n_keep_korean_is_identity', () => {
  assert.equal(keepKorean('<p>안녕</p>'), '<p>안녕</p>')
})

test('test_i18n_lang_follows_the_system_until_chosen', () => {
  assert.equal(loadLang(memoryStorage(), { languages: ['ko-KR'] }), 'ko')
  assert.equal(loadLang(memoryStorage(), { languages: ['en-US'] }), 'en')
  assert.equal(loadLang(memoryStorage(), { language: 'ja' }), 'en')
  assert.equal(loadLang(memoryStorage({ 'marabuza.lang': 'ko' }), { languages: ['en-US'] }), 'ko')
  assert.equal(loadLang(memoryStorage({ 'marabuza.lang': 'xx' }), { languages: ['ko'] }), 'ko', 'an unknown saved value is ignored')
})

test('test_i18n_lang_survives_storage_that_throws', () => {
  const broken = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') } }
  assert.equal(loadLang(broken, { languages: ['en'] }), 'en')
  assert.equal(saveLang(broken, 'en'), false)
})

test('test_i18n_save_then_load_round_trips', () => {
  const storage = memoryStorage()
  assert.equal(saveLang(storage, 'en'), true)
  assert.equal(loadLang(storage, { languages: ['ko'] }), 'en')
  assert.equal(otherLang('en'), 'ko')
  assert.equal(otherLang('ko'), 'en')
})
