-- KOLEHTI V2 ROW LEVEL SECURITY POLICIES
-- Run after sql/01_schema.sql in Supabase SQL editor.

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

-- Public/read-only app data
create policy if not exists "profiles are readable"
  on public.profiles for select
  using (true);

create policy if not exists "groups are readable"
  on public.groups for select
  using (active = true or owner_id = auth.uid());

create policy if not exists "group members are readable"
  on public.group_members for select
  using (true);

create policy if not exists "visible posts are readable"
  on public.posts for select
  using (hidden = false or user_id = auth.uid());

-- Authenticated users can create their own posts from the app.
-- This fixes permission denied for table posts when the frontend inserts a post.
create policy if not exists "authenticated users can create own posts"
  on public.posts for insert
  to authenticated
  with check (user_id = auth.uid());

create policy if not exists "users can update own posts"
  on public.posts for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Voting and lightweight event tracking
create policy if not exists "authenticated users can vote as themselves"
  on public.votes for insert
  to authenticated
  with check (user_id = auth.uid());

create policy if not exists "votes are readable"
  on public.votes for select
  using (true);

create policy if not exists "authenticated users can create own user events"
  on public.user_events for insert
  to authenticated
  with check (user_id = auth.uid());

create policy if not exists "users can read own notifications"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

create policy if not exists "users can update own notifications"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy if not exists "users can create own retention events"
  on public.retention_events for insert
  to authenticated
  with check (user_id = auth.uid());

create policy if not exists "daily winners are readable"
  on public.daily_winners for select
  using (true);

create policy if not exists "active boost events are readable"
  on public.boost_events for select
  using (active = true);

create policy if not exists "jackpot rounds are readable"
  on public.jackpot_rounds for select
  using (true);

create policy if not exists "users can read own referrals"
  on public.referrals for select
  to authenticated
  using (inviter_id = auth.uid() or invited_user_id = auth.uid());

create policy if not exists "users can create own referrals"
  on public.referrals for insert
  to authenticated
  with check (inviter_id = auth.uid());

create policy if not exists "users can create own growth events"
  on public.growth_events for insert
  to authenticated
  with check (user_id = auth.uid());
