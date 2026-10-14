-- Siteloom schema.
-- Run in the Supabase SQL editor (or `supabase db push`). Safe to read top to bottom:
-- clients may only SELECT their own rows; every write goes through the server with
-- the secret key after the app has checked plan limits, credits and ownership.

create extension if not exists pgcrypto;

-- ───────────────────────────── helpers ─────────────────────────────
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ───────────────────────────── profiles ─────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  full_name text,
  avatar_url text,
  plan text not null default 'free' check (plan in ('free', 'starter', 'pro', 'business')),
  billing_interval text check (billing_interval in ('month', 'year')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  subscription_status text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  -- Plan allowance: refills daily (free) or monthly (paid). Unused allowance does not roll over.
  credits_allowance integer not null default 0 check (credits_allowance >= 0),
  -- Purchased / bonus credits: never expire. Spent after the allowance.
  credits_bonus integer not null default 0 check (credits_bonus >= 0),
  -- Epoch default means the first sync refills immediately.
  credits_reset_at timestamptz not null default '1970-01-01T00:00:00Z',
  referral_code text not null unique default lower(substr(encode(gen_random_bytes(6), 'hex'), 1, 8)),
  referred_by uuid references public.profiles(id) on delete set null,
  referral_rewarded boolean not null default false,
  is_admin boolean not null default false,
  email_notifications boolean not null default true,
  welcomed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Create a profile row for every new auth user. The welcome bonus is granted by the app
-- on first visit (so the amount lives in src/config/plans.ts, not here).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────────── credits ─────────────────────────────
create table if not exists public.credit_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  delta_allowance integer not null default 0,
  delta_bonus integer not null default 0,
  reason text not null,
  ref text,
  refunded boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists credit_ledger_user_idx on public.credit_ledger (user_id, created_at desc);

-- Refill the plan allowance if the period has elapsed. Locks the profile row.
-- p_rules comes from the app's plan config (one source of truth for pricing), e.g.
--   {"free": {"refill": 5, "every": "1 day"}, "pro": {"refill": 800, "every": "1 month"}}
-- and the rule is picked from the locked row's current plan.
create or replace function public.sync_credits(p_user uuid, p_rules jsonb)
returns public.profiles
language plpgsql security definer set search_path = public as $$
declare
  p public.profiles;
  rule jsonb;
begin
  select * into p from public.profiles where id = p_user for update;
  if not found then
    raise exception 'profile_not_found';
  end if;
  rule := p_rules -> p.plan;
  if rule is not null and p.credits_reset_at <= now() - (rule ->> 'every')::interval then
    update public.profiles
      set credits_allowance = greatest((rule ->> 'refill')::integer, 0), credits_reset_at = now()
      where id = p_user
      returning * into p;
  end if;
  return p;
end $$;

-- Atomically spend credits (allowance first, then bonus). Raises 'insufficient_credits'.
create or replace function public.spend_credits(
  p_user uuid, p_amount integer, p_rules jsonb, p_reason text, p_ref text default null
) returns table (ledger_id bigint, allowance integer, bonus integer)
language plpgsql security definer set search_path = public as $$
declare
  p public.profiles;
  from_allowance integer;
  from_bonus integer;
  lid bigint;
begin
  if p_amount <= 0 then
    raise exception 'invalid_amount';
  end if;
  p := public.sync_credits(p_user, p_rules);
  if p.credits_allowance + p.credits_bonus < p_amount then
    raise exception 'insufficient_credits';
  end if;
  from_allowance := least(p.credits_allowance, p_amount);
  from_bonus := p_amount - from_allowance;
  update public.profiles
    set credits_allowance = credits_allowance - from_allowance,
        credits_bonus = credits_bonus - from_bonus
    where id = p_user;
  insert into public.credit_ledger (user_id, delta_allowance, delta_bonus, reason, ref)
    values (p_user, -from_allowance, -from_bonus, p_reason, p_ref)
    returning id into lid;
  return query select lid, p.credits_allowance - from_allowance, p.credits_bonus - from_bonus;
end $$;

-- Reverse a spend exactly once (failed generations are never charged).
create or replace function public.refund_credits(p_ledger_id bigint, p_reason text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  l public.credit_ledger;
begin
  select * into l from public.credit_ledger where id = p_ledger_id for update;
  if not found or l.refunded or (l.delta_allowance + l.delta_bonus) >= 0 then
    return;
  end if;
  update public.profiles
    set credits_allowance = credits_allowance - l.delta_allowance,
        credits_bonus = credits_bonus - l.delta_bonus
    where id = l.user_id;
  update public.credit_ledger set refunded = true where id = p_ledger_id;
  insert into public.credit_ledger (user_id, delta_allowance, delta_bonus, reason, ref)
    values (l.user_id, -l.delta_allowance, -l.delta_bonus, p_reason, l.ref);
end $$;

-- Add bonus credits and/or reset the allowance (plan changes, renewals, top-ups, referrals).
create or replace function public.grant_credits(
  p_user uuid, p_bonus integer, p_set_allowance integer, p_reason text, p_ref text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  old_allowance integer;
begin
  select credits_allowance into old_allowance from public.profiles where id = p_user for update;
  if not found then
    raise exception 'profile_not_found';
  end if;
  update public.profiles
    set credits_bonus = credits_bonus + greatest(coalesce(p_bonus, 0), 0),
        credits_allowance = coalesce(p_set_allowance, credits_allowance),
        credits_reset_at = case when p_set_allowance is null then credits_reset_at else now() end
    where id = p_user;
  insert into public.credit_ledger (user_id, delta_allowance, delta_bonus, reason, ref)
    values (
      p_user,
      coalesce(p_set_allowance, old_allowance) - old_allowance,
      greatest(coalesce(p_bonus, 0), 0),
      p_reason,
      p_ref
    );
end $$;

-- ───────────────────────────── projects ─────────────────────────────
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default 'Untitled site',
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$'),
  initial_prompt text,
  files jsonb not null default '{}'::jsonb,
  status text not null default 'idle' check (status in ('idle', 'generating')),
  generating_since timestamptz,
  cancel_requested boolean not null default false,
  published boolean not null default false,
  published_at timestamptz,
  published_files jsonb,
  -- The source files that produced published_files (so the live site can be rebuilt without unpublished edits).
  published_source jsonb,
  published_version_id uuid,
  custom_domain text unique,
  domain_verified boolean not null default false,
  showcase boolean not null default false,
  settings jsonb not null default '{}'::jsonb,
  blocked boolean not null default false,
  blocked_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_user_idx on public.projects (user_id, updated_at desc);
create index if not exists projects_published_idx on public.projects (published_at desc) where published;

create trigger projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();

create table if not exists public.project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  files jsonb not null,
  label text not null,
  source text not null default 'ai' check (source in ('ai', 'manual', 'restore', 'images', 'text-edit')),
  created_at timestamptz not null default now()
);
create index if not exists project_versions_idx on public.project_versions (project_id, created_at desc);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null default '',
  tier text,
  model text,
  status text not null default 'done' check (status in ('streaming', 'done', 'error', 'cancelled')),
  credits_charged integer not null default 0,
  -- The credit_ledger row for this message's charge, so an interrupted generation can be refunded.
  ledger_id bigint,
  cost_usd numeric(12, 6) not null default 0,
  input_tokens integer,
  output_tokens integer,
  files_changed text[] not null default '{}',
  version_id uuid references public.project_versions(id) on delete set null,
  attachments jsonb,
  error text,
  created_at timestamptz not null default now()
);
create index if not exists messages_project_idx on public.messages (project_id, created_at);

-- ───────────────────────────── site runtime ─────────────────────────────
create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  form_name text not null default 'Form',
  page text,
  data jsonb not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists form_submissions_idx on public.form_submissions (project_id, created_at desc);

create table if not exists public.page_views (
  project_id uuid not null references public.projects(id) on delete cascade,
  day date not null,
  path text not null,
  views integer not null default 0,
  primary key (project_id, day, path)
);

create table if not exists public.page_referrers (
  project_id uuid not null references public.projects(id) on delete cascade,
  day date not null,
  source text not null,
  views integer not null default 0,
  primary key (project_id, day, source)
);

create or replace function public.track_page_view(p_project uuid, p_path text, p_source text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.page_views (project_id, day, path, views)
    values (p_project, current_date, left(p_path, 200), 1)
    on conflict (project_id, day, path) do update set views = public.page_views.views + 1;
  if p_source is not null and p_source <> '' then
    insert into public.page_referrers (project_id, day, source, views)
      values (p_project, current_date, left(p_source, 120), 1)
      on conflict (project_id, day, source) do update set views = public.page_referrers.views + 1;
  end if;
end $$;

-- ───────────────────────────── trust & safety ─────────────────────────────
create table if not exists public.abuse_reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  url text,
  reason text not null,
  details text,
  reporter_email text,
  reporter_hash text,
  status text not null default 'open' check (status in ('open', 'actioned', 'dismissed')),
  created_at timestamptz not null default now()
);

create table if not exists public.moderation_events (
  id bigint generated always as identity primary key,
  project_id uuid references public.projects(id) on delete cascade,
  stage text not null,
  verdict text not null,
  categories text[] not null default '{}',
  reason text,
  created_at timestamptz not null default now()
);

-- ───────────────────────────── ops ─────────────────────────────
create table if not exists public.stripe_events (
  id text primary key,
  type text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_spend_daily (
  day date primary key,
  cost_usd numeric(12, 6) not null default 0,
  requests integer not null default 0
);

create or replace function public.record_ai_spend(p_cost numeric)
returns void
language sql security definer set search_path = public as $$
  insert into public.ai_spend_daily (day, cost_usd, requests) values (current_date, p_cost, 1)
  on conflict (day) do update set
    cost_usd = public.ai_spend_daily.cost_usd + excluded.cost_usd,
    requests = public.ai_spend_daily.requests + 1;
$$;

create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  count integer not null default 0
);

-- Fixed-window rate limiter. Returns true when the call is allowed.
create or replace function public.rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  c integer;
begin
  insert into public.rate_limits as r (key, window_start, count) values (p_key, now(), 1)
  on conflict (key) do update set
    count = case when r.window_start < now() - make_interval(secs => p_window_seconds) then 1 else r.count + 1 end,
    window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds) then now() else r.window_start end
  returning count into c;
  return c <= p_limit;
end $$;

-- Daily housekeeping (called by the cron job): trims history and expired bookkeeping rows.
create or replace function public.cleanup_ops(p_keep_versions integer default 50)
returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.rate_limits where window_start < now() - interval '2 days';
  delete from public.stripe_events where created_at < now() - interval '120 days';
  delete from public.project_versions v
    using (
      select id from (
        select id, row_number() over (partition by project_id order by created_at desc) as rn
        from public.project_versions
      ) ranked where rn > p_keep_versions
    ) old
    where v.id = old.id;
end $$;

-- ───────────────────────────── row level security ─────────────────────────────
alter table public.profiles enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.projects enable row level security;
alter table public.project_versions enable row level security;
alter table public.messages enable row level security;
alter table public.form_submissions enable row level security;
alter table public.page_views enable row level security;
alter table public.page_referrers enable row level security;
alter table public.abuse_reports enable row level security;
alter table public.moderation_events enable row level security;
alter table public.stripe_events enable row level security;
alter table public.ai_spend_daily enable row level security;
alter table public.rate_limits enable row level security;

create policy "read own profile" on public.profiles for select using (auth.uid() = id);
create policy "update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "read own ledger" on public.credit_ledger for select using (auth.uid() = user_id);
create policy "read own projects" on public.projects for select using (auth.uid() = user_id);
create policy "read own versions" on public.project_versions for select
  using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));
create policy "read own messages" on public.messages for select
  using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));
create policy "read own submissions" on public.form_submissions for select
  using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));
create policy "read own page views" on public.page_views for select
  using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));
create policy "read own referrers" on public.page_referrers for select
  using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));
-- abuse_reports, moderation_events, stripe_events, ai_spend_daily, rate_limits: no client access.

-- Clients are read-only except for a few harmless profile columns.
revoke insert, update, delete on all tables in schema public from anon, authenticated;
grant update (full_name, avatar_url, email_notifications) on public.profiles to authenticated;

-- Privileged functions are callable by the server (service role) only.
revoke execute on function public.sync_credits(uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.spend_credits(uuid, integer, jsonb, text, text) from public, anon, authenticated;
revoke execute on function public.refund_credits(bigint, text) from public, anon, authenticated;
revoke execute on function public.grant_credits(uuid, integer, integer, text, text) from public, anon, authenticated;
revoke execute on function public.track_page_view(uuid, text, text) from public, anon, authenticated;
revoke execute on function public.record_ai_spend(numeric) from public, anon, authenticated;
revoke execute on function public.rate_limit(text, integer, integer) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.cleanup_ops(integer) from public, anon, authenticated;

-- ───────────────────────────── storage ─────────────────────────────
-- Public bucket for AI-generated images and user uploads used on published sites.
-- Uploads happen server-side with the secret key, so no insert policies are needed.
-- SVG is deliberately excluded: it can carry scripts.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-assets', 'site-assets', true, 8388608, array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'])
on conflict (id) do nothing;
