import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createApprovedNightScene, APPROVED_TITLE_ART, APPROVED_NEON } from '../../../src/js/self-serve/title-approved.js'

test('approved title asset and animation use matching aspect ratios', () => {
  const png = readFileSync('src/img/title-rain-approved.png')
  assert.ok(Math.abs(png.readUInt32BE(16) / png.readUInt32BE(20) - APPROVED_TITLE_ART.w / APPROVED_TITLE_ART.h) < .005)
  for (const b of APPROVED_NEON) {
    assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.w <= APPROVED_TITLE_ART.w && b.y + b.h <= APPROVED_TITLE_ART.h)
  }
})
test('approved scene draws rain, valid ripples and intermittent neon dimming', () => {
  const scene = createApprovedNightScene(() => .5)
  let rectangles = 0, ripples = 0, backgrounds = 0
  const ctx = {
    drawImage() { backgrounds++ },
    fillRect() { rectangles++ }, beginPath() {}, stroke() {},
    ellipse(...args) { assert.equal(args.length, 7); assert.ok(args[2] > 0 && args[3] > 0); ripples++ },
  }
  for (let i = 0; i < 100; i++) scene.update(.05)
  scene.draw(ctx, { background: {} }, {}, 0)
  assert.equal(rectangles, 190)
  assert.equal(ripples, 30)
  rectangles = 0
  scene.draw(ctx, { background: {} }, {}, 6)
  assert.equal(rectangles, 191, 'only rooftop sign dims at this instant')
  assert.equal(backgrounds, 2)
})
