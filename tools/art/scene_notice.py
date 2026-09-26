"""Pixel-art background for opening scene 3 (the day she quits: 마라판다 closed, a notice on the door, rain).

Run: python3 tools/art/scene_notice.py [--preview path]  -> writes src/img/scene-notice.png

First-person, close up at the shop door of scene 1's "마라판다", now dark: the sign and neon off, faded
awning dripping, chairs upside down on the tables behind dark glass, the shutter half down, and the
taped notice catching the streetlight — the one lit thing in the frame. Rain over everything, a wet
pavement. The panda walks in later and stands in front of the door (story.js castSpot / enter).
Same stage as the other scenes (384×152 art, ×2). Deterministic (fixed seed). Uses tools/art/pixel_scene.py.
design/quick-specs/story-character-2026-09-25.md §B
"""
import random
from pathlib import Path

from pixel_scene import Canvas, mix

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'src/img/scene-notice.png'

BG_W, BG_H = 384, 152
SEED = 20260928
BASE = 132  # shop front meets the pavement, just behind where the cast stands
SIDEWALK = (132, 146)
CURB_Y = 146

SKY, SKY_LOW = (14, 18, 32), (30, 36, 56)
FACADE, FACADE_DARK, FACADE_EDGE = (84, 50, 36), (56, 32, 24), (110, 68, 48)
SIGN_OFF, SIGN_TEXT = (46, 24, 20), (132, 100, 80)
AWNING_A, AWNING_B = (110, 40, 36), (150, 132, 116)
GLASS, GLASS_SHEEN = (26, 30, 44), (58, 66, 88)
SHUTTER, SHUTTER_LINE = (104, 108, 122), (78, 82, 96)
PAPER, PAPER_INK = (242, 234, 212), (96, 88, 84)
LAMP = (255, 232, 180)
RAIN = (150, 172, 206)
TILE, GROUT, CURB, ROAD = (40, 46, 66), (30, 34, 50), (62, 70, 94), (14, 16, 28)
DOOR = (206, 270)  # x span of the door (art px); the panda later stands here
NOTICE = (224, 80, 252, 112)  # x0, y0, x1, y1

rng = random.Random(SEED)
cv = Canvas(BG_W, BG_H)
put, glow, rect = cv.put, cv.glow, cv.rect


def sky():
    for y in range(BG_H):
        rect(0, y, BG_W, y + 1, mix(SKY, SKY_LOW, min(1, y / 40)))
    x = 0
    while x < BG_W:  # neighbouring buildings peeking above the shop
        w, top = rng.randrange(18, 40), rng.randrange(0, 14)
        rect(x, top, x + w, 40, (22, 26, 42))
        for wy in range(top + 3, 38, 5):
            for wx in range(x + 3, x + w - 2, 5):
                if rng.random() < 0.12:
                    rect(wx, wy, wx + 2, wy + 2, (120, 150, 190))
        x += w + 2


def facade():
    x0, x1 = 30, 354
    rect(x0, 18, x1, BASE, FACADE)
    rect(x0, 18, x1, 20, FACADE_EDGE)
    rect(x0, 18, x0 + 2, BASE, FACADE_DARK)
    rect(x1 - 2, 18, x1, BASE, FACADE_DARK)
    for y in range(22, BASE, 9):  # old wood siding
        rect(x0 + 2, y, x1 - 2, y + 1, FACADE_DARK)


def sign():
    x0, y0, x1, y1 = 104, 22, 280, 50
    rect(x0 - 2, y0 - 2, x1 + 2, y1 + 2, (90, 40, 32))  # dead neon rim
    rect(x0, y0, x1, y1, SIGN_OFF)
    cv.sign_text('마라판다', (x0 + x1) // 2, (y0 + y1) // 2, SIGN_TEXT, None, size=22)
    for bx in range(x0 + 4, x1 - 4, 14):  # unlit bulbs along the board
        put(bx, y1 + 1, (70, 60, 50))


def awning():
    top, bottom = 56, 66
    for x in range(20, 364):
        c = AWNING_A if (x - 20) // 8 % 2 == 0 else AWNING_B
        rect(x, top, x + 1, bottom, c)
        if ((x - 20) % 8 - 3.5) ** 2 <= 9:
            put(x, bottom, c)
    rect(20, top - 1, 364, top, FACADE_DARK)
    for x in range(24, 364, 16):  # drips off the scallops
        for y in range(bottom + 2, bottom + 2 + rng.randrange(3, 9), 2):
            glow(x, y, RAIN, 0.6)


def window():
    x0, y0, x1, y1 = 44, 72, 192, BASE - 6
    rect(x0 - 3, y0 - 3, x1 + 3, y1 + 3, FACADE_DARK)
    rect(x0, y0, x1, y1, GLASS)
    for tx in range(x0 + 8, x1 - 30, 46):  # tables with chairs stacked upside down: closed
        rect(tx, y1 - 18, tx + 30, y1 - 16, (44, 40, 52))
        rect(tx + 3, y1 - 16, tx + 5, y1, (40, 36, 48))
        rect(tx + 25, y1 - 16, tx + 27, y1, (40, 36, 48))
        for cx in (tx + 4, tx + 18):
            rect(cx, y1 - 26, cx + 8, y1 - 24, (48, 44, 58))
            rect(cx, y1 - 32, cx + 1, y1 - 26, (48, 44, 58))
            rect(cx + 7, y1 - 32, cx + 8, y1 - 26, (48, 44, 58))
    rect((x0 + x1) // 2, y0, (x0 + x1) // 2 + 2, y1, FACADE_DARK)
    for y in range(y0, y1):  # street reflections on the glass
        for x in range(x0, x1):
            if (x - y) % 31 < 3:
                glow(x, y, GLASS_SHEEN, 0.5)


def door():
    x0, x1 = DOOR
    rect(x0 - 3, 70, x1 + 3, BASE, FACADE_DARK)
    rect(x0, 72, x1, BASE, (40, 30, 30))  # dark door behind
    rect(x0 - 3, 68, x1 + 3, 72, SHUTTER_LINE)  # shutter box
    for y in range(72, 116):  # shutter pulled half down
        rect(x0, y, x1, y + 1, SHUTTER_LINE if y % 3 == 0 else SHUTTER)
    rect(x0, 115, x1, 117, (60, 62, 74))  # shutter bottom bar
    rect((x0 + x1) // 2 - 3, 115, (x0 + x1) // 2 + 3, 118, (40, 42, 52))  # handle


def notice():
    x0, y0, x1, y1 = NOTICE
    for y in range(y0 - 24, y1 + 24):  # streetlight pooled on the notice
        for x in range(x0 - 34, x1 + 34):
            d = ((x - (x0 + x1) / 2) / 40) ** 2 + ((y - (y0 + y1) / 2) / 30) ** 2
            if d < 1:
                glow(x, y, LAMP, 0.22 * (1 - d))
    rect(x0 + 1, y0 + 1, x1 + 1, y1 + 1, (40, 36, 40))  # shadow
    rect(x0, y0, x1, y1, PAPER)
    rect(x0 + 6, y0 + 3, x1 - 6, y0 + 5, PAPER_INK)  # title
    for i, y in enumerate(range(y0 + 9, y1 - 5, 4)):
        rect(x0 + 3, y, x1 - 3 - (i * 5) % 9, y + 1, PAPER_INK)
    rect(x1 - 12, y1 - 5, x1 - 3, y1 - 4, (170, 60, 50))  # signature stamp
    for tx, ty in ((x0 - 2, y0 - 1), (x1 - 4, y0 - 1)):  # tape
        rect(tx, ty, tx + 6, ty + 3, (230, 222, 180))


def lanterns():
    for cx in (22, 360):  # lanterns off: dark red, no glow
        rect(cx, 66, cx + 1, 70, (40, 24, 24))
        for y in range(70, 82):
            for x in range(cx - 5, cx + 7):
                if ((x + 0.5 - cx - 0.5) / 5.5) ** 2 + ((y + 0.5 - 76) / 6) ** 2 <= 1:
                    put(x, y, (110, 36, 38) if x < cx else (84, 28, 32))
        rect(cx - 3, 70, cx + 5, 71, (120, 96, 60))
        rect(cx - 3, 81, cx + 5, 82, (120, 96, 60))


def street():
    for y in range(SIDEWALK[0], SIDEWALK[1]):
        row = y - SIDEWALK[0]
        for x in range(BG_W):
            cv.px[x, y] = GROUT if row % 7 == 6 or (x + row // 7 * 6) % 12 == 0 else TILE
    rect(0, CURB_Y, BG_W, CURB_Y + 1, CURB)
    rect(0, CURB_Y + 1, BG_W, BG_H, ROAD)
    cx = (NOTICE[0] + NOTICE[2]) / 2
    for y in range(SIDEWALK[0], BG_H):  # the notice's light reflected in the wet pavement
        for x in range(int(cx - 30), int(cx + 30)):
            if (x + y) % 3 == 0:
                glow(x, y, LAMP, 0.18 * (1 - abs(x - cx) / 30) * max(0.0, 1 - (y - SIDEWALK[0]) / 24))
    for _ in range(26):  # puddles
        px_, py = rng.randrange(BG_W), rng.randrange(SIDEWALK[0] + 2, BG_H)
        for x in range(px_, px_ + rng.randrange(6, 16)):
            glow(x, py, (90, 104, 136), 0.45)


def rain():
    for _ in range(420):
        x, y = rng.randrange(-40, BG_W), rng.randrange(-10, BG_H)
        for i in range(rng.randrange(4, 9)):  # falling slightly to the left
            glow(x - i // 3, y + i, RAIN, 0.28)


def build():
    for step in (sky, facade, sign, awning, window, door, notice, lanterns, street, rain):
        step()
    return cv.img


if __name__ == '__main__':
    build()
    cv.save(OUT)
