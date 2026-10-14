-- Lifecycle (onboarding/upgrade) emails: opt-out flag + a log so each email is sent once.
-- Run in the Supabase SQL editor after 0001_init.sql.

alter table public.profiles add column if not exists marketing_emails boolean not null default true;

create table if not exists public.email_log (
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, kind)
);

alter table public.email_log enable row level security;
revoke insert, update, delete on public.email_log from anon, authenticated;

-- Users may toggle their own marketing emails from Settings.
grant update (marketing_emails) on public.profiles to authenticated;
