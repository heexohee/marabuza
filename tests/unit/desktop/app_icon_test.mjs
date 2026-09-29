// App icon (launch checklist: 앱 아이콘 — approved 2026-09-29, the simplified malatang bowl on pink): electron-builder
// finds the mac/windows icons in the tracked build-resources folder, and the web page links its favicon.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

test('test_app_icon_build_resources_hold_the_mac_and_windows_icons', () => {
  // Arrange
  const dir = pkg.build?.directories?.buildResources

  // Assert
  assert.equal(dir, 'assets/app-icon', 'electron-builder must not read the git-ignored build/ folder')
  for (const file of ['icon.png', 'icon.icns', 'icon.ico']) {
    assert.ok(fs.existsSync(path.join(dir, file)), `missing ${file}`)
  }
})

test('test_app_icon_png_is_1024_square', () => {
  const png = fs.readFileSync('assets/app-icon/icon.png')
  // PNG IHDR: width and height are big-endian at bytes 16..23
  assert.equal(png.readUInt32BE(16), 1024)
  assert.equal(png.readUInt32BE(20), 1024)
})

test('test_app_icon_web_page_links_an_existing_favicon', () => {
  const html = fs.readFileSync('src/self-serve.html', 'utf8')
  const href = html.match(/<link rel="icon"[^>]*href="([^"]+)"/)?.[1]
  assert.ok(href, 'no <link rel="icon">')
  assert.ok(fs.existsSync(path.join('src', href)), `favicon ${href} missing`)
})
