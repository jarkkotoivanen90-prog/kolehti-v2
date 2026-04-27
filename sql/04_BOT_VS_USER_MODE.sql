-- KOLEHTI V2 BOT VS USER MODE
-- Run once in Supabase SQL editor.
-- Safe to run multiple times.

alter table public.bot_profiles add column if not exists score integer not null default 0;
alter table public.bot_profiles add column if not exists wins integer not null default 0;
alter table public.bot_profiles add column if not exists level integer not null default 1;
alter table public.bot_profiles add column if not exists avatar_emoji text not null default '🤖';
alter table public.bot_profiles add column if not exists last_active_at timestamptz;

alter table public.posts add column if not exists bot_id uuid references public.bot_profiles(id) on delete set null;
alter table public.posts add column if not exists bot_score integer not null default 0;
alter table public.posts add column if not exists challenge_mode boolean not null default false;
alter table public.posts add column if not exists challenge_label text;

create table if not exists public.bot_challenges (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid references public.bot_profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  group_id uuid,
  challenge_type text not null default 'bot_vs_user',
  bot_score integer not null default 0,
  user_score integer not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  ends_at timestamptz not null default now() + interval '24 hours'
);

alter table public.bot_challenges enable row level security;

drop policy if exists "read bot challenges" on public.bot_challenges;
create policy "read bot challenges"
on public.bot_challenges for select
using (true);

grant select on public.bot_challenges to anon;
grant select on public.bot_challenges to authenticated;
grant all on public.bot_challenges to service_role;

create index if not exists idx_bot_challenges_status_created
on public.bot_challenges(status, created_at desc);

create index if not exists idx_posts_bot_id_created
on public.posts(bot_id, created_at desc);

update public.bot_profiles
set avatar_emoji = case
  when name = 'SisuBot' then '🛡️'
  when name = 'KipinäBot' then '🔥'
  when name = 'TsemppiBot' then '💙'
  when name = 'RalliBot' then '🏎️'
  else '🤖'
end
where avatar_emoji is null or avatar_emoji = '🤖';
