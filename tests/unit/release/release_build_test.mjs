// Release build (launch checklist 2026-09-27 ⛔ 개발 모드 끄기): the dev bar never shows in a release build,
// even on localhost or with ?dev, and the legacy entry page is left out.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { isDevMode } from '../../../src/js/self-serve/dev.js'
import { IS_RELEASE } from '../../../src/js/build-flags.js'
import { buildRelease } from '../../../tools/release/release.mjs'

const at = (href) => new URL(href)

test('test_release_build_dev_mode_follows_host_and_flag_in_development', () => {
  assert.equal(IS_RELEASE, false, 'the source tree is a development build')
  assert.equal(isDevMode(at('http://localhost:8123/self-serve.html'), false), true)
  assert.equal(isDevMode(at('https://example.com/?dev'), false), true)
  assert.equal(isDevMode(at('http://localhost/?dev=0'), false), false)
  assert.equal(isDevMode(at('https://example.com/'), false), false)
})

test('test_release_build_dev_mode_is_always_off_in_a_release', () => {
  for (const href of ['http://localhost:8123/self-serve.html', 'http://127.0.0.1/?dev', 'https://example.com/?dev=1']) {
    assert.equal(isDevMode(at(href), true), false, href)
  }
})

test('test_release_build_copies_src_flips_the_flag_and_drops_the_legacy_page', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'maratang-release-'))
  try {
    buildRelease(out)
    assert.match(fs.readFileSync(path.join(out, 'js/build-flags.js'), 'utf8'), /export const IS_RELEASE = true/)
    assert.ok(fs.existsSync(path.join(out, 'self-serve.html')))
    assert.ok(!fs.existsSync(path.join(out, 'index.html')), 'legacy flow entry left out')
    assert.ok(!fs.existsSync(path.join(out, 'CLAUDE.md')), 'no dev notes shipped')
    assert.match(fs.readFileSync('src/js/build-flags.js', 'utf8'), /IS_RELEASE = false/, 'source untouched')
  } finally {
    fs.rmSync(out, { recursive: true, force: true })
  }
})
