-- KOLEHTI V2 COMPETITION RULES
-- Safe to run multiple times.

alter table public.posts add column if not exists paid_day_entry boolean not null default false;
alter table public.posts add column if not exists eligible_weekly boolean not null default true;
alter table public.posts add column if not exists eligible_monthly boolean not null default true;
alter table public.posts add column if not exists entry_type text not null default 'weekly_free';

alter table public.profiles add column if not exists winner_week date;
alter table public.profiles add column if not exists winner_month date;
alter table public.profiles add column if not exists weekly_win_count integer not null default 0;
alter table public.profiles add column if not exists monthly_win_count integer not null default 0;

create table if not exists public.competition_winners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  post_id uuid references public.posts(id) on delete set null,
  group_id uuid,
  period_type text not null,
  period_start date not null,
  period_end date not null,
  votes integer not null default 0,
  reward_label text,
  created_at timestamptz not null default now(),
  unique(period_type, period_start)
);

alter table public.competition_winners enable row level security;

drop policy if exists "read competition winners" on public.competition_winners;
create policy "read competition winners"
on public.competition_winners for select
using (true);

grant select on public.competition_winners to anon;
grant select on public.competition_winners to authenticated;
grant all on public.competition_winners to service_role;

create table if not exists public.paid_day_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  post_id uuid references public.posts(id) on delete set null,
  amount_cents integer not null default 500,
  currency text not null default 'eur',
  status text not null default 'pending',
  provider text,
  provider_ref text,
  created_at timestamptz not null default now()
);

alter table public.paid_day_entries enable row level security;

drop policy if exists "read own paid day entries" on public.paid_day_entries;
create policy "read own paid day entries"
on public.paid_day_entries for select
using (auth.uid() = user_id);

grant select, insert on public.paid_day_entries to authenticated;
grant all on public.paid_day_entries to service_role;

create index if not exists idx_posts_user_created_nonbot
on public.posts(user_id, created_at desc)
where is_bot = false;

create index if not exists idx_competition_winners_period
on public.competition_winners(period_type, period_start desc);
