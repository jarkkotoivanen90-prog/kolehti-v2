-- Fix: allow posts without week_id (frontend does not send it yet)

alter table public.posts
alter column week_id drop not null;
