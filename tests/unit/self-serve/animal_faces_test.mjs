import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { CUSTOMER_FACES } from '../../../src/js/data.js'
import { REGULARS } from '../../../src/js/self-serve/story.js'
import { ANIMAL_FACES, queueFaceImg, seatedCustomerHtml } from '../../../src/js/self-serve/animal-faces.js'

test('every random and story customer has an approved queue portrait', () => {
  const faces = new Set([...CUSTOMER_FACES, ...Object.values(REGULARS).map(r => r.face)])
  for (const face of faces) {
    assert.ok(ANIMAL_FACES[face], `missing ${face}`)
    const [file, name] = ANIMAL_FACES[face]
    const png = readFileSync(new URL(`../../../src/img/animal-faces/${file}.png`, import.meta.url))
    assert.equal(png.subarray(1, 4).toString(), 'PNG')
    assert.equal(png.readUInt32BE(16), 48)
    assert.equal(png.readUInt32BE(20), 48)
    assert.ok(queueFaceImg(face).includes(`img/animal-faces/${file}.png?v=1`))
    assert.ok(queueFaceImg(face).includes(`alt="${name} 손님"`))
  }
})

test('seated customers retain their portraits with a dining bib and two paws', () => {
  for (const face of Object.keys(ANIMAL_FACES)) {
    const html = seatedCustomerHtml(face)
    assert.ok(html.includes(queueFaceImg(face)))
    assert.ok(html.includes('class="dining-bib"'))
    assert.equal((html.match(/class="customer-paw /g) ?? []).length, 2)
    assert.ok(!html.includes('undefined'))
  }
  assert.ok(seatedCustomerHtml('🐰').includes('--customer-fur:#eee5d6'))
  assert.ok(seatedCustomerHtml('🐱').includes('--customer-fur:#77716c'))
})

// The panda portrait belongs to the owner, never to a visiting customer.
test('panda owner is excluded from random and story customer pools', () => {
  assert.ok(!CUSTOMER_FACES.includes('🐼'))
  assert.ok(Object.values(REGULARS).every(r => r.face !== '🐼'))
})
