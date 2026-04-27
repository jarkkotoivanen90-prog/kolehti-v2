-- KOLEHTI V2 FULL SAFE SUPABASE SETUP
-- Safe to run multiple times.
-- Run this once in Supabase SQL Editor.

create extension if not exists pgcrypto;

-- =====================================================
-- 1) CORE TABLES
-- =====================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid()
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid()
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid()
);

create table if not exists public.retention_events (
  id uuid primary key default gen_random_uuid()
);

create table if not exists public.daily_winners (
  id uuid primary key default gen_random_uuid()
);

create table if not exists public.boost_events (
  id uuid primary key default gen_random_uuid()
);

create table if not exists public.user_events (
  id uuid primary key default gen_random_uuid()
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid()
);

create table if not exists public.growth_events (
  id uuid primary key default gen_random_uuid()
);

create table if not exists public.jackpot_rounds (
  id uuid primary key default gen_random_uuid()
);

create table if not exists public.reward_events (
  id uuid primary key default gen_random_uuid()
);

create table if not exists public.optimizer_runs (
  id uuid primary key default gen_random_uuid()
);

create table if not exists public.optimizer_weights (
  id uuid primary key default gen_random_uuid()
);

create table if not exists public.segment_stats (
  id uuid primary key default gen_random_uuid()
);

-- =====================================================
-- 2) SAFE COLUMNS
-- =====================================================

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
alter table public.profiles add column if not exists daily_reward_claimed_at date;
alter table public.profiles add column if not exists last_level_seen integer not null default 1;
alter table public.profiles add column if not exists reward_points integer not null default 0;
alter table public.profiles add column if not exists referral_code text;
alter table public.profiles add column if not exists referred_by uuid;
alter table public.profiles add column if not exists referral_count integer not null default 0;
alter table public.profiles add column if not exists growth_score integer not null default 0;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

alter table public.groups add column if not exists name text;
alter table public.groups add column if not exists description text;
alter table public.groups add column if not exists owner_id uuid;
alter table public.groups add column if not exists member_count integer not null default 0;
alter table public.groups add column if not exists total_points integer not null default 0;
alter table public.groups add column if not exists active boolean not null default true;
alter table public.groups add column if not exists created_at timestamptz not null default now();
alter table public.groups add column if not exists updated_at timestamptz not null default now();

alter table public.group_members add column if not exists group_id uuid;
alter table public.group_members add column if not exists user_id uuid;
alter table public.group_members add column if not exists role text not null default 'member';
alter table public.group_members add column if not exists active boolean not null default true;
alter table public.group_members add column if not exists points integer not null default 0;
alter table public.group_members add column if not exists joined_at timestamptz not null default now();
alter table public.group_members add column if not exists created_at timestamptz not null default now();

alter table public.posts add column if not exists user_id uuid;
alter table public.posts add column if not exists group_id uuid;
alter table public.posts add column if not exists content text;
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
alter table public.posts add column if not exists created_at timestamptz not null default now();
alter table public.posts add column if not exists updated_at timestamptz not null default now();

alter table public.votes add column if not exists post_id uuid;
alter table public.votes add column if not exists user_id uuid;
alter table public.votes add column if not exists group_id uuid;
alter table public.votes add column if not exists value integer not null default 1;
alter table public.votes add column if not exists created_at timestamptz not null default now();

alter table public.notifications add column if not exists user_id uuid;
alter table public.notifications add column if not exists type text not null default 'info';
alter table public.notifications add column if not exists title text not null default 'Ilmoitus';
alter table public.notifications add column if not exists body text;
alter table public.notifications add column if not exists read boolean not null default false;
alter table public.notifications add column if not exists meta jsonb not null default '{}'::jsonb;
alter table public.notifications add column if not exists created_at timestamptz not null default now();

alter table public.retention_events add column if not exists user_id uuid;
alter table public.retention_events add column if not exists event_type text not null default 'event';
alter table public.retention_events add column if not exists meta jsonb not null default '{}'::jsonb;
alter table public.retention_events add column if not exists created_at timestamptz not null default now();

alter table public.daily_winners add column if not exists post_id uuid;
alter table public.daily_winners add column if not exists user_id uuid;
alter table public.daily_winners add column if not exists group_id uuid;
alter table public.daily_winners add column if not exists date date not null default current_date;
alter table public.daily_winners add column if not exists score numeric not null default 0;
alter table public.daily_winners add column if not exists created_at timestamptz not null default now();

alter table public.boost_events add column if not exists post_id uuid;
alter table public.boost_events add column if not exists title text not null default '⚡ Boost käynnissä';
alter table public.boost_events add column if not exists multiplier numeric not null default 2;
alter table public.boost_events add column if not exists starts_at timestamptz not null default now();
alter table public.boost_events add column if not exists ends_at timestamptz not null default now() + interval '10 minutes';
alter table public.boost_events add column if not exists active boolean not null default true;
alter table public.boost_events add column if not exists created_at timestamptz not null default now();

alter table public.user_events add column if not exists user_id uuid;
alter table public.user_events add column if not exists post_id uuid;
alter table public.user_events add column if not exists event_type text not null default 'event';
alter table public.user_events add column if not exists value numeric not null default 1;
alter table public.user_events add column if not exists meta jsonb not null default '{}'::jsonb;
alter table public.user_events add column if not exists created_at timestamptz not null default now();

alter table public.referrals add column if not exists inviter_id uuid;
alter table public.referrals add column if not exists invited_user_id uuid;
alter table public.referrals add column if not exists referrer_id uuid;
alter table public.referrals add column if not exists invited_id uuid;
alter table public.referrals add column if not exists invited_email text;
alter table public.referrals add column if not exists referral_code text;
alter table public.referrals add column if not exists status text not null default 'pending';
alter table public.referrals add column if not exists reward_xp integer not null default 100;
alter table public.referrals add column if not exists reward_points integer not null default 100;
alter table public.referrals add column if not exists created_at timestamptz not null default now();
alter table public.referrals add column if not exists completed_at timestamptz;

alter table public.growth_events add column if not exists user_id uuid;
alter table public.growth_events add column if not exists event_type text not null default 'event';
alter table public.growth_events add column if not exists source text;
alter table public.growth_events add column if not exists referrer_id uuid;
alter table public.growth_events add column if not exists group_id uuid;
alter table public.growth_events add column if not exists points integer not null default 0;
alter table public.growth_events add column if not exists meta jsonb not null default '{}'::jsonb;
alter table public.growth_events add column if not exists created_at timestamptz not null default now();

alter table public.jackpot_rounds add column if not exists round_date date not null default current_date;
alter table public.jackpot_rounds add column if not exists group_id uuid;
alter table public.jackpot_rounds add column if not exists title text not null default 'Päivän kierros';
alter table public.jackpot_rounds add column if not exists pot_label text not null default '1000 €';
alter table public.jackpot_rounds add column if not exists status text not null default 'active';
alter table public.jackpot_rounds add column if not exists winner_post_id uuid;
alter table public.jackpot_rounds add column if not exists winner_user_id uuid;
alter table public.jackpot_rounds add column if not exists score numeric not null default 0;
alter table public.jackpot_rounds add column if not exists created_at timestamptz not null default now();
alter table public.jackpot_rounds add column if not exists locked_at timestamptz;

alter table public.reward_events add column if not exists user_id uuid;
alter table public.reward_events add column if not exists type text not null default 'reward';
alter table public.reward_events add column if not exists amount integer not null default 0;
alter table public.reward_events add column if not exists title text;
alter table public.reward_events add column if not exists meta jsonb not null default '{}'::jsonb;
alter table public.reward_events add column if not exists created_at timestamptz not null default now();

alter table public.optimizer_runs add column if not exists run_type text not null default 'scheduled';
alter table public.optimizer_runs add column if not exists window_hours integer not null default 72;
alter table public.optimizer_runs add column if not exists profiles_analyzed integer not null default 0;
alter table public.optimizer_runs add column if not exists events_analyzed integer not null default 0;
alter table public.optimizer_runs add column if not exists summary jsonb not null default '{}'::jsonb;
alter table public.optimizer_runs add column if not exists created_at timestamptz not null default now();

alter table public.optimizer_weights add column if not exists key text;
alter table public.optimizer_weights add column if not exists value numeric not null default 1;
alter table public.optimizer_weights add column if not exists reason text;
alter table public.optimizer_weights add column if not exists meta jsonb not null default '{}'::jsonb;
alter table public.optimizer_weights add column if not exists updated_at timestamptz not null default now();
alter table public.optimizer_weights add column if not exists created_at timestamptz not null default now();

alter table public.segment_stats add column if not exists segment text;
alter table public.segment_stats add column if not exists window_hours integer not null default 72;
alter table public.segment_stats add column if not exists users integer not null default 0;
alter table public.segment_stats add column if not exists events integer not null default 0;
alter table public.segment_stats add column if not exists votes integer not null default 0;
alter table public.segment_stats add column if not exists invites integer not null default 0;
alter table public.segment_stats add column if not exists impressions integer not null default 0;
alter table public.segment_stats add column if not exists notifications integer not null default 0;
alter table public.segment_stats add column if not exists score numeric not null default 0;
alter table public.segment_stats add column if not exists meta jsonb not null default '{}'::jsonb;
alter table public.segment_stats add column if not exists created_at timestamptz not null default now();

-- =====================================================
-- 3) INDEXES
-- =====================================================

create unique index if not exists idx_profiles_referral_code on public.profiles(referral_code) where referral_code is not null;
create unique index if not exists idx_group_members_unique_user_group on public.group_members(group_id, user_id) where group_id is not null and user_id is not null;
create unique index if not exists idx_votes_unique_user_post on public.votes(user_id, post_id) where user_id is not null and post_id is not null;
create unique index if not exists idx_daily_winners_unique_date_group on public.daily_winners(date, group_id);
create unique index if not exists idx_referrals_unique_inviter_invited on public.referrals(inviter_id, invited_user_id) where inviter_id is not null and invited_user_id is not null;
create unique index if not exists idx_jackpot_rounds_unique_date_group on public.jackpot_rounds(round_date, group_id);
create unique index if not exists idx_optimizer_weights_key_unique on public.optimizer_weights(key) where key is not null;

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
create index if not exists idx_reward_events_user_created on public.reward_events(user_id, created_at desc);
create index if not exists idx_optimizer_runs_created on public.optimizer_runs(created_at desc);
create index if not exists idx_segment_stats_segment_created on public.segment_stats(segment, created_at desc);

-- =====================================================
-- 4) FUNCTIONS
-- =====================================================

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.make_referral_code(user_id uuid)
returns text as $$
begin
  return lower(substr(replace(user_id::text, '-', ''), 1, 10));
end;
$$ language plpgsql immutable;

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

  insert into public.profiles (id, xp, level, referral_code)
  values (target_user_id, 0, 1, public.make_referral_code(target_user_id))
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
    jsonb_build_object('amount', xp_amount, 'reason', reason, 'new_xp', updated_profile.xp, 'new_level', updated_profile.level)
  );

  return updated_profile;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.increment_user_xp(uuid, integer, text) to authenticated;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, xp, level, referral_code)
  values (
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

create or replace function public.update_group_member_count()
returns trigger as $$
begin
  update public.groups g
  set member_count = (
    select count(*) from public.group_members gm where gm.group_id = g.id and gm.active = true
  )
  where g.id = coalesce(new.group_id, old.group_id);
  return coalesce(new, old);
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.refresh_post_vote_count()
returns trigger as $$
begin
  update public.posts p
  set votes = (select coalesce(sum(value), 0) from public.votes v where v.post_id = p.id),
      last_engaged_at = now()
  where p.id = coalesce(new.post_id, old.post_id);
  return coalesce(new, old);
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.complete_referral(invited_id uuid, ref_code text)
returns void as $$
declare
  inviter uuid;
begin
  if invited_id is null or ref_code is null or length(trim(ref_code)) = 0 then return; end if;

  select id into inviter
  from public.profiles
  where referral_code = trim(ref_code) or id::text = trim(ref_code)
  limit 1;

  if inviter is null or inviter = invited_id then return; end if;

  update public.profiles set referred_by = coalesce(referred_by, inviter) where id = invited_id;

  insert into public.referrals (inviter_id, invited_user_id, referrer_id, invited_id, referral_code, status, completed_at)
  values (inviter, invited_id, inviter, invited_id, ref_code, 'completed', now())
  on conflict do nothing;

  perform public.increment_user_xp(inviter, 100, 'referral_completed');
  perform public.increment_user_xp(invited_id, 25, 'joined_from_referral');

  update public.profiles
  set referral_count = referral_count + 1,
      growth_score = growth_score + 100
  where id = inviter;

  update public.profiles
  set growth_score = growth_score + 25
  where id = invited_id;

  insert into public.growth_events (user_id, event_type, source, referrer_id, points)
  values
    (inviter, 'referral_completed', 'invite_link', invited_id, 100),
    (invited_id, 'joined_from_referral', 'invite_link', inviter, 25);

  insert into public.notifications (user_id, type, title, body, meta)
  values (inviter, 'growth', 'Kutsu toi uuden jäsenen 🚀', 'Sait +100 XP ja growth-pisteitä.', jsonb_build_object('invited_user_id', invited_id));
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
    and (group_id = target_group_id or (group_id is null and target_group_id is null))
  limit 1;

  return round_id;
end;
$$ language plpgsql security definer set search_path = public;

-- =====================================================
-- 5) TRIGGERS
-- =====================================================

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists set_groups_updated_at on public.groups;
create trigger set_groups_updated_at before update on public.groups for each row execute function public.set_updated_at();

drop trigger if exists set_posts_updated_at on public.posts;
create trigger set_posts_updated_at before update on public.posts for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

drop trigger if exists group_member_count_trigger on public.group_members;
create trigger group_member_count_trigger after insert or update or delete on public.group_members for each row execute function public.update_group_member_count();

drop trigger if exists refresh_post_vote_count_trigger on public.votes;
create trigger refresh_post_vote_count_trigger after insert or update or delete on public.votes for each row execute function public.refresh_post_vote_count();

-- =====================================================
-- 6) BACKFILL
-- =====================================================

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

update public.profiles set referral_code = public.make_referral_code(id) where referral_code is null;
update public.profiles set level = public.get_level_from_xp(coalesce(xp, 0)) where level is null or level < 1;

-- =====================================================
-- 7) RLS + POLICIES
-- =====================================================

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
alter table public.reward_events enable row level security;
alter table public.optimizer_runs enable row level security;
alter table public.optimizer_weights enable row level security;
alter table public.segment_stats enable row level security;

drop policy if exists "read profiles" on public.profiles;
create policy "read profiles" on public.profiles for select using (true);

drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile" on public.profiles for insert with check (auth.uid() = id);

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
create policy "read own referrals" on public.referrals for select using (auth.uid() = inviter_id or auth.uid() = invited_user_id or auth.uid() = referrer_id or auth.uid() = invited_id);

drop policy if exists "insert own growth events" on public.growth_events;
create policy "insert own growth events" on public.growth_events for insert with check (auth.uid() = user_id or user_id is null);

drop policy if exists "read own growth events" on public.growth_events;
create policy "read own growth events" on public.growth_events for select using (auth.uid() = user_id or user_id is null);

drop policy if exists "read jackpot rounds" on public.jackpot_rounds;
create policy "read jackpot rounds" on public.jackpot_rounds for select using (true);

drop policy if exists "read own reward events" on public.reward_events;
create policy "read own reward events" on public.reward_events for select using (auth.uid() = user_id);

drop policy if exists "insert own reward events" on public.reward_events;
create policy "insert own reward events" on public.reward_events for insert with check (auth.uid() = user_id);

drop policy if exists "read optimizer runs" on public.optimizer_runs;
create policy "read optimizer runs" on public.optimizer_runs for select using (true);

drop policy if exists "read optimizer weights" on public.optimizer_weights;
create policy "read optimizer weights" on public.optimizer_weights for select using (true);

drop policy if exists "read segment stats" on public.segment_stats;
create policy "read segment stats" on public.segment_stats for select using (true);

-- =====================================================
-- 8) SEED DATA
-- =====================================================

insert into public.groups (name, description)
values
  ('Sisu', 'Ensimmäinen testiporukka'),
  ('Kipinä', 'Aktiivinen porukka'),
  ('Nousu', 'Kilpailuhenkinen porukka')
on conflict do nothing;

insert into public.optimizer_weights (key, value, reason, meta)
values
  ('vote_weight', 1, 'Default vote signal weight', '{}'::jsonb),
  ('invite_weight', 1, 'Default invite signal weight', '{}'::jsonb),
  ('impression_weight', 1, 'Default impression signal weight', '{}'::jsonb),
  ('notification_weight', 1, 'Default notification signal weight', '{}'::jsonb),
  ('freshness_weight', 1, 'Default freshness signal weight', '{}'::jsonb),
  ('quality_weight', 1, 'Default AI quality signal weight', '{}'::jsonb)
on conflict (key) do nothing;

-- DONE
