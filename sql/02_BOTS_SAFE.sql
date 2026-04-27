-- KOLEHTI V2 SAFE BOT SYSTEM
-- Run once in Supabase SQL editor.
-- Safe to run multiple times.

alter table public.posts add column if not exists is_bot boolean not null default false;
alter table public.posts add column if not exists bot_name text;
alter table public.posts add column if not exists bot_persona text;
alter table public.posts add column if not exists bot_disclosure text;

create table if not exists public.bot_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  persona text not null,
  active boolean not null default true,
  tone text not null default 'supportive',
  created_at timestamptz not null default now()
);

alter table public.bot_profiles enable row level security;

drop policy if exists "read bot profiles" on public.bot_profiles;
create policy "read bot profiles"
on public.bot_profiles for select
using (active = true);

insert into public.bot_profiles (name, persona, tone)
select v.name, v.persona, v.tone
from (
  values
    ('SisuBot', 'Kannustaa käyttäjiä perustelemaan paremmin ja huomaa nousevat postaukset.', 'supportive'),
    ('KipinäBot', 'Nostaa esiin aktiivisuutta, ääniä ja yhteisöllisiä hetkiä.', 'energetic'),
    ('TsemppiBot', 'Kirjoittaa pehmeitä comeback- ja tsemppiviestejä.', 'warm'),
    ('RalliBot', 'Korostaa kilpailua, leaderboardia ja lähellä voittoa olevia postauksia.', 'competitive')
) as v(name, persona, tone)
where not exists (
  select 1 from public.bot_profiles b where b.name = v.name
);

grant select on public.bot_profiles to anon;
grant select on public.bot_profiles to authenticated;
grant all on public.bot_profiles to service_role;

create index if not exists idx_posts_bot_created on public.posts(is_bot, created_at desc);
create index if not exists idx_bot_profiles_active on public.bot_profiles(active);
