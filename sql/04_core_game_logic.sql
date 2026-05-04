-- KOLEHTI V2 CORE GAME LOGIC
-- Run after sql/01_schema.sql and sql/02_policies.sql.
-- Adds the missing monetization, trust, scoring and winner-balancing layer.

create extension if not exists pgcrypto;

-- 1) Profile extensions
alter table public.profiles
  add column if not exists trust_score numeric not null default 50,
  add column if not exists subscription_status text not null default 'free' check (subscription_status in ('free', 'active', 'past_due', 'cancelled')),
  add column if not exists subscription_until timestamptz,
  add column if not exists daily_entry_until timestamptz,
  add column if not exists total_boost_spent numeric not null default 0,
  add column if not exists suspicious_flags integer not null default 0,
  add column if not exists last_daily_win_date date,
  add column if not exists last_weekly_win_date date,
  add column if not exists last_monthly_win_date date,
  add column if not exists near_miss_count integer not null default 0;

-- 2) Post extensions
alter table public.posts
  add column if not exists final_score numeric not null default 0,
  add column if not exists community_score numeric not null default 0,
  add column if not exists engagement_score numeric not null default 0,
  add column if not exists random_factor numeric not null default 0,
  add column if not exists score_breakdown jsonb not null default '{}'::jsonb,
  add column if not exists media_url text,
  add column if not exists media_type text check (media_type is null or media_type in ('image', 'video')),
  add column if not exists image_url text,
  add column if not exists video_url text;

-- 3) Monetization records
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  post_id uuid references public.posts(id) on delete set null,
  payment_provider text not null default 'manual',
  provider_payment_id text,
  type text not null check (type in ('subscription', 'daily_entry', 'boost', 'video', 'extra_post')),
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'eur',
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.boost_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  boost_type text not null default 'daily' check (boost_type in ('daily', 'weekly', 'monthly')),
  sequence_number integer not null default 1,
  amount_cents integer not null check (amount_cents >= 0),
  boost_value numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.win_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  post_id uuid references public.posts(id) on delete set null,
  group_id uuid references public.groups(id) on delete set null,
  pot_type text not null check (pot_type in ('daily', 'weekly', 'monthly', 'quarterly')),
  amount_cents integer not null default 0,
  score numeric not null default 0,
  won_on date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists idx_payments_user_created on public.payments(user_id, created_at desc);
create index if not exists idx_payments_status_type on public.payments(status, type);
create index if not exists idx_boost_purchases_post_created on public.boost_purchases(post_id, created_at desc);
create index if not exists idx_boost_purchases_user_created on public.boost_purchases(user_id, created_at desc);
create index if not exists idx_win_history_user_type on public.win_history(user_id, pot_type, won_on desc);
create index if not exists idx_posts_final_score on public.posts(final_score desc, created_at desc);

-- 4) Pot caps and scaling helpers
create or replace function public.kolehti_pot_amount_cents(member_count integer, pot_type text)
returns integer as $$
declare
  players integer := greatest(0, coalesce(member_count, 0));
  group_max integer := 1500;
  fill_ratio numeric := least(1, players::numeric / group_max::numeric);
  max_amount integer;
begin
  max_amount := case pot_type
    when 'daily' then 100000       -- 1000 €
    when 'weekly' then 300000      -- 3000 €
    when 'monthly' then 500000     -- 5000 €
    when 'quarterly' then 800000   -- 8000 €
    else 0
  end;

  return floor(max_amount * fill_ratio)::integer;
end;
$$ language plpgsql stable;

-- 5) Boost pricing: progressive + capped by type
create or replace function public.kolehti_boost_price_cents(boost_type text, sequence_number integer)
returns integer as $$
declare
  n integer := greatest(1, coalesce(sequence_number, 1));
begin
  if boost_type = 'daily' then
    if n > 1 then raise exception 'Daily boost limit exceeded'; end if;
    return 199;
  elsif boost_type = 'weekly' then
    if n > 2 then raise exception 'Weekly boost limit exceeded'; end if;
    return case n when 1 then 299 when 2 then 599 end;
  elsif boost_type = 'monthly' then
    if n > 6 then raise exception 'Monthly boost limit exceeded'; end if;
    return case n
      when 1 then 399
      when 2 then 699
      when 3 then 1199
      when 4 then 1799
      when 5 then 2499
      when 6 then 3999
    end;
  end if;

  raise exception 'Unknown boost type: %', boost_type;
end;
$$ language plpgsql stable;

create or replace function public.kolehti_boost_value(amount_cents integer)
returns numeric as $$
begin
  -- Diminishing returns: spending more helps, but never linearly buys the win.
  return ln(1 + greatest(0, coalesce(amount_cents, 0))::numeric / 100.0);
end;
$$ language plpgsql immutable;

-- 6) Trust modifier and win balancing
create or replace function public.kolehti_trust_modifier(trust numeric)
returns numeric as $$
begin
  return 0.8 + least(100, greatest(0, coalesce(trust, 50))) / 200.0;
end;
$$ language plpgsql immutable;

create or replace function public.kolehti_win_penalty(
  last_daily date,
  last_weekly date,
  last_monthly date,
  pot_type text default 'daily'
)
returns numeric as $$
declare
  penalty numeric := 1;
begin
  if last_monthly is not null and current_date - last_monthly <= 30 then
    penalty := least(penalty, 0.60);
  end if;

  if last_weekly is not null and current_date - last_weekly <= 14 then
    penalty := least(penalty, 0.75);
  end if;

  if last_daily is not null and current_date - last_daily <= 30 then
    penalty := least(penalty, case when pot_type = 'daily' then 0.70 else 0.90 end);
  end if;

  return penalty;
end;
$$ language plpgsql stable;

create or replace function public.kolehti_near_miss_modifier(best_rank integer, near_misses integer)
returns numeric as $$
declare
  rank_bonus numeric := 0;
  miss_bonus numeric := least(0.10, greatest(0, coalesce(near_misses, 0)) * 0.02);
begin
  if best_rank is not null and best_rank <= 5 then
    rank_bonus := 0.10;
  elsif best_rank is not null and best_rank <= 10 then
    rank_bonus := 0.05;
  end if;

  return 1 + rank_bonus + miss_bonus;
end;
$$ language plpgsql stable;

-- 7) Final score calculation
create or replace function public.kolehti_calculate_post_score(target_post_id uuid, pot_type text default 'daily')
returns numeric as $$
declare
  p public.posts%rowtype;
  u public.profiles%rowtype;
  ai numeric;
  community numeric;
  engagement numeric;
  boost numeric;
  random_part numeric;
  base numeric;
  trust_mod numeric;
  win_mod numeric;
  near_mod numeric;
  final numeric;
begin
  select * into p from public.posts where id = target_post_id and hidden = false;
  if p.id is null then return 0; end if;

  select * into u from public.profiles where id = p.user_id;
  if u.id is null then return 0; end if;

  ai := least(100, greatest(0, coalesce(p.ai_score, 50)));
  community := least(100, greatest(0, coalesce(p.votes, 0) * 8));
  engagement := least(100, greatest(0, coalesce(p.views, 0) * 0.7 + coalesce(p.viral_score, 0)));
  boost := least(100, greatest(0, coalesce(p.boost_score, 0) * 10));
  random_part := random() * 5;

  base :=
    0.40 * ai +
    0.25 * community +
    0.20 * engagement +
    0.10 * boost +
    0.05 * random_part;

  trust_mod := public.kolehti_trust_modifier(u.trust_score);
  win_mod := public.kolehti_win_penalty(u.last_daily_win_date, u.last_weekly_win_date, u.last_monthly_win_date, pot_type);
  near_mod := public.kolehti_near_miss_modifier(u.leaderboard_best_rank, u.near_miss_count);
  final := base * trust_mod * win_mod * near_mod;

  update public.posts
  set final_score = final,
      community_score = community,
      engagement_score = engagement,
      random_factor = random_part,
      score_breakdown = jsonb_build_object(
        'ai', ai,
        'community', community,
        'engagement', engagement,
        'boost', boost,
        'random', random_part,
        'base', base,
        'trust_modifier', trust_mod,
        'win_modifier', win_mod,
        'near_miss_modifier', near_mod,
        'final', final
      )
  where id = target_post_id;

  return final;
end;
$$ language plpgsql security definer set search_path = public;

-- 8) Trust score recalculation
create or replace function public.kolehti_recalculate_trust(target_user_id uuid)
returns numeric as $$
declare
  p public.profiles%rowtype;
  score numeric;
begin
  select * into p from public.profiles where id = target_user_id;
  if p.id is null then return 50; end if;

  score := 50
    + least(20, coalesce(p.total_votes_given, 0) * 0.15)
    + least(15, coalesce(p.total_posts_created, 0) * 0.50)
    + least(15, coalesce(p.user_streak, 0) * 1.00)
    + least(15, coalesce(p.retention_score, 0) * 0.05)
    + least(10, coalesce(p.referral_count, 0) * 1.00)
    - least(40, coalesce(p.suspicious_flags, 0) * 10.0);

  score := least(100, greatest(0, score));

  update public.profiles set trust_score = score where id = target_user_id;
  return score;
end;
$$ language plpgsql security definer set search_path = public;

-- 9) Daily winner selection, idempotent per date and group
create or replace function public.kolehti_run_daily_winner(target_group_id uuid default null, target_date date default current_date)
returns uuid as $$
declare
  winner record;
  member_count integer;
  amount integer;
  round_id uuid;
begin
  select count(*) into member_count
  from public.group_members
  where active = true and (target_group_id is null or group_id = target_group_id);

  amount := public.kolehti_pot_amount_cents(member_count, 'daily');
  round_id := public.create_today_jackpot_round(target_group_id);

  perform public.kolehti_calculate_post_score(id, 'daily')
  from public.posts
  where hidden = false
    and created_at::date = target_date
    and (target_group_id is null or group_id = target_group_id);

  select p.* into winner
  from public.posts p
  where p.hidden = false
    and p.created_at::date = target_date
    and (target_group_id is null or p.group_id = target_group_id)
  order by p.final_score desc, p.created_at asc
  limit 1;

  if winner.id is null then
    update public.jackpot_rounds set status = 'cancelled', locked_at = now() where id = round_id;
    return null;
  end if;

  insert into public.daily_winners (post_id, user_id, group_id, date, score)
  values (winner.id, winner.user_id, winner.group_id, target_date, winner.final_score)
  on conflict (date, group_id) do update
  set post_id = excluded.post_id,
      user_id = excluded.user_id,
      score = excluded.score
  returning id into round_id;

  insert into public.win_history (user_id, post_id, group_id, pot_type, amount_cents, score, won_on)
  values (winner.user_id, winner.id, winner.group_id, 'daily', amount, winner.final_score, target_date);

  update public.posts
  set is_daily_winner = true,
      winner_date = target_date
  where id = winner.id;

  update public.profiles
  set last_daily_win_date = target_date,
      first_place_count = first_place_count + 1
  where id = winner.user_id;

  update public.jackpot_rounds
  set status = 'locked',
      winner_post_id = winner.id,
      winner_user_id = winner.user_id,
      score = winner.final_score,
      locked_at = now()
  where round_date = target_date
    and (group_id is not distinct from target_group_id);

  -- Near-miss tracking: reward top 2-5 with future balancing, not money.
  update public.profiles pr
  set near_miss_count = near_miss_count + 1,
      top3_count = case when ranked.rank <= 3 then top3_count + 1 else top3_count end,
      leaderboard_best_rank = case
        when leaderboard_best_rank is null then ranked.rank
        else least(leaderboard_best_rank, ranked.rank)
      end
  from (
    select user_id, row_number() over (order by final_score desc, created_at asc)::int as rank
    from public.posts
    where hidden = false
      and created_at::date = target_date
      and (target_group_id is null or group_id = target_group_id)
    order by final_score desc, created_at asc
    limit 5
  ) ranked
  where pr.id = ranked.user_id
    and ranked.user_id <> winner.user_id;

  return winner.id;
end;
$$ language plpgsql security definer set search_path = public;

-- 10) RLS additions for new tables
alter table public.payments enable row level security;
alter table public.boost_purchases enable row level security;
alter table public.win_history enable row level security;

create policy if not exists "users can read own payments"
  on public.payments for select
  to authenticated
  using (user_id = auth.uid());

create policy if not exists "users can read own boost purchases"
  on public.boost_purchases for select
  to authenticated
  using (user_id = auth.uid());

create policy if not exists "win history is readable"
  on public.win_history for select
  using (true);
