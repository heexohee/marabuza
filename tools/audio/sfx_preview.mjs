// Renders the click sounds in src/js/self-serve/sfx.js to WAV so they can be heard outside the game.
// Mirrors scheduleSfx: oscillator with an exponential pitch glide, 4 ms linear attack, exponential
// fade to silence at the note's end. The game itself synthesizes these live; these files are previews.
//
// Run from the repo root:  node tools/audio/sfx_preview.mjs
// Output: production/qa/audio-demos/sfx/<name>.wav + sfx-all.wav (every sound, 0.5 s apart)

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { SFX_RECIPES } from '../../src/js/self-serve/sfx.js'

const SR = 44100
const TAIL_SEC = 0.1
const GAP_SEC = 0.5
const OUT_DIR = join('production', 'qa', 'audio-demos', 'sfx')

const WAVES = {
  sine: (p) => Math.sin(2 * Math.PI * p),
  square: (p) => (p < 0.5 ? 1 : -1),
  triangle: (p) => (p < 0.5 ? 4 * p - 1 : 3 - 4 * p),
}

function renderNote(out, note, offset) {
  const n = Math.round(note.dur * SR)
  const attack = 0.004 * SR
  let phase = 0
  for (let i = 0; i < n; i += 1) {
    const x = i / n
    const f = note.to ? note.from * (note.to / note.from) ** x : note.from
    phase = (phase + f / SR) % 1
    const level = i < attack
      ? (i / attack) * note.gain
      : note.gain * (0.0001 / note.gain) ** ((i - attack) / (n - attack))
    out[offset + Math.round(note.at * SR) + i] += level * WAVES[note.wave](phase)
  }
}

function render(notes) {
  const length = Math.max(...notes.map((n) => n.at + n.dur)) + TAIL_SEC
  const out = new Float32Array(Math.ceil(length * SR))
  notes.forEach((n) => renderNote(out, n, 0))
  return out
}

function wav(samples) {
  const buf = Buffer.alloc(44 + samples.length * 2)
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + samples.length * 2, 4); buf.write('WAVE', 8)
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22)
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34)
  buf.write('data', 36); buf.writeUInt32LE(samples.length * 2, 40)
  samples.forEach((s, i) => buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), 44 + i * 2))
  return buf
}

mkdirSync(OUT_DIR, { recursive: true })
const rendered = Object.entries(SFX_RECIPES).map(([name, notes]) => [name, render(notes)])
rendered.forEach(([name, samples]) => writeFileSync(join(OUT_DIR, `${name}.wav`), wav(samples)))

const gap = Math.round(GAP_SEC * SR)
const all = new Float32Array(rendered.reduce((sum, [, s]) => sum + s.length + gap, 0))
rendered.reduce((at, [, s]) => { all.set(s, at); return at + s.length + gap }, 0)
writeFileSync(join(OUT_DIR, 'sfx-all.wav'), wav(all))
process.stdout.write(`${rendered.map(([n]) => n).join(' → ')}\nwrote ${rendered.length + 1} files to ${OUT_DIR}\n`)
