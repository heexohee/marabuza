"""Pixel-art mouse cursors for the self-serve flow (design/quick-specs/playtest-2026-09-27.md #8).

Writes src/img/cursor.png (pink arrow, hotspot 1,1), used everywhere — clickables too (no paw cursor,
feedback 2026-09-27). Drawn at 16×16, saved ×2 = 32×32 so it stays crisp on HiDPI screens.
Hotspots in the CSS are in saved (×2) pixels.

    python3 tools/art/cursors.py
"""
from pathlib import Path

from PIL import Image

SCALE = 2
OUT = Path(__file__).resolve().parents[2] / "src" / "img"

PALETTE = {
    ".": None,
    "o": (58, 31, 20, 255),     # outline — the game's dark brown (#3a1f14)
    "p": (255, 143, 177, 255),  # pink fill
    "l": (255, 204, 221, 255),  # light pink highlight
    "w": (255, 255, 255, 255),  # white
}

ARROW = [
    "o...............",
    "oo..............",
    "olo.............",
    "olpo............",
    "olppo...........",
    "olpppo..........",
    "olppppo.........",
    "olpppppo........",
    "olppppppo.......",
    "olpppppppo......",
    "olppppoooo......",
    "olppopo.........",
    "olpo.opo........",
    "oo...opo........",
    "o.....oo........",
    "................",
]


def draw(rows: list[str]) -> Image.Image:
    """Renders a character map to an RGBA image, scaled by SCALE with nearest-neighbour."""
    img = Image.new("RGBA", (len(rows[0]), len(rows)), (0, 0, 0, 0))
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            color = PALETTE[ch]
            if color:
                img.putpixel((x, y), color)
    return img.resize((img.width * SCALE, img.height * SCALE), Image.NEAREST)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    draw(ARROW).save(OUT / "cursor.png")
    print(f"wrote {OUT / 'cursor.png'}")


if __name__ == "__main__":
    main()
