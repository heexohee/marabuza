// Stage scale-to-window (src/js/self-serve/fit.js): the fixed 1280×884 stage always fits the window.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { STAGE, fitScale } from '../../../src/js/self-serve/fit.js'

const fits = (w, h) => {
  const k = fitScale(w, h)
  return STAGE.w * k <= w && STAGE.h * k <= h
}

test('test_fit_design_window_is_scale_one', () => {
  assert.equal(fitScale(STAGE.w, STAGE.h), 1)
})

test('test_fit_stage_never_overflows_common_windows', () => {
  for (const [w, h] of [[1280, 720], [1366, 768], [1512, 860], [1920, 1080], [2560, 1440], [900, 1100], [760, 1000], [375, 812]]) {
    assert.ok(fits(w, h), `${w}×${h}`)
  }
})

test('test_fit_short_window_is_limited_by_height', () => {
  assert.equal(fitScale(1920, STAGE.h / 2), 0.5)
})

test('test_fit_bad_window_size_falls_back_to_one', () => {
  assert.equal(fitScale(0, 800), 1)
  assert.equal(fitScale(NaN, 800), 1)
})
