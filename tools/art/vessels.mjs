// Pixel-art generator for the pot and bowl in src/styles.css (--px-pot-* / --px-bowl-* variables).
// Run: node tools/art/vessels.mjs > /tmp/vessels.json, then paste each data URI into the matching
// CSS variable. Grid sizes must match the element sizes in styles.css at 4px per art pixel.
const INK = '#3a1f2b'
const grid = (w, h) => Array.from({ length: h }, () => Array(w).fill(null))
const inEllipse = (x, y, cx, cy, rx, ry) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1

// Replace every filled cell that touches empty space (4-neighbour) with the outline colour.
function outline(g) {
  const h = g.length; const w = g[0].length
  const empty = (x, y) => x < 0 || y < 0 || x >= w || y >= h || g[y][x] === null
  return g.map((row, y) => row.map((c, x) => (c !== null && (empty(x - 1, y) || empty(x + 1, y) || empty(x, y - 1) || empty(x, y + 1)) ? INK : c)))
}

function toSvg(g) {
  const h = g.length; const w = g[0].length
  let rects = ''
  g.forEach((row, y) => {
    let x = 0
    while (x < w) {
      const c = row[x]
      if (c === null) { x += 1; continue }
      let run = 1
      while (x + run < w && row[x + run] === c) run += 1
      rects += `<rect x="${x}" y="${y}" width="${run}" height="1" fill="${c}"/>`
      x += run
    }
  })
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${rects}</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

// ---------- bowl rim (41×12): porcelain lip ring; broth area left for the mask ----------
function bowlRim() {
  const W = 41; const H = 14; const g = grid(W, H)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!inEllipse(x, y, W / 2, H / 2, W / 2, H / 2)) continue
    const inBroth = inEllipse(x, y, W / 2, H / 2 + 0.3, W / 2 - 3, H / 2 - 2)
    const inRing = inEllipse(x, y, W / 2, H / 2 + 0.3, W / 2 - 2, H / 2 - 1.3)
    g[y][x] = inBroth ? '#c9401e' : inRing ? '#e2d2b2' : (y < H / 2 ? '#fffdf7' : '#f3e7d0')
  }
  return outline(g)
}
function bowlBroth() {
  const W = 41; const H = 14; const g = grid(W, H)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
    if (inEllipse(x, y, W / 2, H / 2 + 0.3, W / 2 - 3, H / 2 - 2)) g[y][x] = '#000'
  return g
}

// ---------- bowl body (39×18): half-ellipse body + red band + foot ----------
function bowlBody() {
  const W = 39; const H = 18; const g = grid(W, H)
  const RY = 15
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = ((x + 0.5 - W / 2) / (W / 2)) ** 2 + ((y + 0.5) / RY) ** 2
    const inBody = d <= 1
    const inFoot = y >= 13 && y < H && x >= 12 && x <= 26
    if (!inBody && !inFoot) continue
    if (!inBody) { g[y][x] = y === H - 2 ? '#cdb994' : '#dccaa9'; continue }
    const u = (x + 0.5) / W
    let c = '#f5ead6'
    if (u < 0.14 || d > 0.82) c = '#dccaa9'
    else if (u < 0.34) c = '#fffdf7'
    else if (u > 0.8) c = '#e8dbc0'
    if (y === 7 || y === 10) c = '#9e2219'
    if (y === 8 || y === 9) c = x % 3 === 1 ? '#ffd23f' : '#d9362b'
    g[y][x] = c
  }
  return outline(g)
}

// ---------- pot rim (32×9): steel lip ring; broth area left for the mask ----------
function potRim() {
  const W = 32; const H = 10; const g = grid(W, H)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!inEllipse(x, y, W / 2, H / 2, W / 2, H / 2)) continue
    const inBroth = inEllipse(x, y, W / 2, H / 2 + 0.3, W / 2 - 2.5, H / 2 - 1.5)
    const inRing = inEllipse(x, y, W / 2, H / 2 + 0.3, W / 2 - 1.6, H / 2 - 0.9)
    g[y][x] = inBroth ? '#c9401e' : inRing ? '#8e929c' : (y < H / 2 ? '#f4f6f9' : '#cfd2d9')
  }
  return outline(g)
}
function potBroth() {
  const W = 32; const H = 10; const g = grid(W, H)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
    if (inEllipse(x, y, W / 2, H / 2 + 0.3, W / 2 - 2.5, H / 2 - 1.5)) g[y][x] = '#000'
  return g
}

// ---------- pot body (30×14): straight sides, rounded bottom corners, flat steel bands ----------
function potBody() {
  const W = 30; const H = 14; const R = 4.5; const g = grid(W, H)
  const bands = [[0, '#767a85'], [2, '#9a9ea8'], [4, '#dfe2e8'], [7, '#c3c7cf'], [11, '#b2b6bf'], [21, '#9a9ea8'], [26, '#7f838e']]
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const cx = x < R ? R : x >= W - R ? W - R : x + 0.5
    const cy = H - R
    const inside = y + 0.5 <= cy || Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= R
    if (!inside) continue
    let c = bands.filter(([bx]) => x >= bx).at(-1)[1]
    if (y >= H - 3) c = y === H - 2 ? '#7f838e' : '#8e929c'
    if (x === 5 && y >= 5 && y <= 9) c = '#ffffff'
    g[y][x] = c
  }
  return outline(g)
}

console.log(JSON.stringify({
  bowlRim: toSvg(bowlRim()), bowlBroth: toSvg(bowlBroth()), bowlBody: toSvg(bowlBody()),
  potRim: toSvg(potRim()), potBroth: toSvg(potBroth()), potBody: toSvg(potBody()),
}))
