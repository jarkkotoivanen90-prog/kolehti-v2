create table if not exists user_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  type text,
  valid_until timestamptz,
  created_at timestamptz default now()
);

create table if not exists boost_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  post_id uuid references posts(id),
  amount numeric,
  boost_value numeric,
  stripe_session_id text,
  created_at timestamptz default now()
);

create or replace function increment_boost_score(target_post_id uuid)
returns void as $$
begin
  update posts set boost_score = boost_score + 5 where id = target_post_id;
end;
$$ language plpgsql;
