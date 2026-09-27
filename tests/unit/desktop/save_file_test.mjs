// Desktop save file (launch checklist ⛔ 저장 → 파일 + 스팀 클라우드): one JSON file per save key in the app's
// saves/ folder, written atomically, so Steam Auto-Cloud can sync the folder.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { createSaveFile, isSaveKey } = require('../../../desktop/save-file.cjs')
const KEY = 'maratang-selfserve-save-v1'
const withDir = (fn) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'marabuza-saves-'))
  try { return fn(dir) } finally { fs.rmSync(dir, { recursive: true, force: true }) }
}

test('test_save_file_round_trips_a_value_in_its_own_file', () => withDir((dir) => {
  const store = createSaveFile(path.join(dir, 'saves'))
  assert.equal(store.getItem(KEY), null, 'nothing saved yet')
  assert.equal(store.setItem(KEY, '{"day":3}'), true)
  assert.equal(store.getItem(KEY), '{"day":3}')
  assert.equal(fs.readFileSync(path.join(dir, 'saves', `${KEY}.json`), 'utf8'), '{"day":3}')
  assert.deepEqual(fs.readdirSync(path.join(dir, 'saves')), [`${KEY}.json`], 'no temp file left behind')
}))

test('test_save_file_remove_deletes_the_file', () => withDir((dir) => {
  const store = createSaveFile(dir)
  store.setItem(KEY, 'x')
  assert.equal(store.removeItem(KEY), true)
  assert.equal(store.getItem(KEY), null)
  assert.equal(store.removeItem(KEY), true, 'removing twice is fine')
}))

test('test_save_file_refuses_unknown_or_path_like_keys', () => withDir((dir) => {
  const store = createSaveFile(dir)
  for (const key of ['../evil', 'other-game-save', 'maratang-selfserve-../x', '', 42]) {
    assert.equal(isSaveKey(key), false, String(key))
    assert.equal(store.setItem(key, 'x'), false, String(key))
    assert.equal(store.getItem(key), null)
  }
  assert.deepEqual(fs.readdirSync(dir), [])
  assert.equal(isSaveKey(KEY), true)
}))

test('test_save_file_a_failed_write_keeps_the_old_save', () => withDir((dir) => {
  const store = createSaveFile(dir)
  store.setItem(KEY, 'old')
  const broken = createSaveFile(dir, { writeFileSync: () => { throw new Error('disk full') } })
  assert.equal(broken.setItem(KEY, 'new'), false)
  assert.equal(store.getItem(KEY), 'old')
}))
