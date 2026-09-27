// Fine-weather day title (feedback 2026-09-28): clouds drift on the breeze, the street trees sway, petals and
// leaves blow across, wind curls come and go, a few birds fly over and steam rises from her kitchen vent.
// Layers: tools/art/title_day.py (title-day-*.png; still frame img/title-bg-day.png). Shown with ?title=day
// (title-anim.js titleSceneName) while it is reviewed.
import { TITLE_ART } from './title-anim.js'

/** Crown boxes of the street trees (art px, printed by tools/art/title_day.py) and where each stands. */
export const DAY_TREES = [
  { x: 457, y: 217, w: 122, h: 70, ground: 338, phase: 0 },
  { x: 570, y: 239, w: 102, h: 64, ground: 344, phase: 1.9 },
  { x: 6, y: 246, w: 90, h: 55, ground: 346, phase: 3.4 },
]

/** Tuning. Speeds in art px per second, times in seconds. */
export const DAY_FX = {
  cloudSpeed: 5, // the cloud strip drifts right, tiling
  sway: { amp: 2.2, speed: 1.35, gustPeriod: 9 }, // tree tops, px either way
  petals: 44,
  petalSpeed: [34, 70],
  petalColors: ['#ffbad0', '#ffd6e2', '#ffa4c0', '#7ebe68', '#b0da80'],
  curlEvery: [1.6, 4], // a wind curl starts this often
  curlSpeed: 130,
  flockEvery: [9, 18],
  flockSpeed: 38,
  steamEvery: 0.45,
  steamLife: 3.2,
  vent: { x: 437, y: 124 }, // top of her kitchen vent (tools/art/title_bg.py shop())
}

const IMAGES = {
  sky: 'img/title-day-sky.png',
  clouds: 'img/title-day-clouds.png',
  fg: 'img/title-day-fg.png',
  crown0: 'img/title-day-crown-0.png',
  crown1: 'img/title-day-crown-1.png',
  crown2: 'img/title-day-crown-2.png',
}
const between = (rng, [lo, hi]) => lo + rng() * (hi - lo)

/**
 * Wind level 0.4…1: calm spells and gusts, slowly.
 * @param {number} t seconds
 */
export const gust = (t) => 0.7 + 0.3 * Math.sin((t / DAY_FX.sway.gustPeriod) * Math.PI * 2)

/**
 * Whole-pixel sideways shift of one crown row: the top sways most, the rows near the trunk hardly at all.
 * @param {{y: number, ground: number, phase: number}} tree
 * @param {number} y art row
 * @param {number} t seconds
 */
export function swayOffset(tree, y, t) {
  const k = Math.max(0, Math.min(1, (tree.ground - y) / (tree.ground - tree.y)))
  const { amp, speed } = DAY_FX.sway
  const wave = Math.sin(t * speed + tree.phase) * 0.75 + Math.sin(t * speed * 2.3 + tree.phase * 2) * 0.25
  return Math.round(amp * gust(t) * k * k * (wave + 0.35)) || 0 // + a lean with the wind, which blows right; no -0
}

/**
 * A petal or leaf entering from the left (anywhere across the frame when `scatter`, for the first frame).
 * @param {() => number} rng
 * @param {boolean} [scatter]
 */
export function spawnPetal(rng, scatter = false) {
  const { w, h } = TITLE_ART
  return {
    x: scatter ? rng() * w : -4 - rng() * 60,
    y: 100 + rng() * (h - 120),
    speed: between(rng, DAY_FX.petalSpeed),
    phase: rng() * Math.PI * 2,
    color: DAY_FX.petalColors[Math.floor(rng() * DAY_FX.petalColors.length)],
  }
}

/**
 * Moves a petal on the breeze; it bobs up and down and sinks a little. Returns null once it has blown off
 * the right edge (or down below the frame).
 */
export function stepPetal(p, dt, t) {
  const x = p.x + p.speed * gust(t) * dt
  const y = p.y + (Math.sin(t * 2.4 + p.phase) * 14 + 5) * dt
  if (x > TITLE_ART.w + 4 || y > TITLE_ART.h) return null
  return { ...p, x, y }
}

/**
 * Where a flock's birds are `t` seconds after it set off, with each bird's wing up or down.
 * @param {{y: number, startedAt: number}} flock
 * @param {number} t
 * @returns {{x: number, y: number, up: boolean}[]}
 */
export function flockBirds(flock, t) {
  const age = t - flock.startedAt
  const lead = -20 + age * DAY_FX.flockSpeed
  return [[0, 0], [-11, 5], [-19, -3]].map(([dx, dy], i) => ({
    x: Math.round(lead + dx),
    y: Math.round(flock.y + dy + Math.sin(age * 1.4 + i) * 2),
    up: Math.floor(age * 5 + i * 1.7) % 2 === 0,
  }))
}

function drawPetals(ctx, petals, t) {
  for (const p of petals) {
    ctx.fillStyle = p.color
    const x = Math.round(p.x)
    const y = Math.round(p.y)
    if (Math.floor(t * 6 + p.phase) % 2) ctx.fillRect(x, y, 2, 1) // tumbling: flat, then edge-on
    else ctx.fillRect(x, y, 1, 2)
  }
}

/** A 7-px bird: wings up (a V) or down (a ^). */
function drawBird(ctx, { x, y, up }) {
  ctx.fillStyle = '#3c4664'
  ctx.fillRect(x, y, 1, 1)
  for (const s of [-1, 1]) {
    if (up) {
      ctx.fillRect(x + s, y - 1, 1, 1)
      ctx.fillRect(x + s * 2, y - 2, 1, 1)
      ctx.fillRect(x + s * 3, y - 2, 1, 1)
    } else {
      ctx.fillRect(x + s, y, 1, 1)
      ctx.fillRect(x + s * 2, y + 1, 1, 1)
      ctx.fillRect(x + s * 3, y + 1, 1, 1)
    }
  }
}

function drawCurl(ctx, c) {
  const head = c.age * DAY_FX.curlSpeed
  const fadeOut = Math.max(0, 1 - c.age / c.life)
  for (let i = 0; i < c.len; i++) {
    const along = head - i
    if (along < 0) continue
    const alpha = 0.55 * Math.sin((i / c.len) * Math.PI) * fadeOut
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`
    ctx.fillRect(Math.round(c.x + along), Math.round(c.y + Math.sin(along / 7) * 2.5), 1, 1)
  }
}

function drawSteam(ctx, puffs) {
  for (const s of puffs) {
    const k = s.age / DAY_FX.steamLife
    const r = 1 + k * 4
    ctx.fillStyle = `rgba(255, 255, 255, ${(0.4 * (1 - k)).toFixed(3)})`
    for (let yy = -r; yy <= r; yy++) {
      for (let xx = -r; xx <= r; xx++) {
        const px = Math.round(s.x + xx)
        const py = Math.round(s.y + yy)
        if (xx * xx + yy * yy <= r * r && (px + py) % 2 === 0) ctx.fillRect(px, py, 1, 1) // dithered puff
      }
    }
  }
}

/**
 * The fine-weather day scene (same shape as createNightScene in title-anim.js).
 * @param {() => number} rng
 */
export function createDayScene(rng) {
  const { w } = TITLE_ART
  let petals = Array.from({ length: DAY_FX.petals }, () => spawnPetal(rng, true))
  let curls = []
  let nextCurl = between(rng, [0.3, 1])
  let flock = null
  let nextFlock = between(rng, [2, 5])
  let steam = []
  let nextSteam = 0

  function update(dt, t) {
    petals = petals.map((p) => stepPetal(p, dt, t) ?? spawnPetal(rng))
    curls = curls.map((c) => ({ ...c, age: c.age + dt })).filter((c) => c.age < c.life)
    if (t >= nextCurl) {
      curls = [...curls, { x: rng() * (w - 120), y: 150 + rng() * 190, len: 34 + rng() * 30, age: 0, life: 1.6 }]
      nextCurl = t + between(rng, DAY_FX.curlEvery)
    }
    if (!flock && t >= nextFlock) flock = { y: 36 + rng() * 60, startedAt: t }
    if (flock && flockBirds(flock, t)[2].x > w + 10) {
      flock = null
      nextFlock = t + between(rng, DAY_FX.flockEvery)
    }
    steam = steam.map((s) => ({ ...s, age: s.age + dt, y: s.y - 11 * dt, x: s.x + 7 * gust(t) * dt }))
      .filter((s) => s.age < DAY_FX.steamLife)
    if (t >= nextSteam) {
      steam = [...steam, { x: DAY_FX.vent.x + rng() * 3 - 1, y: DAY_FX.vent.y, age: 0 }]
      nextSteam = t + DAY_FX.steamEvery
    }
  }

  function draw(ctx, art, canvas, t) {
    ctx.drawImage(art.sky, 0, 0)
    if (flock) flockBirds(flock, t).forEach((b) => drawBird(ctx, b))
    const cx = Math.round((t * DAY_FX.cloudSpeed) % w)
    ctx.drawImage(art.clouds, cx, 0)
    ctx.drawImage(art.clouds, cx - w, 0)
    ctx.drawImage(art.fg, 0, 0)
    drawSteam(ctx, steam)
    DAY_TREES.forEach((tree, i) => {
      const crown = art[`crown${i}`]
      for (let y = tree.y; y < tree.y + tree.h; y++) {
        ctx.drawImage(crown, tree.x, y, tree.w, 1, tree.x + swayOffset(tree, y, t), y, tree.w, 1)
      }
    })
    curls.forEach((c) => drawCurl(ctx, c))
    drawPetals(ctx, petals, t)
  }

  return { images: IMAGES, update, draw }
}
