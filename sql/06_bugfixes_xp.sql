-- KOLEHTI V2 XP / REWARD BUGFIXES
-- Run this in Supabase SQL editor.
-- Safe to run multiple times.

alter table public.profiles add column if not exists xp integer not null default 0;
alter table public.profiles add column if not exists level integer not null default 1;
alter table public.profiles add column if not exists total_votes_given integer not null default 0;
alter table public.profiles add column if not exists total_posts_created integer not null default 0;
alter table public.profiles add column if not exists top3_count integer not null default 0;
alter table public.profiles add column if not exists first_place_count integer not null default 0;
alter table public.profiles add column if not exists daily_reward_date date;
alter table public.profiles add column if not exists daily_reward_streak integer not null default 0;
alter table public.profiles add column if not exists last_level_seen integer not null default 1;
alter table public.profiles add column if not exists reward_points integer not null default 0;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create table if not exists public.reward_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text not null default 'reward',
  amount integer not null default 0,
  title text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_reward_events_user_created
on public.reward_events(user_id, created_at desc);

alter table public.reward_events enable row level security;

drop policy if exists "read own reward events" on public.reward_events;
create policy "read own reward events"
on public.reward_events for select
using (auth.uid() = user_id);

drop policy if exists "insert own reward events" on public.reward_events;
create policy "insert own reward events"
on public.reward_events for insert
with check (auth.uid() = user_id);

create or replace function public.get_level_from_xp(xp_value integer)
returns integer as $$
begin
  if xp_value >= 2500 then return 10; end if;
  if xp_value >= 2000 then return 9; end if;
  if xp_value >= 1600 then return 8; end if;
  if xp_value >= 1250 then return 7; end if;
  if xp_value >= 950 then return 6; end if;
  if xp_value >= 700 then return 5; end if;
  if xp_value >= 480 then return 4; end if;
  if xp_value >= 300 then return 3; end if;
  if xp_value >= 150 then return 2; end if;
  return 1;
end;
$$ language plpgsql immutable;

create or replace function public.increment_user_xp(
  target_user_id uuid,
  xp_amount integer,
  reason text default 'action'
)
returns public.profiles as $$
declare
  updated_profile public.profiles;
begin
  if target_user_id is null or xp_amount is null then
    return null;
  end if;

  insert into public.profiles (id, xp, level)
  values (target_user_id, 0, 1)
  on conflict (id) do nothing;

  update public.profiles
  set
    xp = coalesce(xp, 0) + xp_amount,
    level = public.get_level_from_xp(coalesce(xp, 0) + xp_amount),
    updated_at = now()
  where id = target_user_id
  returning * into updated_profile;

  insert into public.retention_events (user_id, event_type, meta)
  values (
    target_user_id,
    'xp_gain',
    jsonb_build_object(
      'amount', xp_amount,
      'reason', reason,
      'new_xp', updated_profile.xp,
      'new_level', updated_profile.level
    )
  );

  return updated_profile;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.increment_user_xp(uuid, integer, text) to authenticated;

drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile"
on public.profiles for insert
with check (auth.uid() = id);

-- Backfill missing level values from current XP.
update public.profiles
set level = public.get_level_from_xp(coalesce(xp, 0))
where level is null or level < 1;
