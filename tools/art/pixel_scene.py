"""Shared drawing kit for the opening-scene backgrounds (tools/art/scene_*.py).

A Canvas wraps one RGB image and gives the few primitives the scenes are built from: clipped pixels and
rectangles, alpha-style glow, pixel-crisp Hangul signs and a red Chinese lantern. Scenes stay deterministic
because randomness lives in each scene (its own seeded rng), never here.
design/quick-specs/story-character-2026-09-25.md §B
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
SIGN_FONT = ('/System/Library/Fonts/AppleSDGothicNeo.ttc', 6)  # macOS Apple SD Gothic Neo Bold
HALO_NEIGHBOURS = ((-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (1, 1), (-1, 1), (1, -1))


def mix(a, b, t):
    return tuple(round(p + (q - p) * t) for p, q in zip(a, b))


class Canvas:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.img = Image.new('RGB', (w, h))
        self.px = self.img.load()

    def inside(self, x, y):
        return 0 <= x < self.w and 0 <= y < self.h

    def put(self, x, y, c):
        if self.inside(x, y):
            self.px[x, y] = c

    def glow(self, x, y, c, t):
        """Blends colour c over the pixel by t (0..1)."""
        if self.inside(x, y):
            self.px[x, y] = mix(self.px[x, y], c, max(0.0, min(1.0, t)))

    def rect(self, x0, y0, x1, y1, c):
        for y in range(max(0, y0), min(self.h, y1)):
            for x in range(max(0, x0), min(self.w, x1)):
                self.px[x, y] = c

    def sign_text(self, s, cx, cy, c, halo, size=16):
        """Pixel-crisp Hangul (no anti-aliasing) centred on (cx, cy), with a 1px halo (None = no halo)."""
        path, index = SIGN_FONT
        try:
            font = ImageFont.truetype(path, size, index=index)
        except OSError as err:
            raise SystemExit(f'sign font not found ({path}): {err}')
        mask = Image.new('1', (self.w, self.h), 0)
        draw = ImageDraw.Draw(mask)
        draw.fontmode = '1'
        l, t, r, b = draw.textbbox((0, 0), s, font=font)
        draw.text((cx - (r - l) // 2 - l, cy - (b - t) // 2 - t), s, font=font, fill=1)
        m = mask.load()
        on = [(x, y) for y in range(self.h) for x in range(self.w) if m[x, y]]
        if halo:
            for x, y in on:
                for dx, dy in HALO_NEIGHBOURS:
                    if self.inside(x + dx, y + dy) and not m[x + dx, y + dy]:
                        self.glow(x + dx, y + dy, halo, 0.55)
        for x, y in on:
            self.put(x, y, c)

    def lantern(self, cx, top, cord=3):
        """Red Chinese lantern whose cord starts at `top` and is `cord` px long."""
        body = top + cord - 3
        self.rect(cx, top, cx + 1, body + 3, (60, 30, 40))
        for y in range(body + 3, body + 14):
            for x in range(cx - 5, cx + 7):
                if ((x + 0.5 - cx - 0.5) / 5.5) ** 2 + ((y + 0.5 - body - 8.5) / 5.5) ** 2 <= 1:
                    self.put(x, y, (246, 96, 96) if x < cx else (214, 54, 70))
        self.rect(cx - 3, body + 3, cx + 5, body + 4, (250, 200, 90))
        self.rect(cx - 3, body + 13, cx + 5, body + 14, (250, 200, 90))
        self.rect(cx, body + 14, cx + 2, body + 18, (250, 200, 90))
        for y in range(body + 1, body + 18):
            for x in range(cx - 9, cx + 11):
                self.glow(x, y, (255, 120, 120), 0.06)

    def save(self, out, argv=None):
        """Writes the PNG; `--preview [path]` in argv also writes a ×3 nearest-neighbour preview."""
        argv = sys.argv if argv is None else argv
        out.parent.mkdir(parents=True, exist_ok=True)
        self.img.save(out)
        print('wrote', out.relative_to(ROOT))
        if '--preview' in argv:
            i = argv.index('--preview')
            path = argv[i + 1] if len(argv) > i + 1 else f'/tmp/{out.stem}.png'
            self.img.resize((self.w * 3, self.h * 3), Image.NEAREST).save(path)
            print('preview ->', path)
