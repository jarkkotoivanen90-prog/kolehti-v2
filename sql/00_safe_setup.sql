-- KOLEHTI V2 SAFE SUPABASE SETUP
-- This file is safe to run multiple times.
-- Run this in Supabase SQL editor before policies/seed data.

create extension if not exists pgcrypto;

-- 1) CORE TABLES

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists active_group_id uuid;
alter table public.profiles add column if not exists xp integer not null default 0;
alter table public.profiles add column if not exists level integer not null default 1;
alter table public.profiles add column if not exists active_badge text not null default '🌱';
alter table public.profiles add column if not exists badges jsonb not null default '[]'::jsonb;
alter table public.profiles add column if not exists achievements jsonb not null default '[]'::jsonb;
alter table public.profiles add column if not exists achievement_score integer not null default 0;
alter table public.profiles add column if not exists next_goal text;
alter table public.profiles add column if not exists total_votes_given integer not null default 0;
alter table public.profiles add column if not exists total_posts_created integer not null default 0;
alter table public.profiles add column if not exists top3_count integer not null default 0;
alter table public.profiles add column if not exists first_place_count integer not null default 0;
alter table public.profiles add column if not exists user_streak integer not null default 0;
alter table public.profiles add column if not exists last_streak_date date;
alter table public.profiles add column if not exists last_seen_at timestamptz;
alter table public.profiles add column if not exists comeback_count integer not null default 0;
alter table public.profiles add column if not exists retention_score integer not null default 0;
alter table public.profiles add column if not exists leaderboard_points integer not null default 0;
alter table public.profiles add column if not exists leaderboard_best_rank integer;
alter table public.profiles add column if not exists daily_reward_date date;
alter table public.profiles add column if not exists daily_reward_streak integer not null default 0;
alter table public.profiles add column if not exists referral_code text;
alter table public.profiles add column if not exists referred_by uuid references auth.users(id) on delete set null;
alter table public.profiles add column if not exists referral_count integer not null default 0;
alter table public.profiles add column if not exists growth_score integer not null default 0;

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  owner_id uuid references auth.users(id) on delete set null,
  member_count integer not null default 0,
  total_points integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'member',
  active boolean not null default true,
  points integer not null default 0,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.group_members add column if not exists group_id uuid references public.groups(id) on delete cascade;
alter table public.group_members add column if not exists user_id uuid references auth.users(id) on delete cascade;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  group_id uuid references public.groups(id) on delete set null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.posts add column if not exists ai_score numeric not null default 50;
alter table public.posts add column if not exists ai_quality numeric not null default 50;
alter table public.posts add column if not exists ai_need numeric not null default 50;
alter table public.posts add column if not exists ai_clarity numeric not null default 50;
alter table public.posts add column if not exists ai_risk numeric not null default 0;
alter table public.posts add column if not exists ai_feedback jsonb not null default '{}'::jsonb;
alter table public.posts add column if not exists votes integer not null default 0;
alter table public.posts add column if not exists views integer not null default 0;
alter table public.posts add column if not exists viral_score numeric not null default 0;
alter table public.posts add column if not exists boost_score numeric not null default 0;
alter table public.posts add column if not exists boost_event_active boolean not null default false;
alter table public.posts add column if not exists boost_event_until timestamptz;
alter table public.posts add column if not exists boost_multiplier numeric not null default 1;
alter table public.posts add column if not exists status_label text;
alter table public.posts add column if not exists last_rank integer;
alter table public.posts add column if not exists best_rank integer;
alter table public.posts add column if not exists last_engaged_at timestamptz;
alter table public.posts add column if not exists is_daily_winner boolean not null default false;
alter table public.posts add column if not exists winner_date date;
alter table public.posts add column if not exists hidden boolean not null default false;

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  group_id uuid references public.groups(id) on delete set null,
  value integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text not null default 'info',
  title text not null default 'Ilmoitus',
  body text,
  read boolean not null default false,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.retention_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_winners (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  group_id uuid references public.groups(id) on delete set null,
  date date not null default current_date,
  score numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.boost_events (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  title text not null default '⚡ Boost käynnissä',
  multiplier numeric not null default 2,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null default now() + interval '10 minutes',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  event_type text not null,
  value numeric not null default 1,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid references auth.users(id) on delete cascade,
  invited_user_id uuid references auth.users(id) on delete set null,
  invited_email text,
  status text not null default 'pending',
  reward_xp integer not null default 100,
  reward_points integer not null default 100,
  created_at timestamptz not null default now(),
  completed_at timestamptz
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
  round_date date not null default current_date,
  group_id uuid references public.groups(id) on delete set null,
  title text not null default 'Päivän kierros',
  pot_label text not null default '1000 €',
  status text not null default 'active',
  winner_post_id uuid references public.posts(id) on delete set null,
  winner_user_id uuid references auth.users(id) on delete set null,
  score numeric not null default 0,
  created_at timestamptz not null default now(),
  locked_at timestamptz
);

-- 2) SAFE UNIQUE CONSTRAINTS / INDEXES

create unique index if not exists idx_profiles_referral_code
on public.profiles(referral_code)
where referral_code is not null;

create unique index if not exists idx_group_members_unique_user_group
on public.group_members(group_id, user_id);

create unique index if not exists idx_votes_unique_user_post
on public.votes(user_id, post_id);

create unique index if not exists idx_daily_winners_unique_date_group
on public.daily_winners(date, group_id);

create unique index if not exists idx_referrals_unique_inviter_invited
on public.referrals(inviter_id, invited_user_id)
where invited_user_id is not null;

create unique index if not exists idx_jackpot_rounds_unique_date_group
on public.jackpot_rounds(round_date, group_id);

create index if not exists idx_posts_group_created on public.posts(group_id, created_at desc);
create index if not exists idx_posts_score on public.posts(boost_score desc, ai_score desc, votes desc);
create index if not exists idx_votes_post on public.votes(post_id);
create index if not exists idx_votes_user on public.votes(user_id);
create index if not exists idx_notifications_user_created on public.notifications(user_id, created_at desc);
create index if not exists idx_retention_user_created on public.retention_events(user_id, created_at desc);
create index if not exists idx_daily_winners_date on public.daily_winners(date desc);
create index if not exists idx_boost_events_active_ends on public.boost_events(active, ends_at);
create index if not exists idx_user_events_user_created on public.user_events(user_id, created_at desc);
create index if not exists idx_referrals_inviter on public.referrals(inviter_id, created_at desc);
create index if not exists idx_growth_events_user_created on public.growth_events(user_id, created_at desc);
create index if not exists idx_jackpot_rounds_date on public.jackpot_rounds(round_date desc);

-- 3) FUNCTIONS / TRIGGERS

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_groups_updated_at on public.groups;
create trigger set_groups_updated_at
before update on public.groups
for each row execute function public.set_updated_at();

drop trigger if exists set_posts_updated_at on public.posts;
create trigger set_posts_updated_at
before update on public.posts
for each row execute function public.set_updated_at();

create or replace function public.make_referral_code(user_id uuid)
returns text as $$
begin
  return lower(substr(replace(user_id::text, '-', ''), 1, 10));
end;
$$ language plpgsql immutable;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    username,
    display_name,
    xp,
    level,
    referral_code
  ) values (
    new.id,
    split_part(new.email, '@', 1),
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    0,
    1,
    public.make_referral_code(new.id)
  )
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.update_group_member_count()
returns trigger as $$
begin
  update public.groups g
  set member_count = (
    select count(*)
    from public.group_members gm
    where gm.group_id = g.id and gm.active = true
  )
  where g.id = coalesce(new.group_id, old.group_id);

  return coalesce(new, old);
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists group_member_count_trigger on public.group_members;
create trigger group_member_count_trigger
after insert or update or delete on public.group_members
for each row execute function public.update_group_member_count();

create or replace function public.refresh_post_vote_count()
returns trigger as $$
begin
  update public.posts p
  set votes = (
    select coalesce(sum(value), 0)
    from public.votes v
    where v.post_id = p.id
  ),
  last_engaged_at = now()
  where p.id = coalesce(new.post_id, old.post_id);

  return coalesce(new, old);
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists refresh_post_vote_count_trigger on public.votes;
create trigger refresh_post_vote_count_trigger
after insert or update or delete on public.votes
for each row execute function public.refresh_post_vote_count();

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
     or id::text = trim(ref_code)
  limit 1;

  if inviter is null or inviter = invited_id then
    return;
  end if;

  update public.profiles
  set referred_by = coalesce(referred_by, inviter)
  where id = invited_id;

  insert into public.referrals (inviter_id, invited_user_id, status, completed_at)
  values (inviter, invited_id, 'completed', now())
  on conflict do nothing;

  update public.profiles
  set referral_count = referral_count + 1,
      growth_score = growth_score + 100,
      xp = xp + 100
  where id = inviter;

  update public.profiles
  set growth_score = growth_score + 25,
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
  on conflict do nothing;

  select id into round_id
  from public.jackpot_rounds
  where round_date = current_date
    and (
      group_id = target_group_id
      or (group_id is null and target_group_id is null)
    )
  limit 1;

  return round_id;
end;
$$ language plpgsql security definer set search_path = public;

-- 4) BACKFILL EXISTING USERS

insert into public.profiles (id, username, display_name, xp, level, referral_code)
select
  u.id,
  split_part(u.email, '@', 1),
  split_part(u.email, '@', 1),
  0,
  1,
  public.make_referral_code(u.id)
from auth.users u
on conflict (id) do nothing;

update public.profiles
set referral_code = public.make_referral_code(id)
where referral_code is null;

-- 5) ENABLE RLS

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.posts enable row level security;
alter table public.votes enable row level security;
alter table public.notifications enable row level security;
alter table public.retention_events enable row level security;
alter table public.daily_winners enable row level security;
alter table public.boost_events enable row level security;
alter table public.user_events enable row level security;
alter table public.referrals enable row level security;
alter table public.growth_events enable row level security;
alter table public.jackpot_rounds enable row level security;

-- 6) SAFE POLICIES

drop policy if exists "read profiles" on public.profiles;
create policy "read profiles" on public.profiles for select using (true);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles for update using (auth.uid() = id);

drop policy if exists "read groups" on public.groups;
create policy "read groups" on public.groups for select using (active = true);

drop policy if exists "create groups" on public.groups;
create policy "create groups" on public.groups for insert with check (auth.uid() is not null);

drop policy if exists "read group members" on public.group_members;
create policy "read group members" on public.group_members for select using (true);

drop policy if exists "join group" on public.group_members;
create policy "join group" on public.group_members for insert with check (auth.uid() = user_id);

drop policy if exists "update own membership" on public.group_members;
create policy "update own membership" on public.group_members for update using (auth.uid() = user_id);

drop policy if exists "read posts" on public.posts;
create policy "read posts" on public.posts for select using (hidden = false);

drop policy if exists "create own posts" on public.posts;
create policy "create own posts" on public.posts for insert with check (auth.uid() = user_id);

drop policy if exists "update own posts" on public.posts;
create policy "update own posts" on public.posts for update using (auth.uid() = user_id);

drop policy if exists "read votes" on public.votes;
create policy "read votes" on public.votes for select using (true);

drop policy if exists "create own vote" on public.votes;
create policy "create own vote" on public.votes for insert with check (auth.uid() = user_id);

drop policy if exists "read own notifications" on public.notifications;
create policy "read own notifications" on public.notifications for select using (auth.uid() = user_id);

drop policy if exists "update own notifications" on public.notifications;
create policy "update own notifications" on public.notifications for update using (auth.uid() = user_id);

drop policy if exists "create notifications" on public.notifications;
create policy "create notifications" on public.notifications for insert with check (true);

drop policy if exists "insert retention events" on public.retention_events;
create policy "insert retention events" on public.retention_events for insert with check (auth.uid() = user_id or user_id is null);

drop policy if exists "read own retention events" on public.retention_events;
create policy "read own retention events" on public.retention_events for select using (auth.uid() = user_id or user_id is null);

drop policy if exists "read daily winners" on public.daily_winners;
create policy "read daily winners" on public.daily_winners for select using (true);

drop policy if exists "read boost events" on public.boost_events;
create policy "read boost events" on public.boost_events for select using (true);

drop policy if exists "insert user events" on public.user_events;
create policy "insert user events" on public.user_events for insert with check (auth.uid() = user_id);

drop policy if exists "read own user events" on public.user_events;
create policy "read own user events" on public.user_events for select using (auth.uid() = user_id);

drop policy if exists "read own referrals" on public.referrals;
create policy "read own referrals" on public.referrals for select using (auth.uid() = inviter_id or auth.uid() = invited_user_id);

drop policy if exists "insert own growth events" on public.growth_events;
create policy "insert own growth events" on public.growth_events for insert with check (auth.uid() = user_id or user_id is null);

drop policy if exists "read own growth events" on public.growth_events;
create policy "read own growth events" on public.growth_events for select using (auth.uid() = user_id or user_id is null);

drop policy if exists "read jackpot rounds" on public.jackpot_rounds;
create policy "read jackpot rounds" on public.jackpot_rounds for select using (true);

-- 7) SEED DEFAULT GROUPS

insert into public.groups (name, description)
values
  ('Sisu', 'Ensimmäinen testiporukka'),
  ('Kipinä', 'Aktiivinen porukka'),
  ('Nousu', 'Kilpailuhenkinen porukka')
on conflict do nothing;
