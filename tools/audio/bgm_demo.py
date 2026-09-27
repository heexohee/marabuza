#!/usr/bin/env python3
"""마라부자 BGM demo generator -- casual-tycoon retro soundtrack.

Pure Python standard library (wave/struct/math/random), deterministic (fixed
seeds), 22050 Hz, 16-bit mono. Every melody here is newly composed for this
game; nothing is transcribed from or modelled on an existing tune.

One shared hook ties the set together -- a bouncy "E G . G A G E" figure in
C major. Every track quotes it at a different tempo, key, rhythm or instrument
so the soundtrack reads as one family.

Loops (seamless -- rendered into a circular buffer so tails and echoes wrap):
    bgm-title     "비 오는 밤"   104 BPM light swing, F major, 16 bars. Soft
                  lead, then pulse lead + music-box doubling on the second pass;
                  bouncing root/octave bass, music-box arpeggios, finger snaps
                  and shaker (kick joins on the second pass). No rain.
    bgm-business  "영업 중"      94 BPM, 16th-note swing R&B groove, C major,
                  24 bars (A B A). Syncopated pulse lead, rootless 7th chords on
                  an electric-piano voice, syncopated bass with chromatic
                  approach notes, kick / snare / ghost notes / swung 16th hats.
    bgm-shop      "쉬는 날"      100 BPM lazy swing, C major, 16 bars.
                  Music-box lead, pizzicato bass, soft stabs, shaker only.

Jingles (one-shot, not looped):
    jingle-day-end   ~2.5 s  하루 마감 -- hook quote into a bright C chord
    jingle-ending    ~10 s   1부 엔딩 -- the hook, slow, with a big cadence
    jingle-closed    ~6.5 s  폐업 -- the hook turned to A minor, falling

Run from the repo root:
    python3 tools/audio/bgm_demo.py

Outputs WAV + AAC .m4a (macOS `afconvert`) in production/qa/audio-demos/.
"""

import math
import os
import random
import shutil
import struct
import subprocess
import sys
import wave

SR = 22050
TWO_PI = 2.0 * math.pi
PEAK_TARGET = 10 ** (-1.0 / 20.0)  # -1 dBFS
EIGHTHS_PER_BAR = 8
JINGLE_TAIL_S = 1.8

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT_DIR = os.path.join(ROOT_DIR, "production", "qa", "audio-demos")

NOTE_PC = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}

CHORD_TONES = {
    "C": ("C", "E", "G"), "Dm": ("D", "F", "A"), "Em": ("E", "G", "B"),
    "F": ("F", "A", "C"), "G": ("G", "B", "D"), "Am": ("A", "C", "E"),
    "Gm": ("G", "Bb", "D"), "Bb": ("Bb", "D", "F"), "E": ("E", "G#", "B"),
    "Cmaj7": ("C", "E", "G", "B"), "Dm7": ("D", "F", "A", "C"),
    "Em7": ("E", "G", "B", "D"), "Fmaj7": ("F", "A", "C", "E"),
    "G7": ("G", "B", "D", "F"), "Am7": ("A", "C", "E", "G"),
}


# --------------------------------------------------------------------------
# Notes, bars, chords
# --------------------------------------------------------------------------

def note_to_midi(name):
    """'C5' -> 72, 'F#3' -> 54, 'Bb4' -> 70."""
    pc = NOTE_PC[name[0]]
    rest = name[1:]
    if rest.startswith("#"):
        pc += 1
        rest = rest[1:]
    elif rest.startswith("b"):
        pc -= 1
        rest = rest[1:]
    return 12 * (int(rest) + 1) + pc


def pitch_class(name):
    return note_to_midi(name + "4") % 12


def midi_to_hz(m):
    return 440.0 * 2.0 ** ((m - 69) / 12.0)


def parse_bar(text, bar_len=EIGHTHS_PER_BAR):
    """Parse 'E5:1 ^G5:2 r:1' into [(start8, len8, midi, slide)].

    `bar_len=None` skips the length check (jingles are one free-length line).
    """
    events = []
    pos = 0.0
    for tok in text.split():
        name, length = tok.split(":")
        length = float(length)
        slide = name.startswith("^")
        name = name.lstrip("^")
        if name != "r":
            events.append((pos, length, note_to_midi(name), slide))
        pos += length
    if bar_len is not None and abs(pos - bar_len) > 1e-9:
        raise ValueError("bar does not sum to %s eighths: %r (%s)" % (bar_len, text, pos))
    return events


def chord_voicing(symbol, center, rootless=False):
    """Chord tones placed in the octave window [center-6, center+6).

    `rootless` drops the root (the bass has it) -- the usual voicing for 7ths.
    """
    notes = []
    tones = CHORD_TONES[symbol][1:] if rootless else CHORD_TONES[symbol]
    for name in tones:
        m = center - ((center - pitch_class(name)) % 12)
        if center - m > 6:
            m += 12
        notes.append(m)
    return sorted(notes)


def chord_root(symbol, low=40):
    """Chord root in [low, low+12) -- default E2..D#3 for bass."""
    return low + ((pitch_class(CHORD_TONES[symbol][0]) - low) % 12)


def bar_halves(bar_text):
    """'Dm G' -> ['Dm', 'G'];  'C' -> ['C', 'C']."""
    parts = bar_text.split()
    return parts if len(parts) == 2 else [parts[0], parts[0]]


def warp(pos8, e8, swing, unit=1.0):
    """Eighth position -> seconds, delaying off-beat notes of the `unit` grid
    (1.0 = eighths, 0.5 = sixteenths) by `swing` * unit eighths."""
    within = pos8 % (2.0 * unit)
    shift = swing * (within if within <= unit else 2.0 * unit - within)
    return (pos8 + shift) * e8


# --------------------------------------------------------------------------
# Synthesis
# --------------------------------------------------------------------------

def osc(wave_name, frac):
    """One sample of a roughly zero-mean waveform at phase fraction 0..1."""
    if wave_name == "pulse50":
        return 1.0 if frac < 0.5 else -1.0
    if wave_name == "pulse25":
        return 1.0 if frac < 0.25 else -1.0 / 3.0
    if wave_name == "tri":
        return 4.0 * frac - 1.0 if frac < 0.5 else 3.0 - 4.0 * frac
    if wave_name == "soft":
        tri = 4.0 * frac - 1.0 if frac < 0.5 else 3.0 - 4.0 * frac
        return 0.7 * math.sin(TWO_PI * frac) + 0.3 * tri
    if wave_name == "bell":  # music box: fundamental + bright 4th harmonic
        return 0.8 * math.sin(TWO_PI * frac) + 0.25 * math.sin(TWO_PI * 4.0 * frac)
    if wave_name == "ep":  # electric-piano-ish: warm low harmonics
        return (0.8 * math.sin(TWO_PI * frac) + 0.22 * math.sin(TWO_PI * 2.0 * frac)
                + 0.08 * math.sin(TWO_PI * 3.0 * frac))
    return math.sin(TWO_PI * frac)


def render_tone(buf, start_s, dur_s, midi, wave_name, amp,
                attack=0.005, release=0.03, decay_to=1.0, decay_time=0.2,
                vib_depth=0.0, vib_rate=5.5, vib_delay=0.2, vib_fade=0.2,
                slide_semi=0.0, slide_time=0.06):
    """Render a pitched note into the circular buffer `buf`.

    Envelope: linear attack, exponential decay toward `decay_to`, gate for
    `dur_s`, then a linear release. Pitch: optional slide up from `slide_semi`
    below and delayed vibrato.
    """
    n_total = len(buf)
    base = midi_to_hz(midi)
    start = int(round(start_s * SR))
    n_note = int((dur_s + release) * SR)
    phase = 0.0
    inv_sr = 1.0 / SR
    level_at_gate = None
    for i in range(n_note):
        t = i * inv_sr
        if t < attack:
            env = t / attack
        else:
            env = decay_to + (1.0 - decay_to) * math.exp(-(t - attack) / decay_time)
        if t >= dur_s:
            if level_at_gate is None:
                level_at_gate = env
            env = level_at_gate * max(0.0, 1.0 - (t - dur_s) / release)
        semi = 0.0
        if slide_semi and t < slide_time:
            x = t / slide_time
            semi -= slide_semi * (1.0 - x) * (1.0 - x)
        if vib_depth and t > vib_delay:
            fade = min(1.0, (t - vib_delay) / vib_fade)
            semi += vib_depth * fade * math.sin(TWO_PI * vib_rate * (t - vib_delay))
        f = base * (2.0 ** (semi / 12.0)) if semi else base
        phase += f * inv_sr
        phase -= int(phase)
        buf[(start + i) % n_total] += amp * env * osc(wave_name, phase)


def render_kick(buf, start_s, amp):
    n_total = len(buf)
    start = int(round(start_s * SR))
    phase = 0.0
    for i in range(int(0.18 * SR)):
        t = i / SR
        f = 48.0 + 90.0 * math.exp(-t / 0.022)
        phase += f / SR
        env = min(1.0, t / 0.002) * math.exp(-t / 0.075)
        buf[(start + i) % n_total] += amp * env * math.sin(TWO_PI * phase)


def render_clap(buf, start_s, amp, rng):
    """Three quick band-limited noise bursts and a short tail."""
    n_total = len(buf)
    start = int(round(start_s * SR))
    fast = slow = 0.0
    for i in range(int(0.2 * SR)):
        t = i / SR
        fast += 0.5 * (rng.uniform(-1.0, 1.0) - fast)
        slow += 0.07 * (fast - slow)
        env = 0.0
        for off in (0.0, 0.010, 0.021):
            if t >= off:
                env += math.exp(-(t - off) / 0.0035)
        if t >= 0.021:
            env += 0.5 * math.exp(-(t - 0.021) / 0.055)
        buf[(start + i) % n_total] += amp * min(env, 1.3) * (fast - slow)


def render_shaker(buf, start_s, amp, rng, attack=0.006, decay=0.018):
    """High-passed noise tick -- a shaker, or a closed hat with a fast attack."""
    n_total = len(buf)
    start = int(round(start_s * SR))
    prev = 0.0
    for i in range(int(0.06 * SR)):
        t = i / SR
        w = rng.uniform(-1.0, 1.0)
        env = min(1.0, t / attack) * math.exp(-t / decay)
        buf[(start + i) % n_total] += amp * env * (w - prev) * 0.5
        prev = w


def render_snap(buf, start_s, amp, rng):
    """Finger snap: a very short noise click with a bright tonal ping."""
    n_total = len(buf)
    start = int(round(start_s * SR))
    prev = 0.0
    for i in range(int(0.05 * SR)):
        t = i / SR
        w = rng.uniform(-1.0, 1.0)
        env = min(1.0, t / 0.0008) * math.exp(-t / 0.009)
        s = 0.6 * (w - prev) + 0.5 * math.sin(TWO_PI * 1900.0 * t) * math.exp(-t / 0.006)
        buf[(start + i) % n_total] += amp * env * s
        prev = w


def render_snare(buf, start_s, amp, rng):
    """Clap noise over a short 190 Hz body."""
    render_clap(buf, start_s, amp * 0.8, rng)
    n_total = len(buf)
    start = int(round(start_s * SR))
    for i in range(int(0.1 * SR)):
        t = i / SR
        env = min(1.0, t / 0.001) * math.exp(-t / 0.035)
        buf[(start + i) % n_total] += amp * 0.5 * env * math.sin(TWO_PI * 190.0 * t)


def lowpass_circular(buf, coeff):
    """One-pole low-pass run twice around the loop so the state wraps."""
    n = len(buf)
    y = 0.0
    out = [0.0] * n
    for _ in range(2):
        for i in range(n):
            y += coeff * (buf[i] - y)
            out[i] = y
    return out


def echo_circular(buf, delay_s, gains):
    """Feed-forward multi-tap echo with circular indexing (wraps at loop point)."""
    n = len(buf)
    d = int(round(delay_s * SR))
    out = list(buf)
    for k, g in enumerate(gains, start=1):
        off = (k * d) % n
        for i in range(n):
            out[i] += g * buf[i - off]  # negative index wraps in Python
    return out


def mix(*buses):
    n = len(buses[0][0])
    out = [0.0] * n
    for bus, gain in buses:
        for i in range(n):
            out[i] += gain * bus[i]
    return out


def finalize(buf):
    mean = sum(buf) / len(buf)
    centred = [x - mean for x in buf]
    peak = max(abs(x) for x in centred) or 1.0
    scale = PEAK_TARGET / peak
    return [x * scale for x in centred]


# --------------------------------------------------------------------------
# Parts shared by the tracks
# --------------------------------------------------------------------------

def render_melody(bus, bars, first_bar, e8, swing, wave_name, amp,
                  legato=0.9, transpose=0, unit=1.0, **tone):
    for i, text in enumerate(bars):
        for pos, length, midi, slide in parse_bar(text):
            p0 = (first_bar + i) * EIGHTHS_PER_BAR + pos
            t0 = warp(p0, e8, swing, unit)
            t1 = warp(p0 + length, e8, swing, unit)
            render_tone(bus, t0, (t1 - t0) * legato, midi + transpose, wave_name, amp,
                        slide_semi=1.0 if slide else 0.0, **tone)


def render_boom_chick(bass, stabs, prog, e8, swing, bass_amp, stab_amp,
                      stab_wave="pulse50", stab_center=64, ghost=True):
    """Bass on beats 1 & 3 (root, then fifth when the chord holds), chord
    stabs on beats 2 & 4, plus a quiet ghost stab on the and-of-4."""
    for bar, text in enumerate(prog):
        halves = bar_halves(text)
        base = bar * EIGHTHS_PER_BAR
        for h, symbol in enumerate(halves):
            root = chord_root(symbol)
            note = root + 7 if (h == 1 and halves[0] == halves[1]) else root
            t0 = warp(base + h * 4, e8, swing)
            render_tone(bass, t0, e8 * 1.5, note, "tri", bass_amp,
                        attack=0.003, release=0.04, decay_to=0.55, decay_time=0.15)
            hits = [(2, 1.0)] + ([(3, 0.45)] if ghost and h == 1 else [])
            for step, acc in hits:
                ts = warp(base + h * 4 + step, e8, swing)
                for m in chord_voicing(symbol, stab_center):
                    render_tone(stabs, ts, e8 * 0.55, m, stab_wave, stab_amp * acc,
                                attack=0.003, release=0.03, decay_to=0.4, decay_time=0.08)


def render_sparkle(bus, symbol, start_s, e8, amp, center=84):
    """Quick upward music-box arpeggio of a chord."""
    notes = chord_voicing(symbol, center)
    for k, m in enumerate(notes + [notes[0] + 12]):
        render_tone(bus, start_s + k * e8 * 0.5, e8 * 0.5, m, "bell", amp,
                    attack=0.002, release=0.35, decay_to=0.0, decay_time=0.25)


# --------------------------------------------------------------------------
# The hook and the business theme -- 영업 중
# --------------------------------------------------------------------------

BIZ_BPM = 94
BIZ_SWING = 0.35   # of a sixteenth -- laid-back R&B pocket
BIZ_UNIT = 0.5     # swing the sixteenth grid

HOOK_A = [  # Fmaj7 | Em7 | Dm7 | Cmaj7 | Fmaj7 | Em7 Am7 | Dm7 | G7
    "r:0.5 E5:0.5 G5:1 r:0.5 G5:0.5 A5:1 G5:1 E5:1.5 r:1.5",
    "r:0.5 D5:0.5 E5:1 r:0.5 D5:0.5 C5:1 D5:2 r:2",
    "r:0.5 C5:0.5 D5:1 r:0.5 C5:0.5 A4:1 C5:1.5 D5:1.5 r:1",
    "E5:3 r:3 A4:0.5 C5:0.5 D5:1",
    "r:0.5 E5:0.5 G5:1 r:0.5 G5:0.5 A5:1 G5:1 E5:1.5 r:1.5",
    "r:0.5 G5:0.5 A5:1 r:0.5 C6:0.5 A5:1 G5:1 E5:1.5 r:1.5",
    "F5:1 E5:0.5 D5:0.5 r:0.5 C5:0.5 D5:1 F5:1.5 E5:1.5 r:1",
    "D5:2 r:1 B4:0.5 C5:0.5 D5:1 F5:1 r:2",
]
PROG_A = ["Fmaj7", "Em7", "Dm7", "Cmaj7", "Fmaj7", "Em7 Am7", "Dm7", "G7"]

BIZ_B = [  # Dm7 | Em7 | Fmaj7 | G7 | Em7 | Am7 | Dm7 | G7
    "A5:2 r:0.5 G5:0.5 F5:1 E5:1 D5:2 r:1",
    "r:0.5 E5:0.5 G5:1 B5:2 A5:1 G5:1.5 r:1.5",
    "C6:2 r:0.5 A5:0.5 G5:1 A5:3 r:1",
    "r:1 G5:0.5 F5:0.5 D5:1 B4:1 D5:1.5 F5:1.5 r:1",
    "G5:1.5 E5:0.5 r:0.5 D5:0.5 E5:1 G5:2 r:2",
    "r:0.5 C6:0.5 B5:0.5 A5:0.5 G5:1 E5:1 G5:2 r:2",
    "F5:1 A5:1 C6:1 A5:0.5 G5:0.5 F5:1 E5:1 D5:2",
    "B4:0.5 D5:0.5 F5:0.5 G5:0.5 B5:2 r:4",
]
PROG_B = ["Dm7", "Em7", "Fmaj7", "G7", "Em7", "Am7", "Dm7", "G7"]

# (pos8, semitones over root or "approach", len8, accent) -- one chord per bar
BASS_GROOVE = [(0.0, 0, 1.4, 1.0), (1.5, 0, 0.4, 0.7), (3.5, 12, 0.4, 0.6),
               (4.0, 7, 1.2, 0.9), (5.5, 0, 0.4, 0.7), (7.5, "approach", 0.4, 0.6)]
# two chords in the bar: the same shape per half
BASS_GROOVE_HALF = [(0.0, 0, 1.4, 1.0), (1.5, 0, 0.4, 0.7), (3.5, "approach", 0.4, 0.6)]
# (pos8, len8, accent) -- the chord that sounds is the one at pos + 0.5 (anticipation)
EP_COMP = [(0.0, 1.3, 1.0), (2.5, 0.4, 0.6), (3.5, 2.0, 0.85), (6.5, 1.0, 0.6)]
KICKS = [(0.0, 1.0), (3.5, 0.6), (5.0, 0.8)]
SNARES = [(2.0, 1.0), (6.0, 1.0), (7.5, 0.25)]  # backbeat + ghost


def render_rnb_bass(bass, prog, e8):
    for bar, text in enumerate(prog):
        parts = text.split()
        next_root = chord_root(prog[(bar + 1) % len(prog)].split()[0])
        if len(parts) == 1:
            segments = [(0.0, parts[0], BASS_GROOVE, next_root)]
        else:
            segments = [(0.0, parts[0], BASS_GROOVE_HALF, chord_root(parts[1])),
                        (4.0, parts[1], BASS_GROOVE_HALF, next_root)]
        for offset, symbol, groove, target in segments:
            root = chord_root(symbol)
            for pos, step, length, acc in groove:
                midi = target - 1 if step == "approach" else root + step
                t0 = warp(bar * 8 + offset + pos, e8, BIZ_SWING, BIZ_UNIT)
                render_tone(bass, t0, e8 * length, midi, "soft", 0.42 * acc,
                            attack=0.004, release=0.05, decay_to=0.6, decay_time=0.2)


def render_ep_comp(keys, prog, e8):
    for bar, text in enumerate(prog):
        halves = bar_halves(text)
        for pos, length, acc in EP_COMP:
            symbol = halves[min(1, int((pos + 0.5) // 4))]
            t0 = warp(bar * 8 + pos, e8, BIZ_SWING, BIZ_UNIT)
            for m in chord_voicing(symbol, 66, rootless=True):
                render_tone(keys, t0, e8 * length, m, "ep", 0.075 * acc,
                            attack=0.004, release=0.18, decay_to=0.45, decay_time=0.35)


def render_rnb_drums(drums, bars, e8, rng):
    for bar in range(bars):
        base = bar * 8
        for pos, acc in KICKS:
            render_kick(drums, warp(base + pos, e8, BIZ_SWING, BIZ_UNIT), 0.5 * acc)
        for pos, acc in SNARES:
            render_snare(drums, warp(base + pos, e8, BIZ_SWING, BIZ_UNIT), 0.32 * acc, rng)
        for k in range(16):
            t0 = warp(base + k * 0.5, e8, BIZ_SWING, BIZ_UNIT)
            level = 0.07 if k % 4 == 2 else (0.05 if k % 2 == 0 else 0.03)
            render_shaker(drums, t0, level, rng, attack=0.001, decay=0.012)
        if bar % 8 == 7:  # sixteenth snare roll into the next section
            for k, pos in enumerate((6.5, 7.0, 7.5)):
                render_snare(drums, warp(base + pos, e8, BIZ_SWING, BIZ_UNIT),
                             0.12 + 0.05 * k, rng)


def build_business():
    rng = random.Random(940)
    beat = 60.0 / BIZ_BPM
    e8 = beat / 2.0
    melody = HOOK_A + BIZ_B + HOOK_A
    prog = PROG_A + PROG_B + PROG_A
    n = int(round(len(melody) * 4 * beat * SR))
    lead = [0.0] * n
    double = [0.0] * n
    bass = [0.0] * n
    keys = [0.0] * n
    drums = [0.0] * n

    render_melody(lead, melody, 0, e8, BIZ_SWING, "pulse25", 0.18, unit=BIZ_UNIT,
                  attack=0.004, release=0.06, decay_to=0.7, decay_time=0.2,
                  vib_depth=0.2, vib_rate=5.5, vib_delay=0.2, vib_fade=0.15)
    render_melody(double, HOOK_A, 16, e8, BIZ_SWING, "bell", 0.07, transpose=12,
                  unit=BIZ_UNIT, legato=0.6,
                  attack=0.002, release=0.3, decay_to=0.0, decay_time=0.25)
    render_rnb_bass(bass, prog, e8)
    render_ep_comp(keys, prog, e8)
    render_rnb_drums(drums, len(prog), e8, rng)

    lead = lowpass_circular(lead, 0.45)
    lead = echo_circular(lead, beat * 0.75, [0.2, 0.08])
    keys = echo_circular(lowpass_circular(keys, 0.5), beat * 0.5, [0.15])
    bass = lowpass_circular(bass, 0.3)
    return finalize(mix((lead, 1.0), (double, 1.0), (bass, 0.9), (keys, 1.0),
                        (drums, 0.8)))


# --------------------------------------------------------------------------
# 비 오는 밤 -- title
# --------------------------------------------------------------------------

TITLE_BPM = 104

TITLE_MELODY = [  # F | Dm | Bb | C | F | Dm | Gm C | F -- the hook, in F
    "A4:1 C5:1 r:1 C5:1 D5:1 C5:1 A4:2",
    "F5:3 E5:1 D5:2 C5:2",
    "D5:1 F5:1 r:1 F5:1 G5:1 F5:1 D5:2",
    "E5:3 G5:1 C5:4",
    "A4:1 C5:1 r:1 C5:1 D5:1 C5:1 A4:2",
    "F5:1 A5:1 r:1 A5:1 G5:2 F5:2",
    "D5:2 C5:1 Bb4:1 A4:2 G4:2",
    "F4:6 r:2",
]
TITLE_PROG = ["F", "Dm", "Bb", "C", "F", "Dm", "Gm C", "F"]


TITLE_SWING = 0.15
TITLE_BOUNCE = (0, 12, 7, 12)  # bass per half bar: root, octave, fifth, octave


def build_title():
    rng = random.Random(8000)
    beat = 60.0 / TITLE_BPM
    e8 = beat / 2.0
    prog = TITLE_PROG * 2
    n = int(round(len(prog) * 4 * beat * SR))
    lead = [0.0] * n
    bells = [0.0] * n
    bass = [0.0] * n
    arps = [0.0] * n
    drums = [0.0] * n

    render_melody(lead, TITLE_MELODY, 0, e8, TITLE_SWING, "soft", 0.24, legato=0.85,
                  attack=0.01, release=0.12, decay_to=0.75, decay_time=0.3,
                  vib_depth=0.15, vib_rate=5.5, vib_delay=0.25, vib_fade=0.25)
    render_melody(lead, TITLE_MELODY, 8, e8, TITLE_SWING, "pulse25", 0.16, legato=0.85,
                  attack=0.005, release=0.1, decay_to=0.7, decay_time=0.2,
                  vib_depth=0.15, vib_rate=5.8, vib_delay=0.22, vib_fade=0.2)
    render_melody(bells, TITLE_MELODY, 8, e8, TITLE_SWING, "bell", 0.08, transpose=12,
                  legato=0.5, attack=0.002, release=0.35, decay_to=0.0, decay_time=0.25)

    for bar, text in enumerate(prog):
        for h, symbol in enumerate(bar_halves(text)):
            root = chord_root(symbol)
            lo, mid, hi = chord_voicing(symbol, 74)
            for k in range(4):
                pos = bar * 8 + h * 4 + k
                t0 = warp(pos, e8, TITLE_SWING)
                render_tone(bass, t0, e8 * 0.6, root + TITLE_BOUNCE[k], "tri", 0.3,
                            attack=0.003, release=0.03, decay_to=0.5, decay_time=0.1)
                render_tone(arps, t0, e8 * 0.5, (lo, mid, hi, mid)[k], "bell", 0.06,
                            attack=0.002, release=0.25, decay_to=0.0, decay_time=0.2)

    for bar in range(len(prog)):
        second_pass = bar >= 8
        for step in range(8):
            t0 = warp(bar * 8 + step, e8, TITLE_SWING)
            if step in (2, 6):
                render_snap(drums, t0, 0.32, rng)
            if second_pass and step in (0, 4):
                render_kick(drums, t0, 0.3)
            render_shaker(drums, t0, 0.05 if step % 2 else 0.025, rng)

    lead = lowpass_circular(lead, 0.5)
    lead = echo_circular(lead, beat * 0.75, [0.2, 0.08])
    bells = echo_circular(bells, beat * 0.75, [0.2, 0.08])
    bass = lowpass_circular(bass, 0.35)
    return finalize(mix((lead, 1.0), (bells, 1.0), (bass, 0.75), (arps, 1.0),
                        (drums, 0.7)))


# --------------------------------------------------------------------------
# 쉬는 날 -- shop / day summary / Sunday
# --------------------------------------------------------------------------

SHOP_BPM = 100
SHOP_SWING = 0.34

SHOP_MELODY = [  # C | Em | F | C | Am | Dm | G | G
    "G5:2 E5:1 G5:1 C6:2 G5:2",
    "B5:2 G5:1 E5:1 G5:4",
    "A5:2 F5:1 A5:1 C6:2 A5:2",
    "G5:6 r:2",
    "E5:1 G5:1 r:1 G5:1 A5:1 G5:1 E5:2",
    "F5:1 A5:1 r:1 A5:1 G5:2 F5:2",
    "D5:2 G5:2 B5:2 D6:2",
    "C6:1 B5:1 A5:1 G5:1 F5:1 E5:1 D5:2",
]
SHOP_PROG = ["C", "Em", "F", "C", "Am", "Dm", "G", "G"]


def build_shop():
    rng = random.Random(1000)
    beat = 60.0 / SHOP_BPM
    e8 = beat / 2.0
    prog = SHOP_PROG * 2
    n = int(round(len(prog) * 4 * beat * SR))
    lead = [0.0] * n
    counter = [0.0] * n
    bass = [0.0] * n
    stabs = [0.0] * n
    drums = [0.0] * n

    for first in (0, 8):
        render_melody(lead, SHOP_MELODY, first, e8, SHOP_SWING, "bell", 0.2, legato=0.7,
                      attack=0.002, release=0.45, decay_to=0.0, decay_time=0.35)
    render_melody(counter, SHOP_MELODY, 8, e8, SHOP_SWING, "soft", 0.11, transpose=-12,
                  attack=0.02, release=0.15, decay_to=0.7, decay_time=0.4)
    render_boom_chick(bass, stabs, prog, e8, SHOP_SWING, 0.34, 0.045,
                      stab_wave="tri", stab_center=62, ghost=False)

    for bar in range(len(prog)):
        for step in range(8):
            t0 = warp(bar * 8 + step, e8, SHOP_SWING)
            render_shaker(drums, t0, 0.06 if step % 2 else 0.03, rng)
            if step == 0 and bar % 2 == 0:
                render_kick(drums, t0, 0.2)

    lead = echo_circular(lead, beat * 0.75, [0.22, 0.09])
    bass = lowpass_circular(bass, 0.3)
    return finalize(mix((lead, 1.0), (counter, 1.0), (bass, 0.9), (stabs, 0.8),
                        (drums, 0.7)))


# --------------------------------------------------------------------------
# Jingles
# --------------------------------------------------------------------------

JINGLES = {
    "day-end": {
        "bpm": 140, "wave": "pulse25", "swing": 0.2,
        "melody": "E5:1 G5:1 r:1 G5:1 A5:1 B5:1 C6:6",
        "chords": [(0, "C", 4), (4, "F", 1), (5, "G", 1), (6, "C", 6)],
        "sparkle": (6, "C"),
    },
    "ending": {
        "bpm": 100, "wave": "pulse25", "swing": 0.0,
        "melody": ("E5:1 G5:1 r:1 G5:1 A5:1 G5:1 E5:2 "
                   "C6:1 A5:1 r:1 A5:1 G5:2 E5:2 "
                   "F5:2 A5:2 C6:2 D6:2 "
                   "E6:8"),
        "chords": [(0, "C", 8), (8, "Am", 8), (16, "F", 4), (20, "G", 4), (24, "C", 8)],
        "sparkle": (24, "C"),
    },
    "closed": {
        "bpm": 76, "wave": "soft", "swing": 0.0,
        "melody": "E5:1 C5:1 r:1 C5:1 D5:1 C5:1 B4:2 A4:8",
        "chords": [(0, "Am", 4), (4, "E", 4), (8, "Am", 8)],
        "sparkle": None,
    },
}


def build_jingle(spec):
    beat = 60.0 / spec["bpm"]
    e8 = beat / 2.0
    events = parse_bar(spec["melody"], bar_len=None)
    length8 = max(p + l for p, l, _, _ in events)
    n = int(round((length8 * e8 + JINGLE_TAIL_S) * SR))
    lead = [0.0] * n
    accomp = [0.0] * n
    swing = spec["swing"]

    for pos, length, midi, _ in events:
        t0 = warp(pos, e8, swing)
        t1 = warp(pos + length, e8, swing)
        render_tone(lead, t0, (t1 - t0) * 0.9, midi, spec["wave"], 0.22,
                    attack=0.004, release=0.3, decay_to=0.75, decay_time=0.25,
                    vib_depth=0.2, vib_rate=5.5, vib_delay=0.25, vib_fade=0.2)
    for pos, symbol, length in spec["chords"]:
        t0 = warp(pos, e8, swing)
        dur = length * e8 * 0.95
        render_tone(accomp, t0, dur, chord_root(symbol), "tri", 0.3,
                    attack=0.004, release=0.3, decay_to=0.6, decay_time=0.3)
        for m in chord_voicing(symbol, 64):
            render_tone(accomp, t0, dur, m, "tri", 0.07,
                        attack=0.01, release=0.4, decay_to=0.6, decay_time=0.4)
    if spec["sparkle"]:
        pos, symbol = spec["sparkle"]
        render_sparkle(accomp, symbol, warp(pos, e8, swing), e8, 0.08)

    lead = echo_circular(lowpass_circular(lead, 0.5), beat * 0.5, [0.2, 0.08])
    return finalize(mix((lead, 1.0), (accomp, 1.0)))


# --------------------------------------------------------------------------

def write_wav(path, samples):
    frames = struct.pack("<%dh" % len(samples),
                         *[max(-32767, min(32767, int(round(s * 32767)))) for s in samples])
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(frames)


def to_m4a(wav_path):
    m4a_path = wav_path[:-4] + ".m4a"
    if not shutil.which("afconvert"):
        print("  ! afconvert not found; skipped", m4a_path)
        return None
    if os.path.exists(m4a_path):
        os.remove(m4a_path)
    subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", wav_path, m4a_path],
                   check=True)
    return m4a_path


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    jobs = [("bgm-title.wav", build_title),
            ("bgm-business.wav", build_business),
            ("bgm-shop.wav", build_shop)]
    jobs += [("jingle-%s.wav" % name, lambda s=spec: build_jingle(s))
             for name, spec in JINGLES.items()]
    for name, builder in jobs:
        samples = builder()
        path = os.path.join(OUT_DIR, name)
        write_wav(path, samples)
        seam = abs(samples[0] - samples[-1])
        m4a = to_m4a(path)
        print("%-22s %5.1f s  seam-step %.4f  %s"
              % (name, len(samples) / float(SR), seam,
                 "%.0f KB m4a" % (os.path.getsize(m4a) / 1024.0) if m4a else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
