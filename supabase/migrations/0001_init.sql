-- FOC core schema.
--
-- Hackathon shortcut, stated plainly: RLS is enabled but every policy is
-- permissive (`using (true)`) so the anon key can read/write without an auth
-- flow, which is fine for a single-user weekend demo. Before any real
-- multi-user usage, replace these policies with `auth.uid() = owner` checks.

create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  display_name text not null,
  profile_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists saves (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  source_type text not null check (
    source_type in ('instagram', 'linkedin', 'newsletter', 'telegram_forward', 'manual_paste')
  ),
  source_url text,
  source_name text, -- e.g. "TLDR AI", a Telegram username, a LinkedIn author
  raw_text text,
  fetched_title text,
  fetched_description text,
  fetch_status text not null default 'pending' check (
    fetch_status in ('pending', 'ok', 'blocked', 'failed', 'skipped')
  ),
  captured_at timestamptz not null default now()
);

create index if not exists saves_profile_captured_idx on saves (profile_id, captured_at desc);

create table if not exists save_classifications (
  id uuid primary key default gen_random_uuid(),
  save_id uuid not null unique references saves(id) on delete cascade,
  intent text not null check (intent in ('TOOL', 'BUILD', 'MARKET', 'ANCHOR', 'DISCOVER', 'NOISE')),
  tags text[] not null default '{}',
  one_line_insight text not null,
  score numeric not null default 0,
  matched_active_project text,
  is_noise boolean not null default false,
  model_used text,
  classified_at timestamptz not null default now()
);

create table if not exists briefs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  brief_date date not null,
  status text not null default 'draft' check (
    status in ('draft', 'ranked', 'scripted', 'rendered', 'sent')
  ),
  script_text text,
  video_url text,
  skipped_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, brief_date)
);

create table if not exists brief_items (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid not null references briefs(id) on delete cascade,
  save_id uuid not null references saves(id) on delete cascade,
  rank_position integer not null,
  in_video boolean not null default false,
  created_at timestamptz not null default now(),
  unique (brief_id, save_id)
);

alter table profiles enable row level security;
alter table saves enable row level security;
alter table save_classifications enable row level security;
alter table briefs enable row level security;
alter table brief_items enable row level security;

create policy "demo_anon_all_profiles" on profiles for all using (true) with check (true);
create policy "demo_anon_all_saves" on saves for all using (true) with check (true);
create policy "demo_anon_all_classifications" on save_classifications for all using (true) with check (true);
create policy "demo_anon_all_briefs" on briefs for all using (true) with check (true);
create policy "demo_anon_all_brief_items" on brief_items for all using (true) with check (true);

-- Seed the one profile this hackathon build needs. profile_json is filled by
-- `npm run profile:sync` (reads content-profile/julius.yaml), not by hand here.
insert into profiles (slug, display_name, profile_json)
values ('julius', 'Julius', '{}'::jsonb)
on conflict (slug) do nothing;

-- Enable Realtime on saves/briefs/brief_items so the /today page updates the
-- instant a Telegram capture (or a pasted URL) gets classified, no refresh.
alter publication supabase_realtime add table saves;
alter publication supabase_realtime add table save_classifications;
alter publication supabase_realtime add table briefs;
alter publication supabase_realtime add table brief_items;
