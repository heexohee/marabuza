"""Pixel-art background for opening scene 1 (2 a.m. overtime, downtown at night).

Run: python3 tools/art/scene_office.py [--preview path]  -> writes src/img/scene-office.png

Drawn procedurally at BG_W×BG_H art pixels (shown at ~×2 by .scene-office in src/self-serve.css), in the
mood of night-city pixel references: moonlit skyline, one office floor still lit, the panda owner's old brown malatang shop
"마라판다" glowing at street level (the regular place of scene 2; it only turns pink once the protagonist remodels it) (sign lettered with macOS Apple SD Gothic Neo Bold), a streetlight, and a wet road catching the lights. Deterministic (fixed seed).

Scale: the protagonist is ~56 art px tall standing on the sidewalk (feet near row 143), so the street
buildings are sized against her — the shop front is ~1.6× her height and the towers leave the frame.
design/quick-specs/story-character-2026-09-25.md §B
"""
import random
from pathlib import Path

from pixel_scene import Canvas, mix

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'src/img/scene-office.png'

BG_W, BG_H = 384, 152
SEED = 20260926
BASE = 132  # street-level building bases, just behind the protagonist's feet
SIDEWALK = (132, 146)  # rows
CURB_Y = 146
MOON = (312, 24, 12)  # cx, cy, r
MOON_CLEAR = (284, 342, 46)  # x0, x1, lowest tower top allowed there so the moon stays in open sky

SKY_TOP, SKY_LOW = (10, 16, 34), (30, 44, 76)
FAR, FAR_WIN, FAR_LIT = (20, 30, 54), (32, 48, 80), (104, 146, 190)
MID, MID_EDGE, MID_WIN = (28, 40, 68), (44, 60, 96), (38, 54, 88)
LIT_BLUE, LIT_WARM = (140, 190, 224), (244, 212, 140)
NEAR_A, NEAR_B = (44, 44, 68), (58, 50, 76)
TILE, GROUT, CURB, ROAD = (46, 54, 80), (36, 42, 64), (72, 82, 110), (16, 20, 34)
INK = (12, 12, 22)
# the panda's shop in scene 2's warm browns (tools/art/scene_regular.py), not the protagonist's pink
SHOP_BODY, SHOP_DEEP = (168, 96, 58), (98, 52, 32)
SHOP_GLOW = (255, 212, 160)
SPILL = (255, 190, 130)
AWNING_A, AWNING_B = (204, 62, 48), (250, 230, 200)

rng = random.Random(SEED)
cv = Canvas(BG_W, BG_H)
img, px = cv.img, cv.px
put, glow, rect = cv.put, cv.glow, cv.rect


def sky():
    for y in range(BG_H):
        c = mix(SKY_TOP, SKY_LOW, min(1, y / BASE))
        for x in range(BG_W):
            px[x, y] = c
    for _ in range(90):
        x, y = rng.randrange(BG_W), rng.randrange(70)
        put(x, y, mix(px[x, y], (210, 222, 240), rng.choice((0.35, 0.55, 0.9))))


def moon():
    """A round full moon: pixel centres inside the circle, a soft rim on the lower right, round maria."""
    cx, cy, r = MOON
    for y in range(cy - r - 8, cy + r + 9):
        for x in range(cx - r - 8, cx + r + 9):
            d = ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2) ** 0.5
            if d <= r:
                rim = d > r - 1.6 and (x - cx) + (y - cy) > 0
                put(x, y, (204, 216, 200) if rim else (228, 236, 220))
            elif d <= r + 8:
                glow(x, y, (150, 176, 196), 0.30 * (1 - (d - r) / 8) ** 1.5)
    for mx, my, mr in ((-4, -3, 2.6), (3, 3, 2.2), (-2, 5, 1.4), (5, -4, 1.3)):
        for y in range(cy + my - 3, cy + my + 4):
            for x in range(cx + mx - 3, cx + mx + 4):
                if ((x + 0.5 - cx - mx) ** 2 + (y + 0.5 - cy - my) ** 2) ** 0.5 <= mr:
                    put(x, y, (208, 220, 204))


def windows(x0, y0, x1, y1, dark, lit_rate, lit_cols, step=(3, 3), size=(1, 1)):
    for y in range(y0, y1 - size[1] + 1, step[1]):
        for x in range(x0, x1 - size[0] + 1, step[0]):
            c = rng.choice(lit_cols) if rng.random() < lit_rate else dark
            rect(x, y, x + size[0], y + size[1], c)


def tower(x0, x1, top, body, edge=None, win=None, lit_rate=0.0, lit_cols=(), step=(3, 3), size=(1, 1), antenna=False):
    rect(x0, top, x1, BASE, body)
    if edge:
        rect(x1 - 1, top, x1, BASE, edge)  # moonlight catches the right edge
    if win:
        windows(x0 + 2, max(top, 0) + 3, x1 - 2, BASE - 2, win, lit_rate, lit_cols, step, size)
    if antenna and top > 8:
        mid = (x0 + x1) // 2
        rect(mid, top - 8, mid + 1, top, body)
        put(mid, top - 9, (220, 70, 80))


def clear_of_moon(x0, x1, top):
    lo, hi, lowest = MOON_CLEAR
    return max(top, lowest) if x0 < hi and x1 > lo else top


def far_skyline():
    x = 0
    while x < BG_W:
        w = rng.randrange(16, 32)
        top = clear_of_moon(x, x + w, rng.randrange(-6, 40))
        tower(x, x + w, top, FAR, win=FAR_WIN, lit_rate=0.05, lit_cols=(FAR_LIT,), antenna=rng.random() < 0.3)
        x += w + rng.randrange(0, 3)


def mid_buildings():
    for x0, x1, top in ((0, 40, 26), (126, 164, 12), (164, 198, 36), (228, 262, 20), (262, 290, 50), (344, 384, 16)):
        tower(x0, x1, top, MID, MID_EDGE, MID_WIN, 0.16, (LIT_BLUE, LIT_BLUE, LIT_WARM), (4, 4), (2, 2))


def office():
    """The protagonist's office: runs out of frame, dark floors, one floor still working overtime."""
    x0, x1 = 56, 120
    tower(x0, x1, 0, (34, 46, 78), (52, 68, 106))
    for i, y in enumerate(range(3, BASE - 30, 7)):
        overtime = i == 6
        for x in range(x0 + 4, x1 - 4, 5):
            if overtime:
                c = LIT_WARM if rng.random() < 0.85 else (255, 236, 180)
            else:
                c = LIT_BLUE if rng.random() < 0.05 else (40, 54, 90)
            rect(x, y, x + 4, y + 4, c)
        if overtime:
            for x in range(x0 - 5, x1 + 5):
                for dy in (-3, -2, -1, 4, 5, 6):
                    glow(x, y + dy, LIT_WARM, 0.12)
    rect(x0 - 2, BASE - 26, x1 + 2, BASE - 24, (52, 68, 106))  # lobby canopy
    rect(x0 + 18, BASE - 22, x1 - 18, BASE, (70, 90, 130))  # glass lobby, lights off
    rect(x0 + 31, BASE - 22, x0 + 33, BASE, (40, 54, 90))


def near_row():
    """Street-level buildings, purple-grey like the references, with AC units and shop lights."""
    for x0, x1, top, c in ((0, 56, 36, NEAR_A), (120, 150, 46, NEAR_B), (150, 198, 30, NEAR_A), (300, 344, 40, NEAR_B)):
        rect(x0, top, x1, BASE, c)
        rect(x0, top, x1, top + 2, mix(c, (120, 120, 150), 0.3))
        windows(x0 + 4, top + 6, x1 - 4, BASE - 24, mix(c, INK, 0.3), 0.4, (LIT_WARM, LIT_BLUE, (230, 150, 170)),
                (11, 12), (7, 7))
        for x in range(x0 + 5, x1 - 10, 22):
            rect(x, top + 20, x + 9, top + 27, (150, 158, 176))  # AC unit
            rect(x + 2, top + 22, x + 5, top + 25, (90, 96, 112))
        rect(x0 + 3, BASE - 18, x1 - 3, BASE, mix(c, INK, 0.45))  # closed shutters at street level
        for y in range(BASE - 17, BASE, 3):
            rect(x0 + 3, y, x1 - 3, y + 1, mix(c, INK, 0.25))
    rect(12, BASE - 26, 46, BASE - 19, (236, 150, 170))  # small pink shop sign
    rect(15, BASE - 24, 43, BASE - 21, (255, 214, 224))


SIGN_TEXT = '마라판다'


def bowl(x, y):
    """A steaming bowl of malatang on a table."""
    rect(x, y, x + 9, y + 1, (250, 240, 236))
    rect(x + 1, y + 1, x + 8, y + 3, (230, 84, 60))
    rect(x + 2, y + 3, x + 7, y + 4, (250, 240, 236))
    for sx, sy in ((2, -3), (4, -5), (6, -3), (3, -7)):
        glow(x + sx, y + sy, (255, 255, 255), 0.55)


def shop():
    """The panda owner's malatang shop "마라판다", an old brown place — taller than the protagonist."""
    x0, x1, top = 194, 312, 40
    rect(x0, top, x1, BASE, SHOP_BODY)
    rect(x0, top, x1, top + 2, (196, 124, 78))
    rect(x0, top, x0 + 1, BASE, SHOP_DEEP)
    rect(x1 - 1, top, x1, BASE, SHOP_DEEP)
    rect(x0 + 8, top + 5, x1 - 8, top + 27, (214, 72, 52))  # red-rimmed wooden sign board
    rect(x0 + 9, top + 6, x1 - 9, top + 26, (78, 36, 24))
    cv.sign_text(SIGN_TEXT, (x0 + x1) // 2, top + 16, (255, 232, 196), (255, 150, 80))
    for x in range(x0 - 3, x1 + 3):  # striped awning with a scalloped hem
        c = AWNING_A if (x - x0) // 6 % 2 == 0 else AWNING_B
        rect(x, top + 30, x + 1, top + 38, c)
        if ((x - x0) % 6 - 2.5) ** 2 <= 6:
            put(x, top + 38, c)
    rect(x0 - 3, top + 29, x1 + 3, top + 30, SHOP_DEEP)
    win0, win1, wtop = x0 + 6, x0 + 72, top + 44
    rect(win0 - 1, wtop - 1, win1 + 1, BASE - 5, SHOP_DEEP)
    rect(win0, wtop, win1, BASE - 6, SHOP_GLOW)
    for y in range(wtop, wtop + 3):
        rect(win0, y, win1, y + 1, (255, 236, 222))  # warm ceiling light
    for tx in (win0 + 6, win0 + 38):  # two tables with bowls
        rect(tx, BASE - 20, tx + 22, BASE - 18, (176, 104, 84))
        rect(tx + 2, BASE - 18, tx + 4, BASE - 6, (140, 80, 66))
        rect(tx + 18, BASE - 18, tx + 20, BASE - 6, (140, 80, 66))
        bowl(tx + 3, BASE - 24)
        bowl(tx + 12, BASE - 24)
    rect((win0 + win1) // 2, wtop, (win0 + win1) // 2 + 1, BASE - 6, SHOP_DEEP)  # mullion
    rect(x0 + 2, BASE - 5, x1 - 2, BASE, (130, 72, 44))  # sill / base
    d0, d1 = x0 + 80, x1 - 10
    rect(d0 - 1, top + 43, d1 + 1, BASE, (96, 44, 52))
    rect(d0, top + 44, d1, BASE, (150, 86, 70))  # wooden door
    rect(d0 + 3, top + 56, d1 - 3, top + 74, SHOP_GLOW)  # door glass
    rect(d1 - 6, top + 78, d1 - 4, top + 82, (250, 210, 110))  # handle
    for i, x in enumerate(range(d0, d1, 5)):  # noren curtain
        rect(x, top + 44, x + 4, top + 54, AWNING_A if i % 2 == 0 else AWNING_B)
    cv.lantern(x0 - 1, top + 38)
    cv.lantern(x1 - 1, top + 38)
    menu = (176, BASE - 22)  # A-frame menu board
    rect(menu[0], menu[1], menu[0] + 14, BASE, SHOP_DEEP)
    rect(menu[0] + 1, menu[1] + 1, menu[0] + 13, BASE - 4, (44, 56, 48))  # chalk board, like the one inside
    for y in range(menu[1] + 4, BASE - 6, 3):
        rect(menu[0] + 3, y, menu[0] + 11, y + 1, (240, 236, 220))


def streetlight(x=330):
    top = 34
    rect(x, top, x + 3, SIDEWALK[1] - 2, (64, 70, 88))
    rect(x - 10, top, x + 1, top + 3, (64, 70, 88))
    rect(x - 14, top + 1, x - 6, top + 4, (255, 244, 206))
    for y in range(top + 4, SIDEWALK[1]):
        spread = (y - top - 4) * 0.33
        for xx in range(int(x - 11 - spread), int(x - 8 + spread)):
            glow(xx, y, (255, 236, 190), 0.05)


def tree(cx=364, cy=86, r=26):
    rect(cx - 2, cy, cx + 2, SIDEWALK[0] + 3, (40, 32, 34))
    for y in range(cy - r, cy + r):
        for x in range(cx - r, cx + r + 1):
            d = ((x - cx) / r) ** 2 + ((y - cy) / (r * 0.85)) ** 2
            if d <= 1 and rng.random() < (0.97 if d < 0.8 else 0.6):
                light = x > cx + 5 and y < cy - 4 and rng.random() < 0.5
                put(x, y, (44, 82, 64) if light else (24, 52, 44))


def street():
    for y in range(SIDEWALK[0], SIDEWALK[1]):
        row = y - SIDEWALK[0]
        for x in range(BG_W):
            px[x, y] = GROUT if row % 7 == 6 or (x + row // 7 * 6) % 12 == 0 else TILE
    rect(0, CURB_Y, BG_W, CURB_Y + 1, CURB)
    rect(0, CURB_Y + 1, BG_W, BG_H, ROAD)
    for y in range(SIDEWALK[0], SIDEWALK[1]):  # shop light spilling onto the pavement
        t = 0.5 * (1 - (y - SIDEWALK[0]) / (SIDEWALK[1] - SIDEWALK[0]))
        for x in range(176, 330):
            glow(x, y, SPILL, t * max(0, 1 - abs(x - 253) / 70))
    for x in range(BG_W):  # wet road: lit things above reflect as broken, fading streaks
        src = px[x, BASE - 6]
        if sum(src) / 3 > 110:
            for y in range(CURB_Y + 1, BG_H):
                if (y + x // 4) % 2 == 0:
                    glow(x, y, src, 0.32 * (1 - (y - CURB_Y) / (BG_H - CURB_Y + 2)))


def build():
    for step in (sky, moon, far_skyline, mid_buildings, office, near_row, shop, streetlight, tree, street):
        step()
    return img


if __name__ == '__main__':
    build()
    cv.save(OUT)
