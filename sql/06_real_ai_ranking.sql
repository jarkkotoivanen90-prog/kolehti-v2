-- Real AI Ranking v3
-- Adds production-style ranking RPC with AI similarity, viral velocity, exploration and cold start.
-- Run after sql/05_real_ai_feed.sql.

create or replace function public.match_ai_feed_v3(
  match_user_id uuid default auth.uid(),
  match_count integer default 80,
  exploration_rate double precision default 0.12
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
  viral_velocity double precision,
  quality_score double precision,
  explore_score double precision,
  backend_score double precision,
  rank_reason text
)
language sql
stable
security definer
set search_path = public
as $$
  with profile as (
    select embedding, sample_count
    from public.user_interest_vectors
    where user_id = match_user_id
  ), base as (
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
      greatest(0.25, extract(epoch from (now() - p.created_at)) / 3600)::double precision as age_hours,
      coalesce((select sample_count from profile), 0) as user_samples,
      (('x' || substr(md5(p.id::text || coalesce(match_user_id::text, 'anon')), 1, 8))::bit(32)::bigint::double precision / 4294967295.0) as deterministic_random
    from public.posts p
    left join public.post_embeddings pe on pe.post_id = p.id
    where coalesce(p.hidden, false) = false
  ), scored as (
    select
      *,
      least(100, greatest(0, coalesce(ai_score, 50)))::double precision as quality_score,
      least(90, (
        coalesce(votes, 0) * 13 +
        coalesce(views, 0) * 0.5
      ) / sqrt(age_hours))::double precision as viral_velocity,
      (deterministic_random * greatest(0, least(1, exploration_rate)) * 120)::double precision as explore_score,
      greatest(0, 38 - age_hours * 1.15)::double precision as freshness_score,
      case
        when user_samples < 6 then 32
        when user_samples < 15 then 18
        else 0
      end::double precision as cold_start_score
    from base
  ), final as (
    select
      *,
      (
        coalesce(boost_score, 0) * 6 +
        quality_score * 1.05 +
        coalesce(votes, 0) * 10 +
        coalesce(views, 0) * 0.65 +
        ai_similarity * case when user_samples < 6 then 35 else 105 end +
        viral_velocity * 1.25 +
        explore_score +
        freshness_score +
        cold_start_score
      )::double precision as backend_score
    from scored
  )
  select
    id,
    user_id,
    group_id,
    content,
    ai_score,
    votes,
    views,
    boost_score,
    created_at,
    ai_similarity,
    viral_velocity,
    quality_score,
    explore_score,
    backend_score,
    case
      when viral_velocity >= 35 then 'Nousee nopeasti'
      when ai_similarity >= 0.55 then 'AI match'
      when quality_score >= 75 then 'Vahva perustelu'
      when cold_start_score > 0 then 'Suositeltu alkuun'
      when explore_score >= 8 then 'Uusi löytö'
      else 'For You'
    end as rank_reason
  from final
  order by backend_score desc, created_at desc
  limit least(greatest(match_count, 1), 100);
$$;

grant execute on function public.match_ai_feed_v3(uuid, integer, double precision) to authenticated;
grant execute on function public.match_ai_feed_v3(uuid, integer, double precision) to anon;
