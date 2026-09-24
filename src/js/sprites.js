// Turns an emoji into a chunky outlined pixel sprite (data URL), cached.
// Drawn tiny on a canvas, alpha-quantized, colour-posterized, then outlined,
// so CSS `image-rendering: pixelated` upscaling gives a retro pixel look.

const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'
const ALPHA_CUTOFF = 110
const POSTERIZE_STEP = 28
const OUTLINE = [58, 31, 43]
const cache = new Map()

const posterize = (v) => Math.min(255, Math.round(v / POSTERIZE_STEP) * POSTERIZE_STEP)

const BOUNDS_ALPHA = 24 // faint anti-aliasing counts as part of the glyph when measuring

/** Tight box around every visibly painted pixel, or null for an empty canvas. */
function alphaBounds(ctx, size) {
  const data = ctx.getImageData(0, 0, size, size).data
  let minX = size; let minY = size; let maxX = -1; let maxY = -1
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (data[(y * size + x) * 4 + 3] < BOUNDS_ALPHA) continue
      minX = Math.min(minX, x); maxX = Math.max(maxX, x)
      minY = Math.min(minY, y); maxY = Math.max(maxY, y)
    }
  }
  return maxX < 0 ? null : { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
}

// Emoji glyphs often overflow their em box (usually up and to the right), so the glyph is
// painted on a roomy scratch canvas, measured, then fitted inside px×px with a 1px margin
// left free for the outline. Nothing gets clipped regardless of the font's metrics.
function drawEmoji(emoji, px) {
  const scratchSize = px * 2
  const scratch = document.createElement('canvas')
  scratch.width = scratchSize
  scratch.height = scratchSize
  const sctx = scratch.getContext('2d', { willReadFrequently: true })
  sctx.font = `${px}px ${EMOJI_FONT}`
  sctx.textAlign = 'center'
  sctx.textBaseline = 'middle'
  sctx.fillText(emoji, scratchSize / 2, scratchSize / 2)

  const canvas = document.createElement('canvas')
  canvas.width = px + 2
  canvas.height = px + 2
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const box = alphaBounds(sctx, scratchSize)
  if (!box) return { canvas, ctx }
  const scale = Math.min(px / box.w, px / box.h)
  const w = Math.max(1, Math.round(box.w * scale))
  const h = Math.max(1, Math.round(box.h * scale))
  ctx.drawImage(scratch, box.x, box.y, box.w, box.h, 1 + Math.floor((px - w) / 2), 1 + Math.floor((px - h) / 2), w, h)
  return { canvas, ctx }
}

function pixelate(ctx, size) {
  const src = ctx.getImageData(0, 0, size, size).data
  const out = new Uint8ClampedArray(src.length)
  const solid = (x, y) =>
    x >= 0 && y >= 0 && x < size && y < size && src[(y * size + x) * 4 + 3] >= ALPHA_CUTOFF
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 4
      if (solid(x, y)) {
        out.set([posterize(src[i]), posterize(src[i + 1]), posterize(src[i + 2]), 255], i)
      } else if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) {
        out.set([...OUTLINE, 255], i)
      }
    }
  }
  return new ImageData(out, size, size)
}

// Hand-drawn 16×16 sprites for ingredients no emoji depicts well. Keys start with 'px:'
// and are used in place of an emoji in data.js. '.' is transparent; the outline is added
// by pixelate(), so grids hold fill colours only.
const CUSTOM_GRID = 16
const CUSTOM_SPRITES = {
  // 팽이버섯: three long, separate strands, each with a round cream cap — no base.
  // Strands sit 3px apart so a transparent pixel survives between their outlines.
  'px:enoki': {
    palette: { C: '#fbf3dc', D: '#dcc697', W: '#fffdf5', S: '#e2d8c0' },
    rows: [
      '.......CC.......',
      '......CCCC......',
      '......DDDD......',
      '..CC...WS.......',
      '.CCCC..WS...CC..',
      '.DDDD..WS..CCCC.',
      '..WS...WS..DDDD.',
      '..WS...WS...WS..',
      '..WS...WS...WS..',
      '..WS...WS...WS..',
      '..WS...WS...WS..',
      '..WS...WS...WS..',
      '...WS..WS..WS...',
      '...WS..WS..WS...',
      '...SS..WS..SS...',
      '.......SS.......',
    ],
  },
  // 목이버섯: irregular, ruffled dark-brown ear with folds and a translucent lighter rim
  'px:woodear': {
    palette: { E: '#8b5a3c', M: '#5a3624', K: '#33201a', H: '#a87758' },
    rows: [
      '................',
      '.......EEE......',
      '.....EEMMME..EE.',
      '...EEMMKKMMEEME.',
      '..EMMKKMMHMMMME.',
      '.EMKKMMHHMKKMEE.',
      '.EMKMMHMMKKMMME.',
      'EMKMMHMKKMMHMKE.',
      'EMKMHMKKMMHMKME.',
      '.EMKMMKMMHMKKME.',
      '.EMMKKMMHMKMMEE.',
      '..EMMMKKKKMMME..',
      '...EEMMMMMMEE...',
      '..EE.EEMMEE.EE..',
      '.......EE.......',
      '................',
    ],
  },
  // 푸주: two wrinkled, pale-yellow dried tofu-skin sticks
  'px:tofuskin': {
    palette: { w: '#fcefc4', Y: '#f0cf7c', y: '#d4a651', t: '#a87a34' },
    rows: [
      '................',
      '............wty.',
      '...........wYy..',
      '..........wYy...',
      '.........wty.wYy',
      '........wYy.wYy.',
      '.......wYy.wty..',
      '......wty.wYy...',
      '.....wYy.wYy....',
      '....wYy.wty.....',
      '...wty.wYy......',
      '..wYy.wYy.......',
      '.wYy.wty........',
      'wty.wYy.........',
      '...wYy..........',
      '..wty...........',
    ],
  },
}

function drawCustom(def) {
  const canvas = document.createElement('canvas')
  canvas.width = CUSTOM_GRID + 2
  canvas.height = CUSTOM_GRID + 2
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  def.rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '.') return
    ctx.fillStyle = def.palette[ch]
    ctx.fillRect(x + 1, y + 1, 1, 1)
  }))
  return { canvas, ctx }
}

/** Returns a cached data URL for `emoji` (or a 'px:' custom key) as an outlined pixel sprite. */
export function pixelSprite(emoji, px = 16) {
  const custom = CUSTOM_SPRITES[emoji]
  const key = custom ? emoji : `${emoji}@${px}`
  if (cache.has(key)) return cache.get(key)
  const { canvas, ctx } = custom ? drawCustom(custom) : drawEmoji(emoji, px)
  ctx.putImageData(pixelate(ctx, canvas.width), 0, 0)
  const url = canvas.toDataURL('image/png')
  cache.set(key, url)
  return url
}

/** HTML for a pixel sprite <img>; size it with CSS. */
export const spriteImg = (emoji, px, cls = '', alt = '') =>
  `<img class="px ${cls}" src="${pixelSprite(emoji, px)}" alt="${alt}" draggable="false">`
