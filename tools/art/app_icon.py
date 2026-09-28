"""App icon: a simplified bowl of malatang on a pink tile (approved 2026-09-29, draft ① of the bowl round).

Run: python3 tools/art/app_icon.py
  -> assets/app-icon/icon.png (1024), icon.icns (macOS), icon.ico (Windows) — electron-builder's buildResources
  -> src/img/favicon.png (64) — linked from src/self-serve.html

Drawn on a 64×64 pixel grid and scaled ×12 with nearest-neighbour onto a smooth rounded tile, so it matches the
game's pixel art and still reads at 16–32 px: bold ink outline, few colours, white bowl with the game's pink band,
red mala broth with chili oil, and malatang toppings — corn noodles, a tofu-skin roll, wood ear, bok choy,
dried chili and Sichuan pepper — under three wisps of steam. Deterministic.
"""
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
ICON_DIR = ROOT / 'assets/app-icon'
FAVICON = ROOT / 'src/img/favicon.png'

GRID = 64
SIZE = 1024
ART = 768  # 64 grid × 12
TILE_MARGIN = 0.098  # macOS icon grid: the tile leaves ~10% transparent margin
TILE_RADIUS = 0.22
ICO_SIZES = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
FAVICON_SIZE = 64

INK = (58, 30, 44, 255)
WHITE = (255, 250, 244, 255)
SHADE = (236, 226, 218, 255)
PINK = (255, 127, 160, 255)
TILE = (255, 158, 192, 255)
BROTH = (214, 48, 38, 255)
OIL = (255, 106, 61, 255)
OIL_HI = (255, 150, 110, 255)
GREEN = (92, 176, 72, 255)
GREEN_HI = (150, 210, 96, 255)
STEM = (236, 244, 214, 255)
FUZHU = (232, 178, 96, 255)
FUZHU_LINE = (196, 136, 64, 255)
EAR = (52, 36, 40, 255)
EAR_HI = (96, 72, 78, 255)
NOODLE = (255, 226, 140, 255)
NOODLE_SHADE = (236, 196, 96, 255)
CHILI = (190, 30, 30, 255)
CHILI_HI = (240, 70, 50, 255)
PEPPER = (120, 40, 30, 255)
STEAM = (255, 255, 255, 235)


def draw_bowl(im, d):
    """White bowl with the pink band, its foot, and the broth surface with chili oil."""
    d.pieslice([6, 16, 57, 58], 0, 180, fill=INK)
    d.pieslice([8, 18, 55, 56], 0, 180, fill=WHITE)
    d.pieslice([8, 18, 55, 56], 0, 40, fill=SHADE)
    band = Image.new('L', (GRID, GRID), 0)
    ImageDraw.Draw(band).rectangle([0, 44, GRID, 46], fill=255)
    inner = Image.new('L', (GRID, GRID), 0)
    ImageDraw.Draw(inner).pieslice([8, 18, 55, 56], 0, 180, fill=255)
    im.paste(PINK, (0, 0), ImageChops.multiply(band, inner))
    d.rectangle([22, 55, 41, 58], fill=INK)
    d.rectangle([24, 55, 39, 56], fill=SHADE)
    d.ellipse([5, 28, 58, 42], fill=INK)
    d.ellipse([7, 29, 56, 40], fill=BROTH)
    d.ellipse([9, 30, 30, 34], fill=OIL)
    d.ellipse([11, 31, 19, 33], fill=OIL_HI)


def draw_toppings(d):
    """Corn noodles, tofu-skin roll, wood ear, bok choy, dried chili and Sichuan pepper."""
    for k, y in enumerate((33, 35, 37)):
        for x in range(12, 26):
            d.point((x, y + (1 if (x + k) % 4 < 2 else 0)), fill=NOODLE if (x + k) % 3 else NOODLE_SHADE)
    d.polygon([(14, 31), (24, 24), (27, 27), (17, 34)], fill=INK)
    d.polygon([(15, 31), (24, 25), (26, 27), (17, 33)], fill=FUZHU)
    d.line([(17, 31), (24, 26)], fill=FUZHU_LINE)
    d.ellipse([26, 30, 34, 36], fill=INK)
    d.ellipse([27, 31, 33, 35], fill=EAR)
    d.point((29, 32), fill=EAR_HI)
    d.point((31, 33), fill=EAR_HI)
    d.polygon([(36, 35), (40, 22), (45, 20), (44, 34)], fill=INK)
    d.polygon([(37, 34), (40, 23), (44, 21), (43, 34)], fill=GREEN)
    d.line([(39, 33), (43, 23)], fill=GREEN_HI)
    d.polygon([(39, 36), (41, 29), (43, 29), (42, 36)], fill=STEM)
    d.ellipse([46, 31, 52, 35], fill=INK)
    d.ellipse([47, 32, 51, 34], fill=CHILI_HI)
    d.point((47, 33), fill=CHILI)
    d.ellipse([33, 36, 37, 39], fill=INK)
    d.point((35, 37), fill=CHILI_HI)
    for p in ((22, 37), (45, 37), (50, 36), (30, 38)):
        d.point(p, fill=PEPPER)


def draw_steam(d):
    """Three wavy wisps above the bowl."""
    wiggle = [0, 1, 1, 0, -1, -1, 0]
    for x0 in (20, 31, 42):
        for i, y in enumerate(range(4, 18, 2)):
            x = x0 + wiggle[i]
            d.rectangle([x, y, x + 1, y + 1], fill=STEAM)


def bowl_art():
    """The 64×64 pixel bowl."""
    im = Image.new('RGBA', (GRID, GRID), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    draw_bowl(im, d)
    draw_toppings(d)
    draw_steam(d)
    return im


def app_icon():
    """1024×1024 icon: rounded pink tile with an ink border, the bowl scaled ×12 in the middle."""
    im = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    m = int(SIZE * TILE_MARGIN)
    ImageDraw.Draw(im).rounded_rectangle(
        [m, m, SIZE - m, SIZE - m], radius=int(SIZE * TILE_RADIUS), fill=TILE, outline=INK, width=24)
    art = bowl_art().resize((ART, ART), Image.NEAREST)
    im.alpha_composite(art, ((SIZE - ART) // 2, (SIZE - ART) // 2 + 20))
    return im


if __name__ == '__main__':
    ICON_DIR.mkdir(parents=True, exist_ok=True)
    icon = app_icon()
    icon.save(ICON_DIR / 'icon.png')
    icon.save(ICON_DIR / 'icon.icns')
    icon.save(ICON_DIR / 'icon.ico', sizes=ICO_SIZES)
    icon.resize((FAVICON_SIZE, FAVICON_SIZE), Image.LANCZOS).save(FAVICON)
    print(f'app icon -> {ICON_DIR} (png, icns, ico), favicon -> {FAVICON}')
