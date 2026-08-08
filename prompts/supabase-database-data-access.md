# Implementation Prompt — Supabase Database, Data Access, and All Database Features

## Goal

Implement the complete Supabase-backed data foundation for nicerella:

1. **Database schema** — the 7 core tables from AGENTS.md section 7 (`sources`, `products`, `reviews`, `product_trust_analyses`, `logs`, `oxylabs_schedules`, `oxylabs_schedule_runs`) plus indexes, constraints, and RLS.
2. **pgvector** (section 20) — the `vector(1536)` embedding column on `product_trust_analyses` and a `match_similar_products` SQL function, as a separate migration so the initial schema stays clean.
3. **TypeScript types** — `lib/supabase/types.ts` mirroring the schema for fully typed supabase-js access.
4. **Supabase clients** — a server-only service-role client. No browser client: the UI never talks to Supabase directly (AGENTS.md section 5).
5. **Data access layer** — cohesive, reusable server-side modules in `lib/data/` that the API routes *and* the future scraping / AI-analysis / scheduler pipelines all build on: sources, products (incl. dedupe URL existence check with ≤15-URL chunking), reviews (append-only + dedupe), trust analyses (incl. "pending analysis" queries), logs, schedules, schedule runs, and pgvector similar-products.
6. **API routes** — thin read routes: `GET /api/products`, `GET /api/products/[id]` (public, power the UI), and `GET /api/sources`, `GET /api/logs`, `GET /api/oxylabs/schedules`, `GET /api/oxylabs/runs` (protected by the admin secret).
7. **Wire the UI seam** — `lib/api/products.ts` fetches the real routes instead of returning empty stubs, so the home page and product detail page render stored data.

## Skills and MCPs read / used

- `.agents/skills/supabase` (SKILL.md read fully; security checklist followed; changelog scanned via `https://supabase.com/changelog.md`).
- `node_modules/next/dist/docs/` — route-handler and environment-variable patterns confirmed for Next 16.
- Supabase MCP server — configured in `.mcp.json` (project `etehahqragknvwqiscar`) but **not authenticated in this session**; tools unavailable. Schema application path is a decision point (below).
- Post-deploy review: `ecc:database-reviewer`, `ecc:security-reviewer`, `ecc:typescript-reviewer`, `ecc:code-reviewer` agents.

## Existing code inspected

- `lib/types/product.ts` — domain types the UI consumes (`Product`, `ProductDetail`, `ProductAnalysis`, `SentimentBreakdown`, `RedFlag`).
- `lib/api/products.ts` — UI data-access seam; currently returns empty stubs with a TODO to read from `/api/products` and `/api/products/[id]`.
- `app/page.tsx` — home grid: calls `getProducts()`, expects `Product[]` with `trustScore`, `reviewCount`, `analyzedAt`.
- `app/products/[id]/page.tsx` — detail page: calls `getProduct(id)`, expects `ProductDetail` with `analysis` and `similarProducts`; `notFound()` when null.
- `components/ui/*` — presentational; consume the domain types above only.
- `package.json` — `@supabase/supabase-js@^2.112.2`, `@supabase/ssr@^0.12.4` already installed; Next 16.3.0, React 19.
- `.env.local` — has `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (names confirmed; values not printed).
- Remote project probed via PostgREST: all 7 target tables currently return 404 → greenfield, no tables exist.

## Decisions / assumptions

- **Access model:** all reads/writes happen server-side with the service-role key (bypasses RLS). The UI calls the app's own GET routes only. Supabase Auth is not used (Clerk owns auth), so no cookie-based SSR client is needed.
- **RLS:** enabled on every table with **no** anon/authenticated policies and explicit `REVOKE` of table privileges from `anon`/`authenticated` — defense in depth. Public Data API exposure is not granted (also consistent with the 2026-04-28 changelog change that new public tables are not auto-exposed).
- **pgvector is a second migration** (`supabase/schema_pgvector.sql`), per AGENTS.md section 7 ("do not include it in the initial schema") and section 20.
- **Large integer IDs (AGENTS.md section 18):** `oxylabs_schedules.oxylabs_schedule_id`, `oxylabs_schedule_runs.oxylabs_run_id` and `job_id` are stored as **text** to preserve 64-bit precision.
- **`products.category`** is added (nullable) because section 20 scopes similar-product search by category.
- **Read routes that expose operational data** (`/api/sources`, `/api/logs`, `/api/oxylabs/*`) require the `x-nicerella-admin-secret` header (value from `NICERELLA_ADMIN_SECRET`). Public product read routes do not — they power the public UI.
- **Products appear on the home page only when `analyzed_at` is set** (per AGENTS.md section 18) and join their trust analysis + review count.
- No seed product/review/source data with invented URLs is inserted (AGENTS.md: "Do not invent source URLs"). A seed file is included with clearly-labeled commented examples only.

## Files likely to change / be created

```
supabase/schema.sql                NEW  initial schema (tables, constraints, indexes, RLS)
supabase/schema_pgvector.sql       NEW  vector ext + embedding column + match_similar_products fn
supabase/seed.sql                  NEW  commented example seed (no invented URLs)
lib/supabase/env.ts                NEW  env validation with clear errors
lib/supabase/client.ts             NEW  createServiceClient() (service role)
lib/supabase/types.ts              NEW  Database type map
lib/data/sources.ts                NEW
lib/data/products.ts               NEW
lib/data/reviews.ts                NEW
lib/data/analyses.ts               NEW
lib/data/logs.ts                   NEW
lib/data/schedules.ts              NEW
lib/data/schedule-runs.ts          NEW
lib/data/similar-products.ts       NEW
lib/data/helpers.ts                NEW  shared row-mapping utilities
app/api/products/route.ts          NEW  GET (public)
app/api/products/[id]/route.ts     NEW  GET (public)
app/api/sources/route.ts           NEW  GET (admin secret)
app/api/logs/route.ts              NEW  GET (admin secret)
app/api/oxylabs/schedules/route.ts NEW  GET (admin secret)
app/api/oxylabs/runs/route.ts      NEW  GET (admin secret)
lib/api/products.ts                EDIT wire to the real GET routes
```

## Implementation requirements

### Schema (`supabase/schema.sql`)

- `sources`: `id uuid pk default gen_random_uuid()`, `name text not null`, `listing_url text not null`, `parser_strategy text`, `logo_url text`, `active boolean not null default true`, `created_at timestamptz not null default now()`.
- `products`: `id uuid pk`, `source_id uuid not null references sources(id)`, `original_url text not null unique`, `canonical_url text not null unique`, `title text not null`, `image_url text not null`, `price numeric`, `category text`, `first_seen_at timestamptz not null default now()`, `last_scraped_at timestamptz not null default now()`, `analyzed_at timestamptz`, `created_at timestamptz not null default now()`. Index on `analyzed_at`, `source_id`, `category`.
- `reviews`: `id uuid pk`, `product_id uuid not null references products(id) on delete cascade`, `review_identifier text`, `rating numeric not null`, `raw_text text not null`, `review_date timestamptz`, `verified_purchase boolean not null default false`, `scraped_at timestamptz not null default now()`, `created_at timestamptz not null default now()`. Partial unique index on `(product_id, review_identifier)` where not null; index on `product_id`.
- `product_trust_analyses`: `id uuid pk`, `product_id uuid not null references products(id) on delete cascade unique`, `trust_score numeric not null check (0 <= trust_score <= 1)`, `trust_label text not null`, `positive_pct / neutral_pct / negative_pct numeric not null check 0–100`, check `positive_pct + neutral_pct + negative_pct = 100`, `fake_review_pct numeric not null check 0–100`, `authenticity_confidence numeric not null check 0–1`, `red_flags jsonb not null default '[]'`, `neutral_summary text not null`, `disclaimer text`, `model_name text`, `created_at timestamptz not null default now()`.
- `logs`: `id bigint generated always as identity pk`, `level text not null`, `source text not null`, `message text not null`, `context jsonb`, `created_at timestamptz not null default now()`. Index on `created_at`, `level`.
- `oxylabs_schedules`: `id uuid pk`, `source_id uuid not null references sources(id)`, `oxylabs_schedule_id text not null unique`, `schedule_name text`, `status text not null default 'active'`, `created_at timestamptz not null default now()`.
- `oxylabs_schedule_runs`: `id uuid pk`, `schedule_id uuid not null references oxylabs_schedules(id) on delete cascade`, `oxylabs_run_id text`, `job_id text`, `status text`, `result_status text`, `started_at timestamptz`, `completed_at timestamptz`, `created_at timestamptz not null default now()`. Unique partial index on `oxylabs_run_id` where not null; index on `schedule_id`, `result_status`.
- RLS on all 7 tables; `revoke all on ... from anon, authenticated` (and `public`).

### pgvector (`supabase/schema_pgvector.sql`)

- `create extension if not exists vector;`
- `alter table product_trust_analyses add column if not exists embedding vector(1536);`
- `create index ... on product_trust_analyses using hnsw (embedding vector_cosine_ops);`
- `create or replace function match_similar_products(query_embedding vector(1536), match_category text, match_threshold float default 0.7, match_count int default 6) returns table(...)` — SECURITY INVOKER, scoped by category, returns product + analysis fields ordered by cosine similarity.

### Types (`lib/supabase/types.ts`)

- Hand-authored `Database` type map (mirrors schema) so `createServiceClient().from("products")` is fully typed. All text-id columns are `string`; `numeric` columns are `number`.

### Clients (`lib/supabase/env.ts`, `lib/supabase/client.ts`)

- `env.ts`: validate `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are present; throw a descriptive error otherwise.
- `client.ts`: `createServiceClient()` → `createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })`. Never export the service-role key to the client; this module is server-only.

### Data access layer (`lib/data/*`)

- `sources.ts`: `listSources()`, `listActiveSources()`, `getSourceById(id)`, `upsertSource()`, `setSourceActive(id, active)`.
- `products.ts`: `listAnalyzedProducts(limit)` (join analysis + review count, filter `analyzed_at is not null`, order by first_seen desc), `getProductById(id)` (raw row), `findExistingUrls(urls)` (chunk into ≤15-URL `.in()` batches — AGENTS.md section 9), `insertProducts(rows)` (append-only, dedupe on original/canonical URL), `touchProductScrape(id)`, `markAnalyzed(id, analyzedAt)`.
- `reviews.ts`: `insertReviews(rows)` (dedupe by `review_identifier` where available, else by product + review text hash), `countReviewsByProduct(ids)`.
- `analyses.ts`: `insertTrustAnalysis(row)` (upsert on product_id), `getAnalysisByProduct(productId)`, `listPendingAnalysisProducts()` (`analyzed_at is null`).
- `logs.ts`: `writeLog(level, source, message, context?)` and `listLogs(limit)`.
- `schedules.ts`: `upsertSchedule(row)` (on oxylabs_schedule_id), `listSchedules()`, `removeSchedule(id)`, `updateScheduleStatus(id, status)`, `listOxylabsScheduleIds()` (for orphan deactivation, section 18).
- `schedule-runs.ts`: `upsertScheduleRun(row)` (on oxylabs_run_id), `updateRunResultStatus(id, resultStatus)`, `listScheduleRuns(scheduleId?)`, `listDoneRuns()` (for `/runs` result processing).
- `similar-products.ts`: `findSimilarProducts(productId, category, count)` → calls `match_similar_products` via RPC when embedding exists; returns typed rows; never leaks to client code.
- `helpers.ts`: shared pagination/limit constants and row→domain mapping helpers used by API routes.

All functions return typed rows and throw with descriptive messages on error (no silent failures). No `console.log` in data modules — pipeline code logs via `logs.ts`.

### API routes

- `GET /api/products` (public, `force-dynamic`): analyzed products mapped to `Product[]` (`trustScore` from analysis, `reviewCount` from aggregate, `sourceName` from join).
- `GET /api/products/[id]` (public, `force-dynamic`): `ProductDetail` with `analysis` + `similarProducts`; 404 JSON when the product is unknown or not yet analyzed; `notFound()` semantics handled by the client.
- `GET /api/sources`, `GET /api/logs`, `GET /api/oxylabs/schedules`, `GET /api/oxylabs/runs` (admin-secret protected): 401 on missing/invalid `x-nicerella-admin-secret` (compare against `NICERELLA_ADMIN_SECRET`); return typed lists.

### UI wiring (`lib/api/products.ts`)

- `getProducts()` → `fetch("/api/products")`; `getProduct(id)` → `fetch("/api/products/${id}")` with 404 → `null`. Cache-busting via `cache: "no-store"` so freshly analyzed products appear without restart.

## Security requirements

- Service-role key server-only; never in client components, never `NEXT_PUBLIC_`.
- RLS on all tables, no anon/authenticated grants, no `SECURITY DEFINER` functions in `public` (the vector match function stays `SECURITY INVOKER`).
- Admin secret compared with timing-safe string comparison; reject with 401; never logged or returned.
- No secrets committed; `.env.local` stays gitignored.
- Log routes never expose secrets, tokens, or full raw payloads.

## Acceptance criteria

1. `supabase/schema.sql` + `schema_pgvector.sql` apply cleanly to the project; all 7 tables exist with correct columns/constraints/indexes; RLS enabled; anon/authenticated have no table access.
2. `lib/supabase/types.ts` compiles and types every data-layer call.
3. `npx tsc --noEmit` and `npm run lint` pass.
4. `npm run build` succeeds.
5. Data layer functions verified against the live DB: inserting a source/product/review/analysis and reading them back works; dedupe and URL-existence chunking behave; `match_similar_products` returns rows (once an embedding exists).
6. Home page renders stored, analyzed products via the real `/api/products` route; product detail renders analysis + similar products; missing product → not-found UI.
7. Protected routes return 401 without the admin secret and 200 with it.
8. `ecc:database-reviewer`, `ecc:security-reviewer`, `ecc:typescript-reviewer`, `ecc:code-reviewer` reviews pass with no CRITICAL/HIGH findings.

## Checks to run

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- Live API smoke tests with `curl` (products, sources, logs, schedules, runs; with and without admin secret)
- Live data-layer round-trip test (insert source → product → reviews → analysis → read back → verify dedupe/URL-existence)
- Agent reviews: `ecc:database-reviewer`, `ecc:security-reviewer`, `ecc:typescript-reviewer`, `ecc:code-reviewer`

## Manual test steps expected after implementation

1. Apply `supabase/schema.sql` then `supabase/schema_pgvector.sql` (via Supabase MCP `execute_sql` once authenticated, or Dashboard → SQL Editor).
2. `npm run dev`; visit `/` — empty state shows ("No analyzed products yet") because no data exists yet.
3. `curl -s http://localhost:3000/api/products` → `[]` (200).
4. `curl -s http://localhost:3000/api/logs` → 401 without `x-nicerella-admin-secret`, 200 `[]` with it (value = `NICERELLA_ADMIN_SECRET`).
5. `curl -s http://localhost:3000/api/products/<missing-id>` → 404 JSON.
6. Confirm Supabase Dashboard shows the 7 tables with RLS enabled and no public access.
