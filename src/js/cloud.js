// Cloud save via Supabase + Kakao login — SHARED module, independent of any game flow.
// It never imports flow code: each flow passes its own save validator and a save slot
// ('self-serve', 'legacy', …) so flows with different save formats never overwrite each other.
// Local save stays the source of truth offline; when signed in, a flow mirrors its saves to the
// `saves` table (one row per user per slot, RLS-protected — see supabase/saves.sql).
// Integration guide: docs/cloud-save-setup.md. The client is injected so this is testable offline.

const SUPABASE_ESM = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
const SAVES_TABLE = 'saves'
const FALLBACK_NAME = '사장님'
const SLOT_PATTERN = /^[a-z0-9-]{1,32}$/ // must match the check constraint in supabase/saves.sql

/**
 * Wraps a Supabase client with the few operations a game flow needs.
 * @param {object} client Supabase client (or a test double with the same shape)
 * @param {{ isValidSave: (data: unknown) => boolean, slot: string }} options
 *   isValidSave — the flow's own save validator; data failing it is never pushed or returned.
 *   slot — which save this flow owns, e.g. 'self-serve'.
 */
export function createCloud(client, { isValidSave, slot } = {}) {
  if (typeof isValidSave !== 'function') throw new Error('createCloud: isValidSave(data) is required')
  if (typeof slot !== 'string' || !SLOT_PATTERN.test(slot)) throw new Error(`createCloud: invalid slot "${slot}"`)
  let user = null

  return {
    slot,

    /** Re-reads the current session (e.g. after the Kakao redirect lands back on the page). */
    async refreshUser() {
      const { data } = await client.auth.getSession()
      user = data?.session?.user ?? null
      return user
    },

    /** Calls `cb(user|null)` now and on every sign-in / sign-out. */
    onChange(cb) {
      client.auth.onAuthStateChange((_event, session) => {
        user = session?.user ?? null
        cb(user)
      })
    },

    isSignedIn: () => user !== null,

    /** Nickname from the Kakao profile, or a friendly fallback. */
    displayName() {
      const meta = user?.user_metadata ?? {}
      return meta.name || meta.full_name || meta.nickname || meta.user_name || FALLBACK_NAME
    },

    /** Starts Kakao OAuth; the browser leaves the page and returns to `redirectTo`. Returns an error message or null. */
    async signIn(redirectTo) {
      const { error } = await client.auth.signInWithOAuth({ provider: 'kakao', options: { redirectTo } })
      return error ? error.message : null
    },

    async signOut() {
      await client.auth.signOut()
      user = null
    },

    /** Mirrors a valid save to this user's row in this slot. False when signed out, invalid, or on failure. */
    async pushSave(data) {
      if (!user || !isValidSave(data)) return false
      const savedAt = new Date(data.savedAt ?? Date.now()).toISOString()
      const { error } = await client.from(SAVES_TABLE)
        .upsert({ user_id: user.id, slot, data, saved_at: savedAt }, { onConflict: 'user_id,slot' })
      return !error
    },

    /** This user's save in this slot if it passes the flow's validator, else null (never trust server data blindly). */
    async pullSave() {
      if (!user) return null
      const { data: row, error } = await client.from(SAVES_TABLE)
        .select('data').eq('user_id', user.id).eq('slot', slot).maybeSingle()
      if (error || !row) return null
      return isValidSave(row.data) ? row.data : null
    },
  }
}

/**
 * Connects to Supabase using src/js/cloud-config.js (git-ignored; copy cloud-config.example.js).
 * Resolves to null — cloud features hidden, game unaffected — when the config is missing,
 * incomplete, or the Supabase library cannot be loaded (offline).
 * @param {{ isValidSave: (data: unknown) => boolean, slot: string }} options same as createCloud
 */
export async function connectCloud(options) {
  try {
    const { CLOUD_CONFIG: config } = await import('./cloud-config.js')
    if (!config?.url || !config?.anonKey) return null
    const { createClient } = await import(SUPABASE_ESM)
    const cloud = createCloud(createClient(config.url, config.anonKey), options)
    await cloud.refreshUser()
    return cloud
  } catch {
    return null
  }
}
