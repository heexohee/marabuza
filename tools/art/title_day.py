"""Title background, fine-weather day version (feedback 2026-09-28: sunshine, trees, clouds, wind — her shop on a
clear day) -> production/qa/evidence/title-mockup/title-bg-day.png (draft for review).

Run: python3 tools/art/title_day.py

Same 800×442 frame and 'left' layout as the night title (tools/art/title_bg.py) so the menu column still sits on
the right: the same shop, signs, lanterns and side buildings, drawn through that module with a daylight palette.
Day-only parts live here: blue sky with the sun and fluffy clouds, street trees, laundry on the wire, petals and
leaves on the wind, a dry street with the sun's shadows. Deterministic (fixed seed).
"""
import math
import random

import title_bg as tb
from pixel_scene import Canvas, mix

W, H, BASE, ROAD_Y = tb.W, tb.H, tb.BASE, tb.ROAD_Y
OUT = tb.OUT_DIR / 'title-bg-day.png'
SEED = 20260928

SKY_HIGH, SKY_MID, SKY_LOW = (86, 166, 232), (132, 196, 240), (206, 232, 246)
SUN, SUN_GLOW = (255, 252, 226), (255, 240, 180)
CLOUD, CLOUD_SHADE, CLOUD_DEEP = (255, 255, 255), (220, 232, 246), (186, 206, 232)
FAR, FAR_EDGE, FAR_WIN = (168, 190, 214), (186, 206, 226), (140, 166, 198)
LEAF_OUT, LEAF_DEEP, LEAF_DARK = (28, 66, 54), (40, 92, 66), (58, 124, 78)
LEAF, LEAF_LIT, LEAF_TOP, LEAF_SUN = (84, 156, 90), (126, 190, 104), (176, 218, 128), (222, 240, 166)
TRUNK, TRUNK_DARK, TRUNK_LIT = (120, 84, 64), (84, 56, 46), (156, 116, 86)
HILL_FAR, HILL_NEAR = (170, 204, 216), (146, 188, 186)
SHADOW = (40, 50, 90)  # cool shade, blended over whatever is under it
SUN_X, SUN_Y = 720, 44

# daylight palette pushed into the night module: its functions read these at draw time
DAY = dict(
    BRICK=(184, 124, 108), BRICK_DARK=(160, 104, 92), MORTAR=(206, 182, 170),
    PLASTER=(226, 214, 204), PLASTER_DARK=(184, 170, 164),
    LIGHT=(255, 250, 236),  # the shop's light is just sunlight on the pavement now
    INK=(40, 30, 44),
    DETAILED_INTERIOR=False,  # the day title keeps its plain shop interior (feedback 2026-09-28: day is done)
)

rng = random.Random(SEED)


def use_canvas():
    global cv, px, put, glow, rect, rng
    cv, rng = Canvas(W, H), random.Random(SEED)  # fresh draws every build, so the layer builds line up
    px, put, glow, rect = cv.px, cv.put, cv.glow, cv.rect
    tb.cv, tb.rng = cv, random.Random(tb.SEED)
    tb.px, tb.put, tb.glow, tb.rect = px, put, glow, rect
    for k, v in DAY.items():
        setattr(tb, k, v)


# ---------- sky ----------

def sky():
    for y in range(H):
        t = y / BASE
        for x in range(W):
            if t < 0.5:
                px[x, y] = tb.dither(x, y, SKY_HIGH, SKY_MID, t / 0.5)
            else:
                px[x, y] = tb.dither(x, y, SKY_MID, SKY_LOW, min(1, (t - 0.5) / 0.5))
    for y in range(0, 170):  # the sun's warm wash over the sky
        for x in range(460, W):
            d = math.hypot(x - SUN_X, (y - SUN_Y) * 1.2)
            if d < 190:
                glow(x, y, SUN_GLOW, 0.34 * (1 - d / 190) ** 1.6)
    for k in range(12):  # soft pixel rays
        a = k / 12 * math.tau + 0.13
        for r in range(22, 60 if k % 2 else 44):
            glow(round(SUN_X + math.cos(a) * r), round(SUN_Y + math.sin(a) * r), SUN, 0.34 * (1 - r / 60))
    for y in range(SUN_Y - 14, SUN_Y + 15):
        for x in range(SUN_X - 14, SUN_X + 15):
            d = math.hypot(x + 0.5 - SUN_X, y + 0.5 - SUN_Y)
            if d <= 13.5:
                put(x, y, SUN if d < 11 else mix(SUN, SUN_GLOW, 0.6))


def cloud(cx, cy, w, h, g):
    """A cumulus: a heap of round puffs on a soft base, white where the sun hits, blue-grey underneath."""
    rng = g
    puffs = [(cx + rng.uniform(-0.42, 0.42) * w, cy + rng.uniform(-0.1, 0.25) * h, h * rng.uniform(0.35, 0.55))
             for _ in range(max(6, w // 14))]
    puffs += [(cx + rng.uniform(-0.2, 0.2) * w, cy - rng.uniform(0.1, 0.4) * h, h * rng.uniform(0.55, 0.8)) for _ in range(3)]
    base = cy + h * 0.5
    for y in range(int(cy - h * 1.4), int(base) + 1):
        for x in range(int(cx - w * 0.8), int(cx + w * 0.8)):
            d, qx, qy = min((math.hypot(x - px_, (y - py) * 1.1) / r, px_, py) for px_, py, r in puffs)
            if d >= 1 or y > base - (1 if (x // 3) % 4 == 0 else 0):
                continue
            # shade: lower in the heap and the side away from the sun (left) is darker; puff rims catch light
            shade = (y - (cy - h)) / (base - (cy - h)) * 0.85 + (qx - x) / w * 0.3 - (1 - d) * 0.15
            if d > 0.8 and y < qy:
                shade -= 0.35
            if shade < 0.45:
                c = CLOUD
            elif shade < 0.62:
                c = tb.dither(x, y, CLOUD, CLOUD_SHADE, (shade - 0.45) / 0.17)
            elif shade < 0.8:
                c = tb.dither(x, y, CLOUD_SHADE, CLOUD_DEEP, (shade - 0.62) / 0.18)
            else:
                c = CLOUD_DEEP
            put(x, y, c)


def clouds():
    """The clouds, each with its own seeded draws; one near an edge is drawn again a frame-width away so the
    cloud strip tiles left-right for drifting (tools/art/title_day.py layers, src/js/self-serve/title-day.js)."""
    for i, (cx, cy, w, h) in enumerate(((150, 50, 130, 30), (410, 30, 96, 22), (590, 104, 150, 30), (40, 132, 70, 16),
                                         (318, 120, 64, 14))):
        for shift in (0, -W, W):
            if shift == 0 or abs(cx + shift - W / 2) < W / 2 + w:
                cloud(cx + shift, cy, w, h, random.Random(SEED + i))


def birds():
    for bx, by in ((470, 58), (486, 50), (498, 62)):
        for dx, dy in ((-3, -1), (-2, -1), (-1, 0), (0, 0), (1, -1), (2, -1), (3, -2)):
            put(bx + dx, by + dy, (60, 70, 100))


def far_city():
    x = 0
    while x < W:
        w = rng.randrange(22, 48)
        top = rng.randrange(200, 262)
        rect(x, top, x + w, BASE, FAR)
        rect(x + w - 1, top, x + w, BASE, FAR_EDGE)  # sunlit right edge
        for wy in range(top + 5, BASE - 4, 6):
            for wx in range(x + 3, x + w - 3, 4):
                if rng.random() < 0.3:
                    rect(wx, wy, wx + 2, wy + 2, FAR_WIN)
        x += w + rng.randrange(0, 4)
    for y in range(BASE - 60, BASE):  # haze on the horizon
        for x in range(W):
            glow(x, y, SKY_LOW, 0.3 * (y - BASE + 60) / 60)


# ---------- buildings (the night module, daylit) ----------

def day_window(x, y, w, h, lit, people=True):
    """Daytime windows: the sky reflected in the glass, some with curtains drawn or a flower box."""
    rect(x - 2, y - 2, x + w + 2, y + h + 2, tb.PLASTER_DARK)
    rect(x - 3, y + h + 2, x + w + 3, y + h + 4, tb.PLASTER)
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            px[xx, yy] = tb.dither(xx, yy, (150, 196, 230), (90, 128, 170), (yy - y) / h)
    for i in range(0, w + h, 7):  # diagonal glass glint
        for k in range(4):
            xx, yy = x + i - k, y + k
            if x <= xx < x + w and y <= yy < y + h:
                glow(xx, yy, (255, 255, 255), 0.45)
    if lit:  # curtains half drawn
        c = rng.choice(((240, 200, 200), (230, 226, 196), (200, 220, 236)))
        rect(x, y, x + 5, y + h, c)
        rect(x + w - 5, y, x + w, y + h, c)
    if rng.random() < 0.35:  # flower box
        rect(x - 1, y + h + 4, x + w + 1, y + h + 8, (160, 96, 70))
        for fx in range(x, x + w, 3):
            put(fx, y + h + 3, rng.choice(((240, 110, 140), (255, 210, 90), (255, 255, 255), LEAF)))
    rect(x + w // 2, y, x + w // 2 + 1, y + h, tb.PLASTER_DARK)


def shutters(x0, x1):
    rect(x0 + 8, BASE - 40, x1 - 8, BASE, (150, 150, 160))
    for y in range(BASE - 38, BASE, 3):
        rect(x0 + 8, y, x1 - 8, y + 1, (170, 170, 180))


def buildings():
    tb.window = day_window
    for x0, x1, top, face_right, people in tb.LAYOUTS['left']['sides']:
        tb.side_building(x0, x1, top, face_right, people)
        shutters(x0, x1)
        for y in range(top, BASE):  # the sun is on the right: each building's left face is in shade
            for x in range(x0, min(x1, x0 + 10)):
                glow(x, y, SHADOW, 0.18 * (1 - (x - x0) / 10))


# ---------- street ----------

def street():
    for y in range(BASE, ROAD_Y):
        for x in range(W):
            c = (206, 196, 190) if (x // 16 + (y - BASE) // 8) % 2 else (196, 186, 182)
            if x % 16 == 0 or (y - BASE) % 8 == 0:
                c = (170, 160, 158)
            px[x, y] = c
    rect(0, ROAD_Y, W, ROAD_Y + 3, (220, 214, 210))  # curb
    rect(0, ROAD_Y + 3, W, ROAD_Y + 5, (130, 124, 130))
    for y in range(ROAD_Y + 5, H):
        t = (y - ROAD_Y) / (H - ROAD_Y)
        for x in range(W):
            px[x, y] = tb.dither(x, y, (120, 118, 130), (100, 98, 112), t)
            if rng.random() < 0.03:
                px[x, y] = (136, 134, 146)
    for x in range(20, W, 90):  # lane dashes
        rect(x, 406, x + 44, 409, (236, 230, 214))


def lamp(x):
    """The street lamp, unlit, its shadow falling left."""
    rect(x, BASE - 150, x + 3, BASE, (90, 96, 110))
    rect(x - 1, BASE - 4, x + 4, BASE, (110, 116, 130))
    rect(x + 3, BASE - 150, x + 20, BASE - 147, (90, 96, 110))
    rect(x + 14, BASE - 147, x + 24, BASE - 142, (120, 126, 140))
    rect(x + 15, BASE - 142, x + 23, BASE - 140, (230, 236, 240))
    for y in range(BASE, BASE + 4):
        rect(x - 40 + (y - BASE) * 6, y, x, y + 1, mix(px[x - 1, y], SHADOW, 0.25))


def _line(x0, y0, x1, y1, width, c):
    n = max(abs(x1 - x0), abs(y1 - y0), 1)
    for i in range(n + 1):
        t = i / n
        w = max(1, round(width * (1 - t * 0.5)))
        rect(round(x0 + (x1 - x0) * t), round(y0 + (y1 - y0) * t), round(x0 + (x1 - x0) * t) + w, round(y0 + (y1 - y0) * t) + 1, c)


def tree(cx, ground, h, r, seed, crown=True):
    """A street tree: a tapering barked trunk forking into branches, a crown of overlapping leaf clumps (each
    lit on its upper right with a dark rim below, a deep layer behind, sky holes and sunlit specks), a metal tree
    grate with grass and flowers at its foot, and dappled shade on the pavement to the left."""
    g = random.Random(seed)
    top = ground - h
    ccx, ccy, rx, ry = cx - 2, top + r, r * 1.12, r * 0.86  # crown ellipse
    for y in range(ground - 2, ground + 13):  # dappled shadow, cast left by the sun
        for x in range(int(cx - rx * 1.7 - 20), cx + 8):
            d = ((x - cx + rx * 0.75 + 10) / (rx + 12)) ** 2 + ((y - ground - 5) / 7) ** 2
            if d < 1:
                glow(x, y, SHADOW, 0.34 if (x * 7 + y * 13 + seed) % 9 > 1 else 0.1)
    bg = {(x, y): px[x, y] for y in range(int(top - 8), ground + 1) for x in range(int(ccx - rx - 14), int(ccx + rx + 14))
          if cv.inside(x, y)}
    trunk_top = int(ccy + ry * 0.2)
    for y in range(trunk_top, ground):  # trunk, a little wider at the foot
        t = (y - trunk_top) / (ground - trunk_top)
        half = 2 + round(t * t * 2)
        for x in range(cx - half, cx + half + 1):
            c = TRUNK_DARK if x <= cx - half + (1 if half > 2 else 0) else TRUNK_LIT if x == cx + half else TRUNK
            if c == TRUNK and (y * 3 + x) % 7 == 0:
                c = TRUNK_DARK  # bark marks
            put(x, y, c)
    forks = [(-0.55, -0.55), (0.5, -0.6), (-0.1, -0.7), (0.7, -0.15), (-0.75, -0.1)]
    for fx, fy in forks:  # branches reaching into the crown (kept well inside it)
        _line(cx, trunk_top + 4, round(ccx + fx * rx * 0.55), round(ccy + fy * ry * 0.5), 2, TRUNK_DARK)
    if crown:
        _crown(g, cx, top, r, ccx, ccy, rx, ry, bg)
    grate(cx, ground, random.Random(seed + 1))


def _crown(g, cx, top, r, ccx, ccy, rx, ry, bg):
    """The tree's leaves — drawn on their own so the animated title can sway them (a separate layer)."""
    clumps = []
    for _ in range(int(r * 0.6)):
        a, k = g.uniform(0, math.tau), g.uniform(0, 0.78) ** 0.7
        clumps.append((ccx + math.cos(a) * rx * k, ccy + math.sin(a) * ry * k, r * g.uniform(0.26, 0.4), g.uniform(0, math.tau)))
    clumps.sort(key=lambda q: q[1] + (q[0] - ccx) * 0.25)  # back (top-left) first, front (low-right) last
    x0, x1, y0, y1 = int(ccx - rx - 12), int(ccx + rx + 12), int(top - 8), int(ccy + ry + 8)
    def lobe(x, y, qx, qy, qr, ph):
        """Distance (1 = edge) from a clump's centre, its edge scalloped into little leaf bunches."""
        a = math.atan2(y - qy, x - qx)
        return math.hypot(x - qx, (y - qy) * 1.08) / (qr * (1 + 0.16 * math.sin(a * 6 + ph) + 0.08 * math.sin(a * 11 - ph)))

    for qx, qy, qr, ph in clumps:  # the deep layer behind: every clump's shadow, offset down-left
        for y in range(int(qy - qr * 1.3), int(qy + qr * 1.3) + 3):
            for x in range(int(qx - qr * 1.3) - 2, int(qx + qr * 1.3)):
                if lobe(x + 1, y - 2, qx, qy, qr, ph) < 1:
                    put(x, y, LEAF_DEEP)
    for qx, qy, qr, ph in clumps:
        for y in range(int(qy - qr * 1.3), int(qy + qr * 1.3) + 1):
            for x in range(int(qx - qr * 1.3), int(qx + qr * 1.3) + 1):
                d = lobe(x, y, qx, qy, qr, ph)
                if d >= 1:
                    continue
                ux, uy = (x - qx) / qr, (y - qy) / qr
                light = (ux - uy) * 0.55 + ((x - ccx) / rx - (y - ccy) / ry) * 0.3
                if d > 0.9 and uy - ux > 0.3:
                    c = LEAF_OUT  # dark rim on the shaded lower-left of each clump
                elif light > 0.62:
                    c = LEAF_TOP
                elif light > 0.3:
                    c = tb.dither(x, y, LEAF_LIT, LEAF_TOP, (light - 0.3) / 0.32)
                elif light > -0.05:
                    c = tb.dither(x, y, LEAF, LEAF_LIT, (light + 0.05) / 0.35)
                elif light > -0.45:
                    c = LEAF
                else:
                    c = tb.dither(x, y, LEAF_DARK, LEAF, 0.35)
                put(x, y, c)
    crown = {(x, y) for y in range(y0, y1) for x in range(x0, x1) if cv.inside(x, y) and px[x, y] in
             (LEAF_OUT, LEAF_DEEP, LEAF_DARK, LEAF, LEAF_LIT, LEAF_TOP)}
    edge = [(x, y) for (x, y) in crown if (x, y - 1) not in crown]
    for x, y in g.sample(edge, min(len(edge), int(r * 2.2))):  # leaf tips breaking the silhouette
        put(x, y - 1, LEAF_LIT if x > ccx - rx * 0.2 else LEAF)
        if g.random() < 0.4:
            put(x + 1, y - 2, LEAF_TOP if x > ccx else LEAF)
    for _ in range(6):  # sky holes through the crown, a branch showing in some
        hx, hy = round(ccx + g.uniform(-0.6, 0.6) * rx), round(ccy + g.uniform(-0.3, 0.55) * ry)
        for y in range(hy, hy + 2):
            for x in range(hx, hx + g.choice((2, 3))):
                if (x, y) in bg:
                    px[x, y] = bg[(x, y)]
        put(hx - 1, hy + 2, LEAF_OUT)
    for _ in range(int(r * 0.7)):  # sunlit specks on the bright side
        x, y = round(ccx + g.uniform(0.1, 0.8) * rx), round(ccy - g.uniform(0.2, 0.85) * ry)
        if (x, y) in crown:
            put(x, y, LEAF_SUN)
    for _ in range(8):  # leaves lifted off the crown by the wind, drifting right
        put(round(ccx + rx + g.randrange(2, 30)), round(top + g.randrange(0, int(r * 1.4))), g.choice((LEAF_LIT, LEAF_TOP)))


def grate(cx, ground, g):
    """The metal tree grate with grass tufts and a few flowers round the trunk."""
    rect(cx - 9, ground - 1, cx + 10, ground + 3, (96, 92, 100))
    for x in range(cx - 8, cx + 9, 2):
        rect(x, ground, x + 1, ground + 2, (70, 66, 76))
    for i in range(12):  # grass tufts and a few flowers round the trunk
        gx = cx - 9 + g.randrange(0, 19)
        for k in range(g.randrange(2, 4)):
            put(gx + (k if i % 2 else -k) // 2, ground - 1 - k, LEAF_LIT if k else LEAF)
        if i % 4 == 0:
            put(gx, ground - 3, g.choice(((255, 255, 255), (255, 214, 90), (250, 150, 180))))


def wind_bits():
    """Petals and leaves carried on the breeze, with a few wind streaks."""
    for _ in range(7):  # wind lines: long soft curls, each ending in a little loop
        x, y, n = rng.randrange(-20, W - 80), rng.randrange(150, 330), rng.randrange(30, 60)
        for i in range(n):
            if i % 7 != 6:
                glow(x + i, y + round(2.5 * math.sin(i / 7)), (255, 255, 255), 0.5 * math.sin(math.pi * i / n))
        if rng.random() < 0.5:
            for a in range(0, 12):
                t = a / 12 * math.tau
                glow(x + n + round(3 * math.cos(t)), y + round(2.5 * math.sin(n / 7)) - 3 + round(3 * math.sin(t)), (255, 255, 255), 0.4)
    for _ in range(60):  # petals and leaves on the breeze: 2×1 or 2×2 flecks, tilted
        x, y = rng.randrange(W), rng.randrange(110, H - 10)
        c = rng.choice(((255, 186, 208), (255, 214, 226), (255, 164, 192), LEAF_LIT, LEAF_TOP))
        put(x, y, c)
        put(x + 1, y + rng.choice((0, 1)), mix(c, (255, 255, 255), 0.25))
        if rng.random() < 0.4:
            put(x + 1, y - 1, c)


# ---------- extra detail (feedback 2026-09-28: upgrade the trees and the overall detail) ----------

def hills():
    """Two soft ridges of hills beyond the city, hazed blue by the distance."""
    for layer, (c, base_y, amp, f) in enumerate(((HILL_FAR, 236, 22, 0.011), (HILL_NEAR, 262, 16, 0.019))):
        for x in range(W):
            top = int(base_y - amp * (0.6 * math.sin(x * f + layer * 2) + 0.4 * math.sin(x * f * 2.7 + 1)))
            for y in range(top, BASE):
                px[x, y] = tb.dither(x, y, c, mix(c, SKY_LOW, 0.35), 0.3 if y - top < 2 else 0)
            put(x, top, mix(c, (255, 255, 255), 0.25))  # sunlit ridge line
        for _ in range(60 if layer else 30):  # tiny trees on the ridge
            x = rng.randrange(W)
            top = int(base_y - amp * (0.6 * math.sin(x * f + layer * 2) + 0.4 * math.sin(x * f * 2.7 + 1)))
            rect(x, top - 1, x + 2, top + 1, mix(c, LEAF_DEEP, 0.3))


def rooftops():
    """What stands on the side buildings' roofs: a water tank, an antenna, a rail and potted plants."""
    (rx0, rx1, rtop, *_), (lx0, lx1, ltop, *_) = tb.LAYOUTS['left']['sides']
    tx, ty = rx1 - 60, rtop  # water tank on legs
    for lx in (tx + 2, tx + 18):
        rect(lx, ty - 8, lx + 2, ty, (120, 110, 120))
    rect(tx, ty - 26, tx + 22, ty - 8, (214, 206, 196))
    rect(tx, ty - 26, tx + 22, ty - 24, (236, 230, 222))
    rect(tx + 20, ty - 24, tx + 22, ty - 8, (184, 174, 168))
    for y in range(ty - 22, ty - 9, 4):
        rect(tx, y, tx + 22, y + 1, (190, 182, 176))
    for x in range(rx0 + 4, rx1, 6):  # roof rail
        rect(x, rtop - 7, x + 1, rtop, (140, 134, 144))
    rect(rx0 + 2, rtop - 7, rx1, rtop - 6, (160, 154, 164))
    for x in (rx0 + 20, rx0 + 34, rx0 + 70):  # roof garden pots
        rect(x, rtop - 5, x + 8, rtop, (190, 110, 80))
        for k in range(8):
            put(x + rng.randrange(-1, 9), rtop - 6 - rng.randrange(0, 5), rng.choice((LEAF, LEAF_LIT, (240, 110, 140))))
    ax = lx0 + 50  # antenna on the left roof
    rect(ax, ltop - 30, ax + 1, ltop, (110, 110, 124))
    for i, w in enumerate((10, 7, 4)):
        rect(ax - w, ltop - 28 + i * 5, ax + w + 1, ltop - 27 + i * 5, (110, 110, 124))
    rect(lx0 + 10, ltop - 10, lx0 + 26, ltop, (200, 196, 190))  # stair hut
    rect(lx0 + 10, ltop - 12, lx0 + 28, ltop - 10, (170, 164, 160))
    rect(lx0 + 14, ltop - 8, lx0 + 19, ltop, (130, 110, 100))


def pavement_detail():
    """Cracks and worn tiles, a drain in the curb, a manhole and tyre-worn lane paint."""
    for _ in range(14):
        x, y = rng.randrange(W), rng.randrange(BASE + 2, ROAD_Y - 2)
        for i in range(rng.randrange(3, 7)):
            put(x + i, y + (i // 2) % 2, (160, 150, 150))
    for _ in range(10):
        x, y = rng.randrange(0, W, 16), BASE + rng.randrange(0, 2) * 8
        rect(x + 1, y + 1, x + 16, y + 8, (214, 206, 200))  # a paler, newer tile
    for dx in (250, 690):  # curb drains
        rect(dx, ROAD_Y + 1, dx + 18, ROAD_Y + 5, (70, 68, 80))
        for x in range(dx + 1, dx + 18, 3):
            rect(x, ROAD_Y + 2, x + 1, ROAD_Y + 5, (120, 118, 128))
    mx, my = 330, 424  # manhole
    for y in range(my - 5, my + 6):
        for x in range(mx - 14, mx + 15):
            d = ((x - mx) / 14) ** 2 + ((y - my) / 5.5) ** 2
            if d < 1:
                put(x, y, (84, 82, 94) if d > 0.7 else (104, 102, 114) if (x + y) % 3 else (92, 90, 102))
    for _ in range(40):  # paint worn off the lane dashes
        x = rng.randrange(20, W)
        if (x - 20) % 90 < 44:
            put(x, 406 + rng.randrange(0, 3), (190, 186, 178))
    for y in range(ROAD_Y + 5, ROAD_Y + 12):  # the curb's shadow on the road
        for x in range(W):
            glow(x, y, SHADOW, 0.22 * (1 - (y - ROAD_Y - 5) / 7))


def _wheel(wx, wy, r):
    for y in range(wy - r - 1, wy + r + 2):
        for x in range(wx - r - 1, wx + r + 2):
            d = math.hypot(x - wx, y - wy)
            if d <= r + 0.4:
                c = (36, 32, 42) if d > r - 2.2 else (196, 196, 206) if d > 1.6 else (120, 120, 132)
                if r - 2.2 < d and x > wx and y < wy and d > r - 1:
                    c = (70, 66, 80)  # tyre catching the light
                put(x, y, c)


def scooter(x, ground):
    """Her delivery scooter on the pavement: a pink body lit from the right, a white box on the rack with a
    steaming bowl painted on it, chrome mirror and a yellow headlamp."""
    body, lit, dark, ink = (238, 118, 156), (255, 170, 198), (176, 64, 106), (60, 48, 60)
    for y in range(ground, ground + 5):  # shadow to the left
        for xx in range(x - 22, x + 50):
            glow(xx, y, SHADOW, 0.3)
    _wheel(x + 11, ground - 7, 7)
    _wheel(x + 51, ground - 7, 7)
    rect(x + 16, ground - 12, x + 44, ground - 8, dark)  # floorboard
    for y in range(ground - 28, ground - 10):  # rear body: a rounded hump over the back wheel
        t = (y - ground + 28) / 18
        half = round(13 * math.sqrt(max(0.0, 1 - (1 - t) ** 2)))
        rect(x + 16 - half, y, x + 18 + half, y + 1, body)
        put(x + 18 + half, y, lit)
    rect(x + 4, ground - 16, x + 32, ground - 14, dark)
    rect(x + 6, ground - 32, x + 30, ground - 28, ink)  # seat
    rect(x + 8, ground - 32, x + 30, ground - 31, (100, 86, 100))
    rect(x + 40, ground - 40, x + 49, ground - 10, body)  # front apron
    rect(x + 47, ground - 40, x + 49, ground - 10, lit)
    rect(x + 40, ground - 40, x + 41, ground - 10, dark)
    rect(x + 42, ground - 16, x + 60, ground - 13, body)  # front mudguard
    rect(x + 44, ground - 50, x + 47, ground - 40, dark)  # steering column
    rect(x + 36, ground - 53, x + 56, ground - 50, ink)  # handlebar
    rect(x + 37, ground - 58, x + 39, ground - 53, (150, 150, 160))  # mirror stalk
    rect(x + 35, ground - 61, x + 41, ground - 58, (210, 220, 230))
    rect(x + 49, ground - 47, x + 55, ground - 41, (255, 236, 150))  # headlamp
    put(x + 53, ground - 46, (255, 255, 230))
    bx0, by0, bx1, by1 = x + 2, ground - 56, x + 28, ground - 32  # delivery box on the rack
    rect(x + 4, by1, x + 26, by1 + 2, ink)
    rect(bx0, by0, bx1, by1, (246, 242, 236))
    rect(bx1 - 3, by0, bx1, by1, (255, 255, 255))
    rect(bx0, by0, bx0 + 2, by1, (214, 206, 204))
    rect(bx0, by0, bx1, by0 + 3, (228, 222, 220))  # lid
    rect(bx0, by0 + 20, bx1, by0 + 22, body)  # pink stripe
    rect(bx0 + 7, by0 + 12, bx0 + 19, by0 + 13, (255, 244, 236))  # a bowl of 마라탕 painted on it
    rect(bx0 + 8, by0 + 13, bx0 + 18, by0 + 17, (228, 84, 84))
    rect(bx0 + 10, by0 + 17, bx0 + 16, by0 + 18, (228, 84, 84))
    for k, sx in enumerate((bx0 + 10, bx0 + 13, bx0 + 16)):
        put(sx, by0 + 10 - k % 2, (236, 150, 150))
        put(sx + 1, by0 + 8 - k % 2, (236, 150, 150))


def cat(x, y):
    """A cream tabby curled up asleep in the sun: striped back, pink inner ears, a tail round its paws."""
    fur, lit, shade, stripe, ink = (252, 232, 196), (255, 246, 226), (226, 186, 140), (230, 164, 106), (110, 80, 70)
    for xx in range(x - 18, x + 16):  # its shadow
        for yy in range(y, y + 3):
            glow(xx, yy, SHADOW, 0.32)
    for yy in range(y - 15, y + 1):  # body: a loaf
        for xx in range(x - 15, x + 14):
            d = ((xx - x) / 14.5) ** 2 + ((yy - y + 7) / 8) ** 2
            if d <= 1:
                c = lit if yy < y - 12 and xx > x - 4 else shade if yy > y - 3 or d > 0.8 and xx < x else fur
                if c == fur and (xx - x) % 5 == 0 and yy < y - 6:
                    c = stripe
                put(xx, yy, c)
    hx, hy = x + 11, y - 9  # head, resting on the paws
    for yy in range(hy - 7, hy + 7):
        for xx in range(hx - 7, hx + 8):
            d = ((xx - hx) / 7.5) ** 2 + ((yy - hy) / 6.5) ** 2
            if d <= 1:
                put(xx, yy, lit if yy < hy - 3 else shade if d > 0.75 and yy > hy else fur)
    for ex in (hx - 5, hx + 4):  # ears, pink inside
        for k in range(5):
            rect(ex - (4 - k) // 2, hy - 6 - k, ex + (4 - k) // 2 + 2, hy - 5 - k, fur)
        put(ex + 1, hy - 7, (250, 170, 180))
        put(ex + 1, hy - 8, (250, 170, 180))
    for ex in (hx - 4, hx + 2):  # shut eyes: little arcs
        put(ex, hy, ink)
        put(ex + 1, hy + 1, ink)
        put(ex + 2, hy, ink)
    put(hx, hy + 2, (240, 130, 150))  # nose
    for k in range(3):  # stripes on the forehead
        put(hx - 2 + k * 2, hy - 5, stripe)
    rect(x + 2, y - 2, x + 16, y, fur)  # paws
    put(x + 8, y - 1, shade)
    for i in range(20):  # tail curling round the front
        t = i / 19
        tx, ty = round(x - 15 + t * 17), round(y - 1 - 3 * math.sin(t * math.pi) * (1 - t))
        put(tx, ty, stripe if i % 4 < 2 else fur)
        put(tx, ty + 1, shade)


def bench(x, ground):
    """A park bench with wooden slats lit along their top edges and curly iron legs."""
    wood, lit, dark, iron = (200, 142, 96), (236, 186, 132), (150, 98, 66), (70, 70, 84)
    for y in range(ground, ground + 5):
        for xx in range(x - 20, x + 52):
            glow(xx, y, SHADOW, 0.26)
    for lx in (x + 4, x + 54):  # iron legs, with a curl
        rect(lx, ground - 16, lx + 3, ground, iron)
        rect(lx - 2, ground - 2, lx + 5, ground, iron)
        rect(lx + 1, ground - 34, lx + 3, ground - 16, iron)  # up to the backrest
        put(lx - 1, ground - 12, iron)
        put(lx - 2, ground - 11, iron)
        put(lx + 4, ground - 12, iron)
        put(lx + 5, ground - 11, iron)
    for i, y in enumerate((ground - 18, ground - 15)):  # seat slats
        rect(x, y, x + 62, y + 3, wood if i else mix(wood, lit, 0.3))
        rect(x, y, x + 62, y + 1, lit)
        rect(x, y + 2, x + 62, y + 3, dark)
    for y in (ground - 34, ground - 28):  # backrest slats
        rect(x + 1, y, x + 61, y + 4, wood)
        rect(x + 1, y, x + 61, y + 1, lit)
        rect(x + 1, y + 3, x + 61, y + 4, dark)
    for k in range(6):  # wood grain
        put(x + 6 + k * 10, ground - 32, dark)
        put(x + 3 + k * 10, ground - 17, dark)


def flower_pots(x, ground):
    for i, c in enumerate(((240, 110, 140), (255, 206, 90), (190, 150, 230))):
        px0 = x + i * 11
        rect(px0, ground - 7, px0 + 9, ground, (200, 120, 90))
        rect(px0 - 1, ground - 8, px0 + 10, ground - 6, (220, 140, 104))
        for k in range(10):
            fx, fy = px0 + rng.randrange(0, 9), ground - 9 - rng.randrange(0, 6)
            put(fx, fy, LEAF if k % 3 else LEAF_LIT)
        for k in range(4):
            put(px0 + 1 + k * 2, ground - 12 - (k % 2) * 2, c)


def shop_glass_sky():
    """The sky and the trees across the street reflected in the shop window, faintly."""
    x0, y0, x1, y1 = tb.SHOP_X + 16, 158 + 88, tb.SHOP_X + 196, BASE - 16
    for y in range(y0, y0 + 14):
        for x in range(x0, x1):
            glow(x, y, SKY_MID, 0.28 * (1 - (y - y0) / 14))
    for k in range(3):
        cx = x0 + 30 + k * 60
        for y in range(y0 + 2, y0 + 14):
            for x in range(cx - 12, cx + 12):
                if ((x - cx) / 12) ** 2 + ((y - y0 - 8) / 6) ** 2 < 1:
                    glow(x, y, LEAF, 0.18)


def sunlight_on_shop():
    x0, x1, top = tb.SHOP_X, tb.SHOP_X + tb.SHOP_W, 158
    for y in range(top, BASE):  # light from the upper right warms the facade's right side
        for x in range(x0, x1):
            glow(x, y, (255, 246, 220), 0.12 * (x - x0) / (x1 - x0))
    for y in range(BASE, BASE + 14):  # the shop's own shadow falls left onto the pavement
        for x in range(max(0, x0 - 60 + (y - BASE) * 2), x0):
            glow(x, y, SHADOW, 0.22)


def build(clouds_on=True, crowns=True, flourish=True):
    """The whole day title. The animated title draws some parts live, so its layers are built without them:
    the clouds (they drift), the tree crowns (they sway), and the static birds, petals and wind lines
    (`flourish`; the canvas flies its own)."""
    use_canvas()
    L = tb.LAYOUTS['left']
    tb.SHOP_X, tb.NEON_LIT = L['shop'], True
    sky()
    if clouds_on:
        clouds()
    if flourish:
        birds()
    hills()
    far_city()
    buildings()
    rooftops()
    street()
    pavement_detail()
    lamp(L['lamp'] + 12)
    halos = {(255, 120, 170), (255, 100, 170)}  # no neon halo in daylight; the tubes and letters stay
    tb.glow = lambda x, y, c, t: None if tuple(c) in halos else glow(x, y, c, t)
    night_pool = tb.pool
    tb.pool = lambda cx, cy, rx, ry, c, s: night_pool(cx, cy, rx, ry, c, s * 0.35)  # lamps are faint by day
    tb.shop()
    tb.roof_sign(tb.SHOP_X + tb.SHOP_W // 2, 146)
    tb.glow, tb.pool = glow, night_pool
    sunlight_on_shop()
    shop_glass_sky()
    for i, t in enumerate(TREES):  # crowns: True, False, or the indices of the trees that get one
        tree(*t, crown=crowns is True or (crowns is not False and i in crowns))
    scooter(50, BASE + 16)
    cat(452, BASE + 16)
    bench(628, BASE + 15)
    flower_pots(560, BASE + 8)
    if flourish:
        wind_bits()
    return cv


TREES = ((506, BASE - 2, 128, 40, 11), (612, BASE + 4, 104, 32, 23), (36, BASE + 6, 100, 30, 37))  # cx, ground, h, r, seed


def sky_only():
    use_canvas()
    sky()
    return cv.img


def alpha_where_differs(img, under):
    """img with every pixel that equals `under` made transparent."""
    out = img.convert('RGBA')
    o, u = out.load(), under.load()
    for y in range(H):
        for x in range(W):
            if o[x, y][:3] == u[x, y][:3]:
                o[x, y] = (0, 0, 0, 0)
    return out


def export_layers():
    """Layers for the animated day title -> src/img/title-day-{sky,clouds,fg,crown-N}.png, plus the still
    src/img/title-bg-day.png shown before they load and with reduced motion."""
    out = tb.ROOT / 'src/img'
    sky_img = sky_only()
    bare = build(clouds_on=False, crowns=False, flourish=False).img
    sky_img.save(out / 'title-day-sky.png', optimize=True)
    use_canvas()  # the cloud strip alone: sky + clouds, minus the sky
    sky()
    clouds()
    alpha_where_differs(cv.img, sky_img).crop((0, 0, W, 170)).save(out / 'title-day-clouds.png', optimize=True)
    alpha_where_differs(bare, sky_img).save(out / 'title-day-fg.png', optimize=True)
    for i, (cx, ground, *_rest) in enumerate(TREES):  # one crown per file, so each sways on its own
        crown = alpha_where_differs(build(clouds_on=False, crowns={i}, flourish=False).img, bare)
        crown.save(out / f'title-day-crown-{i}.png', optimize=True)
        x0, y0, x1, y1 = crown.getbbox()
        print('DAY_TREES', i, {'x': x0, 'y': y0, 'w': x1 - x0, 'h': y1 - y0, 'ground': ground})
    build().img.save(out / 'title-bg-day.png', optimize=True)


if __name__ == '__main__':
    build().img.save(OUT)
    print('wrote', OUT.relative_to(tb.ROOT))
    export_layers()
