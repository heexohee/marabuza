// Living title background (feedback 2026-09-27): rain falls, the roof neon sign flickers, the clouds sway behind the
// buildings and the wet road shimmers. A canvas at the art's own 800×442 px, scaled like the CSS background
// (object-fit: cover, centred) so it lines up with img/title-bg.png — that still frame stays under it for the first
// paint and is all that shows with prefers-reduced-motion. Layers: tools/art/title_layers.py. CSS: .title-anim.

/** Art size and the street lines of tools/art/title_bg.py (BASE = building bases, ROAD_Y + 5 = wet road top). */
export const TITLE_ART = { w: 800, h: 442, base: 340, road: 363 }

/**
 * Boxes (art px) of the signs that flicker — where the lit and unlit frames differ, printed by
 * tools/art/title_layers.py. Only the roof sign: the subtitle sign (퇴사하고 마라탕집 사장님) stays lit
 * (feedback 2026-09-27); its box would be { x: 129, y: 158, w: 319, h: 54 }.
 */
export const NEON_BOXES = {
  roof: { x: 149, y: 54, w: 279, h: 96 },
}

/** Tuning for the whole effect. Speeds in art px per second, times in seconds. */
export const TITLE_FX = {
  drops: 230,
  farShare: 0.45, // this share of drops is the fainter, slower far layer
  speed: { near: [430, 560], far: [300, 380] },
  length: { near: [7, 11], far: [4, 7] },
  wind: 0.25, // x per y — the slant of the baked rain
  color: { near: 'rgba(214, 204, 250, 0.42)', far: 'rgba(190, 180, 236, 0.24)' },
  splashSec: 0.14,
  rippleSec: 0.7,
  rippleMaxRx: 6,
  cloudSway: 26, // px either way
  cloudPeriod: 46,
  cloudY: 14,
  shimmerAmp: [0.6, 1.7], // row shift at the road top → bottom
  // neon: seconds lit between flickers, per sign in NEON_BOXES
  neonCalm: { roof: [2.2, 6.5] },
}

const IMAGES = { sky: 'img/title-sky.png', fg: 'img/title-fg.png', off: 'img/title-off.png', clouds: 'img/title-clouds.png' }
const MAX_DT = 0.1
const between = (rng, [lo, hi]) => lo + rng() * (hi - lo)

/**
 * One flicker burst: a few quick off/dim/on steps that end lit, sometimes a longer blackout first.
 * @param {() => number} rng 0..1
 * @returns {{level: number, dur: number}[]} level 0 = unlit … 1 = lit, dur in seconds
 */
export function flickerBurst(rng) {
  const steps = []
  if (rng() < 0.18) steps.push({ level: 0, dur: 0.35 + rng() * 0.5 }) // a tube dropping out for a moment
  const n = 2 + Math.floor(rng() * 4)
  for (let i = 0; i < n; i++) {
    steps.push({ level: rng() < 0.6 ? 0 : 0.45, dur: 0.03 + rng() * 0.08 })
    steps.push({ level: 1, dur: 0.04 + rng() * 0.12 })
  }
  return steps
}

/**
 * Level of a sign `t` seconds into its current burst (1 once the burst is over).
 * @param {{level: number, dur: number}[]} burst
 * @param {number} t
 */
export function burstLevel(burst, t) {
  let at = 0
  for (const step of burst) {
    at += step.dur
    if (t < at) return step.level
  }
  return 1
}

/** Total length of a burst in seconds. */
export const burstLength = (burst) => burst.reduce((sum, s) => sum + s.dur, 0)

/**
 * A raindrop starting above the frame (or anywhere in it when `scatter`, for the first frame).
 * @param {() => number} rng
 * @param {boolean} [scatter]
 */
export function spawnDrop(rng, scatter = false) {
  const { w, h, base } = TITLE_ART
  const layer = rng() < TITLE_FX.farShare ? 'far' : 'near'
  const groundY = base + 2 + rng() * (h - base - 2) // where it lands: the sidewalk or the road
  const y = scatter ? rng() * groundY : -rng() * h * 0.4
  return {
    layer,
    x: rng() * (w + h * TITLE_FX.wind) - h * TITLE_FX.wind, // start left of the frame too, for the slant
    y,
    speed: between(rng, TITLE_FX.speed[layer]),
    len: Math.round(between(rng, TITLE_FX.length[layer])),
    groundY,
  }
}

/**
 * Moves a drop by dt; a drop that reaches its ground comes back as `landed` with where it hit.
 * @returns {{drop: object, landed: {x: number, y: number} | null}}
 */
export function stepDrop(drop, dt) {
  const y = drop.y + drop.speed * dt
  const x = drop.x + drop.speed * dt * TITLE_FX.wind
  if (y + drop.len < drop.groundY) return { drop: { ...drop, x, y }, landed: null }
  return { drop, landed: { x: Math.round(x + drop.len * TITLE_FX.wind), y: Math.round(drop.groundY) } }
}

/**
 * Whole-pixel sideways shift of one road row — two slow waves, stronger further down (0 above the road).
 * @param {number} y art row
 * @param {number} t seconds
 */
export function shimmerOffset(y, t) {
  const { h, road } = TITLE_ART
  if (y < road) return 0
  const depth = (y - road) / (h - road)
  const [a0, a1] = TITLE_FX.shimmerAmp
  const amp = a0 + (a1 - a0) * depth
  return Math.round(amp * (0.65 * Math.sin(t * 2.1 + y * 0.83) + 0.35 * Math.sin(t * 1.3 - y * 0.37)))
}

/** Sideways sway of the cloud strip at time t, in px. */
export const cloudOffset = (t) => TITLE_FX.cloudSway * Math.sin((t / TITLE_FX.cloudPeriod) * Math.PI * 2)

function loadImages(doc) {
  return Promise.all(Object.entries(IMAGES).map(([key, src]) => new Promise((resolve, reject) => {
    const img = new doc.defaultView.Image()
    img.onload = () => resolve([key, img])
    img.onerror = () => reject(new Error(`title art failed to load: ${src}`))
    img.src = src
  }))).then(Object.fromEntries)
}

function createSign(rng, name, now) {
  return { name, burst: null, burstAt: 0, nextAt: now + between(rng, TITLE_FX.neonCalm[name]) }
}

/** The sign's level now, starting a new burst when its calm spell is over. Returns the updated sign too. */
function signAt(sign, now, rng) {
  if (!sign.burst && now >= sign.nextAt) return signAt({ ...sign, burst: flickerBurst(rng), burstAt: now }, now, rng)
  if (!sign.burst) return { sign, level: 1 }
  const t = now - sign.burstAt
  if (t >= burstLength(sign.burst)) {
    return { sign: { ...sign, burst: null, nextAt: now + between(rng, TITLE_FX.neonCalm[sign.name]) }, level: 1 }
  }
  return { sign, level: burstLevel(sign.burst, t) }
}

function drawRain(ctx, drops, layer) {
  ctx.fillStyle = TITLE_FX.color[layer]
  for (const d of drops) {
    if (d.layer !== layer) continue
    const x0 = Math.round(d.x)
    const y0 = Math.round(d.y)
    for (let k = 0; k < d.len; k += 4) ctx.fillRect(x0 + (k >> 2), y0 + k, 1, Math.min(4, d.len - k))
  }
}

function drawSplashes(ctx, splashes) {
  ctx.fillStyle = 'rgba(200, 184, 232, 0.7)'
  for (const s of splashes) {
    const spread = s.age < TITLE_FX.splashSec / 2 ? 1 : 2
    ctx.fillRect(s.x - spread, s.y - spread, 1, 1)
    ctx.fillRect(s.x + spread, s.y - spread, 1, 1)
    if (spread === 1) ctx.fillRect(s.x, s.y, 1, 1)
  }
}

function drawRipples(ctx, ripples) {
  for (const r of ripples) {
    const k = r.age / TITLE_FX.rippleSec
    const rx = 1 + k * TITLE_FX.rippleMaxRx
    const ry = Math.max(1, rx * 0.34)
    ctx.fillStyle = `rgba(206, 160, 226, ${(0.55 * (1 - k)).toFixed(3)})`
    const points = Math.max(8, Math.round(rx * 4))
    for (let i = 0; i < points; i++) {
      const a = (i / points) * Math.PI * 2
      ctx.fillRect(Math.round(r.x + Math.cos(a) * rx), Math.round(r.y + Math.sin(a) * ry), 1, 1)
    }
  }
}

/**
 * Starts the living title: a canvas behind #app, running only while the title screen shows
 * (html[data-screen="menu"]) and motion is allowed. Falls back to the still CSS background if the art fails.
 * @param {Window} win
 * @param {{rng?: () => number, onError?: (err: Error) => void}} [opts]
 * @returns {{stop: () => void}}
 */
export function mountTitleAnim(win = window, { rng = Math.random, onError = () => {} } = {}) {
  const doc = win.document
  const { w, h, road } = TITLE_ART
  const canvas = doc.createElement('canvas')
  canvas.className = 'title-anim'
  canvas.width = w
  canvas.height = h
  canvas.setAttribute('aria-hidden', 'true')
  doc.body.prepend(canvas)
  const ctx = canvas.getContext('2d')
  const motion = win.matchMedia?.('(prefers-reduced-motion: reduce)')

  let art = null
  let frame = 0
  let last = 0
  let clock = 0
  let drops = Array.from({ length: TITLE_FX.drops }, () => spawnDrop(rng, true))
  let splashes = []
  let ripples = []
  let signs = Object.fromEntries(Object.keys(NEON_BOXES).map((name) => [name, createSign(rng, name, 0)]))

  function update(dt) {
    clock += dt
    const landed = []
    drops = drops.map((d) => {
      const step = stepDrop(d, dt)
      if (!step.landed) return step.drop
      landed.push(step.landed)
      return spawnDrop(rng)
    })
    const age = (list, life) => list.map((s) => ({ ...s, age: s.age + dt })).filter((s) => s.age < life)
    const fresh = (onRoad) => landed.filter((p) => (p.y >= road + 2) === onRoad).map((p) => ({ ...p, age: 0 }))
    splashes = [...age(splashes, TITLE_FX.splashSec), ...fresh(false)]
    ripples = [...age(ripples, TITLE_FX.rippleSec), ...fresh(true)]
  }

  function drawNeon() {
    for (const [name, box] of Object.entries(NEON_BOXES)) {
      const { sign, level } = signAt(signs[name], clock, rng)
      signs = { ...signs, [name]: sign }
      if (level >= 1) continue
      ctx.globalAlpha = 1 - level
      ctx.drawImage(art.off, box.x, box.y, box.w, box.h, box.x, box.y, box.w, box.h)
      ctx.globalAlpha = 1
    }
  }

  function draw() {
    ctx.drawImage(art.sky, 0, 0)
    const cx = Math.round(cloudOffset(clock))
    ctx.drawImage(art.clouds, cx, TITLE_FX.cloudY)
    ctx.drawImage(art.clouds, cx + (cx > 0 ? -w : w), TITLE_FX.cloudY) // the strip tiles; fill the gap it leaves
    ctx.drawImage(art.fg, 0, 0)
    drawNeon()
    for (let y = road; y < h; y++) {
      const dx = shimmerOffset(y, clock)
      if (dx) ctx.drawImage(canvas, 0, y, w, 1, dx, y, w, 1)
    }
    drawRipples(ctx, ripples)
    drawSplashes(ctx, splashes)
    drawRain(ctx, drops, 'far')
    drawRain(ctx, drops, 'near')
  }

  function loop(now) {
    const dt = last ? Math.min(MAX_DT, (now - last) / 1000) : 0
    last = now
    update(dt)
    draw()
    frame = win.requestAnimationFrame(loop)
  }

  const shouldRun = () => Boolean(art) && doc.documentElement.dataset.screen === 'menu' && !motion?.matches
  function sync() {
    const run = shouldRun()
    canvas.classList.toggle('on', run)
    if (run && !frame) {
      last = 0
      frame = win.requestAnimationFrame(loop)
    } else if (!run && frame) {
      win.cancelAnimationFrame(frame)
      frame = 0
    }
  }

  const observer = new win.MutationObserver(sync)
  observer.observe(doc.documentElement, { attributes: true, attributeFilter: ['data-screen'] })
  motion?.addEventListener?.('change', sync)
  loadImages(doc).then((images) => {
    art = images
    sync()
  }).catch(onError)

  return {
    stop() {
      observer.disconnect()
      motion?.removeEventListener?.('change', sync)
      if (frame) win.cancelAnimationFrame(frame)
      frame = 0
      canvas.remove()
    },
  }
}
