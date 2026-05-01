-- Learning Loop v1
-- Updates the user's interest vector from feed events.
-- Run after sql/05_real_ai_feed.sql and sql/06_real_ai_ranking.sql.

create or replace function public.update_user_interest(
  target_user_id uuid default auth.uid(),
  target_post_id uuid default null,
  signal text default 'feed_view',
  signal_weight double precision default 1
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := coalesce(target_user_id, auth.uid());
  post_vec vector(1536);
  old_vec vector(1536);
  old_count integer;
  alpha double precision;
begin
  if uid is null or target_post_id is null then
    return;
  end if;

  select embedding
  into post_vec
  from public.post_embeddings
  where post_id = target_post_id;

  if post_vec is null then
    return;
  end if;

  alpha := case signal
    when 'feed_like' then 0.18
    when 'feed_share' then 0.24
    when 'feed_view' then 0.06
    when 'feed_skip' then -0.10
    else 0.03
  end * greatest(0.1, least(2.5, signal_weight));

  insert into public.user_events (user_id, post_id, event_type, source, meta)
  values (
    uid,
    target_post_id,
    signal,
    'learning_loop_v1',
    jsonb_build_object('alpha', alpha, 'signal_weight', signal_weight)
  );

  select embedding, sample_count
  into old_vec, old_count
  from public.user_interest_vectors
  where user_id = uid;

  if old_vec is null then
    insert into public.user_interest_vectors (user_id, embedding, sample_count)
    values (uid, post_vec, 1)
    on conflict (user_id) do update
      set embedding = excluded.embedding,
          sample_count = public.user_interest_vectors.sample_count + 1,
          updated_at = now();
  else
    update public.user_interest_vectors
    set embedding = old_vec * (1 - abs(alpha)) + post_vec * alpha,
        sample_count = coalesce(old_count, 0) + 1,
        updated_at = now()
    where user_id = uid;
  end if;
end;
$$;

grant execute on function public.update_user_interest(uuid, uuid, text, double precision) to authenticated;
grant execute on function public.update_user_interest(uuid, uuid, text, double precision) to anon;
