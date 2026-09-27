// The self-serve save goes to the desktop app's save file when the app provides one (window.marabuzaSave, see
// desktop/preload.cjs), else to localStorage — the web build is unchanged.
import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { saveStore } from '../../../src/js/self-serve/save-store.js'
import { loadGame, saveGame } from '../../../src/js/self-serve/save.js'
import { createNewGame } from '../../../src/js/self-serve/logic.js'
import { SAVE_KEY } from '../../../src/js/self-serve/data.js'

function memoryStorage() {
  const store = new Map()
  return { store, getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) }
}
afterEach(() => { delete globalThis.marabuzaSave; delete globalThis.localStorage })

test('test_save_store_uses_local_storage_on_the_web', () => {
  globalThis.localStorage = memoryStorage()
  assert.equal(saveStore(), globalThis.localStorage)
})

test('test_save_store_prefers_the_desktop_save_file', () => {
  globalThis.localStorage = memoryStorage()
  globalThis.marabuzaSave = memoryStorage()
  assert.equal(saveStore(), globalThis.marabuzaSave)
  saveGame({ ...createNewGame(), phase: 'shop', day: 5, money: 123_400 })
  assert.ok(globalThis.marabuzaSave.store.has(SAVE_KEY), 'written to the save file')
  assert.equal(globalThis.localStorage.store.size, 0, 'not to localStorage')
  assert.equal(loadGame().money, 123_400)
})

test('test_save_store_reports_a_failed_desktop_write', () => {
  globalThis.marabuzaSave = { getItem: () => null, setItem: () => { throw new Error('write failed') }, removeItem: () => {} }
  assert.equal(saveGame({ ...createNewGame(), phase: 'shop', day: 2 }), false)
})
