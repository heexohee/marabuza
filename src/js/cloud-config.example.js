// Copy this file to cloud-config.js (git-ignored) and fill in your Supabase project values:
// Supabase dashboard → Project Settings → API. The anon / publishable key is meant for browsers;
// the `saves` table is protected by row-level security (supabase/saves.sql).
// NEVER put the service_role key here.
export const CLOUD_CONFIG = {
  url: '', // e.g. https://abcdefghijkl.supabase.co
  anonKey: '', // anon (public) or sb_publishable_... key
}
