"""Pixel sprite of the panda owner of 마라판다: a towering, heavily built adult panda — gruff face, kind heart.

Run: python3 tools/art/panda_sprite.py [--preview path]  -> writes src/img/panda.png (transparent)

Mood: grown-up anthropomorphic proportions rather than chibi (small head, thick neck and traps, huge chest
and arms, a sturdy belly), a realistic panda face (white muzzle, big nose, short eye patches, half-lidded
eyes) and the real panda's black shoulder band running into the arms. Original design — no borrowed
character marks. Outfit: white tank top, red waist apron and bandana, towel over one shoulder.

Built from shaded shapes: each body part is an ellipse lit from the upper left (sphere shading quantised
to the material's tones) so muscles read as round masses; chosen overlaps (shoulder line, elbow, pecs)
get a dark seam. The silhouette gets a 1px ink outline, then details are drawn on top.
Size PANDA_W×PANDA_H: ~1.4× the protagonist's 112 rows.
design/game-brief.md Story (판다 사장님) · design/quick-specs/story-character-2026-09-25.md §B
"""
import math
from pathlib import Path

from pixel_scene import Canvas

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'src/img/panda.png'

PANDA_W, PANDA_H = 96, 160
CX = PANDA_W // 2
LIGHT = (-0.45, -0.6, 0.66)  # from the upper left, toward the viewer
INK = (26, 16, 20)
KEY = (255, 0, 255)  # drawn as background, made transparent on save; never used as a colour

# material -> tones from dark to light
TONES = {
    'fur_black': [(22, 18, 26), (40, 34, 44), (60, 54, 66), (92, 86, 100)],
    'fur_white': [(200, 196, 206), (226, 224, 230), (246, 244, 240), (255, 255, 252)],
    'tank': [(206, 208, 220), (230, 232, 238), (246, 246, 248), (255, 255, 255)],
    'apron': [(146, 34, 36), (186, 46, 44), (214, 62, 52), (236, 104, 88)],
    'band': [(146, 34, 36), (192, 48, 46), (222, 68, 56), (242, 114, 96)],
}
TONE_CUTS = {'fur_black': (0.02, 0.5, 0.86)}  # lighting thresholds between the four tones (per material)
DEFAULT_CUTS = (0.12, 0.45, 0.78)
SEAM = {'fur_black': (12, 8, 16), 'tank': (192, 194, 208)}
# only these overlaps draw a seam (shoulder line, elbow, pecs, belly); the rest blend into one mass
SEAM_PAIRS = {('delt', 'bicep'), ('bicep', 'fore'), ('pec', 'pec'), ('tank', 'pec'), ('belly', 'pec')}

W, H = PANDA_W, PANDA_H
mat = [[None] * W for _ in range(H)]  # material per pixel
lum = [[0.0] * W for _ in range(H)]  # lighting per pixel
part = [[None] * W for _ in range(H)]  # shape id per pixel
order = {}  # shape id -> draw order (later = in front)


def claim(pid, x, y, material, light):
    order.setdefault(pid, len(order))
    mat[y][x], part[y][x], lum[y][x] = material, pid, light


def ellipse(pid, cx, cy, rx, ry, material, tilt=0.0):
    """Fills an ellipse with sphere shading; later shapes cover earlier ones."""
    c, s = math.cos(tilt), math.sin(tilt)
    reach = int(max(rx, ry)) + 2
    for y in range(int(cy) - reach, int(cy) + reach + 1):
        for x in range(int(cx) - reach, int(cx) + reach + 1):
            if not (0 <= x < W and 0 <= y < H):
                continue
            dx, dy = x + 0.5 - cx, y + 0.5 - cy
            u, v = (dx * c + dy * s) / rx, (-dx * s + dy * c) / ry
            d = u * u + v * v
            if d <= 1:
                claim(pid, x, y, material, u * LIGHT[0] + v * LIGHT[1] + math.sqrt(1 - d) * LIGHT[2])


def poly(pid, pts, material):
    """Fills a polygon, lit flatter than an ellipse: brighter toward the left and the top."""
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    for y in range(int(y0), int(y1) + 1):
        for x in range(int(x0), int(x1) + 1):
            if 0 <= x < W and 0 <= y < H and inside(x + 0.5, y + 0.5, pts):
                claim(pid, x, y, material, 0.95 - 0.7 * (x - x0) / max(1, x1 - x0) - 0.25 * (y - y0) / max(1, y1 - y0))


def inside(x, y, pts):
    hit = False
    for (ax, ay), (bx, by) in zip(pts, pts[1:] + pts[:1]):
        if (ay > y) != (by > y) and x < ax + (bx - ax) * (y - ay) / (by - ay):
            hit = not hit
    return hit


def tone(material, light):
    return TONES[material][sum(light > cut for cut in TONE_CUTS.get(material, DEFAULT_CUTS))]


def body():
    """Back to front: legs, torso (tank, belly, pecs), apron, shoulder band and arms, ears, head, muzzle."""
    for side in (-1, 1):
        ellipse(f'leg{side}', CX + side * 12, 142, 12, 12, 'fur_black')
        ellipse(f'foot{side}', CX + side * 14, 153, 13, 5, 'fur_black')
    poly('tank', [(CX - 30, 54), (CX + 30, 54), (CX + 19, 126), (CX - 19, 126)], 'tank')
    ellipse('belly', CX, 106, 19, 17, 'tank')
    for side in (-1, 1):
        ellipse(f'pec{side}', CX + side * 12, 68, 13, 9, 'tank')
    poly('apron', [(CX - 21, 98), (CX + 21, 98), (CX + 24, 138), (CX - 24, 138)], 'apron')
    for side in (-1, 1):
        ellipse(f'trap{side}', CX + side * 15, 50, 17, 9, 'fur_black')
        ellipse(f'delt{side}', CX + side * 33, 60, 12, 11, 'fur_black')
        ellipse(f'bicep{side}', CX + side * 36, 78, 10.5, 14, 'fur_black', tilt=side * 0.1)
        ellipse(f'fore{side}', CX + side * 35, 100, 10, 13, 'fur_black', tilt=-side * 0.22)
        ellipse(f'paw{side}', CX + side * 32, 117, 8, 7, 'fur_black')
    for side in (-1, 1):
        ellipse(f'ear{side}', CX + side * 16, 12, 7, 7, 'fur_black')
    ellipse('head', CX, 30, 21, 19, 'fur_white')
    ellipse('muzzle', CX, 40, 11, 7.5, 'fur_white')


def kind(pid):
    return pid.rstrip('-1').rstrip('-') if pid else pid


def is_seam(x, y):
    """A pixel touching a same-material shape drawn in front of it, where that pair is a muscle line."""
    m, pid = mat[y][x], part[y][x]
    if m not in SEAM:
        return False
    for dx, dy in ((1, 0), (0, 1), (-1, 0), (0, -1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < W and 0 <= ny < H and mat[ny][nx] == m and part[ny][nx] != pid \
                and order[part[ny][nx]] > order[pid] and (kind(pid), kind(part[ny][nx])) in SEAM_PAIRS:
            return True
    return False


def is_edge(x, y):
    return any(not (0 <= x + dx < W and 0 <= y + dy < H) or mat[y + dy][x + dx] is None
               for dx, dy in ((1, 0), (0, 1), (-1, 0), (0, -1)))


def paint(cv):
    for y in range(H):
        for x in range(W):
            if mat[y][x] is not None:
                cv.put(x, y, SEAM[mat[y][x]] if is_seam(x, y) else tone(mat[y][x], lum[y][x]))
    for y in range(H):  # silhouette outline
        for x in range(W):
            if mat[y][x] is not None and is_edge(x, y):
                cv.put(x, y, INK)
    for x in range(CX - 10, CX + 11):  # soft shadow under the muzzle
        for y in (47, 48):
            if part[y][x] == 'head' and not is_edge(x, y):
                cv.put(x, y, TONES['fur_white'][0])


def eye_patch(cv, ex, ey, tilt):
    k = TONES['fur_black']
    c, s = math.cos(tilt), math.sin(tilt)
    for y in range(ey - 9, ey + 10):
        for x in range(ex - 9, ex + 10):
            dx, dy = x + 0.5 - ex, y + 0.5 - ey
            u, v = (dx * c + dy * s) / 5.5, (-dx * s + dy * c) / 7
            if u * u + v * v <= 1:
                cv.put(x, y, k[1] if (u < 0 and v < -0.3) else k[0])


# half-lidded eye: heavy lid line on top, dark iris, one glint — gruff but not mean
EYE = ('LLLL', 'wiiw', '.iS.')
EYE_COLS = {'L': (12, 8, 14), 'w': (214, 208, 196), 'i': (70, 44, 34), 'S': (255, 255, 255)}
NOSE = ('.#######.', '#########', '.#######.', '..#####..', '....#....')


def face(cv):
    for side in (-1, 1):
        ex, ey = CX + side * 9, 28
        eye_patch(cv, ex, ey, -side * 0.55)  # outer end droops
        for dy, row in enumerate(EYE):
            for dx, ch in enumerate(row):
                if ch != '.':
                    cv.put(ex - 2 + dx + (1 if side > 0 else 0), ey - 1 + dy, EYE_COLS[ch])
        for dx, dy in ((1, -4), (2, -5), (3, -5)):  # brow ridge, low and heavy
            cv.put(ex + side * dx, ey + dy, INK)
    for dy, row in enumerate(NOSE):
        for dx, ch in enumerate(row):
            if ch == '#':
                cv.put(CX - 4 + dx, 34 + dy, INK)
    cv.rect(CX - 3, 34, CX - 1, 35, (96, 90, 104))  # nose shine
    cv.rect(CX, 39, CX + 1, 42, INK)  # philtrum
    for dx in range(-5, 6):  # firm mouth, corners just turning up
        cv.put(CX + dx, 42 - (abs(dx) >= 5), INK)
    for side in (-1, 1):
        for bx in range(CX + side * 13 - 2, CX + side * 13 + 3):
            cv.glow(bx, 38, (240, 160, 160), 0.35)


def outfit_details(cv):
    t, a = TONES['tank'], TONES['apron']
    for x in range(CX - 14, CX + 15, 7):  # tank rib at the neckline
        cv.put(x, 55, t[1])
    for side in (-1, 1):  # apron straps up over the pecs
        sx = CX + side * 15
        cv.rect(sx - 1, 54, sx + 2, 99, a[1])
        cv.rect(sx + (1 if side < 0 else -1), 54, sx + (2 if side < 0 else 0), 99, a[0])
    cv.rect(CX - 9, 110, CX + 10, 121, a[1])  # pocket
    cv.rect(CX - 8, 111, CX + 9, 112, a[0])
    cv.rect(CX - 24, 136, CX + 25, 138, a[0])  # hem


def headband(cv):
    """Red bandana across the forehead, knot and tails on the right."""
    for y in range(13, 19):
        for x in range(W):
            if part[y][x] == 'head' and not is_edge(x, y):
                cv.put(x, y, TONES['band'][1] if y in (13, 18) else tone('band', 0.95 - (x - 27) / 50))
    for x, y0, y1 in ((68, 15, 23), (69, 16, 25), (70, 16, 26), (71, 17, 25), (72, 18, 23)):
        for y in range(y0, y1):
            cv.put(x, y, TONES['band'][2] if y < y0 + 3 else TONES['band'][1])
        cv.put(x, y1, INK)
    cv.rect(65, 14, 69, 19, TONES['band'][0])  # knot


def towel(cv):
    """Towel slung over the shoulder on the viewer's left, blue stripes."""
    for y in range(52, 84):
        lean = (y - 52) * 0.12
        for x in range(6, 26):
            if abs(x + 0.5 - (16 - lean)) < 5:
                stripe = (y // 3) % 4 == 0
                cv.put(x, y, (120, 176, 220) if stripe else ((246, 246, 248) if x < 15 - lean else (218, 220, 230)))
        cv.put(int(10.5 - lean), y, INK)
        cv.put(int(21.5 - lean), y, INK)
    cv.rect(7, 84, 18, 85, INK)


def build():
    body()
    cv = Canvas(W, H)
    cv.rect(0, 0, W, H, KEY)
    paint(cv)
    outfit_details(cv)
    face(cv)
    headband(cv)
    towel(cv)
    rgba = cv.img.convert('RGBA')
    rgba.putdata([(0, 0, 0, 0) if p[:3] == KEY else p for p in rgba.get_flattened_data()])
    cv.img, cv.px = rgba, rgba.load()
    return cv


if __name__ == '__main__':
    build().save(OUT)
