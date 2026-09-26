"""Pixel-art cross-section of the shop for the self-serve business screen (`.shop-scene`).

Run: python3 tools/art/scene_shop.py [--stage N] [--old-sign] [--mockup] [--out PATH] [--preview [PATH]]
  default                -> src/img/scene-shop.png (interior stage 0, the game's background)
  --stage N              interior stage 0-6 (Story 005): 0 갈색 노포 → 6 핑크 마라부자; the game uses
                         src/img/scene-shop-N.png for N ≥ 1 (see `python3 tools/art/scene_shop.py --all`)
  --all                  writes the game's backgrounds for every stage (scene-shop.png, scene-shop-1..6.png)
  --old-sign             the brown "마라판다" sign. The game never shows it: the sign is swapped to pink
                         "마라부자" on takeover day, at the end of the opening (Story 007), so every business
                         day — interior stage 0 included — has the new sign
  --mockup               also paints the tables, chairs and open board that the game draws as DOM, so a
                         stage can be judged as a whole picture (design drafts; not used by the game)

Story: production/epics/shop-growth/story-001-shop-cross-section.md (layout), story-005 (interior stages).
The hall seen side-on in the warm browns of tools/art/scene_regular.py: the door on the left, the dining
floor across the whole width (tables and chairs are DOM, drawn over it), and the back wall with two windows
(Story 004 changes the view), the shop sign, a chalk menu and lanterns. The kitchen is not in this picture:
since the 2026-09-27 layout it is its own strip under the ticket rail (CSS .ss-kitchen: tiled wall, steel
counter, pots, wok).

Interior stages are cumulative (design/game-brief.md §인테리어 6단계, 2026-09-26):
  1 벽지        pink striped wallpaper and wainscot
  2 바닥        cream/pink checker floor
  3 조명        red lanterns → pink pendant lamps, pinker light
  4 문·포토존   pink awning and door, pink menu board, neon heart photo spot on the wall
  5 의자·식탁   white table tops, mint chairs
  6 주방        pink kitchen tiles (the CSS kitchen strip; nothing changes in this picture)

The stage is STAGE_W×STAGE_H art px and is always shown at that aspect ratio, so the layout constants below
are also the positions in src/js/self-serve/shop-stage.js and src/self-serve.css — keep the three in step.
Deterministic (fixed seed).
"""
import random
import sys
from pathlib import Path

from pixel_scene import Canvas, mix

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'src/img/scene-shop.png'

# Hall-only stage (layout 2026-09-27): the kitchen moved out to its own strip under the ticket rail (CSS
# .ss-kitchen), so the dining room now spans the whole width and the stage is a little shorter.
STAGE_W, STAGE_H = 320, 120
FLOOR_Y = 92  # wall meets floor
BEAM_H = 5
DOOR = (6, 30)  # x span; the door's bottom is FLOOR_Y
DINING = (34, 316)  # x span the tables are laid out in (CSS .shop-scene .seats, shop-stage.js)
LIGHT_XS = (106, 204, 306)
SEED = 20260926

INK = (40, 22, 16)
ROSE_INK = (122, 74, 92)  # the self-serve theme's --ink
CREAM = (255, 238, 206)
STEEL, STEEL_DARK, STEEL_LIGHT = (176, 182, 194), (112, 118, 132), (214, 220, 228)

BROWN = {  # stage 0: 마라판다 as the panda left it
    'wall': (244, 190, 122), 'wall_stripe': (234, 176, 106),
    'wood': (150, 84, 50), 'wood_dark': (98, 52, 32), 'wood_light': (184, 112, 66),
    'tile_a': (168, 88, 40), 'tile_b': (204, 130, 72), 'grout': (130, 66, 34), 'floor_shade': INK,
    'ktile': (238, 232, 222), 'kgrout': (196, 188, 176),
    'lights': 'lantern', 'light': (255, 214, 150),
    'door': (132, 72, 44), 'awning': (200, 60, 50),
    'sign': '마라판다', 'sign_edge': (200, 60, 50), 'sign_bg': (112, 44, 30), 'sign_text': CREAM, 'sign_halo': (255, 170, 120),
    'menu_bg': (44, 56, 48), 'menu_text': (240, 236, 220), 'menu_dots': (246, 200, 90),
    'table': (201, 138, 82), 'table_leg': (138, 82, 48), 'chair': (122, 68, 40), 'furniture_edge': INK,
    'photo_spot': False, 'hood_trim': STEEL_DARK, 'hood': STEEL, 'cabinet': STEEL,
}
RENAMED_SIGN = {
    'sign': '마라부자', 'sign_edge': (255, 127, 160), 'sign_bg': (122, 58, 84), 'sign_text': (255, 240, 246), 'sign_halo': (255, 120, 170),
}
MOCKUP_TABLES = 3  # tables drawn in --mockup (the game draws 2-4 as DOM, from the seat upgrade)
STAGE_CHANGES = (
    {},
    {  # 1 벽지
        'wall': (255, 218, 228), 'wall_stripe': (250, 202, 216),
        'wood': (236, 164, 186), 'wood_dark': (176, 104, 128), 'wood_light': (250, 196, 212),
    },
    {  # 2 바닥
        'tile_a': (250, 226, 230), 'tile_b': (240, 184, 200), 'grout': (214, 152, 172), 'floor_shade': ROSE_INK,
    },
    {'lights': 'pendant', 'light': (255, 196, 216)},  # 3 조명
    {  # 4 문·포토존
        'door': (240, 150, 176), 'awning': (255, 127, 160), 'photo_spot': True,
        'menu_bg': (255, 246, 240), 'menu_text': ROSE_INK, 'menu_dots': (255, 127, 160),
    },
    {'table': (255, 246, 240), 'table_leg': (236, 150, 176), 'chair': (143, 217, 182), 'furniture_edge': ROSE_INK},  # 5 의자·식탁
    {'ktile': (255, 238, 242), 'kgrout': (238, 200, 212), 'hood_trim': (236, 150, 176), 'hood': (250, 200, 214), 'cabinet': (250, 214, 224)},  # 6 주방
)


def theme(stage, renamed=False):
    """Palette for an interior stage: stage 0 plus every change up to `stage` (and the new sign if renamed)."""
    t = dict(BROWN, **(RENAMED_SIGN if renamed else {}))
    for change in STAGE_CHANGES[1:stage + 1]:
        t.update(change)
    return t


class Painter:
    def __init__(self, stage, renamed=False):
        self.t = theme(stage, renamed)
        self.rng = random.Random(SEED)
        self.cv = Canvas(STAGE_W, STAGE_H)
        self.glow, self.rect = self.cv.glow, self.cv.rect

    def wall(self):
        t, rect = self.t, self.rect
        for y in range(FLOOR_Y):
            for x in range(STAGE_W):
                self.cv.px[x, y] = t['wall_stripe'] if x % 8 in (0, 1) else t['wall']
        rect(0, 0, STAGE_W, BEAM_H, t['wood_dark'])  # ceiling beam
        rect(0, BEAM_H, STAGE_W, BEAM_H + 1, INK)
        rect(0, FLOOR_Y - 14, STAGE_W, FLOOR_Y, t['wood'])  # wainscot along the wall
        rect(0, FLOOR_Y - 14, STAGE_W, FLOOR_Y - 12, t['wood_light'])
        for x in range(0, STAGE_W, 12):
            rect(x, FLOOR_Y - 12, x + 1, FLOOR_Y, t['wood_dark'])

    def floor(self):
        t = self.t
        for y in range(FLOOR_Y, STAGE_H):
            row = y - FLOOR_Y
            for x in range(STAGE_W):
                tile = (x // 12 + row // 6) % 2
                c = t['grout'] if row % 6 == 5 or x % 12 == 11 else (t['tile_a'] if tile else t['tile_b'])
                self.cv.px[x, y] = mix(c, t['floor_shade'], min(0.3, row / 120))
        self.rect(0, FLOOR_Y, STAGE_W, FLOOR_Y + 1, t['wood_dark'])

    def door(self):
        t, rect = self.t, self.rect
        x0, x1 = DOOR
        top = 40
        rect(x0 - 2, top - 2, x1 + 2, FLOOR_Y, t['wood_dark'])  # frame
        rect(x0, top, x1, FLOOR_Y, t['door'])
        rect(x0 + 3, top + 4, x1 - 3, top + 30, (180, 214, 230))  # glass
        for y in range(top + 4, top + 30):
            for x in range(x0 + 3, x1 - 3):
                if (x - y) % 11 < 2:
                    self.glow(x, y, (255, 255, 255), 0.35)
        rect(x0 + 3, top + 34, x1 - 3, top + 36, t['wood_dark'])  # kick rail
        rect(x1 - 6, top + 40, x1 - 4, top + 46, (250, 210, 110))  # handle
        rect(x0 - 4, top - 6, x1 + 4, top - 2, t['awning'])  # little awning over the door

    def window(self, x0=42, x1=96):
        """Back-wall window; Story 004 swaps this view for the time of day."""
        t, rect = self.t, self.rect
        y0, y1 = 22, 66
        rect(x0 - 3, y0 - 3, x1 + 3, y1 + 3, t['wood_dark'])
        for y in range(y0, y1):
            rect(x0, y, x1, y + 1, mix((132, 190, 236), (208, 230, 248), (y - y0) / (y1 - y0)))
        x = x0
        while x < x1:
            w, top = self.rng.randrange(7, 13), self.rng.randrange(y0 + 14, y0 + 30)
            rect(x, top, min(x + w, x1), y1, (156, 172, 198))
            x += w + 1
        rect((x0 + x1) // 2, y0, (x0 + x1) // 2 + 2, y1, t['wood_dark'])
        rect(x0, (y0 + y1) // 2, x1, (y0 + y1) // 2 + 2, t['wood_dark'])
        rect(x0 - 5, y1 + 3, x1 + 5, y1 + 5, t['wood_light'])  # sill

    def window_right(self):
        """A second window where the kitchen used to be (the hall now spans the whole wall)."""
        self.window(236, 290)

    def signboard(self):
        t, rect = self.t, self.rect
        x0, y0, x1, y1 = 112, 10, 196, 30
        if t['sign'] == RENAMED_SIGN['sign']:  # neon: a soft halo around the whole board
            for y in range(y0 - 7, y1 + 7):
                for x in range(x0 - 8, x1 + 8):
                    self.glow(x, y, t['sign_halo'], 0.12)
        rect(x0 - 2, y0 - 2, x1 + 2, y1 + 2, t['sign_edge'])
        rect(x0, y0, x1, y1, t['sign_bg'])
        self.cv.sign_text(t['sign'], (x0 + x1) // 2, (y0 + y1) // 2, t['sign_text'], t['sign_halo'], size=13)

    def menu_board(self):
        t, rect = self.t, self.rect
        x0, y0, x1, y1 = 150, 38, 196, 76
        rect(x0 - 2, y0 - 2, x1 + 2, y1 + 2, t['wood_dark'])
        rect(x0, y0, x1, y1, t['menu_bg'])
        for i, (name, dots) in enumerate((('마라탕', 4), ('샹궈', 3), ('꿔바로우', 2))):
            cy = y0 + 7 + i * 12
            self.cv.sign_text(name, x0 + 16, cy, t['menu_text'], None, size=8)
            for d in range(dots):
                rect(x1 - 4 - d * 3, cy, x1 - 3 - d * 3, cy + 1, t['menu_dots'])

    def lights(self):
        for cx in LIGHT_XS:
            if self.t['lights'] == 'lantern':
                self.cv.lantern(cx, BEAM_H + 1, cord=6)
            else:
                self.pendant(cx)

    def pendant(self, cx):
        """Pink dome pendant lamp with a warm bulb (interior stage 2+)."""
        rect, glow = self.rect, self.glow
        top = BEAM_H + 1
        rect(cx, top, cx + 1, top + 8, ROSE_INK)  # cord
        for i, y in enumerate(range(top + 8, top + 16)):  # dome widening downwards
            half = 2 + i
            rect(cx - half, y, cx + 1 + half, y + 1, (255, 150, 182) if i < 6 else (236, 110, 150))
        rect(cx - 1, top + 16, cx + 2, top + 18, (255, 236, 170))  # bulb
        for y in range(top + 14, top + 34):
            for x in range(cx - 16, cx + 18):
                d = ((x - cx - 0.5) / 16) ** 2 + ((y - top - 16) / 18) ** 2
                if d < 1:
                    glow(x, y, (255, 214, 226), 0.22 * (1 - d))

    def light_pool(self):
        for cx in LIGHT_XS:
            for y in range(FLOOR_Y, STAGE_H):
                for x in range(cx - 40, cx + 42):
                    d = ((x - cx) / 40) ** 2 + ((y - FLOOR_Y - 12) / 14) ** 2
                    if d < 1:
                        self.glow(x, y, self.t['light'], 0.14 * (1 - d))

    def photo_spot(self):
        """Stage 4: a pink neon heart on the wall under the open board — the shop's photo spot."""
        cx, cy = 216, 54  # between the menu board and the right window
        for y in range(cy - 14, cy + 14):
            for x in range(cx - 18, cx + 18):
                self.glow(x, y, (255, 150, 190), 0.10)
        heart = ('.XX...XX.', 'XXXX.XXXX', 'XXXXXXXXX', '.XXXXXXX.', '..XXXXX..', '...XXX...', '....X....')
        for row, line in enumerate(heart):
            for col, ch in enumerate(line):
                if ch == 'X':
                    self.rect(cx - 9 + col * 2, cy - 7 + row * 2, cx - 7 + col * 2, cy - 5 + row * 2, (255, 110, 160))

    # ---- mockup only: what the game draws as DOM over the background ----

    def furniture(self):
        t, rect = self.t, self.rect
        n = MOCKUP_TABLES
        cell = (DINING[1] - DINING[0]) / n
        edge = t['furniture_edge']
        for i in range(n):
            cx = int(DINING[0] + cell * (i + 0.5))
            base = STAGE_H - 8
            rect(cx - 10, base - 36, cx - 7, base, t['chair'])  # chair back
            rect(cx - 10, base - 14, cx, base - 11, t['chair'])  # chair seat
            rect(cx - 15, base - 22, cx + 16, base - 19, t['table'])  # table top
            rect(cx - 15, base - 19, cx + 16, base - 18, edge)
            rect(cx - 1, base - 18, cx + 3, base, t['table_leg'])
            rect(cx - 6, base - 23, cx + 6, base - 22, (255, 255, 255))  # a bowl on every table
            rect(cx - 4, base - 25, cx + 4, base - 23, (214, 80, 50))

    def open_board(self):
        rect = self.rect
        x0, y0, x1, y1 = 102, 42, 144, 58
        rect(x0, y0, x1, y1, ROSE_INK)
        rect(x0 + 1, y0 + 1, x1 - 1, y1 - 1, (217, 68, 58))
        self.cv.sign_text('영업중', (x0 + x1) // 2, (y0 + y1) // 2, (255, 243, 214), None, size=8)


def build(stage=0, mockup=False, renamed=False):
    p = Painter(stage, renamed)
    steps = [p.wall, p.floor, p.door, p.window, p.window_right, p.signboard, p.menu_board, p.lights, p.light_pool]
    if p.t['photo_spot']:
        steps.append(p.photo_spot)
    if mockup:
        steps += [p.furniture, p.open_board]
    for step in steps:
        step()
    return p.cv


def arg(name, default):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default


if __name__ == '__main__':
    renamed = '--old-sign' not in sys.argv
    if '--all' in sys.argv:
        for n in range(len(STAGE_CHANGES)):
            build(n, False, renamed).save(OUT if n == 0 else OUT.with_name(f'scene-shop-{n}.png'), [])
    else:
        stage = int(arg('--stage', 0))
        build(stage, '--mockup' in sys.argv, renamed).save(Path(arg('--out', OUT)).resolve(), sys.argv)
