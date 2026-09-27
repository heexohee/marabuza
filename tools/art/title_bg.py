"""Title-screen background (concept 1: her pink shop in a rainy night alley) -> src/img/title-bg.png.

Run: python3 tools/art/title_bg.py  -> production/qa/evidence/title-mockup/title-bg-v3-{center,left}.png
(800×442 art px shown at ×2 — the same pixel size as the opening scenes — wide enough to cover a 16:9 window edge to
edge behind the stage, like Dave the Diver's title). Two layouts: the shop in the middle (menu below it), or the shop
on the left (logo and menu in a column on the right).

v3 (feedback 2026-09-27): the neighbours' windows and the street lamp are yellow and blue like the 마라판다 night
street of opening scene 1 (tools/art/scene_office.py); only her shop glows pink.

v2 (feedback 2026-09-27): finer pixel work at twice the resolution, every light source pink (lanterns, window,
street lamp, spill and reflections), no subtitle text under the logo — the game's subtitle is lettered on the shop's
neon sign instead — and the logo sits right above the shop with no empty band. Deterministic (fixed seed).
"""
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from pixel_scene import Canvas, mix

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / 'production/qa/evidence/title-mockup'
W, H = 800, 442
LAYOUT = 'center'  # 'center' | 'left' — set per build in __main__
SHOP_W = 340
SEED = 20260928
SHOP_X = 230
SUBTITLE = '퇴사하고 마라탕집 사장님'  # the game's subtitle, on her shop's neon sign (user, 2026-09-27)

BASE = 340  # building bases / sidewalk top (v4: lowered so the road takes less of the frame)
ROAD_Y = 358  # the menu band sits over the wet road below this

SKY_TOP, SKY_MID, SKY_LOW = (10, 10, 30), (30, 20, 54), (74, 36, 80)
FAR, FAR_EDGE = (34, 28, 60), (48, 38, 78)
BRICK, BRICK_DARK, MORTAR = (58, 44, 76), (48, 36, 64), (40, 30, 54)
PLASTER, PLASTER_DARK = (70, 58, 92), (56, 46, 76)
PINK, PINK_MID, PINK_DEEP, PINK_PALE = (240, 128, 170), (214, 96, 142), (150, 54, 96), (255, 196, 216)
CREAM = (255, 240, 244)
NEON, NEON_HALO = (255, 238, 248), (255, 100, 170)
TUBE_OFF = (128, 72, 100)  # an unlit neon tube (the animated title's flicker frame, tools/art/title_layers.py)
NEON_LIT = True  # False = both signs switched off; set per build
LIGHT = (255, 150, 200)  # her shop's pink light
LIT_WARM, LIT_BLUE = (244, 212, 140), (140, 190, 224)  # the neighbours (scene_office.py)
LAMP = (255, 214, 140)  # sodium street lamp
INSIDE_TOP, INSIDE_LOW = (255, 214, 230), (246, 150, 190)
INK = (14, 10, 22)

rng = random.Random(SEED)
cv = Canvas(W, H)
px, put, glow, rect = cv.px, cv.put, cv.glow, cv.rect


def dither(x, y, a, b, t):
    """Ordered 2×2 dither between colours a and b at ratio t — the hand-pixelled gradient look."""
    bayer = ((0.125, 0.625), (0.875, 0.375))[y % 2][x % 2]
    return b if t > bayer else a


def pool(cx, cy, rx, ry, c, strength):
    """Soft elliptical light pool."""
    for y in range(int(cy - ry), int(cy + ry) + 1):
        for x in range(int(cx - rx), int(cx + rx) + 1):
            d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
            if d < 1:
                glow(x, y, c, strength * (1 - d) ** 1.4)


# ---------- sky and city ----------

def sky(clouds=True):
    for y in range(H):
        t = y / BASE
        for x in range(W):
            if t < 0.55:
                px[x, y] = dither(x, y, SKY_TOP, SKY_MID, t / 0.55)
            else:
                px[x, y] = dither(x, y, SKY_MID, SKY_LOW, min(1, (t - 0.55) / 0.45))
    for _ in range(90):
        x, y = rng.randrange(W), rng.randrange(190)
        c = mix(px[x, y], (230, 230, 255), rng.choice((0.35, 0.6, 0.9)))
        put(x, y, c)
        if rng.random() < 0.12:  # a few twinkles with a cross
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                glow(x + dx, y + dy, (230, 230, 255), 0.35)
    if not clouds:  # the animated title draws its own drifting clouds (tools/art/title_layers.py)
        return
    for cx, cy, w in ((120, 70, 90), (470, 50, 120), (330, 120, 70)):  # thin clouds lit pink from the city
        for y in range(cy - 3, cy + 4):
            for x in range(cx - w // 2, cx + w // 2):
                edge = abs(x - cx) / (w / 2) + abs(y - cy) / 4
                if edge < 1 and (x + y) % 3:
                    glow(x, y, (80, 70, 120), 0.35 * (1 - edge))


def far_skyline():
    x = 0
    while x < W:
        w = rng.randrange(22, 48)
        top = rng.randrange(190, 255)
        rect(x, top, x + w, BASE, FAR)
        rect(x + w - 1, top, x + w, BASE, FAR_EDGE)
        if rng.random() < 0.3:
            mid = x + w // 2
            rect(mid, top - 10, mid + 1, top, FAR)
            put(mid, top - 11, (230, 70, 80))
        for wy in range(top + 4, BASE - 4, 6):
            for wx in range(x + 3, x + w - 3, 4):
                if rng.random() < 0.10:
                    rect(wx, wy, wx + 2, wy + 2, rng.choice((LIT_WARM, LIT_BLUE, (120, 130, 190), (200, 170, 120))))
        x += w + rng.randrange(0, 4)
    for y in range(BASE - 50, BASE):  # pink city haze on the horizon
        for x in range(W):
            glow(x, y, (90, 70, 130), 0.16 * (y - BASE + 50) / 50)


# ---------- side buildings ----------

def brick_wall(x0, x1, top, bottom):
    for y in range(top, bottom):
        row = (y - top) // 4
        for x in range(x0, x1):
            if (y - top) % 4 == 3 or (x + (row % 2) * 4) % 8 == 0:
                px[x, y] = MORTAR
            else:
                px[x, y] = BRICK_DARK if (x // 8 + row) % 5 == 0 else BRICK


def window(x, y, w, h, lit, people=True):
    rect(x - 2, y - 2, x + w + 2, y + h + 2, PLASTER_DARK)  # frame
    rect(x - 3, y + h + 2, x + w + 3, y + h + 4, PLASTER)  # sill
    if lit:
        c = rng.choice((LIT_WARM, LIT_WARM, LIT_BLUE))
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                px[xx, yy] = dither(xx, yy, c, mix(c, INK, 0.25), (yy - y) / h)
        rect(x, y, x + w, y + 3, mix(c, INK, 0.45))  # curtain top
        if people and rng.random() < 0.5:  # someone at home
            cx = x + rng.randrange(4, w - 4)
            sil = mix(c, INK, 0.55)
            rect(cx - 2, y + h - 7, cx + 3, y + h, sil)
            rect(cx - 1, y + h - 10, cx + 2, y + h - 7, sil)
        pool(x + w / 2, y + h / 2, w + 6, h + 4, c, 0.10)
    else:
        rect(x, y, x + w, y + h, (30, 26, 48))
        for i in range(0, w + h, 5):  # glass sheen
            for d in range(2):
                xx, yy = x + i - d, y + d
                if x <= xx < x + w and y <= yy < y + h:
                    glow(xx, yy, (120, 110, 160), 0.4)
    rect(x + w // 2, y, x + w // 2 + 1, y + h, PLASTER_DARK)  # mullion


def ac_unit(x, y):
    rect(x, y, x + 16, y + 11, (150, 146, 170))
    rect(x, y + 10, x + 16, y + 11, (100, 96, 120))
    for gx in range(x + 2, x + 9, 2):
        rect(gx, y + 2, gx + 1, y + 9, (100, 96, 120))
    for yy in range(y + 3, y + 8):
        for xx in range(x + 10, x + 15):
            if ((xx - x - 12.5) ** 2 + (yy - y - 5.5) ** 2) <= 6:
                put(xx, yy, (90, 86, 110))
    rect(x + 3, y + 11, x + 4, y + 16, (80, 76, 100))


def side_building(x0, x1, top, face_right, people=True):
    brick_wall(x0, x1, top, BASE)
    rect(x0, top, x1, top + 4, PLASTER)  # cornice
    rect(x0, top + 4, x1, top + 5, INK)
    edge = x1 - 2 if face_right else x0
    rect(edge, top, edge + 2, BASE, mix(BRICK, LIGHT, 0.25))  # pink rim light from the shop
    for i, wy in enumerate(range(top + 16, BASE - 60, 34)):
        for j, wx in enumerate(range(x0 + 12, x1 - 30, 40)):
            window(wx, wy, 22, 20, rng.random() < 0.45, people)
            if (i + j) % 2 == 0:
                ac_unit(wx + 1, wy + 26)
    pipe = x1 - 10 if face_right else x0 + 8
    rect(pipe, top + 5, pipe + 3, BASE, (96, 90, 118))  # drain pipe
    for y in range(top + 20, BASE, 26):
        rect(pipe - 1, y, pipe + 4, y + 2, (120, 114, 142))
    rect(x0 + 8, BASE - 40, x1 - 8, BASE, (44, 36, 60))  # shutters at street level
    for y in range(BASE - 38, BASE, 3):
        rect(x0 + 8, y, x1 - 8, y + 1, (56, 46, 74))


def wires(xa, xb):
    """Sagging power lines crossing the alley between two buildings, catching the shop's light."""
    for y0, y1, sag in ((160, 148, 26), (178, 168, 20)):
        for x in range(xa, xb):
            t = (x - xa) / (xb - xa)
            y = int(y0 + (y1 - y0) * t + sag * 4 * t * (1 - t))
            put(x, y, (26, 20, 40))
            if SHOP_X < x < SHOP_X + SHOP_W:
                glow(x, y + 1, LIGHT, 0.2)


def street_lamp(x):
    rect(x, BASE - 150, x + 3, BASE, (60, 54, 80))
    rect(x - 1, BASE - 4, x + 4, BASE, (80, 74, 100))
    rect(x + 3, BASE - 150, x + 20, BASE - 147, (60, 54, 80))
    rect(x + 14, BASE - 147, x + 24, BASE - 142, (90, 80, 110))
    rect(x + 15, BASE - 142, x + 23, BASE - 140, (255, 240, 200))
    pool(x + 19, BASE - 140, 22, 16, LAMP, 0.45)
    for y in range(BASE - 140, BASE + 14):  # light cone
        half = (y - BASE + 140) * 0.28 + 4
        for xx in range(int(x + 19 - half), int(x + 19 + half)):
            glow(xx, y, LAMP, 0.07)
    pool(x + 19, BASE + 8, 34, 7, LAMP, 0.35)


# ---------- her shop ----------

def pink_lantern(cx, top):
    rect(cx, top, cx + 1, top + 5, (70, 30, 50))
    body = top + 5
    for y in range(body + 3, body + 21):
        for x in range(cx - 8, cx + 10):
            d = ((x + 0.5 - cx - 0.5) / 8.5) ** 2 + ((y + 0.5 - body - 12) / 9) ** 2
            if d <= 1:
                shade = (x - cx) / 9
                c = mix((255, 150, 196), (206, 70, 130), max(0, min(1, (shade + 1) / 2)))
                if (y - body) % 5 == 0:
                    c = mix(c, (150, 40, 90), 0.4)  # ribs
                put(x, y, c)
    rect(cx - 5, body + 2, cx + 7, body + 4, (255, 220, 120))
    rect(cx - 5, body + 20, cx + 7, body + 22, (255, 220, 120))
    for i in range(6):
        rect(cx - 1 + (i % 3), body + 22, cx + (i % 3), body + 28 + i % 2, (255, 150, 196))
    pool(cx + 1, body + 12, 26, 24, LIGHT, 0.30)


def neon_sign(x0, y0, x1, y1):
    neon = NEON if NEON_LIT else TUBE_OFF
    for y in range(y0 - 10, y1 + 10 if NEON_LIT else y0 - 10):
        for x in range(x0 - 14, x1 + 14):
            dx = max(x0 - x, 0, x - x1)
            dy = max(y0 - y, 0, y - y1)
            d = (dx * dx + dy * dy) ** 0.5
            if d < 14:
                glow(x, y, NEON_HALO, 0.28 * (1 - d / 14))
    rect(x0 - 4, y0 - 4, x1 + 4, y1 + 4, (96, 58, 70))  # wooden frame
    rect(x0 - 3, y0 - 3, x1 + 3, y1 + 3, (130, 82, 92))
    rect(x0, y0, x1, y1, (70, 24, 52))  # dark plum panel
    for y in range(y0, y1):
        for x in range(x0, x1):
            if (x + y * 2) % 7 == 0:
                glow(x, y, (110, 40, 80), 0.5)
    tubes = ((2, NEON_HALO), (4, (255, 170, 210))) if NEON_LIT else ((2, TUBE_OFF), (4, mix(TUBE_OFF, INK, 0.2)))
    for inset, c in tubes:  # double neon tube border
        rect(x0 + inset, y0 + inset, x1 - inset, y0 + inset + 1, c)
        rect(x0 + inset, y1 - inset - 1, x1 - inset, y1 - inset, c)
        rect(x0 + inset, y0 + inset, x0 + inset + 1, y1 - inset, c)
        rect(x1 - inset - 1, y0 + inset, x1 - inset, y1 - inset, c)
    for bx in (x0 + 18, x1 - 20):  # a steaming neon bowl at each end
        by = (y0 + y1) // 2 + 3
        for x in range(bx - 8, bx + 9):
            put(x, by - 1, neon)
        for x in range(bx - 7, bx + 8):
            if abs(x - bx) > 5:
                put(x, by + 3, neon)
        for x in range(bx - 6, bx + 7):
            put(x, by + 6, neon)
        rect(bx - 3, by + 7, bx + 4, by + 8, neon)
        for i, sx in enumerate((bx - 4, bx, bx + 4)):
            for k in range(3):
                put(sx + (k + i) % 2, by - 4 - k * 2, neon)
    cv.sign_text(SUBTITLE, (x0 + x1) // 2, (y0 + y1) // 2, neon, NEON_HALO if NEON_LIT else None, size=16)


def awning(x0, x1, y):
    for x in range(x0, x1):
        stripe = (x - x0) // 10 % 2 == 0
        top_c = PINK_MID if stripe else CREAM
        low_c = PINK_DEEP if stripe else (236, 214, 224)
        for yy in range(y, y + 16):
            px[x, yy] = dither(x, yy, top_c, low_c, (yy - y) / 16)
        dip = ((x - x0) % 10 - 4.5) ** 2 <= 16
        if dip:
            put(x, y + 16, low_c)
            put(x, y + 17, low_c if ((x - x0) % 10 - 4.5) ** 2 <= 6 else (60, 30, 50))
    rect(x0, y - 2, x1, y, PINK_DEEP)
    for x in range(x0, x1):  # shadow under the awning
        for yy in range(y + 18, y + 24):
            glow(x, yy, INK, 0.35 * (1 - (yy - y - 18) / 6))


def customer(x, y, kind, counter_y):
    """One diner seen through the window: head, ears and rounded shoulders cut by the counter, an arm reaching
    for the bowl. Two tones plus a rim of pendant light on the top edges, and a lighter inner ear, so the shapes
    read as bear / rabbit / cat / dog rather than flat stamps."""
    fill, edge, rim, inner = (178, 84, 124), (132, 50, 90), (240, 160, 196), (214, 120, 158)
    shape, ears_in = set(), set()

    def ell(cx, cy, rx, ry, into=shape):
        for yy in range(int(cy - ry) - 1, int(cy + ry) + 2):
            for xx in range(int(cx - rx) - 1, int(cx + rx) + 2):
                if ((xx + 0.5 - cx) / rx) ** 2 + ((yy + 0.5 - cy) / ry) ** 2 <= 1:
                    into.add((xx, yy))

    dark = set()
    ell(x, y + 19, 12, 9.5)  # shoulders: a dome joined to the head, not a box
    ell(x, y + 11, 3.5, 3)  # neck
    ell(x, y + 1, 7.6, 7.8)  # head
    if kind == 'bear':
        for ex in (x - 6, x + 6):
            ell(ex, y - 6, 3.4, 3.4)
            ell(ex, y - 6, 1.6, 1.6, ears_in)
    elif kind == 'rabbit':
        ell(x - 3, y - 11, 2.3, 7.5)  # left ear upright
        ell(x - 3, y - 11, 0.9, 5.5, ears_in)
        ell(x + 4, y - 9, 2.3, 5)  # right ear, folding over at the top
        ell(x + 7, y - 14, 2.6, 2.2)
        ell(x + 4, y - 9, 0.9, 3.5, ears_in)
    elif kind == 'cat':
        for sx in (-1, 1):
            for k in range(8):  # triangular ears
                for w in range(-(7 - k) // 2, (7 - k) // 2 + 1):
                    px_ = x + sx * 5 + w
                    shape.add((px_, y - 4 - k))
                    if k < 5 and abs(w) <= (4 - k) // 2:
                        ears_in.add((px_, y - 4 - k))
    elif kind == 'dog':
        for sx in (-1, 1):  # floppy ears hanging at the sides, a shade darker than the head
            ell(x + sx * 7.8, y + 2, 3, 6.2)
            ell(x + sx * 8.2, y + 3, 2, 5, dark)
        ell(x, y + 5, 3.8, 2.8)  # muzzle
    arm_dir = -1 if kind in ('rabbit', 'dog') else 1  # which side their bowl sits
    shape = {p for p in shape if p[1] < counter_y}
    for (xx, yy) in shape:
        exposed_up = (xx, yy - 1) not in shape
        outline = any((xx + dx, yy + dy) not in shape for dx, dy in ((1, 0), (-1, 0), (0, 1)))
        c = rim if exposed_up and yy < y + 12 else edge if outline else fill
        if (xx, yy) in ears_in and not exposed_up:
            c = inner
        elif (xx, yy) in dark and not exposed_up:
            c = edge
        put(xx, yy, c)
    bx = x + arm_dir * 12  # their bowl on the counter, steaming
    rect(bx - 6, counter_y - 4, bx + 7, counter_y - 3, (255, 244, 236))
    rect(bx - 5, counter_y - 3, bx + 6, counter_y, (236, 96, 90))
    rect(bx - 4, counter_y - 4, bx + 5, counter_y - 3, (250, 150, 110))
    for k in range(6):
        glow(bx - 2 + (k % 3) * 2 + (k // 3), counter_y - 7 - k * 2, (255, 255, 255), 0.45 - k * 0.05)


def shop_window(x0, y0, x1, y1):
    rect(x0 - 4, y0 - 4, x1 + 4, y1 + 4, PINK_DEEP)
    rect(x0 - 2, y0 - 2, x1 + 2, y1 + 2, (120, 44, 80))
    for y in range(y0, y1):
        for x in range(x0, x1):
            px[x, y] = dither(x, y, INSIDE_TOP, INSIDE_LOW, (y - y0) / (y1 - y0))
    for lx in range(x0 + 20, x1 - 10, 44):  # pendant lamps inside
        rect(lx, y0, lx + 1, y0 + 8, (150, 60, 100))
        rect(lx - 4, y0 + 8, lx + 5, y0 + 12, (220, 90, 140))
        pool(lx, y0 + 14, 18, 10, (255, 240, 248), 0.4)
    rect(x0, y1 - 22, x1, y1 - 19, (200, 110, 140))  # counter
    # no diners in the window (feedback 2026-09-27: keep the shop interior empty); customer() kept for later use
    for y in range(y1 - 18, y1):  # fogged lower glass
        for x in range(x0, x1):
            glow(x, y, (255, 255, 255), 0.25 * (y - y1 + 18) / 18)
            if (x * 5 + y * 3) % 23 == 0:
                glow(x, y, (255, 255, 255), 0.5)
    for i in range(0, x1 - x0 + y1 - y0, 60):  # diagonal glass sheen
        for d in range(6):
            for k in range(y1 - y0):
                xx, yy = x0 + i - k + d, y0 + k
                if x0 <= xx < x1 and y0 <= yy < y1:
                    glow(xx, yy, (255, 255, 255), 0.10)
    mid = (x0 + x1) // 2
    rect(mid - 1, y0, mid + 2, y1, PINK_DEEP)
    rect(x0, (y0 + y1) // 2 - 30, x1, (y0 + y1) // 2 - 28, PINK_DEEP)  # transom bar
    for y in range(y1 + 6, BASE + 16):  # pink spill on the sidewalk
        for x in range(x0 - 20, x1 + 20):
            t = (y - y1 - 6) / (BASE + 16 - y1 - 6)
            glow(x, y, LIGHT, 0.32 * (1 - t))


def door(x0, y0, x1):
    rect(x0 - 3, y0 - 3, x1 + 3, BASE, PINK_DEEP)
    rect(x0, y0, x1, BASE, (246, 160, 192))
    for py in (y0 + 48, y0 + 72):  # panels, both inside the door (it ends at the sidewalk)
        rect(x0 + 5, py, x1 - 5, py + 20, (230, 136, 172))
        rect(x0 + 5, py, x1 - 5, py + 1, (255, 196, 216))
    rect(x0 + 6, y0 + 8, x1 - 6, y0 + 50, (255, 206, 226))  # door glass
    pool((x0 + x1) / 2, y0 + 28, 20, 22, (255, 255, 255), 0.35)
    rect(x1 - 9, y0 + 64, x1 - 6, y0 + 72, (255, 220, 120))  # handle
    for i, x in enumerate(range(x0, x1, 8)):  # noren
        c = PINK_DEEP if i % 2 == 0 else CREAM
        rect(x, y0, x + 7, y0 + 18, c)
        rect(x, y0 + 18, x + 7, y0 + 19, mix(c, INK, 0.3))
    rect(x0 + 9, y0 + 26, x1 - 9, y0 + 38, (255, 244, 248))  # hanging 영업중 sign
    rect(x0 + 9, y0 + 26, x1 - 9, y0 + 27, PINK_DEEP)
    cv.sign_text('영업중', (x0 + x1) // 2, y0 + 32, (200, 60, 110), None, size=10)


def props(x_board, x_plants):
    bx, by = x_board, BASE - 34  # A-frame chalk menu board
    rect(bx, by, bx + 26, by + 30, (120, 80, 70))
    rect(bx + 2, by + 2, bx + 24, by + 26, (40, 50, 46))
    for i, w in enumerate((16, 12, 18, 10)):
        rect(bx + 4, by + 5 + i * 5, bx + 4 + w, by + 6 + i * 5, (230, 226, 214))
    rect(bx + 18, by + 5, bx + 21, by + 8, (255, 150, 196))
    rect(bx + 2, by + 30, bx + 4, BASE + 2, (120, 80, 70))
    rect(bx + 22, by + 30, bx + 24, BASE + 2, (120, 80, 70))
    for i, px_ in enumerate((x_plants, x_plants + 18)):  # potted plants by the door
        rect(px_, BASE - 14, px_ + 14, BASE, (200, 110, 90))
        rect(px_ - 1, BASE - 15, px_ + 15, BASE - 13, (220, 130, 104))
        for k in range(14):
            lx = px_ + 7 + rng.randrange(-8, 9)
            ly = BASE - 16 - rng.randrange(0, 14 + i * 4)
            rect(lx, ly, lx + 3, ly + 2, rng.choice(((80, 150, 110), (110, 180, 130), (60, 120, 96))))


def shop():
    x0, x1, top = SHOP_X, SHOP_X + SHOP_W, 158
    for y in range(top, BASE):  # pink stucco facade with a soft vertical gradient
        for x in range(x0, x1):
            px[x, y] = dither(x, y, PINK, PINK_MID, (y - top) / (BASE - top) * 0.8)
    for y in range(top, BASE, 3):  # stucco grain
        for x in range(x0 + (y % 6), x1, 6):
            glow(x, y, PINK_DEEP, 0.18)
    rect(x0 - 6, top - 10, x1 + 6, top, (196, 74, 120))  # cornice
    rect(x0 - 6, top - 12, x1 + 6, top - 10, PINK_PALE)
    rect(x0 - 6, top, x1 + 6, top + 2, PINK_DEEP)
    for x in range(x0 - 6, x1 + 6, 6):
        rect(x, top - 10, x + 1, top, (170, 60, 104))
    rect(x0, top, x0 + 2, BASE, PINK_DEEP)
    rect(x1 - 2, top, x1, BASE, PINK_DEEP)
    rect(x1 - 26, top - 30, x1 - 16, top - 10, (110, 100, 124))  # vent pipe on the roof (clear of the logo)
    rect(x1 - 28, top - 32, x1 - 14, top - 30, (130, 120, 146))
    for i in range(22):  # steam from the kitchen
        sx = x1 - 22 + int(6 * ((i * 7) % 5 - 2) / 2)
        sy = top - 34 - i * 4
        for dx in range(-2, 3):
            glow(sx + dx + (i // 3) % 3, sy, (255, 230, 240), max(0, 0.34 - i * 0.014))
    neon_sign(x0 + 24, top + 10, x1 - 24, top + 46)
    awning(x0 - 6, x1 + 6, top + 56)
    shop_window(x0 + 16, top + 88, x0 + 196, BASE - 16)
    rect(x0 + 10, BASE - 12, x0 + 202, BASE, (170, 70, 110))  # tiled kickplate
    for x in range(x0 + 10, x0 + 202, 8):
        rect(x, BASE - 12, x + 1, BASE, (140, 54, 90))
    rect(x0 + 10, BASE - 7, x0 + 202, BASE - 6, (140, 54, 90))
    door(x1 - 110, top + 86, x1 - 62)
    props(x1 - 54, x0 + 182)  # plants under the window's corner, clear of the door
    pink_lantern(x0 - 14, top + 50)
    pink_lantern(x1 + 12, top + 50)



def roof_sign(cx, roof_y):
    """The title's "마라부자" board on posts on her roof — the same board as the in-game shop sign
    (tools/art/scene_shop.py RENAMED_SIGN colours), so the logo is part of the street, not pasted on top."""
    edge, bg, text, halo = (255, 127, 160), (122, 58, 84), (255, 240, 246), (255, 120, 170)
    if not NEON_LIT:
        edge, text, halo = mix(edge, bg, 0.55), mix(TUBE_OFF, bg, 0.2), None
    w, h = 236, 58
    x0, x1, y1 = cx - w // 2, cx + w // 2, roof_y - 16
    y0 = y1 - h
    for px_ in (x0 + 34, x1 - 36):  # posts down to the roof
        rect(px_, y1, px_ + 4, roof_y - 10, (70, 60, 86))
        rect(px_ - 2, roof_y - 12, px_ + 6, roof_y - 10, (90, 80, 108))
    rect(x0 + 34, y1 + 10, x1 - 32, y1 + 12, (70, 60, 86))  # cross brace
    for y in range(y0 - 18, y1 + 18 if halo else y0 - 18):  # neon halo
        for x in range(x0 - 22, x1 + 22):
            dx, dy = max(x0 - x, 0, x - x1), max(y0 - y, 0, y - y1)
            d = (dx * dx + dy * dy) ** 0.5
            if d < 22:
                glow(x, y, halo, 0.30 * (1 - d / 22))
    rect(x0 - 4, y0 - 4, x1 + 4, y1 + 4, (90, 36, 60))
    rect(x0 - 3, y0 - 3, x1 + 3, y1 + 3, edge)
    rect(x0, y0, x1, y1, bg)
    for y in range(y0, y1):  # a little panel texture
        for x in range(x0, x1):
            if (x + y * 2) % 9 == 0:
                glow(x, y, (150, 70, 104), 0.35)
    line = (255, 170, 205) if halo else mix(TUBE_OFF, bg, 0.3)
    rect(x0 + 3, y0 + 3, x1 - 3, y0 + 4, line)  # inner neon line
    rect(x0 + 3, y1 - 4, x1 - 3, y1 - 3, line)
    cv.sign_text('마라부자', cx, (y0 + y1) // 2, text, halo, size=40)
    cv.sign_text('마라부자', cx + 1, (y0 + y1) // 2, text, None, size=40)  # 1px faux-bold, like a thick neon tube
    if halo:
        pool(cx, y1 + 4, w * 0.6, 16, halo, 0.25)  # light on the roof


# ---------- street ----------

def street():
    for y in range(BASE, ROAD_Y):  # sidewalk tiles
        for x in range(W):
            c = (64, 54, 86) if (x // 16 + (y - BASE) // 8) % 2 else (58, 50, 80)
            if (x % 16 == 0) or ((y - BASE) % 8 == 0):
                c = (46, 38, 66)
            px[x, y] = c
    rect(0, ROAD_Y, W, ROAD_Y + 3, (96, 88, 124))  # curb
    rect(0, ROAD_Y + 3, W, ROAD_Y + 5, (40, 34, 60))
    for y in range(ROAD_Y + 5, H):
        t = (y - ROAD_Y) / (H - ROAD_Y)
        for x in range(W):
            px[x, y] = dither(x, y, (26, 22, 42), (16, 13, 28), t)
            if rng.random() < 0.02:
                px[x, y] = (34, 30, 52)  # asphalt grain


def reflections(lamp_x):
    """Wet road: the shop, sign, lanterns and lamp smeared downward in broken streaks."""
    x0, x1 = SHOP_X, SHOP_X + SHOP_W
    sources = [(x0, x1, NEON_HALO, 0.30), (x0 + 16, x0 + 196, LIGHT, 0.24), (x1 - 110, x1 - 62, (246, 160, 192), 0.18)]
    for sx0, sx1, c, st in sources:
        for x in range(sx0, sx1):
            for y in range(ROAD_Y + 6, H):
                t = (y - ROAD_Y) / (H - ROAD_Y)
                if (x * 7 + y * 3) % 11 < 6 and rng.random() < 0.75:
                    glow(x, y, c, st * (1 - t) ** 1.3)
    for cx, c in ((x0 - 14, LIGHT), (x1 + 12, LIGHT), (lamp_x + 19, LAMP)):  # vertical wobbling streaks
        for y in range(ROAD_Y + 6, H):
            wob = int(2 * ((y // 3) % 3 - 1))
            for dx in range(-3, 4):
                glow(cx + dx + wob, y, c, 0.30 * (1 - (y - ROAD_Y) / (H - ROAD_Y)) * (1 - abs(dx) / 4))
    for _ in range(12):  # puddles with ripple rings
        cx, cy = rng.randrange(20, W - 20), rng.randrange(ROAD_Y + 20, H - 8)
        rx, ry = rng.randrange(14, 30), rng.randrange(3, 6)
        for y in range(cy - ry, cy + ry + 1):
            for x in range(cx - rx, cx + rx + 1):
                d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
                if d < 1:
                    glow(x, y, (90, 70, 130), 0.35)
                if 0.75 < d < 1:
                    glow(x, y, (200, 150, 220), 0.35)


def rain():
    for _ in range(260):
        x, y = rng.randrange(W), rng.randrange(H - 20)
        length = rng.randrange(5, 10)
        for i in range(length):
            glow(x + i // 4, y + i, (200, 190, 240), 0.22)
    for _ in range(60):  # splashes on the sidewalk and road
        x, y = rng.randrange(W), rng.randrange(BASE + 2, H)
        put(x, y, (190, 170, 220))
        put(x - 1, y - 1, (150, 130, 190))
        put(x + 1, y - 1, (150, 130, 190))


LAYOUTS = {
    # shop x, side buildings (x0, x1, top, facing the shop on its right), wire span, street lamp x
    'center': dict(shop=230, sides=((0, 196, 110, True, True), (604, W, 98, False, True)), wires=(196, 604), lamp=120),
    # shop moved right (feedback 2026-09-27: too far left full screen); no figures in the right building's windows
    # feedback 2026-09-27 (2nd): shop 10px further left, the left building narrowed to keep its gap to the
    # lantern, and no figures in either building's windows
    'left': dict(shop=118, sides=((620, W, 80, False, False), (0, 94, 112, True, False)), wires=(460, 620), lamp=548),
}


def build(layout, clouds=True, with_rain=True, neon_lit=True):
    """The whole background. The flags drop the parts the animated title draws live (tools/art/title_layers.py)."""
    global LAYOUT, SHOP_X, NEON_LIT, rng, cv, px, put, glow, rect
    LAYOUT, NEON_LIT, rng, cv = layout, neon_lit, random.Random(SEED), Canvas(W, H)
    px, put, glow, rect = cv.px, cv.put, cv.glow, cv.rect
    L = LAYOUTS[layout]
    SHOP_X = L['shop']
    sky(clouds)
    far_skyline()
    for x0, x1, top, face_right, people in L['sides']:
        side_building(x0, x1, top, face_right, people)
    wires(*L['wires'])
    street()
    street_lamp(L['lamp'])
    shop()
    if layout == 'left':
        roof_sign(SHOP_X + SHOP_W // 2, 146)  # the cornice top
    reflections(L['lamp'])
    if with_rain:
        rain()
    return cv


def mock(bg_path, out_path):
    """The whole title screen at stage size: logo right above the shop, the four menu items on a band."""
    big = Image.open(bg_path).resize((W * 2, H * 2), Image.NEAREST).convert('RGBA')
    over = Image.new('RGBA', big.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(over)
    font = lambda size: ImageFont.truetype('/System/Library/Fonts/AppleSDGothicNeo.ttc', size, index=6)
    cx = big.width // 2

    def centred(text, y, size, fill, stroke=0, stroke_fill=None):
        f = font(size)
        l, t, r, b = d.textbbox((0, 0), text, font=f, stroke_width=stroke)
        d.text((cx - (r - l) // 2 - l, y), text, font=f, fill=fill, stroke_width=stroke, stroke_fill=stroke_fill)

    logo_y = 22
    for glow_r in (20, 13, 7):
        centred('마라부자', logo_y, 150, (255, 100, 170, 36), stroke=glow_r, stroke_fill=(255, 100, 170, 36))
    centred('마라부자', logo_y, 150, (255, 240, 248, 255), stroke=6, stroke_fill=(214, 56, 120, 255))
    band_top, band_bot = 668, 872
    d.rectangle((0, band_top, big.width, band_bot), fill=(20, 10, 30, 150))
    for i, item in enumerate(['새 게임', '이어서 하기', '불러오기', '설정']):
        on = i == 1
        centred(item, band_top + 14 + i * 46, 34 if on else 30, (255, 255, 255, 255) if on else (224, 204, 218, 200))
    d.text((big.width - 150, 852), 'v0.1 · 개발 빌드', font=font(18), fill=(224, 204, 218, 150))
    Image.alpha_composite(big, over).convert('RGB').save(out_path)
    print('wrote', out_path.relative_to(ROOT))


if __name__ == '__main__':
    # the approved title background (feedback 2026-09-27: layout 'left', roof sign); 'center' kept as a draft
    build('left').save(ROOT / 'src/img/title-bg.png', [])
    build('center').save(OUT_DIR / 'title-bg-v3-center.png', [])
