-- KOLEHTI V2 LEARNING OPTIMIZER
-- Run this once in Supabase SQL editor.
-- Safe to run multiple times.

create table if not exists public.optimizer_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text not null default 'scheduled',
  window_hours integer not null default 72,
  profiles_analyzed integer not null default 0,
  events_analyzed integer not null default 0,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.optimizer_weights (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value numeric not null default 1,
  reason text,
  meta jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.segment_stats (
  id uuid primary key default gen_random_uuid(),
  segment text not null,
  window_hours integer not null default 72,
  users integer not null default 0,
  events integer not null default 0,
  votes integer not null default 0,
  invites integer not null default 0,
  impressions integer not null default 0,
  notifications integer not null default 0,
  score numeric not null default 0,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_optimizer_runs_created on public.optimizer_runs(created_at desc);
create index if not exists idx_optimizer_weights_key on public.optimizer_weights(key);
create index if not exists idx_segment_stats_segment_created on public.segment_stats(segment, created_at desc);

alter table public.optimizer_runs enable row level security;
alter table public.optimizer_weights enable row level security;
alter table public.segment_stats enable row level security;

drop policy if exists "read optimizer runs" on public.optimizer_runs;
create policy "read optimizer runs" on public.optimizer_runs for select using (true);

drop policy if exists "read optimizer weights" on public.optimizer_weights;
create policy "read optimizer weights" on public.optimizer_weights for select using (true);

drop policy if exists "read segment stats" on public.segment_stats;
create policy "read segment stats" on public.segment_stats for select using (true);

insert into public.optimizer_weights (key, value, reason, meta)
values
  ('vote_weight', 1, 'Default vote signal weight', '{}'::jsonb),
  ('invite_weight', 1, 'Default invite signal weight', '{}'::jsonb),
  ('impression_weight', 1, 'Default impression signal weight', '{}'::jsonb),
  ('notification_weight', 1, 'Default notification signal weight', '{}'::jsonb),
  ('freshness_weight', 1, 'Default freshness signal weight', '{}'::jsonb),
  ('quality_weight', 1, 'Default AI quality signal weight', '{}'::jsonb)
on conflict (key) do nothing;
