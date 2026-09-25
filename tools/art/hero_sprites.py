"""Converts assets/art/hero-reference.webp into the protagonist's pixel grids.

Run: python3 tools/art/hero_sprites.py                  -> writes src/js/self-serve/hero-art.js
     python3 tools/art/hero_sprites.py --preview [path] -> also writes a scaled preview PNG

Each reference character is box-downsampled to HERO_H rows (the reference is drawn on a ~8.4px grid,
so this keeps its shading, eye shine and pocket stitching). Every pixel then gets a palette key:
  hair  -> '0'..'6'  tone level (dark..light), recoloured at runtime from the chosen hair ramp
  apron -> 'V'..'Z'  tone level (dark..light), recoloured from the chosen apron ramp
  rest  -> a letter from one fixed palette shared by all styles (skin, shirt, skirt, shoes, eyes, outline)
Tone levels come from each part's own luminance percentiles, so the reference's light/shade structure
survives any recolour. Needs Pillow.
design/quick-specs/story-character-2026-09-25.md §A
"""
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'assets/art/hero-reference.webp'
OUT = ROOT / 'src/js/self-serve/hero-art.js'

HERO_W, HERO_H = 64, 112
BODY_X = 30  # column the body centre (between the legs) is placed on
TOP, BOTTOM = 30, 971  # source rows covered by the characters
ALPHA_CUT = 110  # downsampled alpha below this is transparent
FIXED_COLOURS = 40  # size of the shared fixed palette
HAIR_KEYS = '0123456'
APRON_KEYS = 'VWXYZ'
FIXED_KEYS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTU'

# Zones are written in 80-row units (see rows()) so they read like the reference layout.
CHARACTERS = [
    {'hair': 'bob', 'span': (76, 502),
     'hair_cols': ['895649', '845547', '8c5949', '9c5e4c', '5b3831', 'b79276', '68463e', '61413c', '493130'],
     'apron_cols': ['fab8ad', 'e79d8b', 'f0a79a'],
     'hair_zone': lambda x, y, c: y <= 34},
    {'hair': 'long', 'span': (536, 1000),
     'hair_cols': ['413538', '41373a', '3c3233', '372b2c', '322323', '6b524b', '2b1a19', '493130', '5a4a4e'],
     'apron_cols': ['ceeacd', 'c2dbc2', 'a9c7a9'],
     'hair_zone': lambda x, y, c: y <= 34 or (y <= 50 and abs(x - c) >= 10)},
    {'hair': 'pony', 'span': (1037, 1508),
     'hair_cols': ['fee9a5', 'eab782', 'ebb984', 'b79276', '9f7659', '9c5e4c', '845547', '5b3831', 'f6c4a1', 'd9a06a'],
     'apron_cols': ['fee9a5', 'f7dc8f', 'eac27a'],
     'hair_zone': lambda x, y, c: y <= 33 or (y <= 46 and x - c >= 10)},
]
FACE_ROWS = range(20, 33)  # rows where the space between the cheeks is face (eyes!), never hair
FACE_HALF = 11  # the face (eyes included) reaches this many 80-row columns from the body centre
APRON_ROWS = range(34, 59)
APRON_HALF = 10  # apron cells lie within this many 80-row columns of the body centre
SKIN = (254, 226, 207)
BLUSH = (245, 163, 160)
STRAND_LUM = 70  # darker pixels inside the hair are strand lines, not outline
STRAND_NEIGHBOURS = 4  # hair neighbours (of 8) a strand pixel needs
# Assembly: every style shares one body; only the hair layer and the colours change.
BODY_FROM = 'bob'  # face, arms, legs, shoes
TORSO_FROM = 'long'  # shirt + apron shape
TORSO_ROWS = range(33, 60)  # 80-row units taken from TORSO_FROM
NECK_ROW = 33  # 80-row units: above, hair in front of the face; below, hair behind the body
HAIR_LAYER = {'hair', 'hairline'}
NECK_Y = int(NECK_ROW * HERO_H / 80)  # the same, in grid rows
HAIR_DIST = 0.7  # hair / apron candidates win ties against fixed colours
APRON_DIST = 0.6


def hex_rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def dist(a, b):
    return sum((p - q) ** 2 for p, q in zip(a, b))


def lum(c):
    return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]


def downsample(img, span):
    a, b = span
    crop = img.crop((a, TOP, b, BOTTOM))
    w = round(crop.size[0] * HERO_H / crop.size[1])
    small = crop.resize((w, HERO_H), Image.BOX)
    px = small.load()
    return [[px[x, y][:3] if px[x, y][3] >= ALPHA_CUT else None for x in range(w)] for y in range(HERO_H)]


def rows(y):
    """Grid row -> the 80-row units the zones are written in."""
    return y * 80 / HERO_H


def body_centre(g):
    y = round(66 * HERO_H / 80)
    xs = [x for x, c in enumerate(g[y]) if c is not None]
    return (xs[0] + xs[-1]) // 2


def face_span(g, y, c):
    """Cheek to cheek, but never past FACE_HALF: side locks lie between the cheeks and the ears."""
    xs = [x for x, col in enumerate(g[y]) if col is not None and dist(col, SKIN) < 1800]
    if not xs:
        return (0, -1)
    half = FACE_HALF * HERO_H / 80
    return (max(xs[0], c - half), min(xs[-1], c + half))


def split_parts(g, spec):
    """Labels each pixel 'hair', 'apron' or 'fixed'."""
    c = body_centre(g)
    scale = 80 / HERO_H
    hair_cols = [hex_rgb(h) for h in spec['hair_cols']]
    apron_cols = [hex_rgb(h) for h in spec['apron_cols']]
    fixed_ref = [SKIN, (254, 251, 245), (28, 13, 12), (61, 42, 42), (94, 64, 58), (246, 186, 162)]
    labels = []
    hair_ok = []
    for y, row in enumerate(g):
        yy = rows(y)
        lo, hi = face_span(g, y, c) if int(yy) in FACE_ROWS else (0, -1)
        line, ok_line = [], []
        for x, col in enumerate(row):
            xx, cx = x * scale, c * scale
            in_hair = spec['hair_zone'](xx, yy, cx) and not lo < x < hi
            ok_line.append(in_hair)
            if col is None:
                line.append(None)
                continue
            in_apron = int(yy) in APRON_ROWS and abs(xx - cx) <= APRON_HALF
            # blush only lives on the face; inside the apron box that pink is apron shade
            refs = fixed_ref if in_apron else fixed_ref + [BLUSH]
            cands = [(min(dist(col, v) for v in refs), 'fixed')]
            if in_hair:
                cands.append((min(dist(col, v) for v in hair_cols) * HAIR_DIST, 'hair'))
            if in_apron:
                cands.append((min(dist(col, v) for v in apron_cols) * APRON_DIST, 'apron'))
            line.append(min(cands)[1])
        labels.append(line)
        hair_ok.append(ok_line)
    for _ in range(2):
        labels = absorb_hair_strands(g, labels, hair_ok)
    return mark_hairline(g, labels, hair_ok), c


def mark_hairline(g, labels, hair_ok):
    """The dark outline around the hair belongs to the hair layer, so swapping hair takes it along."""
    h, w = len(g), len(g[0])
    out = [row[:] for row in labels]
    for y in range(h):
        for x in range(w):
            if labels[y][x] != 'fixed' or not hair_ok[y][x] or lum(g[y][x]) >= STRAND_LUM:
                continue
            around = [(y + dy, x + dx) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if (dy or dx) and 0 <= y + dy < h and 0 <= x + dx < w]
            if any(labels[j][i] == 'hair' for j, i in around):
                out[y][x] = 'hairline'
    return out


def absorb_hair_strands(g, labels, hair_ok):
    """Dark strand lines inside the hair (not on the silhouette) become the hair's darkest tone,
    so a recolour does not leave black streaks. The silhouette outline stays fixed."""
    h, w = len(g), len(g[0])
    out = [row[:] for row in labels]
    for y in range(1, h - 1):
        for x in range(1, w - 1):
            if labels[y][x] != 'fixed' or not hair_ok[y][x] or lum(g[y][x]) >= STRAND_LUM:
                continue
            around = [(y + dy, x + dx) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dy or dx]
            if any(g[j][i] is None for j, i in around):
                continue
            if sum(labels[j][i] == 'hair' for j, i in around) >= STRAND_NEIGHBOURS:
                out[y][x] = 'hair'
    return out


def tone_levels(values, keys):
    """Maps luminance to tone keys: p10 -> second level, p50 -> middle, p90 -> second-to-last."""
    s = sorted(values)
    p = lambda q: s[min(len(s) - 1, int(q * len(s)))]
    lo, mid, hi = p(0.1), p(0.5), p(0.9)
    n = len(keys) - 1
    anchors = [(lo, 1), (mid, n / 2), (hi, n - 1)]

    def key(v):
        if v <= mid:
            t = 1 + (v - lo) / max(1e-6, mid - lo) * (n / 2 - 1)
        else:
            t = n / 2 + (v - mid) / max(1e-6, hi - mid) * (n / 2 - 1)
        return keys[max(0, min(n, round(t)))]
    return key, anchors


def build_fixed_palette(samples):
    strip = Image.new('RGB', (len(samples), 1))
    strip.putdata(samples)
    q = strip.quantize(colors=FIXED_COLOURS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    pal = q.getpalette()[:FIXED_COLOURS * 3]
    return [tuple(pal[i:i + 3]) for i in range(0, len(pal), 3)]


def build():
    img = Image.open(SRC).convert('RGBA')
    parts = []
    for spec in CHARACTERS:
        g = downsample(img, spec['span'])
        labels, c = split_parts(g, spec)
        parts.append((spec['hair'], g, labels, c))

    fixed_samples = [col for _, g, lab, _ in parts for row, lrow in zip(g, lab) for col, l in zip(row, lrow) if l == 'fixed']
    palette = build_fixed_palette(fixed_samples)
    fixed = {FIXED_KEYS[i]: col for i, col in enumerate(palette)}

    keyed = {}
    for hair, g, labels, c in parts:
        vals = {p: [lum(col) for row, lrow in zip(g, labels) for col, l in zip(row, lrow) if l == p] for p in ('hair', 'apron')}
        hair_key, _ = tone_levels(vals['hair'], HAIR_KEYS)
        apron_key, _ = tone_levels(vals['apron'], APRON_KEYS)
        fixed_key = lambda col: min(fixed, key=lambda k: dist(fixed[k], col))
        key_of = {'hair': lambda col: hair_key(lum(col)), 'apron': lambda col: apron_key(lum(col)),
                  'fixed': fixed_key, 'hairline': fixed_key}
        grid = [[None if l is None else key_of[l](col) for col, l in zip(row, lrow)] for row, lrow in zip(g, labels)]
        keyed[hair] = (place(grid, c), place(labels, c))

    body = body_layer(keyed)
    hair = {style: compose(keyed, style) for style in keyed}
    used = {k for r in body for k in r} | {k for layer in hair.values() for r in layer for k in r}
    return body, hair, {k: v for k, v in fixed.items() if k in used}


def compose(keyed, style):
    """`style`'s hair layer around the shared body. Rows up to NECK_Y are drawn over the body (bangs over
    the face) and also carry the style's own skin where the shared body has a gap under its removed hair
    (forehead, ears); rows below are drawn behind the body (hair falling down the back)."""
    hair_keys, hair_labels = keyed[style]
    body = body_layer(keyed)
    out = []
    for y in range(HERO_H):
        line = []
        for x in range(HERO_W):
            hair = hair_keys[y][x] if hair_labels[y][x] in HAIR_LAYER else None
            own = hair_keys[y][x] if hair_labels[y][x] not in HAIR_LAYER else None
            fill = own if y <= NECK_Y and body[y][x] == '.' else None
            line.append(hair or fill or '.')
        out.append(''.join(line))
    return out


def body_layer(keyed):
    """The shared body: BODY_FROM without its hair, with TORSO_FROM's shirt and apron swapped in
    (only inside the base silhouette, so TORSO_FROM's hair never leaks in)."""
    base_keys, base_labels = keyed[BODY_FROM]
    torso_keys, torso_labels = keyed[TORSO_FROM]
    out = []
    for y in range(HERO_H):
        in_torso = int(rows(y)) in TORSO_ROWS
        line = []
        for x in range(HERO_W):
            k = base_keys[y][x] if base_labels[y][x] not in HAIR_LAYER else None
            if in_torso and k and torso_keys[y][x] and torso_labels[y][x] not in HAIR_LAYER:
                k = torso_keys[y][x]
            line.append(k or '.')
        out.append(''.join(line))
    return out


def stack(body, hair):
    """Hair over the body down to NECK_Y, behind it below (mirrors characterGrid in character.js)."""
    pick = lambda *ks: next((k for k in ks if k != '.'), '.')
    return [''.join(pick(h, m) if y <= NECK_Y else pick(m, h) for m, h in zip(mr, hr))
            for y, (mr, hr) in enumerate(zip(body, hair))]


def place(g, c):
    """Pads a grid of cells (None = clear) to HERO_W with the body centre on BODY_X."""
    off = BODY_X - c
    out = []
    for row in g:
        line = [None] * HERO_W
        for x, k in enumerate(row):
            if 0 <= x + off < HERO_W:
                line[x + off] = k
            elif k is not None:
                raise SystemExit(f'pixel at column {x} falls outside the {HERO_W}-wide canvas')
        out.append(line)
    return out


def write_js(body, hair, fixed):
    grid = lambda name, rows_, indent: [f'{indent}{name}: [', *[f"{indent}  '{r}'," for r in rows_], f'{indent}],']
    lines = [
        '// GENERATED by tools/art/hero_sprites.py from assets/art/hero-reference.webp — do not edit by hand.',
        "// Keys: '.' clear · hair '0'..'6' and apron 'V'..'Z' are tone levels (dark..light) · letters are HERO_FIXED.",
        '// One shared body; each hair style is one layer: over the body down to HERO_NECK_Y, behind it below.',
        f'export const HERO_W = {HERO_W}',
        f'export const HERO_H = {HERO_H}',
        f"export const HAIR_TONE_KEYS = '{HAIR_KEYS}'",
        f"export const APRON_TONE_KEYS = '{APRON_KEYS}'",
        f'export const HERO_NECK_Y = {NECK_Y}',
        '',
        'export const HERO_FIXED = {',
        *[f"  {k}: '#{r:02x}{g:02x}{b:02x}'," for k, (r, g, b) in sorted(fixed.items())],
        '}',
        '',
        'export const HERO_BODY = [',
        *[f"  '{r}'," for r in body],
        ']',
        '',
        'export const HERO_HAIR = {',
    ]
    for style, rows_ in hair.items():
        lines += grid(style, rows_, '  ')
    lines.append('}')
    OUT.write_text('\n'.join(lines) + '\n')


# Preview only (mirrors toneScale in character.js): each style in its reference colours.
PREVIEW_RAMPS = {
    'bob': (['b88c6e', '8a5748', '5b3831'], ['fcd3cc', 'fab8ad', 'e08f86']),
    'long': (['6b5a5e', '413538', '2b2024'], ['e3f5e3', 'ceeacd', 'a8cfa8']),
    'pony': (['fee9a5', 'eab782', 'b98a58'], ['fff5cf', 'fee9a5', 'eac27a']),
}


def mix(a, b, t):
    return tuple(round(p + (q - p) * t) for p, q in zip(a, b))


def tone_scale(ramp, n):
    """[light, base, shade] -> n colours dark..light (ends pushed past shade / light)."""
    light, base, shade = (hex_rgb(h) for h in ramp)
    deep, bright = mix(shade, (28, 13, 12), 0.45), mix(light, (255, 255, 255), 0.45)
    stops = [deep, shade, base, light, bright]
    out = []
    for i in range(n):
        t = i / (n - 1) * (len(stops) - 1)
        k = min(len(stops) - 2, int(t))
        out.append(mix(stops[k], stops[k + 1], t - k))
    return out


def preview(art, fixed, path, zoom=6):
    sheet = Image.new('RGBA', ((HERO_W + 4) * len(art), HERO_H + 4), (243, 220, 230, 255))
    for i, (hair, rows_) in enumerate(art.items()):
        hr, ar = PREVIEW_RAMPS[hair]
        pal = {**fixed, **dict(zip(HAIR_KEYS, tone_scale(hr, len(HAIR_KEYS)))),
               **dict(zip(APRON_KEYS, tone_scale(ar, len(APRON_KEYS))))}
        for y, r in enumerate(rows_):
            for x, k in enumerate(r):
                if k != '.':
                    sheet.putpixel((i * (HERO_W + 4) + 2 + x, 2 + y), pal[k] + (255,))
    sheet.resize((sheet.size[0] * zoom, sheet.size[1] * zoom), Image.NEAREST).save(path)
    print('preview ->', path)


if __name__ == '__main__':
    body_rows, hair_layers, fixed_pal = build()
    write_js(body_rows, hair_layers, fixed_pal)
    print('wrote', OUT.relative_to(ROOT), f'({len(fixed_pal)} fixed colours)')
    if '--preview' in sys.argv:
        i = sys.argv.index('--preview')
        art = {style: stack(body_rows, layer) for style, layer in hair_layers.items()}
        preview(art, fixed_pal, sys.argv[i + 1] if len(sys.argv) > i + 1 else '/tmp/hero-preview.png')
