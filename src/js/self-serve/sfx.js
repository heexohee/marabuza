// Click sound effects for the self-serve variant: which action makes which sound, and the sounds
// themselves as tiny synth recipes (no audio files). Played through the audio player's SFX bus.

/**
 * One tone of a sound: starts `at` s after the click, lasts `dur` s, pitch glides `from` → `to` Hz.
 * @typedef {{ at: number, dur: number, from: number, to?: number, wave: OscillatorType, gain: number }} SfxNote
 */

const hz = (midi) => 440 * 2 ** ((midi - 69) / 12)

/** @type {Record<string, SfxNote[]>} */
export const SFX_RECIPES = {
  // 띠링♪ — coin: short B5 then a ringing E6
  pay: [
    { at: 0, dur: 0.07, from: hz(83), wave: 'square', gain: 0.12 },
    { at: 0.07, dur: 0.26, from: hz(88), wave: 'square', gain: 0.12 },
  ],
  // 쏙쏙 — two little upward pops
  restock: [
    { at: 0, dur: 0.06, from: 520, to: 1100, wave: 'sine', gain: 0.35 },
    { at: 0.09, dur: 0.06, from: 640, to: 1350, wave: 'sine', gain: 0.35 },
  ],
  // 룰루 — happy rising arpeggio C6 E6 G6 C7
  buy: [72, 76, 79, 84].map((m, i) => ({ at: i * 0.06, dur: i === 3 ? 0.2 : 0.07, from: hz(m + 12), wave: 'triangle', gain: 0.28 })),
  // 반짝 — high sparkle G6 C7 E7 G7 + a soft shimmer on top
  unlock: [
    ...[91, 96, 100, 103].map((m, i) => ({ at: i * 0.05, dur: 0.12, from: hz(m), wave: 'sine', gain: 0.22 })),
    { at: 0.2, dur: 0.35, from: hz(108), wave: 'sine', gain: 0.08 },
  ],
  // 보글 — three bubbles
  cook: [
    { at: 0, dur: 0.05, from: 380, to: 620, wave: 'sine', gain: 0.3 },
    { at: 0.07, dur: 0.05, from: 460, to: 760, wave: 'sine', gain: 0.26 },
    { at: 0.13, dur: 0.05, from: 330, to: 560, wave: 'sine', gain: 0.24 },
  ],
  // 짠~ — quick C–E–G roll that rings together
  serve: [72, 76, 79].map((m, i) => ({ at: i * 0.035, dur: 0.32 - i * 0.035, from: hz(m + 12), wave: 'triangle', gain: 0.22 })),
  // 앗! — soft falling boop-boop
  oops: [
    { at: 0, dur: 0.08, from: hz(76), wave: 'square', gain: 0.09 },
    { at: 0.1, dur: 0.14, from: hz(71), to: hz(69), wave: 'square', gain: 0.09 },
  ],
  // 톡 — tiny tap for small buttons
  tap: [{ at: 0, dur: 0.03, from: 1400, to: 1000, wave: 'sine', gain: 0.18 }],
}

/** Game action (data-action) → sound. Actions not listed are silent. */
export const ACTION_SFX = {
  chargeConfirm: 'pay',
  restock: 'restock',
  buy: 'buy', sidePack: 'buy', upgrade: 'buy', interior: 'buy', payPremium: 'pay',
  unlock: 'unlock', openSide: 'unlock',
  cook: 'cook', cookNext: 'cook',
  table: 'serve',
  charge: 'tap', chargeReset: 'tap', mode: 'tap', spice: 'tap', price: 'tap', pick: 'tap', dig: 'tap',
}

/**
 * The sound for an action that just ran: `oops` when it added a warning toast, nothing when it
 * changed nothing (refused silently), else the action's own sound.
 * @param {string} action @param {object} prev state before @param {object} next state after
 * @returns {string|null} key into SFX_RECIPES
 */
export function sfxForAction(action, prev, next) {
  const isNew = (t) => t.id >= (prev.nextToastId ?? 0)
  if ((next.toasts ?? []).some((t) => isNew(t) && t.kind === 'bad')) return 'oops'
  if (next === prev) return null
  return ACTION_SFX[action] ?? null
}

/**
 * Schedules a recipe on a Web Audio context into `destination`.
 * @param {BaseAudioContext} ctx @param {AudioNode} destination @param {SfxNote[]} notes
 */
export function scheduleSfx(ctx, destination, notes) {
  const t0 = ctx.currentTime
  notes.forEach((n) => {
    const osc = ctx.createOscillator()
    const env = ctx.createGain()
    const start = t0 + n.at
    const end = start + n.dur
    osc.type = n.wave
    osc.frequency.setValueAtTime(n.from, start)
    if (n.to) osc.frequency.exponentialRampToValueAtTime(n.to, end)
    env.gain.setValueAtTime(0, start)
    env.gain.linearRampToValueAtTime(n.gain, start + 0.004)
    env.gain.exponentialRampToValueAtTime(0.0001, end)
    osc.connect(env).connect(destination)
    osc.start(start)
    osc.stop(end + 0.02)
  })
}
