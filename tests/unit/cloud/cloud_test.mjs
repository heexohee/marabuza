// Kakao login + cloud save module (src/js/cloud.js). Flow-agnostic: no game-flow code is imported;
// each flow passes its own save validator and save slot. Uses a fake Supabase client (no network).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createCloud } from '../../../src/js/cloud.js'

const SAVED_AT = 1_700_000_000_000
const SLOT = 'self-serve'
// Stand-in for a flow's own validator (e.g. self-serve/save.js isValidSave).
const isValidSave = (d) => d !== null && typeof d === 'object' && d.v === 1 && Number.isInteger(d.coins)
const goodSave = (over = {}) => ({ v: 1, coins: 5, savedAt: SAVED_AT, ...over })

// Fake Supabase client: records calls, returns canned rows.
function fakeClient({ user = { id: 'user-1', user_metadata: { name: '마라왕' } }, row = null, error = null } = {}) {
  const calls = []
  const query = {
    upsert: (payload, opts) => { calls.push(['upsert', payload, opts]); return Promise.resolve({ error }) },
    select: () => query,
    eq: (col, val) => { calls.push(['eq', col, val]); return query },
    maybeSingle: () => Promise.resolve({ data: row, error }),
  }
  return {
    calls,
    from: (table) => { calls.push(['from', table]); return query },
    auth: {
      getSession: () => Promise.resolve({ data: { session: user ? { user } : null } }),
      onAuthStateChange: (cb) => { calls.push(['onAuth']); cb('INITIAL_SESSION', user ? { user } : null) },
      signInWithOAuth: (opts) => { calls.push(['oauth', opts]); return Promise.resolve({ error: null }) },
      signOut: () => { calls.push(['signOut']); return Promise.resolve({ error: null }) },
    },
  }
}

async function signedInCloud(clientOpts) {
  const client = fakeClient(clientOpts)
  const cloud = createCloud(client, { isValidSave, slot: SLOT })
  await cloud.refreshUser()
  return { client, cloud }
}

// ---------- setup ----------

test('test_cloud_create_requires_a_validator_and_a_slot', () => {
  assert.throws(() => createCloud(fakeClient(), { slot: SLOT }), /isValidSave/)
  assert.throws(() => createCloud(fakeClient(), { isValidSave }), /slot/)
  assert.throws(() => createCloud(fakeClient(), { isValidSave, slot: 'Bad Slot!' }), /slot/)
})

// ---------- push ----------

test('test_cloud_push_upserts_the_users_row_for_this_slot', async () => {
  const { client, cloud } = await signedInCloud()
  assert.equal(await cloud.pushSave(goodSave()), true)
  const [, payload, opts] = client.calls.find(([op]) => op === 'upsert')
  assert.equal(payload.user_id, 'user-1')
  assert.equal(payload.slot, SLOT)
  assert.deepEqual(payload.data, goodSave())
  assert.equal(payload.saved_at, new Date(SAVED_AT).toISOString())
  assert.equal(opts.onConflict, 'user_id,slot')
})

test('test_cloud_push_is_skipped_when_signed_out', async () => {
  const { client, cloud } = await signedInCloud({ user: null })
  assert.equal(await cloud.pushSave(goodSave()), false)
  assert.equal(client.calls.some(([op]) => op === 'upsert'), false)
})

test('test_cloud_push_refuses_data_the_flow_validator_rejects', async () => {
  const { client, cloud } = await signedInCloud()
  assert.equal(await cloud.pushSave({ v: 1, coins: 'lots' }), false)
  assert.equal(client.calls.some(([op]) => op === 'upsert'), false)
})

test('test_cloud_push_reports_a_server_error_as_false', async () => {
  const { cloud } = await signedInCloud({ error: { message: 'boom' } })
  assert.equal(await cloud.pushSave(goodSave()), false)
})

// ---------- pull ----------

test('test_cloud_pull_reads_only_this_users_row_in_this_slot', async () => {
  const { client, cloud } = await signedInCloud({ row: { data: goodSave() } })
  assert.deepEqual(await cloud.pullSave(), goodSave())
  const filters = client.calls.filter(([op]) => op === 'eq').map(([, col, val]) => `${col}=${val}`)
  assert.deepEqual(filters.sort(), ['slot=self-serve', 'user_id=user-1'])
})

test('test_cloud_pull_returns_null_for_data_the_flow_validator_rejects', async () => {
  const { cloud } = await signedInCloud({ row: { data: { v: 1, coins: 'lots' } } })
  assert.equal(await cloud.pullSave(), null)
})

test('test_cloud_pull_returns_null_when_signed_out_or_no_row', async () => {
  assert.equal(await (await signedInCloud({ user: null })).cloud.pullSave(), null)
  assert.equal(await (await signedInCloud({ row: null })).cloud.pullSave(), null)
})

// ---------- auth ----------

test('test_cloud_login_uses_kakao_and_returns_to_the_game', async () => {
  const client = fakeClient({ user: null })
  await createCloud(client, { isValidSave, slot: SLOT }).signIn('http://localhost:8124/self-serve.html')
  const [, opts] = client.calls.find(([op]) => op === 'oauth')
  assert.equal(opts.provider, 'kakao')
  assert.equal(opts.options.redirectTo, 'http://localhost:8124/self-serve.html')
})

test('test_cloud_on_change_reports_sign_in_state', async () => {
  const { cloud } = await signedInCloud()
  const seen = []
  cloud.onChange((user) => seen.push(user?.id ?? null))
  assert.deepEqual(seen, ['user-1'])
  assert.equal(cloud.isSignedIn(), true)
})

test('test_cloud_display_name_falls_back_when_profile_has_no_name', async () => {
  assert.equal((await signedInCloud()).cloud.displayName(), '마라왕')
  const { cloud } = await signedInCloud({ user: { id: 'u2', user_metadata: {} } })
  assert.equal(cloud.displayName(), '사장님')
})

test('test_cloud_sign_out_clears_the_user', async () => {
  const { client, cloud } = await signedInCloud()
  await cloud.signOut()
  assert.equal(cloud.isSignedIn(), false)
  assert.ok(client.calls.some(([op]) => op === 'signOut'))
})
