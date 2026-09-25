// Protagonist: a 64×112 pixel sprite assembled from one shared body plus a hair-style layer (converted from
// assets/art/hero-reference.webp by tools/art/hero_sprites.py). Hair and apron pixels are tone levels,
// coloured from the chosen ramp. Pure data + grid assembly (testable in node); only characterSprite() touches the DOM.
// design/quick-specs/story-character-2026-09-25.md §A
import { NAME_MAX_LEN } from './data.js'
import {
  APRON_TONE_KEYS, HAIR_TONE_KEYS, HERO_BODY, HERO_FIXED, HERO_H, HERO_HAIR, HERO_NECK_Y, HERO_W,
} from './hero-art.js'

export { APRON_TONE_KEYS, HAIR_TONE_KEYS }
export const CHARACTER_W = HERO_W
export const CHARACTER_H = HERO_H
export const HAIR_BASE_KEY = HAIR_TONE_KEYS[(HAIR_TONE_KEYS.length - 1) / 2]
export const APRON_BASE_KEY = APRON_TONE_KEYS[(APRON_TONE_KEYS.length - 1) / 2]

const INK = '#1c0d0c'
const WHITE = '#ffffff'
const TONE_EDGE = 0.45 // how far the darkest / lightest tone reaches past the ramp toward ink / white

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const hex = (c) => `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t))

/** [light, base, shade] → n colours from dark to light; the middle one is base. Mirrors tools/art/hero_sprites.py. */
export function toneScale([light, base, shade], n) {
  const stops = [mix(rgb(shade), rgb(INK), TONE_EDGE), rgb(shade), rgb(base), rgb(light), mix(rgb(light), rgb(WHITE), TONE_EDGE)]
  return Array.from({ length: n }, (_, i) => {
    const t = (i / (n - 1)) * (stops.length - 1)
    const k = Math.min(stops.length - 2, Math.floor(t))
    return hex(mix(stops[k], stops[k + 1], t - k))
  })
}

// Options are the three reference girls (1 bob · 2 long · 3 pony) and their own hair / apron colours.
export const HAIR_STYLES = [
  { id: 'bob', label: '단발' },
  { id: 'long', label: '긴 머리' },
  { id: 'pony', label: '포니테일' },
]
// ramp = [light, base, shade]; hex (the swatch) is the base tone.
const tone = (id, label, ramp) => ({ id, label, hex: ramp[1], ramp })
export const HAIR_COLORS = [
  tone('brown', '갈색', ['#b88c6e', '#8a5748', '#5b3831']),
  tone('black', '흑발', ['#6b5a5e', '#413538', '#2b2024']),
  tone('gold', '금발', ['#fee9a5', '#eab782', '#b98a58']),
]
export const APRON_COLORS = [
  tone('pink', '분홍', ['#fcd3cc', '#fab8ad', '#e08f86']),
  tone('mint', '민트', ['#e3f5e3', '#ceeacd', '#a8cfa8']),
  tone('yellow', '노랑', ['#fff5cf', '#fee9a5', '#eac27a']),
]

/** Reference girl 1. Saves holding a colour that no longer exists fall back to these. */
export const DEFAULT_CHARACTER = { name: '초아', hair: 'bob', hairColor: 'brown', apron: 'pink' }

const OPTIONS = { hair: HAIR_STYLES, hairColor: HAIR_COLORS, apron: APRON_COLORS }
const byId = (list, id) => list.find((o) => o.id === id)

const gridCache = new Map()
const pick = (top, under) => (top !== '.' ? top : under)

/**
 * The protagonist as rows of palette keys (CHARACTER_H rows × CHARACTER_W chars): the shared body with the
 * hair style's layer on top down to the neck (bangs over the face) and behind it below (hair down the back).
 */
export function characterGrid(look) {
  const style = HERO_HAIR[look.hair] ? look.hair : DEFAULT_CHARACTER.hair
  if (!gridCache.has(style)) {
    const hair = HERO_HAIR[style]
    gridCache.set(style, HERO_BODY.map((body, y) => [...body]
      .map((b, x) => (y <= HERO_NECK_Y ? pick(hair[y][x], b) : pick(b, hair[y][x])))
      .join('')))
  }
  return gridCache.get(style)
}

const toneMap = (keys, ramp) => Object.fromEntries(toneScale(ramp, keys.length).map((c, i) => [keys[i], c]))

/** Palette key → colour for this look: fixed colours plus the hair and apron tone levels. */
export function characterPalette(look) {
  const hair = byId(HAIR_COLORS, look.hairColor) ?? byId(HAIR_COLORS, DEFAULT_CHARACTER.hairColor)
  const apron = byId(APRON_COLORS, look.apron) ?? byId(APRON_COLORS, DEFAULT_CHARACTER.apron)
  return { ...HERO_FIXED, ...toneMap(HAIR_TONE_KEYS, hair.ramp), ...toneMap(APRON_TONE_KEYS, apron.ramp) }
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
