// Protagonist: a 16×20 pixel sprite built from a base body plus a hair layer, recoloured by palette.
// Pure data + grid composition (testable in node); only characterSprite() touches the DOM.
// design/quick-specs/story-character-2026-09-25.md §A
import { NAME_MAX_LEN } from './data.js'

export const CHARACTER_W = 16
export const CHARACTER_H = 20

export const HAIR_STYLES = [
  { id: 'bob', label: '단발' },
  { id: 'pony', label: '포니테일' },
  { id: 'long', label: '긴 머리' },
]
export const HAIR_COLORS = [
  { id: 'brown', label: '갈색', hex: '#6b3e26' },
  { id: 'black', label: '흑발', hex: '#2b2330' },
  { id: 'pink', label: '분홍', hex: '#e98aa8' },
  { id: 'orange', label: '주황', hex: '#e8894a' },
]
export const APRON_COLORS = [
  { id: 'red', label: '빨강', hex: '#e2493b' },
  { id: 'pink', label: '분홍', hex: '#f19cb7' },
  { id: 'mint', label: '민트', hex: '#7fd1b9' },
  { id: 'yellow', label: '노랑', hex: '#f7c948' },
]

export const DEFAULT_CHARACTER = { name: '초아', hair: 'bob', hairColor: 'brown', apron: 'red' }

const OPTIONS = { hair: HAIR_STYLES, hairColor: HAIR_COLORS, apron: APRON_COLORS }
const byId = (list, id) => list.find((o) => o.id === id)

// Fixed colours; hair (h) and apron (a) come from the player's choice.
const BASE_PALETTE = { o: '#3a1f2b', s: '#f6d3b3', e: '#3a1f2b', p: '#f4a0a0', r: '#d9534f', t: '#f5f1e8' }

const row = (...parts) => parts.join('')
const BLANK = '.'.repeat(CHARACTER_W)

// o outline · s skin · e eye · p blush · r mouth · t shirt · a apron · h hair · . transparent
const BODY = [
  BLANK, BLANK, BLANK,
  row('....', 'oooooooo', '....'),
  row('...o', 'ssssssss', 'o...'),
  row('...o', 'ssssssss', 'o...'),
  row('...o', 'sesssses', 'o...'),
  row('...o', 'pssssssp', 'o...'),
  row('...o', 'sssrrsss', 'o...'),
  row('....', 'oooooooo', '....'),
  row('......', 'osso', '......'),
  row('....', 'otttttto', '....'),
  row('...', 'ottaaaatto', '...'),
  row('...', 'otaaaaaato', '...'),
  row('...', 'osaaaaaaso', '...'),
  row('...', 'oaaaaaaaao', '...'),
  row('...', 'oaaaaaaaao', '...'),
  row('....', 'oaaaaaao', '....'),
  row('.....', 'oo', '..', 'oo', '.....'),
  BLANK,
]

// Hair layers: row index → overlay row ('.' keeps the body pixel underneath).
const CROWN = {
  1: row('....', 'oooooooo', '....'),
  2: row('...o', 'hhhhhhhh', 'o...'),
  3: row('..o', 'hhhhhhhhhh', 'o..'),
}
const SIDES = row('..oh', '........', 'ho..')
const HAIR_LAYERS = {
  bob: { ...CROWN, 4: row('..o', 'hhhhhhhhhh', 'o..'), 5: SIDES, 6: SIDES, 7: SIDES, 8: SIDES, 9: row('..oo', '........', 'oo..') },
  pony: {
    ...CROWN,
    4: row('..o', 'hhhhh', '........'),
    5: row('..oh', '.........', 'ohh'),
    6: row('..oh', '.........', 'ohh'),
    7: row('..oh', '..........', 'hh'),
    8: row('..............', 'ho'),
  },
  long: {
    ...CROWN,
    4: row('..o', 'hhhhhhhhhh', 'o..'),
    5: SIDES, 6: SIDES, 7: SIDES, 8: SIDES, 9: SIDES,
    10: row('..ohh', '......', 'hho..'),
    11: row('..ohh', '......', 'hho..'),
    12: row('...oh', '......', 'ho...'),
  },
}

const overlay = (base, top) => [...base].map((ch, x) => (top[x] === '.' ? ch : top[x])).join('')

/** The protagonist as rows of palette keys (CHARACTER_H rows × CHARACTER_W chars). */
export function characterGrid(look) {
  const layer = HAIR_LAYERS[look.hair] ?? HAIR_LAYERS[DEFAULT_CHARACTER.hair]
  return BODY.map((line, y) => (layer[y] ? overlay(line, layer[y]) : line))
}

/** Palette key → colour for this look. */
export function characterPalette(look) {
  const hair = byId(HAIR_COLORS, look.hairColor) ?? byId(HAIR_COLORS, DEFAULT_CHARACTER.hairColor)
  const apron = byId(APRON_COLORS, look.apron) ?? byId(APRON_COLORS, DEFAULT_CHARACTER.apron)
  return { ...BASE_PALETTE, h: hair.hex, a: apron.hex }
}

/** Returns the look with one appearance option changed; unknown keys or values leave it as is. */
export function withCharacterOption(look, key, value) {
  const list = OPTIONS[key]
  return list && byId(list, value) ? { ...look, [key]: value } : look
}

/** Trimmed, at most NAME_MAX_LEN characters, never blank. */
export function sanitizeName(raw) {
  const trimmed = typeof raw === 'string' ? raw.trim() : ''
  return trimmed ? [...trimmed].slice(0, NAME_MAX_LEN).join('') : DEFAULT_CHARACTER.name
}

/** Repairs untrusted saved data into a valid look (missing or bad fields fall back to defaults). */
export function normalizeCharacter(raw) {
  const src = raw && typeof raw === 'object' ? raw : {}
  const pick = (key) => (byId(OPTIONS[key], src[key]) ? src[key] : DEFAULT_CHARACTER[key])
  return { name: sanitizeName(src.name), hair: pick('hair'), hairColor: pick('hairColor'), apron: pick('apron') }
}

const spriteCache = new Map()

/** Data URL of the protagonist sprite (browser only). Scale it up with CSS `image-rendering: pixelated`. */
export function characterSprite(look) {
  const key = `${look.hair}|${look.hairColor}|${look.apron}`
  if (spriteCache.has(key)) return spriteCache.get(key)
  const canvas = document.createElement('canvas')
  canvas.width = CHARACTER_W
  canvas.height = CHARACTER_H
  const ctx = canvas.getContext('2d')
  const palette = characterPalette(look)
  characterGrid(look).forEach((line, y) => [...line].forEach((ch, x) => {
    if (ch === '.') return
    ctx.fillStyle = palette[ch]
    ctx.fillRect(x, y, 1, 1)
  }))
  const url = canvas.toDataURL('image/png')
  spriteCache.set(key, url)
  return url
}
