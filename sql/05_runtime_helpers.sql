-- KOLEHTI V2 RUNTIME HELPERS
-- Run after 04_core_game_logic.sql. Safe to run multiple times.

create table if not exists public.app_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

insert into public.app_config (key, value)
values
  ('payments_enabled', 'false'),
  ('auto_winner_enabled', 'false'),
  ('stripe_live_enabled', 'false'),
  ('mock_payments_enabled', 'true')
on conflict (key) do nothing;

create or replace function public.get_config(p_key text)
returns text as $$
  select value from public.app_config where key = p_key;
$$ language sql stable;

create or replace function public.increment_boost_score(target_post_id uuid, target_user_id uuid, boost_value numeric, amount_cents integer)
returns numeric as $$
declare
  next_score numeric;
begin
  update public.posts
  set boost_score = coalesce(boost_score, 0) + coalesce(boost_value, 0),
      final_score = public.calculate_score(id)
  where id = target_post_id
  returning boost_score into next_score;

  update public.profiles
  set total_boost_spent = coalesce(total_boost_spent, 0) + coalesce(amount_cents, 0) / 100.0
  where id = target_user_id;

  return coalesce(next_score, 0);
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.run_daily_winner_lightweight(target_days integer default 7)
returns uuid as $$
declare
  winner record;
begin
  select p.id, p.user_id, p.final_score
  into winner
  from public.posts p
  join public.profiles u on u.id = p.user_id
  where p.created_at > now() - make_interval(days => greatest(1, coalesce(target_days, 7)))
    and p.hidden = false
    and (u.last_win_date is null or current_date - u.last_win_date > 3)
  order by p.final_score desc, p.created_at asc
  limit 1;

  if winner.id is null then
    return null;
  end if;

  insert into public.win_history(user_id, post_id, amount)
  values (winner.user_id, winner.id, 1000);

  update public.profiles
  set last_win_date = current_date,
      first_place_count = first_place_count + 1
  where id = winner.user_id;

  return winner.id;
end;
$$ language plpgsql security definer set search_path = public;

create or replace view public.latest_winners as
select
  wh.id,
  wh.user_id,
  wh.post_id,
  wh.amount,
  wh.created_at,
  p.content,
  p.final_score,
  pr.display_name,
  pr.username,
  pr.avatar_url
from public.win_history wh
left join public.posts p on p.id = wh.post_id
left join public.profiles pr on pr.id = wh.user_id
order by wh.created_at desc;

create or replace function public.record_retention_action(target_user_id uuid, action_type text, points integer default 10)
returns integer as $$
declare
  next_xp integer;
  today date := current_date;
begin
  insert into public.retention_events(user_id, event_type, meta)
  values (target_user_id, action_type, jsonb_build_object('points', points));

  update public.profiles
  set xp = coalesce(xp, 0) + greatest(0, coalesce(points, 0)),
      retention_score = coalesce(retention_score, 0) + greatest(0, coalesce(points, 0)),
      user_streak = case
        when last_streak_date = today then user_streak
        when last_streak_date = today - 1 then user_streak + 1
        else 1
      end,
      last_streak_date = today,
      last_seen_at = now(),
      level = greatest(1, floor((coalesce(xp, 0) + greatest(0, coalesce(points, 0))) / 250) + 1)
  where id = target_user_id
  returning xp into next_xp;

  perform public.kolehti_recalculate_trust(target_user_id);

  return coalesce(next_xp, 0);
end;
$$ language plpgsql security definer set search_path = public;

alter table public.app_config enable row level security;
drop policy if exists "app_config_readable" on public.app_config;
create policy "app_config_readable"
on public.app_config for select
using (true);
