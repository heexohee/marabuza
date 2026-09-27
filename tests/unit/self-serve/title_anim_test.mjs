// Living title background (feedback 2026-09-27: rain, neon flicker, clouds, shimmering road) — the pure parts.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  TITLE_ART, TITLE_FX, burstLength, burstLevel, cloudOffset, flickerBurst, shimmerOffset, spawnDrop, stepDrop,
} from '../../../src/js/self-serve/title-anim.js'

/** Deterministic 0..1 sequence (a small LCG), so every run draws the same numbers. */
function seeded(seed = 7) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648
    return s / 2147483648
  }
}

test('test_flicker_burst_ends_lit_and_levels_stay_in_range', () => {
  const rng = seeded()
  for (let i = 0; i < 50; i++) {
    const burst = flickerBurst(rng)
    assert.ok(burst.length >= 4)
    assert.equal(burst.at(-1).level, 1)
    assert.ok(burst.every((s) => s.level >= 0 && s.level <= 1 && s.dur > 0))
    assert.ok(burst.some((s) => s.level < 1), 'a burst always dims at least once')
  }
})

test('test_burst_level_follows_steps_then_stays_lit', () => {
  const burst = [{ level: 0, dur: 0.1 }, { level: 1, dur: 0.1 }, { level: 0.45, dur: 0.1 }]
  assert.equal(burstLevel(burst, 0.05), 0)
  assert.equal(burstLevel(burst, 0.15), 1)
  assert.equal(burstLevel(burst, 0.25), 0.45)
  assert.equal(burstLevel(burst, 5), 1)
  assert.ok(Math.abs(burstLength(burst) - 0.3) < 1e-9)
})

test('test_spawned_drop_lands_on_sidewalk_or_road', () => {
  const rng = seeded(3)
  for (let i = 0; i < 200; i++) {
    const d = spawnDrop(rng)
    assert.ok(d.groundY >= TITLE_ART.base && d.groundY <= TITLE_ART.h)
    assert.ok(d.y <= 0, 'a new drop starts above the frame')
    assert.ok(['near', 'far'].includes(d.layer))
    const [lo, hi] = TITLE_FX.speed[d.layer]
    assert.ok(d.speed >= lo && d.speed <= hi)
  }
})

test('test_step_drop_falls_slanted_then_reports_landing', () => {
  const drop = { layer: 'near', x: 100, y: 0, speed: 400, len: 8, groundY: 360 }
  const { drop: moved, landed } = stepDrop(drop, 0.1)
  assert.equal(landed, null)
  assert.equal(moved.y, 40)
  assert.equal(moved.x, 100 + 40 * TITLE_FX.wind)
  const hit = stepDrop({ ...drop, y: 350 }, 0.1)
  assert.deepEqual(hit.landed, { x: Math.round(100 + 40 * TITLE_FX.wind + 8 * TITLE_FX.wind), y: 360 })
})

test('test_shimmer_only_moves_road_rows_within_amplitude', () => {
  const max = Math.ceil(TITLE_FX.shimmerAmp[1])
  for (let t = 0; t < 10; t += 0.37) {
    assert.equal(shimmerOffset(TITLE_ART.road - 1, t), 0)
    for (let y = TITLE_ART.road; y < TITLE_ART.h; y++) {
      const dx = shimmerOffset(y, t)
      assert.ok(Number.isInteger(dx) && Math.abs(dx) <= max)
    }
  }
})

test('test_cloud_sway_stays_within_its_range_and_returns', () => {
  for (let t = 0; t < TITLE_FX.cloudPeriod; t += 1) assert.ok(Math.abs(cloudOffset(t)) <= TITLE_FX.cloudSway + 1e-9)
  assert.ok(Math.abs(cloudOffset(TITLE_FX.cloudPeriod)) < 1e-9)
})
