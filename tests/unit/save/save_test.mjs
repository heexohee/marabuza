// LEGACY flow (owner-scoop, src/index.html) — save serialization, validation and
// local-vs-cloud selection (pure — no localStorage, no network). Kept green because the
// legacy demo still runs; the shared cloud module is tested in tests/unit/cloud/.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createNewGame, unlockIngredient } from '../../../src/js/logic.js'
import { isValidSave, pickNewest, restoreSave, serializeSave } from '../../../src/js/save.js'

const SAVED_AT = 1_700_000_000_000

// Factory: a game with some progress worth saving.
function progressedGame() {
  const s = { ...createNewGame(), day: 4, money: 30000, rating: 3.6 }
  return unlockIngredient(s, 'beef')
}

// ---------- serialize / restore ----------

test('test_save_serialize_keeps_progress_and_stamps_saved_at', () => {
  const data = serializeSave(progressedGame(), SAVED_AT)
  assert.equal(data.day, 4)
  assert.equal(data.money, 30000 - 6000)
  assert.ok(data.unlocked.includes('beef'))
  assert.equal(data.savedAt, SAVED_AT)
  assert.equal(isValidSave(data), true)
})

test('test_save_restore_round_trips_to_a_playable_state', () => {
  const restored = restoreSave(serializeSave(progressedGame(), SAVED_AT))
  assert.equal(restored.day, 4)
  assert.ok(restored.unlocked.includes('beef'))
  assert.equal(restored.phase, 'menu')
})

test('test_save_restore_rejects_tampered_data', () => {
  const data = serializeSave(progressedGame(), SAVED_AT)
  assert.equal(restoreSave({ ...data, money: -5 }), null)
  assert.equal(restoreSave({ ...data, unlocked: ['caviar'] }), null)
  assert.equal(restoreSave({ ...data, savedAt: 'yesterday' }), null)
  assert.equal(restoreSave(null), null)
})

test('test_save_old_saves_without_saved_at_are_still_valid', () => {
  const { savedAt: _dropped, ...legacy } = serializeSave(progressedGame(), SAVED_AT)
  assert.equal(isValidSave(legacy), true)
})

// ---------- local vs cloud ----------

test('test_save_pick_newest_prefers_the_later_save', () => {
  const older = serializeSave(progressedGame(), SAVED_AT)
  const newer = { ...older, day: 5, savedAt: SAVED_AT + 1000 }
  assert.equal(pickNewest(older, newer), newer)
  assert.equal(pickNewest(newer, older), newer)
})

test('test_save_pick_newest_handles_missing_or_invalid_sides', () => {
  const valid = serializeSave(progressedGame(), SAVED_AT)
  assert.equal(pickNewest(null, valid), valid)
  assert.equal(pickNewest(valid, null), valid)
  assert.equal(pickNewest(valid, { junk: true }), valid)
  assert.equal(pickNewest(null, null), null)
})
