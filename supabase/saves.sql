-- Cloud saves for 마라부자: one row per signed-in user per save slot.
-- A slot is a game flow's own save ('self-serve', 'legacy', …), so flows with different
-- save formats never overwrite each other. Used by src/js/cloud.js.
-- Run once in Supabase dashboard → SQL Editor.

create table if not exists public.saves (
  user_id uuid not null references auth.users (id) on delete cascade,
  slot text not null check (slot ~ '^[a-z0-9-]{1,32}$'), -- same rule as SLOT_PATTERN in cloud.js
  data jsonb not null check (pg_column_size(data) < 16384), -- a save is ~1 KB; reject junk
  saved_at timestamptz not null default now(),
  primary key (user_id, slot)
);

alter table public.saves enable row level security;

-- Each user can only see and write their own saves.
create policy "saves: read own" on public.saves
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "saves: insert own" on public.saves
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "saves: update own" on public.saves
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- No delete policy on purpose: deletes are denied until an account-reset feature needs one.
