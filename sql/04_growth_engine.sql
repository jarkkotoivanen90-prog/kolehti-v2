-- KOLEHTI V2 GROWTH ENGINE
-- Run after 01_schema.sql and 02_policies.sql.

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references auth.users(id) on delete cascade,
  invited_user_id uuid references auth.users(id) on delete set null,
  invited_email text,
  status text not null default 'pending' check (status in ('pending', 'completed', 'rewarded')),
  reward_xp integer not null default 100,
  reward_points integer not null default 100,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (inviter_id, invited_user_id)
);

create table if not exists public.growth_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  source text,
  referrer_id uuid references auth.users(id) on delete set null,
  group_id uuid references public.groups(id) on delete set null,
  points integer not null default 0,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.jackpot_rounds (
  id uuid primary key default gen_random_uuid(),
  round_date date not null,
  group_id uuid references public.groups(id) on delete set null,
  title text not null default 'Päivän kierros',
  pot_label text not null default '1000 €',
  status text not null default 'active' check (status in ('active', 'locked', 'paid', 'cancelled')),
  winner_post_id uuid references public.posts(id) on delete set null,
  winner_user_id uuid references auth.users(id) on delete set null,
  score numeric not null default 0,
  created_at timestamptz not null default now(),
  locked_at timestamptz,
  unique (round_date, group_id)
);

alter table public.profiles add column if not exists referral_code text;
alter table public.profiles add column if not exists referred_by uuid references auth.users(id) on delete set null;
alter table public.profiles add column if not exists referral_count integer not null default 0;
alter table public.profiles add column if not exists growth_score integer not null default 0;

create unique index if not exists idx_profiles_referral_code on public.profiles(referral_code) where referral_code is not null;
create index if not exists idx_referrals_inviter on public.referrals(inviter_id, created_at desc);
create index if not exists idx_growth_events_user_created on public.growth_events(user_id, created_at desc);
create index if not exists idx_jackpot_rounds_date on public.jackpot_rounds(round_date desc);

create or replace function public.make_referral_code(user_id uuid)
returns text as $$
begin
  return lower(substr(replace(user_id::text, '-', ''), 1, 10));
end;
$$ language plpgsql immutable;

create or replace function public.ensure_referral_code(target_user_id uuid)
returns text as $$
declare
  code text;
begin
  code := public.make_referral_code(target_user_id);

  update public.profiles
  set referral_code = coalesce(referral_code, code)
  where id = target_user_id;

  return code;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.complete_referral(invited_id uuid, ref_code text)
returns void as $$
declare
  inviter uuid;
begin
  if invited_id is null or ref_code is null or length(trim(ref_code)) = 0 then
    return;
  end if;

  select id into inviter
  from public.profiles
  where referral_code = trim(ref_code)
  limit 1;

  if inviter is null or inviter = invited_id then
    return;
  end if;

  update public.profiles
  set referred_by = coalesce(referred_by, inviter)
  where id = invited_id;

  insert into public.referrals (inviter_id, invited_user_id, status, completed_at)
  values (inviter, invited_id, 'completed', now())
  on conflict (inviter_id, invited_user_id) do nothing;

  update public.profiles
  set
    referral_count = referral_count + 1,
    growth_score = growth_score + 100,
    xp = xp + 100
  where id = inviter;

  update public.profiles
  set
    growth_score = growth_score + 25,
    xp = xp + 25
  where id = invited_id;

  insert into public.growth_events (user_id, event_type, source, referrer_id, points)
  values
    (inviter, 'referral_completed', 'invite_link', invited_id, 100),
    (invited_id, 'joined_from_referral', 'invite_link', inviter, 25);

  insert into public.notifications (user_id, type, title, body, meta)
  values (
    inviter,
    'growth',
    'Kutsu toi uuden jäsenen 🚀',
    'Sait +100 XP ja growth-pisteitä.',
    jsonb_build_object('invited_user_id', invited_id)
  );
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.create_today_jackpot_round(target_group_id uuid default null)
returns uuid as $$
declare
  round_id uuid;
begin
  insert into public.jackpot_rounds (round_date, group_id)
  values (current_date, target_group_id)
  on conflict (round_date, group_id) do update set status = public.jackpot_rounds.status
  returning id into round_id;

  return round_id;
end;
$$ language plpgsql security definer set search_path = public;

alter table public.referrals enable row level security;
alter table public.growth_events enable row level security;
alter table public.jackpot_rounds enable row level security;

drop policy if exists "read own referrals" on public.referrals;
create policy "read own referrals"
on public.referrals for select
using (auth.uid() = inviter_id or auth.uid() = invited_user_id);

drop policy if exists "insert own growth events" on public.growth_events;
create policy "insert own growth events"
on public.growth_events for insert
with check (auth.uid() = user_id or user_id is null);

drop policy if exists "read own growth events" on public.growth_events;
create policy "read own growth events"
on public.growth_events for select
using (auth.uid() = user_id or user_id is null);

drop policy if exists "read jackpot rounds" on public.jackpot_rounds;
create policy "read jackpot rounds"
on public.jackpot_rounds for select
using (true);

-- Backfill referral codes for existing users.
update public.profiles
set referral_code = public.make_referral_code(id)
where referral_code is null;
