-- ============================================================================
-- nicerella — email subscribers table for newsletter / marketing emails
-- ----------------------------------------------------------------------------
-- Run this in Supabase Dashboard → SQL Editor to enable the newsletter
-- signup form in the footer. The app gracefully degrades if this table
-- does not exist (the /api/subscribe route returns 503 with a helpful message).
-- ============================================================================

create table if not exists public.email_subscribers (
  id           uuid primary key default gen_random_uuid(),
  email        text not null unique,
  source       text not null default 'unknown',
  verified     boolean not null default false,
  unsubscribed boolean not null default false,
  subscribed_at timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

-- Fast lookup by email (used for upsert on subscribe)
create unique index if not exists email_subscribers_email_unique
  on public.email_subscribers (email);

-- Filter by source for analytics
create index if not exists email_subscribers_source_idx
  on public.email_subscribers (source);

-- Filter active subscribers (not unsubscribed)
create index if not exists email_subscribers_active_idx
  on public.email_subscribers (unsubscribed) where unsubscribed = false;

-- Security: service-role only, same pattern as other tables
alter table public.email_subscribers enable row level security;

revoke all on table public.email_subscribers
  from anon, authenticated, public;
