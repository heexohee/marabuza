// BUG-002 (production/qa/bugs/BUG-002-opening-illustration-transition.md): story illustrations are decoded
// before they are needed, and a picture that just changed fades in over the previous one instead of popping
// out of an empty box.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { endingHtml, openingHtml, storyArtUrls, teaserHtml } from '../../../src/js/self-serve/story-ui.js'
import { preloadImages } from '../../../src/js/self-serve/preload.js'

const CHARACTER = { name: '초아', hair: 'bob', hairColor: 'brown', apron: 'pink' }
const opening = (scene, line) => openingHtml({ story: { scene, line }, character: CHARACTER })
const sceneTag = (html) => html.match(/<div class="scene[^>]*>/)[0]

test('test_story_art_urls_cover_every_opening_and_ending_picture_and_exist', () => {
  // Arrange / Act
  const urls = storyArtUrls()

  // Assert
  for (const src of ['01-office', '02-regular', '05-apron', '06-alone', '07-open', 'rain-background', 'layers/reading', 'layers/talk-panda', 'layers/talk-protagonist']) {
    assert.ok(urls.includes(`img/opening-approved/${src}.png`), src)
  }
  for (const src of ['01-ledger', '02-settlement', '08-certificate', '04-rabbit', '05-franchise', '06-hiring-pose-overlay']) {
    assert.ok(urls.includes(`img/story-v2/ending/${src}.png`), src)
  }
  assert.equal(new Set(urls).size, urls.length, 'no duplicates')
  for (const src of urls) assert.ok(fs.existsSync(path.join('src', src)), `missing file ${src}`)
})

test('test_story_art_first_opening_picture_fades_in_from_the_empty_box', () => {
  const tag = sceneTag(opening(0, 0))
  assert.match(tag, /art-enter/)
  assert.doesNotMatch(tag, /background-image/)
})

test('test_story_art_same_picture_on_the_next_line_does_not_fade_again', () => {
  assert.doesNotMatch(sceneTag(opening(0, 1)), /art-enter|cast-enter/)
})

test('test_story_art_new_picture_fades_in_over_the_previous_one', () => {
  // office's last line → regular's first line: 01-office behind, 02-regular fading in
  const tag = sceneTag(opening(1, 0))
  assert.match(tag, /art-enter/)
  assert.match(tag, /background-image:url\('img\/opening-approved\/01-office\.png'\)/)
})

test('test_story_art_rainy_beats_keep_the_plate_and_fade_only_the_cast', () => {
  // notice line 4 switches 03-notice → 04-offer: same rain plate, new cast
  const tag = sceneTag(opening(2, 4))
  assert.match(tag, /cast-enter/)
  assert.doesNotMatch(tag, /art-enter/)
})

test('test_story_art_ending_and_teaser_fade_only_when_the_picture_changes', () => {
  const ending = (endingStep) => sceneTag(endingHtml({ endingStep, premiumPaidInFull: true, character: CHARACTER }))
  assert.match(ending(1), /art-enter/)
  assert.match(ending(1), /01-ledger\.png/)
  assert.doesNotMatch(ending(2), /art-enter/)
  const teaser = (teaserStep) => sceneTag(teaserHtml({ teaserStep, character: CHARACTER }))
  assert.match(teaser(0), /art-enter/)
  assert.doesNotMatch(teaser(1), /art-enter/)
})

test('test_story_art_preload_decodes_every_url_and_counts_failures_as_zero', async () => {
  // Arrange: a fake Image whose decode() fails for one file
  const made = []
  const makeImage = () => {
    const img = { src: '', decode: () => (img.src.includes('broken') ? Promise.reject(new Error('404')) : Promise.resolve()) }
    made.push(img)
    return img
  }

  // Act
  const decoded = await preloadImages(['a.png', 'broken.png', 'c.png'], makeImage)

  // Assert
  assert.deepEqual(made.map((i) => i.src), ['a.png', 'broken.png', 'c.png'])
  assert.equal(decoded, 2)
})
