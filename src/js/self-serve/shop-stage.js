// Business-screen centre: 마라판다 seen side-on (production/epics/shop-growth/story-001-shop-cross-section.md).
// The stage is the background art's own grid (tools/art/scene_shop.py, 320×120 art px — the hall; the kitchen is its own strip) shown at a fixed
// ratio, so every spot here is art px; the page multiplies by one art px (CSS --apx) and it scales with the column.

/** Stage size and the painted landmarks the DOM lines up with (keep in step with scene_shop.py). */
export const SHOP_STAGE = {
  w: 320,
  h: 120,
  floorY: 92, // wall meets floor
  dining: { x0: 34, x1: 316 }, // floor span the tables share (right of the door); the kitchen is its own strip
}

/** Pot art width at zoom 1 (styles.css .pot-art) and the gap kept between pots on the kitchen strip. */
export const POT_ART_W = 144
const POT_GAP = 6
const POT_ZOOM_MIN = 0.25

const round2 = (v) => Math.round(v * 100) / 100

/**
 * Where each table stands: the dining span split into equal cells, one table centred in each.
 * @param {number} count tables in the shop (2–5 with upgrades)
 * @returns {{ x: number, w: number }[]} per table: left edge and width of its cell, art px
 */
export function tableSpots(count) {
  const n = Math.max(0, Math.floor(count))
  const { x0, x1 } = SHOP_STAGE.dining
  const cell = (x1 - x0) / (n || 1)
  return Array.from({ length: n }, (_, i) => ({ x: round2(x0 + cell * i), w: round2(cell) }))
}

/**
 * Pot scale so `count` pots fit side by side on a kitchen counter `kitchenPx` wide (never above ×1).
 * @param {number} kitchenPx rendered width of the kitchen counter, CSS px
 * @param {number} count pots owned (1–4)
 */
export function potZoom(kitchenPx, count) {
  const n = Math.max(1, Math.floor(count))
  const fit = (kitchenPx / n - POT_GAP) / POT_ART_W
  return Math.max(POT_ZOOM_MIN, Math.min(1, Math.round(fit * 100) / 100))
}
