"""Rebuilds src/fonts/noto-emoji-subset.ttf — Noto Color Emoji cut down to the emoji the game uses.

Why: sprites.js pixelates emoji glyphs at runtime. Without a bundled font the player's own
emoji font is used (Apple / Segoe / Noto), so animals and ingredients look different per
device. The subset pins every device to Noto (SIL OFL 1.1) at a few hundred KB.

Run after adding a new emoji anywhere under src/:
    pip install fonttools
    python3 tools/fonts/build_emoji_subset.py [path/to/NotoColorEmoji.ttf]

The source font defaults to the Debian/Ubuntu `fonts-noto-color-emoji` package path; the
CBDT (bitmap) build is used because Chromium — and so Electron — renders it everywhere.
"""
import pathlib
import sys

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC_DIR = ROOT / 'src'
OUT = SRC_DIR / 'fonts' / 'noto-emoji-subset.ttf'
DEFAULT_FONT = '/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf'
TEXT_EXT = {'.js', '.html', '.css', '.json'}
ZWJ, VS16 = 0x200D, 0xFE0F


def is_candidate(cp):
    """Non-ASCII, non-Hangul code points — the font's cmap decides what is an emoji."""
    return cp > 0x7F and not (0xAC00 <= cp <= 0xD7A3) and not (0x3130 <= cp <= 0x318F)


def main():
    font_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_FONT
    cmap = TTFont(font_path).getBestCmap()
    used = set()
    for path in SRC_DIR.rglob('*'):
        if path.suffix not in TEXT_EXT:
            continue
        for ch in path.read_text(encoding='utf-8'):
            cp = ord(ch)
            if is_candidate(cp) and (cp in cmap or cp in (ZWJ, VS16)):
                used.add(cp)

    options = subset.Options()
    options.layout_features = ['*']  # keep ZWJ / VS16 ligatures for multi-codepoint emoji
    options.name_IDs = ['*']
    options.notdef_outline = True
    font = TTFont(font_path)
    sub = subset.Subsetter(options)
    sub.populate(unicodes=used)
    sub.subset(font)
    font.save(OUT)
    print(f'{len(used)} code points -> {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB)')
    print(''.join(chr(c) for c in sorted(used)))


if __name__ == '__main__':
    main()
