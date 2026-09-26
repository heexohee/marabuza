"""Pixel-art cross-section of 마라판다 for the self-serve business screen (`.shop-scene`).

Run: python3 tools/art/scene_shop.py [--preview]  -> writes src/img/scene-shop.png

Story: production/epics/shop-growth/story-001-shop-cross-section.md
The shop seen side-on, stage 0 of the interior (Story 005 adds stages 1-4), in the warm browns of
tools/art/scene_regular.py. Left to right: the door, the dining floor (tables and chairs are DOM elements
drawn over it so they can be clicked and follow the seat count), and the kitchen at the right end (tiled
wall, hood, steel counter the pots stand on). The back wall carries a window (Story 004 changes the view),
the "마라판다" board, a chalk menu and lanterns; the open/closed board is a DOM element.

The stage is STAGE_W×STAGE_H art px and is always shown at that aspect ratio, so the layout constants below
are also the CSS positions (as % of the stage) in src/self-serve.css — keep the two in step.
Deterministic (fixed seed).
"""
import random
from pathlib import Path

from pixel_scene import Canvas, mix

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'src/img/scene-shop.png'

STAGE_W, STAGE_H = 320, 150
FLOOR_Y = 112  # wall meets floor
BEAM_H = 5
DOOR = (6, 30)  # x span; the door's bottom is FLOOR_Y
DINING = (34, 212)  # x span the tables are laid out in (CSS .shop-scene .seats)
KITCHEN = (214, 320)  # x span of the kitchen (CSS .shop-scene .pots)
COUNTER_Y = 100  # top of the kitchen counter the pots stand on
SEED = 20260926

WALL, WALL_STRIPE = (244, 190, 122), (234, 176, 106)
WOOD, WOOD_DARK, WOOD_LIGHT = (150, 84, 50), (98, 52, 32), (184, 112, 66)
TILE_A, TILE_B, GROUT = (168, 88, 40), (204, 130, 72), (130, 66, 34)
KTILE, KGROUT = (238, 232, 222), (196, 188, 176)
STEEL, STEEL_DARK, STEEL_LIGHT = (176, 182, 194), (112, 118, 132), (214, 220, 228)
CREAM, INK = (255, 238, 206), (40, 22, 16)
WARM_LIGHT = (255, 214, 150)

rng = random.Random(SEED)
cv = Canvas(STAGE_W, STAGE_H)
glow, rect = cv.glow, cv.rect


def wall():
    for y in range(FLOOR_Y):
        for x in range(STAGE_W):
            cv.px[x, y] = WALL_STRIPE if x % 8 in (0, 1) else WALL
    rect(0, 0, STAGE_W, BEAM_H, WOOD_DARK)  # ceiling beam
    rect(0, BEAM_H, STAGE_W, BEAM_H + 1, INK)
    rect(0, FLOOR_Y - 14, KITCHEN[0], FLOOR_Y, WOOD)  # wainscot along the dining wall
    rect(0, FLOOR_Y - 14, KITCHEN[0], FLOOR_Y - 12, WOOD_LIGHT)
    for x in range(0, KITCHEN[0], 12):
        rect(x, FLOOR_Y - 12, x + 1, FLOOR_Y, WOOD_DARK)


def floor():
    for y in range(FLOOR_Y, STAGE_H):
        row = y - FLOOR_Y
        for x in range(STAGE_W):
            tile = (x // 12 + row // 6) % 2
            c = GROUT if row % 6 == 5 or x % 12 == 11 else (TILE_A if tile else TILE_B)
            cv.px[x, y] = mix(c, INK, min(0.3, row / 120))
    rect(0, FLOOR_Y, STAGE_W, FLOOR_Y + 1, WOOD_DARK)


def door():
    x0, x1 = DOOR
    top = 40
    rect(x0 - 2, top - 2, x1 + 2, FLOOR_Y, WOOD_DARK)  # frame
    rect(x0, top, x1, FLOOR_Y, (132, 72, 44))
    rect(x0 + 3, top + 4, x1 - 3, top + 30, (180, 214, 230))  # glass
    for y in range(top + 4, top + 30):
        for x in range(x0 + 3, x1 - 3):
            if (x - y) % 11 < 2:
                glow(x, y, (255, 255, 255), 0.35)
    rect(x0 + 3, top + 34, x1 - 3, top + 36, WOOD_DARK)  # kick rail
    rect(x1 - 6, top + 40, x1 - 4, top + 46, (250, 210, 110))  # handle
    rect(x0 - 4, top - 6, x1 + 4, top - 2, (200, 60, 50))  # little awning over the door


def window():
    """Back-wall window; Story 004 swaps this view for the time of day."""
    x0, y0, x1, y1 = 42, 22, 96, 70
    rect(x0 - 3, y0 - 3, x1 + 3, y1 + 3, WOOD_DARK)
    for y in range(y0, y1):
        rect(x0, y, x1, y + 1, mix((132, 190, 236), (208, 230, 248), (y - y0) / (y1 - y0)))
    x = x0
    while x < x1:
        w, top = rng.randrange(7, 13), rng.randrange(y0 + 14, y0 + 30)
        rect(x, top, min(x + w, x1), y1, (156, 172, 198))
        x += w + 1
    rect((x0 + x1) // 2, y0, (x0 + x1) // 2 + 2, y1, WOOD_DARK)
    rect(x0, (y0 + y1) // 2, x1, (y0 + y1) // 2 + 2, WOOD_DARK)
    rect(x0 - 5, y1 + 3, x1 + 5, y1 + 5, WOOD_LIGHT)  # sill


def signboard():
    x0, y0, x1, y1 = 112, 10, 196, 30
    rect(x0 - 2, y0 - 2, x1 + 2, y1 + 2, (200, 60, 50))
    rect(x0, y0, x1, y1, (112, 44, 30))
    cv.sign_text('마라판다', (x0 + x1) // 2, (y0 + y1) // 2, CREAM, (255, 170, 120), size=13)


def menu_board():
    x0, y0, x1, y1 = 150, 38, 196, 76
    rect(x0 - 2, y0 - 2, x1 + 2, y1 + 2, WOOD_DARK)
    rect(x0, y0, x1, y1, (44, 56, 48))
    for i, (name, dots) in enumerate((('마라탕', 4), ('샹궈', 3), ('꿔바로우', 2))):
        cy = y0 + 7 + i * 12
        cv.sign_text(name, x0 + 16, cy, (240, 236, 220), None, size=8)
        for d in range(dots):
            rect(x1 - 4 - d * 3, cy, x1 - 3 - d * 3, cy + 1, (246, 200, 90))


def lanterns():
    for cx in (106, 204):
        cv.lantern(cx, BEAM_H + 1, cord=6)


def kitchen():
    x0, x1 = KITCHEN
    for y in range(BEAM_H + 1, COUNTER_Y):  # white tile splashback
        for x in range(x0, x1):
            cv.px[x, y] = KGROUT if (y - BEAM_H) % 8 == 7 or (x - x0) % 10 == 9 else KTILE
    rect(x0, BEAM_H + 1, x0 + 2, FLOOR_Y, WOOD_DARK)  # kitchen partition edge
    hx0, hx1 = x0 + 10, x1 - 6  # extractor hood
    rect(hx0 + 18, BEAM_H + 1, hx1 - 18, 20, STEEL_DARK)
    for i, y in enumerate(range(20, 34)):
        rect(hx0 + 8 - i // 2, y, hx1 - 8 + i // 2, y + 1, STEEL_LIGHT if i < 2 else STEEL)
    rect(hx0, 34, hx1, 36, STEEL_DARK)
    rect(x0 + 8, 52, x0 + 40, 54, WOOD_DARK)  # spice shelf
    for i, sx in enumerate(range(x0 + 10, x0 + 40, 6)):
        rect(sx, 44, sx + 4, 52, ((208, 60, 50), (240, 200, 90), (96, 150, 80), (230, 120, 60), (180, 60, 90))[i % 5])
    rect(x0, COUNTER_Y, x1, STAGE_H, STEEL)  # counter the pots stand on
    rect(x0, COUNTER_Y, x1, COUNTER_Y + 3, STEEL_LIGHT)
    rect(x0, COUNTER_Y + 3, x1, COUNTER_Y + 4, STEEL_DARK)
    for x in range(x0 + 8, x1 - 4, 26):  # cabinet doors
        rect(x, COUNTER_Y + 10, x + 20, STAGE_H - 6, STEEL_DARK)
        rect(x + 1, COUNTER_Y + 11, x + 19, STAGE_H - 7, STEEL)
        rect(x + 16, COUNTER_Y + 24, x + 18, COUNTER_Y + 30, STEEL_LIGHT)


def light_pool():
    for cx in (106, 204):
        for y in range(FLOOR_Y, STAGE_H):
            for x in range(cx - 40, cx + 42):
                d = ((x - cx) / 40) ** 2 + ((y - FLOOR_Y - 12) / 14) ** 2
                if d < 1 and x < KITCHEN[0]:
                    glow(x, y, WARM_LIGHT, 0.14 * (1 - d))


def build():
    for step in (wall, floor, door, window, signboard, menu_board, lanterns, kitchen, light_pool):
        step()
    return cv


if __name__ == '__main__':
    import sys
    build().save(OUT, sys.argv)
