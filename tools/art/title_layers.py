"""Layers for the animated title (feedback 2026-09-27: rain falling, the neon sign flickering, clouds drifting, the
puddles shimmering) -> src/img/title-{sky,fg,off,clouds}.png, drawn by src/js/self-serve/title-anim.js.

Run: python3 tools/art/title_layers.py   (after tools/art/title_bg.py; same seed, so the layers line up with
src/img/title-bg.png, which stays the still frame for the first paint and for reduced motion)

  title-sky.png     the night sky with its stars, no clouds (opaque)
  title-fg.png      everything in front of the sky — city, shop, street, reflections — with the sky transparent,
                    so the clouds pass behind the buildings and the sign; no baked rain (the canvas rains)
  title-off.png     the same frame with both neon signs switched off (opaque); the canvas blends it over the
                    sign boxes printed below (NEON_BOXES in title-anim.js) to flicker them
  title-clouds.png  a W-wide strip of pixel clouds lit pink from the city, seamless left-right, for drifting
"""
import random

from PIL import Image

import title_bg as tb
from pixel_scene import Canvas, mix

W, H = tb.W, tb.H
OUT = tb.ROOT / 'src/img'
CLOUD_H = 150
CLOUD_SEED = 20260929
CLOUD_BODY, CLOUD_LIT, CLOUD_TOP = (58, 44, 92), (132, 74, 132), (84, 66, 124)


def sky_only():
    """The sky exactly as build() paints it (same rng draws for the stars), before anything stands in front."""
    tb.rng, tb.cv = random.Random(tb.SEED), Canvas(W, H)
    tb.px, tb.put, tb.glow, tb.rect = tb.cv.px, tb.cv.put, tb.cv.glow, tb.cv.rect
    tb.sky(clouds=False)
    return tb.cv.img


def foreground(full, sky):
    """`full` with every pixel the sky still shows made transparent."""
    fg = full.convert('RGBA')
    f, s = fg.load(), sky.load()
    for y in range(H):
        for x in range(W):
            if f[x, y][:3] == s[x, y]:
                f[x, y] = (0, 0, 0, 0)
    return fg


def diff_boxes(a, b, split_y):
    """Bounding boxes of the pixels that differ between a and b, above and below split_y (roof sign / shop sign)."""
    pa, pb = a.load(), b.load()
    boxes = [[W, H, 0, 0], [W, H, 0, 0]]
    for y in range(H):
        for x in range(W):
            if pa[x, y] != pb[x, y]:
                bx = boxes[0 if y < split_y else 1]
                bx[0], bx[1], bx[2], bx[3] = min(bx[0], x), min(bx[1], y), max(bx[2], x + 1), max(bx[3], y + 1)
    return [(x0, y0, x1 - x0, y1 - y0) for x0, y0, x1, y1 in boxes]


def clouds():
    """Puffy dithered clouds: a dark body, a pink underside lit by the street and a paler rim on top."""
    rng = random.Random(CLOUD_SEED)
    img = Image.new('RGBA', (W, CLOUD_H), (0, 0, 0, 0))
    p = img.load()
    bayer = ((0.125, 0.625), (0.875, 0.375))
    for cx, cy, w in ((90, 40, 150), (330, 22, 190), (560, 56, 170), (740, 30, 120), (250, 100, 110), (650, 112, 130)):
        puffs = [(cx + rng.uniform(-w / 2, w / 2), cy + rng.uniform(-4, 4), rng.uniform(8, 16)) for _ in range(w // 12)]
        for y in range(max(0, cy - 26), min(CLOUD_H, cy + 9)):  # flat bottom at cy + 8
            for xx in range(cx - w // 2 - 20, cx + w // 2 + 20):
                d = min(((xx - px_) ** 2 + ((y - py) * 2.2) ** 2) ** 0.5 / r for px_, py, r in puffs)
                if d >= 1:
                    continue
                x = xx % W  # wraps round so the strip tiles
                under = max(0.0, min(1.0, (y - cy + 6) / 12))
                c = mix(CLOUD_BODY, CLOUD_LIT, under * 0.8)
                if d > 0.72 and y < cy:
                    c = CLOUD_TOP
                a = 0.62 * (1 - d ** 3)
                if a > bayer[y % 2][x % 2] * 0.6:
                    old = p[x, y]
                    p[x, y] = (*c, max(old[3], round(a * 255)))
    return img


if __name__ == '__main__':
    sky = sky_only()
    lit = tb.build('left', clouds=False, with_rain=False, neon_lit=True).img
    off = tb.build('left', clouds=False, with_rain=False, neon_lit=False).img
    sky.save(OUT / 'title-sky.png', optimize=True)
    foreground(lit, sky).save(OUT / 'title-fg.png', optimize=True)
    off.save(OUT / 'title-off.png', optimize=True)
    clouds().save(OUT / 'title-clouds.png', optimize=True)
    roof, shop = diff_boxes(lit, off, split_y=150)
    print('NEON_BOXES roof', roof, 'shop', shop)
