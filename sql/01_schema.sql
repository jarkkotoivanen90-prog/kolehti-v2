-- KOLEHTI V2 DATABASE SCHEMA
-- Run first in Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  display_name text,
  avatar_url text,
  active_group_id uuid,
  xp integer not null default 0,
  level integer not null default 1,
  active_badge text not null default '🌱',
  badges jsonb not null default '[]'::jsonb,
  achievements jsonb not null default '[]'::jsonb,
  achievement_score integer not null default 0,
  next_goal text,
  total_votes_given integer not null default 0,
  total_posts_created integer not null default 0,
  top3_count integer not null default 0,
  first_place_count integer not null default 0,
  user_streak integer not null default 0,
  last_streak_date date,
  last_seen_at timestamptz,
  comeback_count integer not null default 0,
  retention_score integer not null default 0,
  leaderboard_points integer not null default 0,
  leaderboard_best_rank integer,
  daily_reward_date date,
  daily_reward_streak integer not null default 0,
  referral_code text,
  referred_by uuid references auth.users(id) on delete set null,
  referral_count integer not null default 0,
  growth_score integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  active boolean not null default true,
  points integer not null default 0,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  group_id uuid references public.groups(id) on delete set null,
  content text not null check (char_length(content) between 1 and 2000),
  ai_score numeric not null default 50,
  ai_quality numeric not null default 50,
  ai_need numeric not null default 50,
  ai_clarity numeric not null default 50,
  ai_risk numeric not null default 0,
  ai_feedback jsonb not null default '{}'::jsonb,
  votes integer not null default 0,
  views integer not null default 0,
  viral_score numeric not null default 0,
  boost_score numeric not null default 0,
  boost_event_active boolean not null default false,
  boost_event_until timestamptz,
  boost_multiplier numeric not null default 1,
  status_label text,
  last_rank integer,
  best_rank integer,
  last_engaged_at timestamptz,
  is_daily_winner boolean not null default false,
  winner_date date,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid references public.groups(id) on delete set null,
  value integer not null default 1 check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'info',
  title text not null,
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
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  group_id uuid references public.groups(id) on delete set null,
  date date not null,
  score numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (date, group_id)
);

create table if not exists public.boost_events (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  title text not null default '⚡ Boost käynnissä',
  multiplier numeric not null default 2,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
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

create unique index if not exists idx_profiles_referral_code on public.profiles(referral_code) where referral_code is not null;
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

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists set_groups_updated_at on public.groups;
create trigger set_groups_updated_at before update on public.groups for each row execute function public.set_updated_at();

drop trigger if exists set_posts_updated_at on public.posts;
create trigger set_posts_updated_at before update on public.posts for each row execute function public.set_updated_at();

create or replace function public.make_referral_code(user_id uuid)
returns text as $$
begin
  return lower(substr(replace(user_id::text, '-', ''), 1, 10));
end;
$$ language plpgsql immutable;

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

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

drop trigger if exists group_member_count_trigger on public.group_members;
create trigger group_member_count_trigger after insert or update or delete on public.group_members for each row execute function public.update_group_member_count();

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

drop trigger if exists refresh_post_vote_count_trigger on public.votes;
create trigger refresh_post_vote_count_trigger after insert or update or delete on public.votes for each row execute function public.refresh_post_vote_count();

create or replace function public.complete_referral(invited_id uuid, ref_code text)
returns void as $$
declare
  inviter uuid;
begin
  if invited_id is null or ref_code is null or length(trim(ref_code)) = 0 then return; end if;

  select id into inviter from public.profiles where referral_code = trim(ref_code) or id::text = trim(ref_code) limit 1;
  if inviter is null or inviter = invited_id then return; end if;

  update public.profiles set referred_by = coalesce(referred_by, inviter) where id = invited_id;

  insert into public.referrals (inviter_id, invited_user_id, status, completed_at)
  values (inviter, invited_id, 'completed', now())
  on conflict (inviter_id, invited_user_id) do nothing;

  update public.profiles set referral_count = referral_count + 1, growth_score = growth_score + 100, xp = xp + 100 where id = inviter;
  update public.profiles set growth_score = growth_score + 25, xp = xp + 25 where id = invited_id;

  insert into public.growth_events (user_id, event_type, source, referrer_id, points)
  values (inviter, 'referral_completed', 'invite_link', invited_id, 100),
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
  on conflict (round_date, group_id) do update set status = public.jackpot_rounds.status
  returning id into round_id;
  return round_id;
end;
$$ language plpgsql security definer set search_path = public;

update public.profiles set referral_code = public.make_referral_code(id) where referral_code is null;
