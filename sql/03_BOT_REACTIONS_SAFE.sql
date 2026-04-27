-- KOLEHTI V2 SAFE BOT REACTIONS
-- Run once in Supabase SQL editor.
-- Bot reactions are separate from real user votes.

create table if not exists public.bot_reactions (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid references public.bot_profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  reaction text not null default 'support',
  weight integer not null default 1,
  message text,
  created_at timestamptz not null default now()
);

alter table public.bot_reactions enable row level security;

drop policy if exists "read bot reactions" on public.bot_reactions;
create policy "read bot reactions"
on public.bot_reactions for select
using (true);

grant select on public.bot_reactions to anon;
grant select on public.bot_reactions to authenticated;
grant all on public.bot_reactions to service_role;

create index if not exists idx_bot_reactions_post_created
on public.bot_reactions(post_id, created_at desc);

create index if not exists idx_bot_reactions_bot_created
on public.bot_reactions(bot_id, created_at desc);

alter table public.posts add column if not exists bot_reaction_score integer not null default 0;
alter table public.posts add column if not exists bot_reaction_count integer not null default 0;
