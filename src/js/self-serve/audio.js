// Background music and jingles for the self-serve variant: which track plays in which phase,
// the player's volume prefs, and a Web Audio player that loops the BGM sample-accurately.
// Tracks are rendered by tools/audio/bgm_demo.py and copied into src/audio/; click sounds come from sfx.js.
import { SFX_RECIPES, scheduleSfx } from './sfx.js'

/** Every audio file the game can play, by key. */
export const AUDIO_TRACKS = {
  title: 'audio/bgm-title.m4a',
  business: 'audio/bgm-business.m4a',
  shop: 'audio/bgm-shop.m4a',
  dayEnd: 'audio/jingle-day-end.m4a',
  closed: 'audio/jingle-closed.m4a',
  ending: 'audio/jingle-ending.m4a', // 1부 엔딩 — plays as the day-28 ending scene opens
}

/** Loop to play in each game phase; `null` = silence (a jingle may still play on entry). */
export const PHASE_MUSIC = {
  menu: 'title', create: 'title', opening: 'title',
  day: 'business',
  summary: 'shop', shop: 'shop', sunday: 'shop',
  ending: 'title', // after the part-1 jingle, the title theme carries the ending (same hook)
  teaser: 'title', // part-2 teaser (story N003) stays on the ending's music
  credits: 'title', // …and so do the end-of-part-1 credits
  closed: null,
}

/** Mix and timing knobs. Gains are on top of the player's volume. */
export const AUDIO_TUNING = { fadeSec: 0.8, musicGain: 0.55, jingleGain: 0.75, afterJingleSec: 0.4 }

/** `muted` = music off, `sfxMuted` = click sounds off; `volume` scales both. */
export const DEFAULT_AUDIO_PREFS = { muted: false, sfxMuted: false, volume: 0.7 }
export const VOLUME_STEP = 0.1
const PREFS_KEY = 'maratang.audio.v1'

/** @param {string} phase @returns {string|null} key into AUDIO_TRACKS */
export const musicForPhase = (phase) => PHASE_MUSIC[phase] ?? null

/**
 * Jingle to play when the phase changes, or null.
 * @param {string|null} from @param {string} to @returns {string|null}
 */
export function jingleForTransition(from, to) {
  if (from === to) return null
  if (to === 'closed') return 'closed'
  if (to === 'ending') return 'ending'
  if (from === 'day' && to === 'summary') return 'dayEnd'
  return null
}

const clampVolume = (v) => Math.round(Math.max(0, Math.min(1, v)) * 10) / 10

/** Coerces anything read from storage into valid prefs. @returns {{muted: boolean, sfxMuted: boolean, volume: number}} */
export function sanitizeAudioPrefs(raw) {
  const volume = Number(raw?.volume)
  return {
    muted: raw?.muted === true,
    sfxMuted: raw?.sfxMuted === true,
    volume: raw?.volume != null && Number.isFinite(volume) ? clampVolume(volume) : DEFAULT_AUDIO_PREFS.volume,
  }
}

export const toggleMuted = (prefs) => ({ ...prefs, muted: !prefs.muted })
export const toggleSfxMuted = (prefs) => ({ ...prefs, sfxMuted: !prefs.sfxMuted })

/** Volume change by `delta`; turning it up also unmutes the music. */
export const changeVolume = (prefs, delta) => ({ ...prefs, muted: delta > 0 ? false : prefs.muted, volume: clampVolume(prefs.volume + delta) })

/** Effective music gain: 0 when the music is off. */
export const masterGain = (prefs) => (prefs.muted ? 0 : prefs.volume)

/** Effective click-sound gain: 0 when sounds are off. */
export const sfxGain = (prefs) => (prefs.sfxMuted ? 0 : prefs.volume)

/** Two same sounds closer than this merge into one (fast repeated clicks). */
const SFX_MIN_GAP_SEC = 0.04

/** @param {Storage|undefined} storage */
export function loadAudioPrefs(storage) {
  try {
    return sanitizeAudioPrefs(JSON.parse(storage?.getItem(PREFS_KEY) ?? 'null'))
  } catch {
    return { ...DEFAULT_AUDIO_PREFS } // unreadable prefs are not worth an error: fall back to defaults
  }
}

/** @param {Storage|undefined} storage @returns {boolean} whether it was stored */
export function saveAudioPrefs(storage, prefs) {
  try {
    storage?.setItem(PREFS_KEY, JSON.stringify(prefs))
    return true
  } catch {
    return false
  }
}

/**
 * Web Audio player. Browsers keep audio locked until a user gesture, so nothing sounds
 * until `unlock()` runs from a click / key handler; the phase asked for before that
 * starts then.
 * @param {{ AudioContextClass: typeof AudioContext, fetchFn: typeof fetch, onError: (msg: string) => void }} deps
 */
export function createAudioPlayer({ AudioContextClass, fetchFn, onError }) {
  let ctx = null
  let master = null // music bus
  let sfxBus = null
  const lastSfxAt = new Map()
  let prefs = { ...DEFAULT_AUDIO_PREFS }
  let phase = null
  let music = null // { key, source, gain }
  let jingle = null
  let generation = 0
  let hasReportedError = false
  const buffers = new Map()

  const load = (key) => {
    if (!buffers.has(key)) {
      const pending = fetchFn(AUDIO_TRACKS[key])
        .then((res) => {
          if (!res.ok) throw new Error(`${AUDIO_TRACKS[key]}: HTTP ${res.status}`)
          return res.arrayBuffer()
        })
        .then((data) => ctx.decodeAudioData(data))
      pending.catch(() => buffers.delete(key)) // let a later phase change retry
      buffers.set(key, pending)
    }
    return buffers.get(key)
  }

  const report = (error) => {
    if (hasReportedError) return
    hasReportedError = true
    onError(`음악을 불러오지 못했어요 (${error?.message ?? error})`)
  }

  const fadeOut = (voice) => {
    if (!voice) return
    const now = ctx.currentTime
    voice.gain.gain.cancelScheduledValues(now)
    voice.gain.gain.setValueAtTime(voice.gain.gain.value, now)
    voice.gain.gain.linearRampToValueAtTime(0, now + AUDIO_TUNING.fadeSec)
    voice.source.stop(now + AUDIO_TUNING.fadeSec + 0.05)
  }

  const startVoice = (buffer, loop, level, fadeIn) => {
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = loop
    const gain = ctx.createGain()
    const now = ctx.currentTime
    gain.gain.setValueAtTime(fadeIn ? 0 : level, now)
    if (fadeIn) gain.gain.linearRampToValueAtTime(level, now + AUDIO_TUNING.fadeSec)
    source.connect(gain).connect(master)
    source.start(now)
    return { source, gain }
  }

  const playMusic = async (key, gen) => {
    if (music?.key === key) return
    fadeOut(music)
    music = null
    if (!key) return
    const buffer = await load(key)
    if (gen !== generation) return
    music = { key, ...startVoice(buffer, true, AUDIO_TUNING.musicGain, true) }
  }

  const playJingleThen = async (jingleKey, musicKey, gen) => {
    fadeOut(music)
    music = null
    fadeOut(jingle)
    const buffer = await load(jingleKey)
    if (gen !== generation) return
    jingle = startVoice(buffer, false, AUDIO_TUNING.jingleGain, false)
    const waitMs = (buffer.duration + AUDIO_TUNING.afterJingleSec) * 1000
    await new Promise((resolve) => setTimeout(resolve, waitMs))
    if (gen === generation) await playMusic(musicKey, gen)
  }

  const apply = (from, to) => {
    if (!ctx) return
    generation += 1
    const gen = generation
    const jingleKey = jingleForTransition(from, to)
    const done = jingleKey ? playJingleThen(jingleKey, musicForPhase(to), gen) : playMusic(musicForPhase(to), gen)
    done.catch(report)
  }

  return {
    /** Call from a user gesture; safe to call many times. */
    unlock() {
      if (!ctx) {
        try {
          ctx = new AudioContextClass()
        } catch (error) {
          return report(error)
        }
        master = ctx.createGain()
        master.gain.value = masterGain(prefs)
        master.connect(ctx.destination)
        sfxBus = ctx.createGain()
        sfxBus.gain.value = sfxGain(prefs)
        sfxBus.connect(ctx.destination)
        apply(null, phase)
      }
      if (ctx.state === 'suspended') ctx.resume().catch(report)
    },
    /** Follow the game phase; plays a jingle on the transitions that have one. */
    setPhase(next) {
      if (next === phase) return
      const from = phase
      phase = next
      apply(from, next)
    },
    /** @param {{muted: boolean, sfxMuted: boolean, volume: number}} next */
    setPrefs(next) {
      prefs = next
      if (!master) return
      master.gain.setTargetAtTime(masterGain(prefs), ctx.currentTime, 0.05)
      sfxBus.gain.setTargetAtTime(sfxGain(prefs), ctx.currentTime, 0.05)
    },
    /** Plays a click sound (key into SFX_RECIPES); no-op before unlock, when off, or for `null`. */
    playSfx(key) {
      if (!ctx || !key || prefs.sfxMuted || !SFX_RECIPES[key]) return
      const now = ctx.currentTime
      if (now - (lastSfxAt.get(key) ?? -1) < SFX_MIN_GAP_SEC) return
      lastSfxAt.set(key, now)
      scheduleSfx(ctx, sfxBus, SFX_RECIPES[key])
    },
  }
}
