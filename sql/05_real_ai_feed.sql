-- Real AI Feed v2: pgvector + user interest backend
-- Run in Supabase SQL editor before deploying Edge Functions.

create extension if not exists vector;

create table if not exists public.post_embeddings (
  post_id uuid primary key references public.posts(id) on delete cascade,
  embedding vector(1536) not null,
  model text not null default 'text-embedding-3-small',
  content_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_interest_vectors (
  user_id uuid primary key references auth.users(id) on delete cascade,
  embedding vector(1536) not null,
  sample_count integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.post_embeddings enable row level security;
alter table public.user_interest_vectors enable row level security;

drop policy if exists "post embeddings are readable" on public.post_embeddings;
create policy "post embeddings are readable"
  on public.post_embeddings for select
  using (true);

drop policy if exists "users can read own interest vector" on public.user_interest_vectors;
create policy "users can read own interest vector"
  on public.user_interest_vectors for select
  to authenticated
  using (user_id = auth.uid());

create index if not exists idx_post_embeddings_hnsw
on public.post_embeddings using hnsw (embedding vector_cosine_ops);

create or replace function public.match_ai_feed(
  match_user_id uuid default auth.uid(),
  match_count integer default 50
)
returns table (
  id uuid,
  user_id uuid,
  group_id uuid,
  content text,
  ai_score numeric,
  votes integer,
  views integer,
  boost_score numeric,
  created_at timestamptz,
  ai_similarity double precision,
  backend_score double precision
)
language sql
stable
security definer
set search_path = public
as $$
  with profile as (
    select embedding
    from public.user_interest_vectors
    where user_id = match_user_id
  ), ranked as (
    select
      p.id,
      p.user_id,
      p.group_id,
      p.content,
      p.ai_score,
      p.votes,
      p.views,
      p.boost_score,
      p.created_at,
      coalesce(1 - (pe.embedding <=> (select embedding from profile)), 0)::double precision as ai_similarity,
      (
        coalesce(p.boost_score, 0) * 5 +
        coalesce(p.ai_score, 50) +
        coalesce(p.votes, 0) * 11 +
        coalesce(p.views, 0) * 0.7 +
        greatest(0, 35 - extract(epoch from (now() - p.created_at)) / 3600 * 1.4) +
        coalesce(1 - (pe.embedding <=> (select embedding from profile)), 0) * 90
      )::double precision as backend_score
    from public.posts p
    left join public.post_embeddings pe on pe.post_id = p.id
    where coalesce(p.hidden, false) = false
  )
  select * from ranked
  order by backend_score desc, created_at desc
  limit least(greatest(match_count, 1), 100);
$$;

create or replace function public.record_ai_feed_signal(
  target_post_id uuid,
  event text,
  weight double precision default 1
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  post_vec vector(1536);
  old_vec vector(1536);
  old_count integer;
  alpha double precision;
begin
  if uid is null or target_post_id is null then return; end if;

  insert into public.user_events (user_id, post_id, event_type, source, meta)
  values (uid, target_post_id, event, 'ai_feed_v2', jsonb_build_object('weight', weight));

  select embedding into post_vec from public.post_embeddings where post_id = target_post_id;
  if post_vec is null then return; end if;

  alpha := case event
    when 'feed_like' then 0.18
    when 'feed_share' then 0.24
    when 'feed_view' then 0.06
    when 'feed_skip' then -0.10
    else 0.03
  end * weight;

  select embedding, sample_count into old_vec, old_count
  from public.user_interest_vectors
  where user_id = uid;

  if old_vec is null then
    insert into public.user_interest_vectors (user_id, embedding, sample_count)
    values (uid, post_vec, 1)
    on conflict (user_id) do nothing;
  else
    update public.user_interest_vectors
    set embedding = old_vec * (1 - abs(alpha)) + post_vec * alpha,
        sample_count = old_count + 1,
        updated_at = now()
    where user_id = uid;
  end if;
end;
$$;
