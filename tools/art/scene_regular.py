"""Pixel-art background for opening scene 2 (late-night stop at the panda owner's old malatang shop).

Run: python3 tools/art/scene_regular.py [--preview]  -> writes the shop in three moods (MODES):
  night   -> src/img/scene-regular.png         scene 2, the late-night regular visit (영업중 neon)
  morning -> src/img/scene-takeover.png        scene 4, the takeover morning (준비중 board, sunlight)
  open    -> src/img/scene-takeover-open.png   scene 4's last line: 영업중 neon and lanterns lit, and the
                                               board swapped to her pink "마라부자" (the title drop)

Inside the panda's shop in the scene's original warm browns (orange wall / brown floor, as the old
.scene-regular gradient was) — an old, well-loved place, unlike the protagonist's pink shop to come:
a window onto the night street, the self-serve ingredient fridge every malatang shop has, a "마라판다"
board, a chalk menu, a kitchen counter with steaming pots, lanterns from the ceiling, a tiled floor.
Same scale rules as scene 1: the protagonist (~56 art px) stands around 34% from the left and the panda
around 64%, both on the floor below FLOOR_Y. Deterministic (fixed seed). Uses tools/art/pixel_scene.py.
design/quick-specs/story-character-2026-09-25.md §B
"""
import random
from pathlib import Path

from pixel_scene import Canvas, mix

ROOT = Path(__file__).resolve().parents[2]
MODES = {'night': 'scene-regular', 'morning': 'scene-takeover', 'open': 'scene-takeover-open'}
DAYLIGHT = {'morning', 'open'}
SUN = (255, 244, 210)

BG_W, BG_H = 384, 152
SEED = 20260927
FLOOR_Y = 118  # wall meets floor just behind the cast's feet (feet near row 143)
BEAM_H = 6

WALL, WALL_STRIPE = (244, 190, 122), (234, 176, 106)
WOOD, WOOD_DARK, WOOD_LIGHT = (150, 84, 50), (98, 52, 32), (184, 112, 66)
TILE_A, TILE_B, GROUT = (168, 88, 40), (204, 130, 72), (130, 66, 34)
STEEL, STEEL_DARK = (182, 188, 198), (120, 126, 140)
BROTH, CREAM, INK = (212, 62, 42), (255, 238, 206), (40, 22, 16)
WARM_LIGHT = (255, 214, 150)
LANTERN_X = (30, 94, 185, 299)  # in the gaps between window, fridge and the two boards

MODE = 'night'
rng = random.Random(SEED)
cv = Canvas(BG_W, BG_H)
put, glow, rect = cv.put, cv.glow, cv.rect


def wall():
    for y in range(FLOOR_Y):
        for x in range(BG_W):
            cv.px[x, y] = WALL_STRIPE if x % 8 in (0, 1) else WALL
    rect(0, 0, BG_W, BEAM_H, WOOD_DARK)  # ceiling beam
    rect(0, BEAM_H, BG_W, BEAM_H + 1, INK)
    rect(0, 96, BG_W, FLOOR_Y, WOOD)  # wainscot
    rect(0, 96, BG_W, 98, WOOD_LIGHT)
    for x in range(0, BG_W, 12):
        rect(x, 98, x + 1, FLOOR_Y, WOOD_DARK)


WINDOW = (10, 30, 90, 94)  # x0, y0, x1, y1


def window():
    """The street outside (night or day), mullions, glass sheen and the sign in the window."""
    x0, y0, x1, y1 = WINDOW
    rect(x0 - 3, y0 - 3, x1 + 3, y1 + 3, WOOD_DARK)
    if MODE in DAYLIGHT:
        day_street()
    else:
        night_street()
    rect((x0 + x1) // 2, y0, (x0 + x1) // 2 + 2, y1, WOOD_DARK)  # mullions
    rect(x0, (y0 + y1) // 2, x1, (y0 + y1) // 2 + 2, WOOD_DARK)
    for y in range(y0, y1):  # glass sheen
        for x in range(x0, x1):
            if (x - y) % 23 < 2:
                glow(x, y, (255, 255, 255), 0.10)
    if MODE == 'morning':  # hanging wooden board: not open yet
        bx0, by0, bx1, by1 = x0 + 20, y1 - 19, x1 - 20, y1 - 5
        rect(bx0 + 10, y0 + 30, bx0 + 11, by0, INK)
        rect(bx1 - 11, y0 + 30, bx1 - 10, by0, INK)
        rect(bx0 - 1, by0 - 1, bx1 + 1, by1 + 1, WOOD_DARK)
        rect(bx0, by0, bx1, by1, (232, 210, 166))
        cv.sign_text('준비중', (x0 + x1) // 2, (by0 + by1) // 2, (110, 66, 44), None, size=10)
    else:
        cv.sign_text('영업중', (x0 + x1) // 2, y1 - 12, (255, 120, 110), (150, 50, 60), size=10)
    rect(x0 - 5, y1 + 3, x1 + 5, y1 + 5, WOOD_LIGHT)  # sill


def day_street():
    """Morning outside: blue sky, two clouds, pale towers, a bright road."""
    x0, y0, x1, y1 = WINDOW
    for y in range(y0, y1):
        rect(x0, y, x1, y + 1, mix((132, 190, 236), (208, 230, 248), (y - y0) / (y1 - y0)))
    for cx, cy, rx in ((30, y0 + 8, 9), (66, y0 + 13, 7)):
        for y in range(cy - 4, cy + 4):
            for x in range(cx - rx, cx + rx + 1):
                if ((x - cx) / rx) ** 2 + ((y - cy) / 3.5) ** 2 <= 1:
                    put(x, y, (250, 252, 255))
    x = x0
    while x < x1:
        w, top = rng.randrange(8, 16), rng.randrange(y0 + 16, y0 + 38)
        rect(x, top, min(x + w, x1), y1, (156, 172, 198))
        rect(min(x + w, x1) - 1, top, min(x + w, x1), y1, (184, 198, 220))
        for wy in range(top + 3, y1 - 4, 4):
            for wx in range(x + 2, min(x + w, x1) - 1, 3):
                if rng.random() < 0.25:
                    put(wx, wy, (206, 222, 240))
        x += w + 1
    rect(x0, y1 - 6, x1, y1, (150, 146, 150))  # street


def night_street():
    """Night street outside: dark sky, far towers with lit windows, a wet road glint."""
    x0, y0, x1, y1 = WINDOW
    for y in range(y0, y1):
        rect(x0, y, x1, y + 1, mix((14, 20, 40), (40, 52, 86), (y - y0) / (y1 - y0)))
    for _ in range(14):
        put(rng.randrange(x0, x1), rng.randrange(y0, y0 + 16), (200, 214, 236))
    x = x0
    while x < x1:
        w, top = rng.randrange(8, 16), rng.randrange(y0 + 10, y0 + 36)
        rect(x, top, min(x + w, x1), y1, (24, 32, 58))
        for wy in range(top + 3, y1 - 4, 4):
            for wx in range(x + 2, min(x + w, x1) - 1, 3):
                if rng.random() < 0.3:
                    put(wx, wy, rng.choice(((244, 212, 140), (140, 190, 224))))
        x += w + 1
    rect(x0, y1 - 6, x1, y1, (22, 26, 42))  # street
    for gx in range(x0, x1, 3):
        glow(gx, y1 - 3, (244, 212, 140), 0.35)


INGREDIENTS = (
    ((96, 176, 92), (60, 130, 64)),  # greens
    ((236, 226, 204), (196, 180, 150)),  # mushrooms
    ((252, 244, 214), (226, 210, 170)),  # tofu
    ((246, 212, 120), (214, 170, 80)),  # noodles
    ((240, 128, 110), (196, 82, 70)),  # fish cakes
)


def fridge():
    """Self-serve ingredient fridge: steel frame, glass doors, shelves of heaped bowls, skewers on top."""
    x0, y0, x1, y1 = 100, 34, 180, FLOOR_Y
    rect(x0 - 1, y0 - 1, x1 + 1, y1, INK)
    rect(x0, y0, x1, y1, STEEL)
    rect(x0, y0, x1, y0 + 13, (208, 58, 52))  # header strip
    cv.sign_text('셀프 재료', (x0 + x1) // 2, y0 + 7, CREAM, None, size=10)
    gx0, gy0, gx1, gy1 = x0 + 3, y0 + 16, x1 - 3, y1 - 8
    rect(gx0, gy0, gx1, gy1, (212, 238, 240))
    for i, y in enumerate(range(gy0 + 4, gy1 - 3, 12)):
        rect(gx0, y + 9, gx1, y + 10, STEEL_DARK)
        light, dark = INGREDIENTS[i % len(INGREDIENTS)]
        for bx in range(gx0 + 2, gx1 - 8, 11):  # little bowls, each heaped
            rect(bx, y + 5, bx + 9, y + 9, (250, 250, 250))
            for hx in range(bx + 1, bx + 8):
                h = 3 if 2 < hx - bx < 6 else 2
                rect(hx, y + 5 - h, hx + 1, y + 5, light if rng.random() < 0.7 else dark)
    rect((gx0 + gx1) // 2, gy0, (gx0 + gx1) // 2 + 1, gy1, STEEL_DARK)  # door split
    for y in range(gy0, gy1):  # glass sheen
        for x in range(gx0, gx1):
            if (x + y) % 29 < 2:
                glow(x, y, (255, 255, 255), 0.25)
    rect(x0 + 6, y1 - 6, x1 - 6, y1 - 4, STEEL_DARK)  # kick plate
    for i, sx in enumerate(range(x0 + 4, x1 - 4, 5)):  # skewers on top
        rect(sx, y0 - 9, sx + 1, y0 - 1, (196, 150, 96))
        rect(sx - 1, y0 - 12, sx + 2, y0 - 9, ((226, 70, 60), (246, 200, 90), (250, 236, 220))[i % 3])


def shop_board():
    x0, y0, x1, y1 = 190, 12, 296, 36
    if MODE == 'open':  # first opening under her name: pink neon "마라부자" (same colours as tools/art/scene_shop.py)
        for y in range(y0 - 7, y1 + 7):
            for x in range(x0 - 8, x1 + 8):
                glow(x, y, (255, 120, 170), 0.12)
        rect(x0 - 2, y0 - 2, x1 + 2, y1 + 2, (255, 127, 160))
        rect(x0, y0, x1, y1, (122, 58, 84))
        cv.sign_text('마라부자', (x0 + x1) // 2, (y0 + y1) // 2, (255, 240, 246), (255, 120, 170), size=14)
        return
    rect(x0 - 2, y0 - 2, x1 + 2, y1 + 2, (200, 60, 50))
    rect(x0, y0, x1, y1, (112, 44, 30))
    cv.sign_text('마라판다', (x0 + x1) // 2, (y0 + y1) // 2, CREAM, (255, 170, 120), size=14)


def menu_board():
    x0, y0, x1, y1 = 304, 12, 376, 74
    rect(x0 - 3, y0 - 3, x1 + 3, y1 + 3, WOOD_DARK)
    rect(x0, y0, x1, y1, (44, 56, 48))
    for i, (name, dots) in enumerate((('마라탕', 5), ('마라샹궈', 3), ('꿔바로우', 4), ('볶음밥', 2))):
        cy = y0 + 9 + i * 14
        cv.sign_text(name, x0 + 22, cy, (240, 236, 220), None, size=10)
        for d in range(dots):
            rect(x1 - 6 - d * 3, cy, x1 - 5 - d * 3, cy + 1, (246, 200, 90))  # price dots
    for y in range(y0, y1):
        for x in range(x0, x1):
            if rng.random() < 0.03:
                glow(x, y, (255, 255, 255), 0.15)  # chalk dust


def pot(x0, y):
    rect(x0, y, x0 + 34, y + 2, STEEL_DARK)
    rect(x0 + 1, y + 2, x0 + 33, y + 16, STEEL)
    rect(x0 + 2, y + 2, x0 + 32, y + 4, BROTH)
    for bx in range(x0 + 4, x0 + 30, 6):
        put(bx, y + 3, (250, 200, 90))
    rect(x0 - 3, y + 5, x0 + 1, y + 7, STEEL_DARK)
    rect(x0 + 33, y + 5, x0 + 37, y + 7, STEEL_DARK)
    for i in range(10):  # steam
        sx = x0 + 8 + (i * 7) % 20
        for sy in range(y - 4 - i * 3, y - 1 - i * 3):
            glow(sx + (sy // 3) % 3, sy, (255, 255, 255), 0.28 - i * 0.02)


def counter():
    """Kitchen counter behind the panda owner, pots bubbling."""
    x0, top = 188, 84
    rect(x0, top, BG_W, top + 4, (214, 150, 96))
    rect(x0, top + 4, BG_W, FLOOR_Y, (170, 94, 54))
    for x in range(x0, BG_W, 16):
        rect(x, top + 4, x + 1, FLOOR_Y, WOOD_DARK)
    rect(x0, top + 4, BG_W, top + 6, WOOD_DARK)
    pot(200, top - 16)
    pot(318, top - 16)
    rect(252, top - 10, 272, top, (250, 246, 238))  # stack of bowls
    for y in range(top - 10, top, 3):
        rect(252, y, 272, y + 1, (226, 70, 60))


def floor():
    for y in range(FLOOR_Y, BG_H):
        row = y - FLOOR_Y
        for x in range(BG_W):
            tile = (x // 12 + row // 6) % 2
            c = GROUT if row % 6 == 5 or x % 12 == 11 else (TILE_A if tile else TILE_B)
            cv.px[x, y] = mix(c, INK, min(0.35, row / 80))
    rect(0, FLOOR_Y, BG_W, FLOOR_Y + 1, WOOD_DARK)


def lights():
    """Lanterns; lit ones pool warm light on the floor (not in the morning, before opening)."""
    for cx in LANTERN_X:
        cv.lantern(cx, BEAM_H + 1, cord=10)
        if MODE == 'morning':
            continue
        for y in range(FLOOR_Y, BG_H):  # warm pools on the floor
            for x in range(cx - 40, cx + 42):
                d = ((x - cx) / 40) ** 2 + ((y - FLOOR_Y - 12) / 16) ** 2
                if d < 1:
                    glow(x, y, WARM_LIGHT, 0.18 * (1 - d))


def sunlight():
    """Morning sun through the window: a slanted patch on the floor and a faint shaft in the air."""
    x0, y0, x1, y1 = WINDOW
    for y in range(y1 + 5, BG_H):
        t = (y - y0) * 0.9
        for x in range(int(x0 + t), int(x1 + t)):
            glow(x, y, SUN, 0.07 if y < FLOOR_Y else 0.2)


def build(mode='night'):
    """Paints one mood from a fresh canvas and seed, so each output is deterministic on its own."""
    global MODE, rng, cv, put, glow, rect
    MODE, rng, cv = mode, random.Random(SEED), Canvas(BG_W, BG_H)
    put, glow, rect = cv.put, cv.glow, cv.rect
    steps = [wall, window, fridge, shop_board, menu_board, counter, floor, lights]
    if MODE in DAYLIGHT:
        steps.append(sunlight)
    for step in steps:
        step()
    return cv


if __name__ == '__main__':
    import sys
    argv = ['--preview'] if '--preview' in sys.argv else []  # each mood previews to /tmp/<name>.png
    for mode, name in MODES.items():
        build(mode).save(ROOT / f'src/img/{name}.png', argv)
