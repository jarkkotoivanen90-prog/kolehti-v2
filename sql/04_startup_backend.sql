-- KOLEHTI startup backend: groups, AI ranking, support-pot winner logic.
-- Run after 01_schema.sql, 02_policies.sql and 03_seed.sql.
-- Product framing: community support distribution based on reasons, votes and engagement.

create extension if not exists pgcrypto;

alter table public.groups add column if not exists capacity integer not null default 1500;
alter table public.groups add column if not exists region text;
alter table public.groups add column if not exists season_id uuid;

alter table public.posts add column if not exists shares integer not null default 0;
alter table public.posts add column if not exists xp_score numeric not null default 0;
alter table public.posts add column if not exists support_score numeric not null default 0;
alter table public.posts add column if not exists ai_empathy numeric not null default 50;
alter table public.posts add column if not exists ai_specificity numeric not null default 50;
alter table public.posts add column if not exists ai_fairness numeric not null default 50;
alter table public.posts add column if not exists monthly_win_count integer not null default 0;

create table if not exists public.kolehti_user_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  event_name text not null check (event_name in ('view','skip','like','share','vote','open','watch')),
  signal_weight numeric not null default 1,
  group_id uuid references public.groups(id) on delete set null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.kolehti_pot_rules (
  id uuid primary key default gen_random_uuid(),
  period text not null check (period in ('daily','weekly','monthly','final')),
  max_amount_cents integer not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (period)
);

create table if not exists public.kolehti_payouts (
  id uuid primary key default gen_random_uuid(),
  period text not null check (period in ('daily','weekly','monthly','final')),
  payout_date date not null default current_date,
  group_id uuid references public.groups(id) on delete set null,
  winner_user_id uuid references auth.users(id) on delete set null,
  winner_post_id uuid references public.posts(id) on delete set null,
  amount_cents integer not null default 0,
  score numeric not null default 0,
  reason text,
  status text not null default 'pending' check (status in ('pending','approved','paid','cancelled')),
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (period, payout_date, group_id)
);

insert into public.kolehti_pot_rules (period, max_amount_cents)
values ('daily', 100000), ('weekly', 300000), ('monthly', 500000), ('final', 0)
on conflict (period) do update set max_amount_cents = excluded.max_amount_cents, active = true;

create index if not exists idx_kolehti_memory_user_created on public.kolehti_user_memory(user_id, created_at desc);
create index if not exists idx_kolehti_memory_post_created on public.kolehti_user_memory(post_id, created_at desc);
create index if not exists idx_posts_support_score on public.posts(support_score desc, created_at desc);
create index if not exists idx_kolehti_payouts_period_date on public.kolehti_payouts(period, payout_date desc);

create or replace function public.ensure_kolehti_group()
returns uuid as $$
declare
  candidate uuid;
  group_names text[] := array['Aino','Eino','Helmi','Onni','Sisu','Aava','Ilmari','Kerttu','Otso','Vieno','Lempi','Toivo'];
  picked_name text;
begin
  select id into candidate
  from public.groups
  where active = true and member_count < coalesce(capacity, 1500)
  order by member_count asc, created_at asc
  limit 1;

  if candidate is not null then return candidate; end if;

  picked_name := group_names[1 + floor(random() * array_length(group_names, 1))::int] || ' ' || to_char(now(), 'YYMMDD-HH24MI');

  insert into public.groups (name, description, capacity, active)
  values (picked_name, 'KOLEHTI-yhteisöryhmä: jäsenet sekoitetaan ympäri Suomea.', 1500, true)
  returning id into candidate;

  return candidate;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.join_kolehti_group(target_user_id uuid default auth.uid())
returns uuid as $$
declare
  group_id uuid;
begin
  if target_user_id is null then raise exception 'missing user'; end if;

  select gm.group_id into group_id
  from public.group_members gm
  join public.groups g on g.id = gm.group_id
  where gm.user_id = target_user_id and gm.active = true and g.active = true
  limit 1;

  if group_id is not null then return group_id; end if;

  group_id := public.ensure_kolehti_group();

  insert into public.group_members (group_id, user_id, role, active)
  values (group_id, target_user_id, 'member', true)
  on conflict (group_id, user_id) do update set active = true;

  update public.profiles set active_group_id = group_id where id = target_user_id;
  return group_id;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.kolehti_calculate_support_score(p public.posts)
returns numeric as $$
declare
  recency numeric;
  fairness_penalty numeric;
  score numeric;
begin
  recency := greatest(0, 24 - extract(epoch from (now() - p.created_at)) / 3600) / 24;
  fairness_penalty := case when coalesce(p.monthly_win_count, 0) > 0 then 0.72 else 1 end;

  score := (
    coalesce(p.ai_need, 50) * 0.24 +
    coalesce(p.ai_empathy, p.ai_quality, 50) * 0.18 +
    coalesce(p.ai_specificity, p.ai_clarity, 50) * 0.16 +
    coalesce(p.ai_fairness, 50) * 0.14 +
    coalesce(p.votes, 0) * 4.0 +
    coalesce(p.shares, 0) * 8.0 +
    coalesce(p.views, 0) * 0.18 +
    coalesce(p.boost_score, 0) * 0.35 +
    recency * 18
  ) * fairness_penalty - coalesce(p.ai_risk, 0) * 0.65;

  return greatest(0, round(score, 2));
end;
$$ language plpgsql stable;

create or replace function public.refresh_kolehti_support_scores(target_group_id uuid default null)
returns integer as $$
declare
  changed integer;
begin
  update public.posts p
  set support_score = public.kolehti_calculate_support_score(p),
      xp_score = coalesce(p.votes, 0) * 10 + coalesce(p.shares, 0) * 30 + coalesce(p.views, 0) * 0.5 + coalesce(p.boost_score, 0),
      updated_at = now()
  where p.hidden = false and (target_group_id is null or p.group_id = target_group_id);

  get diagnostics changed = row_count;
  return changed;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.record_kolehti_user_memory(target_post_id uuid, event_name text, signal_weight numeric default 1, meta jsonb default '{}'::jsonb)
returns void as $$
declare
  uid uuid := auth.uid();
  gid uuid;
  xp_delta integer := 0;
begin
  if uid is null or target_post_id is null then return; end if;
  select group_id into gid from public.posts where id = target_post_id;

  insert into public.kolehti_user_memory (user_id, post_id, event_name, signal_weight, group_id, meta)
  values (uid, target_post_id, event_name, signal_weight, gid, coalesce(meta, '{}'::jsonb));

  xp_delta := case event_name
    when 'like' then 8
    when 'vote' then 12
    when 'share' then 25
    when 'watch' then greatest(1, least(20, signal_weight::integer))
    when 'skip' then -2
    else 1
  end;

  update public.profiles set xp = greatest(0, xp + xp_delta), leaderboard_points = greatest(0, leaderboard_points + xp_delta), updated_at = now() where id = uid;
  update public.group_members set points = greatest(0, points + xp_delta) where user_id = uid and active = true;

  if event_name = 'share' then
    update public.posts set shares = shares + 1, last_engaged_at = now() where id = target_post_id;
  elsif event_name = 'view' or event_name = 'watch' then
    update public.posts set views = views + 1, last_engaged_at = now() where id = target_post_id;
  end if;

  perform public.refresh_kolehti_support_scores(gid);
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.get_kolehti_startup_feed(match_count integer default 80)
returns table (
  id uuid,
  user_id uuid,
  group_id uuid,
  content text,
  ai_score numeric,
  ai_quality numeric,
  ai_need numeric,
  ai_clarity numeric,
  ai_risk numeric,
  ai_feedback jsonb,
  votes integer,
  views integer,
  shares integer,
  viral_score numeric,
  boost_score numeric,
  support_score numeric,
  xp_score numeric,
  display_name text,
  username text,
  created_at timestamptz,
  rank_reason text
) as $$
declare
  gid uuid;
begin
  gid := public.join_kolehti_group(auth.uid());
  perform public.refresh_kolehti_support_scores(gid);

  return query
  select
    p.id, p.user_id, p.group_id, p.content,
    p.ai_score, p.ai_quality, p.ai_need, p.ai_clarity, p.ai_risk, p.ai_feedback,
    p.votes, p.views, p.shares, p.viral_score, p.boost_score, p.support_score, p.xp_score,
    pr.display_name, pr.username, p.created_at,
    case
      when p.support_score >= 90 then 'Yhteisön tukisignaali vahva'
      when p.ai_need >= 75 then 'AI arvioi tarpeen kiireelliseksi'
      when p.votes >= 5 then 'Yhteisö reagoi tähän'
      when p.shares >= 2 then 'Jakojen kautta nousussa'
      else 'Tasapainottaa feediä'
    end as rank_reason
  from public.posts p
  left join public.profiles pr on pr.id = p.user_id
  where p.hidden = false and (gid is null or p.group_id = gid or p.group_id is null)
  order by p.support_score desc, p.created_at desc
  limit greatest(1, least(match_count, 120));
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.select_daily_support_winner(target_group_id uuid default null, target_date date default current_date)
returns uuid as $$
declare
  winner public.posts%rowtype;
  amount_cents integer;
  eligible_count integer;
begin
  perform public.refresh_kolehti_support_scores(target_group_id);

  select count(distinct v.user_id) into eligible_count
  from public.votes v
  join public.posts p on p.id = v.post_id
  where date(v.created_at) = target_date and (target_group_id is null or p.group_id = target_group_id);

  select * into winner
  from public.posts p
  where p.hidden = false
    and date(p.created_at) <= target_date
    and (target_group_id is null or p.group_id = target_group_id)
    and exists (
      select 1 from public.votes v where v.user_id = p.user_id and date(v.created_at) = target_date
    )
  order by p.support_score desc, p.created_at asc
  limit 1;

  if winner.id is null then return null; end if;

  select max_amount_cents into amount_cents from public.kolehti_pot_rules where period = 'daily' and active = true limit 1;
  amount_cents := least(coalesce(amount_cents, 100000), greatest(0, eligible_count * 100));

  insert into public.kolehti_payouts (period, payout_date, group_id, winner_user_id, winner_post_id, amount_cents, score, reason, meta)
  values ('daily', target_date, winner.group_id, winner.user_id, winner.id, amount_cents, winner.support_score, 'AI + yhteisön tukisignaalit', jsonb_build_object('eligible_voters', eligible_count))
  on conflict (period, payout_date, group_id) do update
    set winner_user_id = excluded.winner_user_id,
        winner_post_id = excluded.winner_post_id,
        amount_cents = excluded.amount_cents,
        score = excluded.score,
        reason = excluded.reason,
        meta = excluded.meta;

  insert into public.daily_winners (post_id, user_id, group_id, date, score)
  values (winner.id, winner.user_id, winner.group_id, target_date, winner.support_score)
  on conflict (date, group_id) do update set post_id = excluded.post_id, user_id = excluded.user_id, score = excluded.score;

  update public.posts set is_daily_winner = true, winner_date = target_date, monthly_win_count = monthly_win_count + 1 where id = winner.id;
  return winner.id;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.select_weekly_like_winner(target_group_id uuid default null, week_start date default date_trunc('week', current_date)::date)
returns uuid as $$
declare
  winner public.posts%rowtype;
  amount_cents integer;
begin
  select * into winner
  from public.posts p
  where p.hidden = false
    and p.created_at::date >= week_start
    and p.created_at::date < week_start + 7
    and (target_group_id is null or p.group_id = target_group_id)
  order by p.votes desc, p.support_score desc
  limit 1;

  if winner.id is null then return null; end if;
  select max_amount_cents into amount_cents from public.kolehti_pot_rules where period = 'weekly' and active = true limit 1;

  insert into public.kolehti_payouts (period, payout_date, group_id, winner_user_id, winner_post_id, amount_cents, score, reason)
  values ('weekly', week_start + 6, winner.group_id, winner.user_id, winner.id, coalesce(amount_cents, 300000), winner.votes, 'Viikon eniten yhteisöääniä saanut perustelu')
  on conflict (period, payout_date, group_id) do update set winner_user_id = excluded.winner_user_id, winner_post_id = excluded.winner_post_id, amount_cents = excluded.amount_cents, score = excluded.score, reason = excluded.reason;

  return winner.id;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.select_monthly_xp_winner(target_group_id uuid default null, month_start date default date_trunc('month', current_date)::date)
returns uuid as $$
declare
  winner_id uuid;
  amount_cents integer;
  score numeric;
begin
  select p.id, p.leaderboard_points into winner_id, score
  from public.profiles p
  left join public.group_members gm on gm.user_id = p.id and gm.active = true
  where target_group_id is null or gm.group_id = target_group_id
  order by p.leaderboard_points desc, p.xp desc
  limit 1;

  if winner_id is null then return null; end if;
  select max_amount_cents into amount_cents from public.kolehti_pot_rules where period = 'monthly' and active = true limit 1;

  insert into public.kolehti_payouts (period, payout_date, group_id, winner_user_id, amount_cents, score, reason)
  values ('monthly', (month_start + interval '1 month - 1 day')::date, target_group_id, winner_id, coalesce(amount_cents, 500000), coalesce(score, 0), 'Kuukauden XP-yhteisöaktiivisuus')
  on conflict (period, payout_date, group_id) do update set winner_user_id = excluded.winner_user_id, amount_cents = excluded.amount_cents, score = excluded.score, reason = excluded.reason;

  return winner_id;
end;
$$ language plpgsql security definer set search_path = public;

notify pgrst, 'reload schema';
