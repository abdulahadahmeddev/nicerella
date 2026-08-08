-- ============================================================================
-- nicerella — initial database schema
-- ----------------------------------------------------------------------------
-- Canonical schema per AGENTS.md section 7. Run this file once (Supabase
-- Dashboard → SQL Editor, or the Supabase MCP `execute_sql` tool). The
-- pgvector addition lives separately in supabase/schema_pgvector.sql
-- (AGENTS.md section 20) and is not part of this initial schema.
--
-- Access model: the app reads/writes these tables server-side with the
-- service-role key only (lib/data/*). The UI talks to the app's own GET
-- routes, never to Supabase directly. RLS is therefore enabled as defense in
-- depth, and no anon/authenticated access is granted.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- sources — configured e-commerce sources to scrape
-- ----------------------------------------------------------------------------
create table if not exists public.sources (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  listing_url     text not null,
  parser_strategy text,
  logo_url        text,
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

create index if not exists sources_active_idx on public.sources (active);

-- Sources are upserted by listing_url (lib/data/sources.ts); a unique index
-- makes that ON CONFLICT arbiter inferrable (AGENTS.md section 8).
create unique index if not exists sources_listing_url_key
  on public.sources (listing_url);

-- ----------------------------------------------------------------------------
-- products — append-only product catalog, deduped by URL
-- ----------------------------------------------------------------------------
create table if not exists public.products (
  id               uuid primary key default gen_random_uuid(),
  source_id        uuid not null references public.sources (id) on delete restrict,
  original_url     text not null unique,
  canonical_url    text not null unique,
  title            text not null,
  image_url        text not null,
  price            numeric(10, 2),
  category         text,
  first_seen_at    timestamptz not null default now(),
  last_scraped_at  timestamptz not null default now(),
  analyzed_at      timestamptz,
  created_at       timestamptz not null default now()
);

create index if not exists products_analyzed_at_idx on public.products (analyzed_at);
create index if not exists products_source_id_idx on public.products (source_id);
create index if not exists products_category_idx on public.products (category);

-- ----------------------------------------------------------------------------
-- reviews — append-only reviews per product
-- ----------------------------------------------------------------------------
create table if not exists public.reviews (
  id                 uuid primary key default gen_random_uuid(),
  product_id         uuid not null references public.products (id) on delete cascade,
  review_identifier  text,
  rating             numeric not null,
  raw_text           text not null,
  review_date        timestamptz,
  verified_purchase  boolean not null default false,
  scraped_at         timestamptz not null default now(),
  created_at         timestamptz not null default now()
);

create index if not exists reviews_product_id_idx on public.reviews (product_id);

-- Dedupe reviews that expose a source identifier (AGENTS.md section 10).
-- Non-partial: insertReviews upserts with `onConflict: "product_id,review_identifier"`,
-- which Postgres can only infer as an arbiter from a non-partial unique index.
-- NULL identifiers stay append-only (btree treats NULLs as distinct).
create unique index if not exists reviews_product_identifier_unique
  on public.reviews (product_id, review_identifier);

-- ----------------------------------------------------------------------------
-- product_trust_analyses — one AI trust analysis per product
-- ----------------------------------------------------------------------------
create table if not exists public.product_trust_analyses (
  id                      uuid primary key default gen_random_uuid(),
  product_id              uuid not null unique references public.products (id) on delete cascade,
  trust_score             numeric not null check (trust_score >= 0 and trust_score <= 1),
  trust_label             text not null,
  positive_pct            numeric not null check (positive_pct >= 0 and positive_pct <= 100),
  neutral_pct             numeric not null check (neutral_pct >= 0 and neutral_pct <= 100),
  negative_pct            numeric not null check (negative_pct >= 0 and negative_pct <= 100),
  fake_review_pct         numeric not null check (fake_review_pct >= 0 and fake_review_pct <= 100),
  authenticity_confidence numeric not null check (authenticity_confidence >= 0 and authenticity_confidence <= 1),
  red_flags               jsonb not null default '[]'::jsonb,
  neutral_summary         text not null,
  disclaimer              text,
  model_name              text,
  created_at              timestamptz not null default now(),
  -- AGENTS.md section 7: sentiment percentages must sum to 100.
  constraint product_trust_analyses_sentiment_sum_check
    check (positive_pct + neutral_pct + negative_pct = 100)
);

-- ----------------------------------------------------------------------------
-- logs — pipeline / operation log entries
-- ----------------------------------------------------------------------------
create table if not exists public.logs (
  id         bigint generated always as identity primary key,
  level      text not null,
  source     text not null,
  message    text not null,
  context    jsonb,
  created_at timestamptz not null default now()
);

create index if not exists logs_created_at_idx on public.logs (created_at);
create index if not exists logs_level_idx on public.logs (level);

-- ----------------------------------------------------------------------------
-- oxylabs_schedules — recurring Oxylabs scrape schedules
-- ----------------------------------------------------------------------------
-- oxylabs_schedule_id is TEXT: Oxylabs IDs are 64-bit integers that exceed
-- Number.MAX_SAFE_INTEGER; storing the exact digit string avoids precision
-- loss (AGENTS.md section 18).
create table if not exists public.oxylabs_schedules (
  id                   uuid primary key default gen_random_uuid(),
  source_id            uuid not null references public.sources (id) on delete cascade,
  oxylabs_schedule_id  text not null unique,
  schedule_name        text,
  status               text not null default 'active',
  created_at           timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- oxylabs_schedule_runs — per-run status of scheduled Oxylabs jobs
-- ----------------------------------------------------------------------------
create table if not exists public.oxylabs_schedule_runs (
  id              uuid primary key default gen_random_uuid(),
  schedule_id     uuid not null references public.oxylabs_schedules (id) on delete cascade,
  oxylabs_run_id  text,
  job_id          text,
  status          text,
  result_status   text,
  started_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists oxylabs_schedule_runs_schedule_id_idx
  on public.oxylabs_schedule_runs (schedule_id);
create index if not exists oxylabs_schedule_runs_result_status_idx
  on public.oxylabs_schedule_runs (result_status);

-- A run is uniquely identified by its Oxylabs run id when present.
-- Non-partial: upsertScheduleRun uses `onConflict: "oxylabs_run_id"`, which
-- requires a non-partial unique index as the arbiter. NULL run ids stay
-- append-only (btree treats NULLs as distinct).
create unique index if not exists oxylabs_schedule_runs_run_id_unique
  on public.oxylabs_schedule_runs (oxylabs_run_id);

-- ----------------------------------------------------------------------------
-- subscriptions — Stripe-backed plans for Clerk users (pricing / Pro gating)
-- ----------------------------------------------------------------------------
-- user_id is the Clerk user id (text). Read/written with the service-role key
-- only (lib/data/subscriptions.ts). RLS enabled as defense in depth.
create table if not exists public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 text not null unique,
  stripe_customer_id      text,
  stripe_subscription_id  text unique,
  plan                    text not null default 'free',
  status                  text not null default 'active',
  trial_ends_at           timestamptz,
  current_period_end      timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);
create index if not exists subscriptions_status_idx on public.subscriptions (status);

-- ----------------------------------------------------------------------------
-- Security
-- ----------------------------------------------------------------------------
-- The app accesses these tables exclusively via the service-role key
-- (bypasses RLS) from server-side code. Enable RLS on every table as defense
-- in depth and revoke any default Data API grants so anon / authenticated
-- roles — and PUBLIC — cannot touch the data at all.
alter table public.sources               enable row level security;
alter table public.products              enable row level security;
alter table public.reviews               enable row level security;
alter table public.product_trust_analyses enable row level security;
alter table public.logs                  enable row level security;
alter table public.oxylabs_schedules     enable row level security;
alter table public.oxylabs_schedule_runs enable row level security;
alter table public.subscriptions          enable row level security;

revoke all on table
  public.sources,
  public.products,
  public.reviews,
  public.product_trust_analyses,
  public.logs,
  public.oxylabs_schedules,
  public.oxylabs_schedule_runs,
  public.subscriptions
from anon, authenticated, public;
