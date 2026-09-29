// Approved rose-pink title: background contains no menu text; screens.js owns real buttons.
export const APPROVED_TITLE_ART = { w: 780, h: 503 }
export const APPROVED_NEON = [
  { x: 151, y: 74, w: 273, h: 76, offset: 0 },
  { x: 120, y: 183, w: 327, h: 49, offset: 2.4 },
]

export function createApprovedNightScene(rng = Math.random) {
  const { w, h } = APPROVED_TITLE_ART
  const drops = Array.from({ length: 190 }, () => ({
    x: rng() * (w + 20), y: rng() * h,
    speed: 180 + rng() * 150, length: 9 + rng() * 12,
    width: rng() < .4 ? 2 : 1, alpha: .24 + rng() * .25,
  }))
  const ripples = Array.from({ length: 30 }, () => ({ x: rng() * w, y: 422 + rng() * 77, offset: rng() * 3 }))
  return {
    size: APPROVED_TITLE_ART,
    images: { background: 'img/title-rain-approved.png?v=1' },
    update(dt) {
      for (const d of drops) {
        d.y += d.speed * dt
        d.x -= d.speed * .08 * dt
        if (d.y > h + 7) { d.y = -22; d.x = rng() * (w + 20) }
      }
    },
    draw(ctx, art, canvas, clock) {
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(art.background, 0, 0, w, h)
      // Two mild dips, then a long calm interval; only sign pixels are dimmed.
      for (const b of APPROVED_NEON) {
        const t = (clock + b.offset) % 9
        const dim = (t >= 5.985 && t < 6.03) || (t >= 6.12 && t < 6.165)
        if (dim) { ctx.fillStyle = 'rgba(20,18,43,.35)'; ctx.fillRect(b.x, b.y, b.w, b.h) }
      }
      for (const d of drops) {
        ctx.fillStyle = `rgba(165,180,223,${d.alpha})`
        ctx.fillRect(Math.round(d.x), Math.round(d.y), d.width, Math.round(d.length))
      }
      for (const r of ripples) {
        const p = ((clock + r.offset) % 1.8) / 1.8
        ctx.strokeStyle = `rgba(164,157,211,${.26 * (1 - p)})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.ellipse(Math.round(r.x), Math.round(r.y), 2 + p * 10, 1 + p * 2, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
    },
  }
}
