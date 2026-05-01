create table if not exists public.user_brain_clusters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  cluster text,
  embedding vector(1536),
  updated_at timestamptz default now()
);

create or replace function public.update_user_brain_cluster(
  target_user_id uuid,
  target_post_id uuid,
  signal text
)
returns void
language plpgsql
as $$
declare
  vec vector(1536);
begin
  select embedding into vec from post_embeddings where post_id = target_post_id;
  if vec is null then return; end if;

  insert into user_brain_clusters (user_id, cluster, embedding)
  values (target_user_id, signal, vec);
end;
$$;
