// Fine-weather day title (feedback 2026-09-28) — the pure parts, and picking the scene.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { TITLE_ART, titleSceneName } from '../../../src/js/self-serve/title-anim.js'
import { DAY_FX, DAY_TREES, flockBirds, gust, spawnPetal, stepPetal, swayOffset } from '../../../src/js/self-serve/title-day.js'

function seeded(seed = 5) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648
    return s / 2147483648
  }
}

test('test_title_scene_is_day_only_with_the_query', () => {
  assert.equal(titleSceneName('?title=day'), 'day')
  assert.equal(titleSceneName('?dev&title=day'), 'day')
  assert.equal(titleSceneName(''), 'night')
  assert.equal(titleSceneName('?title=dusk'), 'night')
})

test('test_gust_stays_between_calm_and_full', () => {
  for (let t = 0; t < 30; t += 0.25) assert.ok(gust(t) >= 0.4 - 1e-9 && gust(t) <= 1 + 1e-9)
})

test('test_sway_is_bounded_and_still_at_the_trunk', () => {
  const max = Math.ceil(DAY_FX.sway.amp * 1.35)
  for (const tree of DAY_TREES) {
    for (let t = 0; t < 20; t += 0.33) {
      assert.equal(swayOffset(tree, tree.ground, t), 0)
      for (let y = tree.y; y < tree.y + tree.h; y++) {
        const dx = swayOffset(tree, y, t)
        assert.ok(Number.isInteger(dx) && Math.abs(dx) <= max)
      }
    }
  }
})

test('test_sway_top_row_moves_over_time', () => {
  const tree = DAY_TREES[0]
  const seen = new Set()
  for (let t = 0; t < 12; t += 0.1) seen.add(swayOffset(tree, tree.y, t))
  assert.ok(seen.size >= 3, 'the top of the crown takes several positions')
})

test('test_petal_blows_right_then_leaves_the_frame', () => {
  const rng = seeded()
  let p = spawnPetal(rng)
  assert.ok(p.x < 0, 'a new petal enters from the left')
  let t = 0
  let steps = 0
  while (p && steps < 10000) {
    const next = stepPetal(p, 0.05, t)
    if (next) assert.ok(next.x > p.x)
    p = next
    t += 0.05
    steps += 1
  }
  assert.equal(p, null)
  assert.ok(steps < 10000)
})

test('test_scattered_petals_start_inside_the_frame', () => {
  const rng = seeded(9)
  for (let i = 0; i < 100; i++) {
    const p = spawnPetal(rng, true)
    assert.ok(p.x >= 0 && p.x <= TITLE_ART.w && p.y >= 100 && p.y <= TITLE_ART.h)
  }
})

test('test_flock_flies_right_and_flaps', () => {
  const flock = { y: 60, startedAt: 2 }
  const a = flockBirds(flock, 2)
  const b = flockBirds(flock, 4)
  assert.equal(a.length, 3)
  assert.ok(b[0].x > a[0].x)
  const wings = new Set()
  for (let t = 2; t < 4; t += 0.05) wings.add(flockBirds(flock, t)[0].up)
  assert.equal(wings.size, 2)
})
