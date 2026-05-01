-- Fix/optimize weekly pot support.
-- Ensures new posts get an ISO week id like 2026-W18 when posts.week_id is text-compatible.
-- Safe to run multiple times.

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'posts'
      and column_name = 'week_id'
  ) then
    alter table public.posts add column week_id text;
  end if;
end $$;

create or replace function public.current_iso_week_id()
returns text as $$
  select to_char(current_date, 'IYYY-"W"IW');
$$ language sql stable;

do $$
declare
  week_id_type text;
begin
  select data_type into week_id_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'posts'
    and column_name = 'week_id';

  if week_id_type in ('text', 'character varying', 'character') then
    alter table public.posts
      alter column week_id drop not null;

    alter table public.posts
      alter column week_id set default public.current_iso_week_id();

    update public.posts
    set week_id = public.current_iso_week_id()
    where week_id is null;
  end if;
end $$;

create index if not exists idx_posts_week_created
on public.posts(week_id, created_at desc);
