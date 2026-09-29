import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { CUSTOMER_FACES } from '../../../src/js/data.js'
import { REGULARS } from '../../../src/js/self-serve/story.js'
import { ANIMAL_FACES, queueFaceImg, seatedCustomerHtml } from '../../../src/js/self-serve/animal-faces.js'

test('every random and story customer has an approved queue portrait', () => {
  const faces = new Set([...CUSTOMER_FACES, ...Object.values(REGULARS).map(r => r.face)])
  assert.equal(faces.size, 13)
  assert.ok(CUSTOMER_FACES.includes('🐦'), 'sparrow can visit as a random guest')
  for (const face of faces) {
    assert.ok(ANIMAL_FACES[face], `missing ${face}`)
    const [file, name] = ANIMAL_FACES[face]
    const png = readFileSync(new URL(`../../../src/img/animal-faces/${file}.png`, import.meta.url))
    assert.equal(png.subarray(1, 4).toString(), 'PNG')
    assert.equal(png.readUInt32BE(16), 48)
    assert.equal(png.readUInt32BE(20), 48)
    assert.ok(queueFaceImg(face).includes(`img/animal-faces/${file}.png?v=3`))
    assert.ok(queueFaceImg(face).includes(`alt="${name} 손님"`))
  }
})

test('owner portrait retains the legacy fallback', () => {
  for (const face of ['🐼']) {
    const html = seatedCustomerHtml(face)
    assert.ok(html.includes(queueFaceImg(face)))
    assert.ok(html.includes('class="dining-bib"'))
    assert.equal((html.match(/class="customer-paw /g) ?? []).length, 2)
    assert.ok(!html.includes('undefined'))
  }
  assert.ok(queueFaceImg('🐼').includes('panda.png?v=1'))
})

// The panda portrait belongs to the owner, never to a visiting customer.
test('panda owner is excluded from random and story customer pools', () => {
  assert.ok(!CUSTOMER_FACES.includes('🐼'))
  assert.ok(Object.values(REGULARS).every(r => r.face !== '🐼'))
})

test('all thirteen guest species use approved seated artwork and matching portrait', () => {
  const guests = Object.keys(ANIMAL_FACES).filter(face => face !== '🐼')
  assert.equal(guests.length, 13)
  for (const face of guests) {
    const [file, name] = ANIMAL_FACES[face]
    const html = seatedCustomerHtml(face)
    assert.equal((html.match(/<img /g) ?? []).length, file === 'penguin' ? 2 : 1)
    assert.ok(html.includes(`img/seated-customers/${file}.png?v=3`))
    assert.ok(html.includes(`${file === 'penguin' ? 'aria-label' : 'alt'}="${name} 손님"`))
    assert.ok(!html.includes('customer-torso') && !html.includes('customer-paw'))
    const png = readFileSync(new URL(`../../../src/img/seated-customers/${file}.png`, import.meta.url))
    assert.equal(png.readUInt32BE(16), 96)
    assert.equal(png.readUInt32BE(20), 112)
    const portrait = readFileSync(new URL(`../../../src/img/animal-faces/${file}.png`, import.meta.url))
    assert.equal(portrait.readUInt32BE(16), 48)
    assert.equal(portrait.readUInt32BE(20), 48)
    assert.ok(queueFaceImg(face).includes(`img/animal-faces/${file}.png?v=3`))
  }
})
