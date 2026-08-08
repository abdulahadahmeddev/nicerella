-- Run this in Supabase Dashboard → SQL Editor to create all tables.
-- This is a no-op if tables already exist (IF NOT EXISTS).

create table if not exists public.sources (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  listing_url     text not null,
  parser_strategy text,
  logo_url        text,
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);
create unique index if not exists sources_listing_url_key on public.sources (listing_url);

create table if not exists public.products (
  id              uuid primary key default gen_random_uuid(),
  source_id       uuid not null references public.sources(id) on delete restrict,
  original_url    text not null unique,
  canonical_url   text not null unique,
  title           text not null,
  image_url       text not null,
  price           numeric(10,2),
  category        text,
  first_seen_at   timestamptz not null default now(),
  last_scraped_at timestamptz not null default now(),
  analyzed_at     timestamptz,
  created_at      timestamptz not null default now()
);

create table if not exists public.reviews (
  id                 uuid primary key default gen_random_uuid(),
  product_id         uuid not null references public.products(id) on delete cascade,
  review_identifier  text,
  rating             numeric not null,
  raw_text           text not null,
  review_date        timestamptz,
  verified_purchase  boolean not null default false,
  scraped_at         timestamptz not null default now(),
  created_at         timestamptz not null default now()
);
create unique index if not exists reviews_product_identifier_unique on public.reviews (product_id, review_identifier);

create table if not exists public.product_trust_analyses (
  id                      uuid primary key default gen_random_uuid(),
  product_id              uuid not null unique references public.products(id) on delete cascade,
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
  constraint product_trust_analyses_sentiment_sum_check check (positive_pct + neutral_pct + negative_pct = 100)
);

create table if not exists public.logs (
  id         bigint generated always as identity primary key,
  level      text not null,
  source     text not null,
  message    text not null,
  context    jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.oxylabs_schedules (
  id                  uuid primary key default gen_random_uuid(),
  source_id           uuid not null references public.sources(id) on delete cascade,
  oxylabs_schedule_id text not null unique,
  schedule_name       text,
  status              text not null default 'active',
  created_at          timestamptz not null default now()
);

create table if not exists public.oxylabs_schedule_runs (
  id              uuid primary key default gen_random_uuid(),
  schedule_id     uuid not null references public.oxylabs_schedules(id) on delete cascade,
  oxylabs_run_id  text,
  job_id          text,
  status          text,
  result_status   text,
  started_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz not null default now()
);
create unique index if not exists oxylabs_schedule_runs_run_id_unique on public.oxylabs_schedule_runs (oxylabs_run_id);

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

-- Enable RLS on every table
alter table public.sources               enable row level security;
alter table public.products              enable row level security;
alter table public.reviews               enable row level security;
alter table public.product_trust_analyses enable row level security;
alter table public.logs                  enable row level security;
alter table public.oxylabs_schedules     enable row level security;
alter table public.oxylabs_schedule_runs enable row level security;
alter table public.subscriptions          enable row level security;

-- Revoke all access from anon/authenticated roles
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
