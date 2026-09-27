"""Restore the approved red-apron panda sprite without redrawing its design.

Run: python3 tools/art/panda_sprite.py
Source: design/panda-owner-concepts/ready/panda-A-96x160.png
96×160 RGBA, 22 colors, binary alpha; approved on 2026-09-28.
"""
from pathlib import Path
from shutil import copyfile

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'design/panda-owner-concepts/ready/panda-A-96x160.png'
OUT = ROOT / 'src/img/panda.png'

if __name__ == '__main__':
    copyfile(SOURCE, OUT)
    print(f'Restored approved panda sprite: {OUT}')
