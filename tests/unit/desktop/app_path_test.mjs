// Desktop app (Electron, launch checklist ⛔ 데스크톱 앱 포장): the app:// protocol serves only files inside dist/.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { resolveAppPath, APP_ORIGIN } = require('../../../desktop/app-path.cjs')
const ROOT = path.resolve('/game/dist')

test('test_app_path_maps_urls_into_the_release_folder', () => {
  assert.equal(APP_ORIGIN, 'app://game')
  assert.equal(resolveAppPath('app://game/self-serve.html', ROOT), path.join(ROOT, 'self-serve.html'))
  assert.equal(resolveAppPath('app://game/js/self-serve/main.js?v=2', ROOT), path.join(ROOT, 'js/self-serve/main.js'))
  assert.equal(resolveAppPath('app://game/img/title-bg.png#x', ROOT), path.join(ROOT, 'img/title-bg.png'))
})

test('test_app_path_root_opens_the_game_page', () => {
  assert.equal(resolveAppPath('app://game/', ROOT), path.join(ROOT, 'self-serve.html'))
  assert.equal(resolveAppPath('app://game', ROOT), path.join(ROOT, 'self-serve.html'))
})

test('test_app_path_decodes_escaped_names', () => {
  assert.equal(resolveAppPath('app://game/img/a%20b.png', ROOT), path.join(ROOT, 'img/a b.png'))
})

test('test_app_path_never_resolves_outside_the_release_folder', () => {
  // the URL parser folds leading ../ into the root; encoded %2f..%2f survives parsing and must be refused
  for (const url of ['app://game/../secret.txt', 'app://game/%2e%2e/secret.txt', 'app://game/js/..%2f..%2fsecret', 'app://game/%2e%2e%2f%2e%2e%2fetc/passwd']) {
    const file = resolveAppPath(url, ROOT)
    assert.ok(file === null || file.startsWith(ROOT + path.sep), `${url} → ${file}`)
  }
  assert.equal(resolveAppPath('app://game/js/..%2f..%2fsecret', ROOT), null)
  assert.equal(resolveAppPath('app://other/self-serve.html', ROOT), null, 'another host')
  assert.equal(resolveAppPath('https://game/self-serve.html', ROOT), null, 'another scheme')
})
