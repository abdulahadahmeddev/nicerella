# Oxylabs scraping + scheduler + cron + multi-provider AI analysis pipeline

## Goal

Deliver the complete nicerella data pipeline and connect it to the existing
Supabase/UI foundation:

1. **Manual scraping** — `POST /api/scrape` runs the canonical scrape-to-insert
   pipeline (AGENTS.md §9/11/12/13/16): load active sources from Supabase, fetch
   each listing page live through Oxylabs Web Scraper API, extract product links,
   reject non-product URLs, dedupe against the catalog, scrape product detail
   pages + reviews, validate, insert append-only, emit run logging + summary.
2. **Oxylabs Scheduler** — `POST /api/oxylabs/schedules` (create/update schedules
   for active source listing pages, orphan-schedule deactivation, 64-bit ID
   precision), `POST /api/oxylabs/scheduled-results/process` (consume completed
   runs via `/runs` with `result_status === 'done'`, reuse the same pipeline).
3. **Vercel Cron** — `GET /api/cron/pipeline` protected by `CRON_SECRET` that
   runs process-then-analyze automatically, plus `vercel.json` cron config.
4. **AI trust analysis** — `POST /api/analyze` analyzes all pending products
   using **multi-provider free-tier AI with failover** (Gemini, Groq, Cerebras,
   Mistral, HuggingFace), stores the analysis + embedding, marks `analyzed_at`.
5. **Demo source** — seed one clearly-labelled active source so the pipeline is
   testable end-to-end.
6. **Milestone 2 (separate): floating AI chatbot** — collapsed chat bubble in the
   bottom-right corner that performs agent-like tasks, backed by the same
   multi-provider failover.

## Skills and MCPs read/used

- `.agents/skills/web-scraper-api` (SKILL.md, examples.md) — Oxylabs WSA auth, endpoints, params
- `.agents/skills/ai-sdk` (SKILL.md) — AI SDK patterns; bundled docs in `node_modules/ai/docs` will be read after install (never code AI SDK from memory)
- `.agents/skills/supabase` (SKILL.md) — migrations, queries, verify-after-change
- Live Oxylabs Scheduler docs (fetched `developers.oxylabs.io/.../scheduler`) — create/list/runs/jobs/state endpoints + 64-bit `schedule_id`
- `node_modules/next/dist/docs/` — Next.js 16 route-handler conventions (`params: Promise`, `force-dynamic`)
- MCPs: `supabase` (apply migrations + live queries), `github` (if needed),
  `playwright-mcp` + `chrome-devtools-mcp` (milestone 2 UI verification only)
- Sub-agents: `ecc:database-reviewer`, `ecc:security-reviewer`,
  `ecc:typescript-reviewer`, `ecc:code-reviewer` after implementation

## Existing code inspected

- `lib/data/`: `sources.ts`, `products.ts`, `reviews.ts`, `analyses.ts`,
  `schedules.ts`, `schedule-runs.ts`, `logs.ts`, `helpers.ts` (chunking, unwrap)
- `lib/supabase/`: `client.ts` (service-role, `server-only`), `env.ts` (fail-fast)
- `lib/api/admin-secret.ts`, `lib/api/products.ts`
- `app/api/products/{route,[id]/route}`, `sources`, `logs`,
  `oxylabs/schedules`, `oxylabs/runs`
- `supabase/schema.sql`, `supabase/schema_pgvector.sql`
- `package.json` (deps), `.env.local` (var names only), `app/page.tsx`, `app/products/[id]/page.tsx`

## Decisions / assumptions

- All action routes `POST` + `x-nicerella-admin-secret` (401 on missing/invalid, §15).
  Cron is the only `GET` exception, guarded by `CRON_SECRET` (§14). No
  `CRON_SECRET` in `.env.local`; dev builds skip the check.
- **Shared scrape-to-insert pipeline** (§9): one module consumed by both manual
  scraping (live listing fetch via Oxylabs realtime) and scheduler processing
  (listing HTML from completed job results). Same reject-list, URL check
  (≤15/.in()), content gate, cleanup, dedupe, and run logging.
- **Manual listing fetch**: `POST https://realtime.oxylabs.io/v1/queries`,
  `source: "universal"`, `url: <source.listing_url>`, `render: true`; result
  HTML from `results[0].content` when `status_code` is 2xx.
- **Scheduler sync** (§18):
  - Per active source create a schedule with `cron` (configurable, default
    e.g. `0 9 * * *`) and `end_time` (default ~2 years out); `items` =
    `[{ source: "universal", url: source.listing_url, render: true }]`.
  - Read `schedule_id` and job/run `id`s **from the raw HTTP response text via
    regex/string capture before any `JSON.parse`** (64-bit precision loss).
  - After creating new schedules, `GET /v1/schedules`, compare with
    `listOxylabsScheduleIds()`, and `PUT /v1/schedules/{id}/state {active:false}`
    for any Oxylabs schedule not stored in the DB (orphan deactivation).
  - Use `GET /v1/schedules/{id}/runs` and process only `result_status === 'done'`.
  - Fetch each done job's HTML with `GET https://data.oxylabs.io/v1/queries/{job_id}`
    (verify exact path in docs during implementation); parse that HTML instead of
    a live listing fetch. Never store raw listing HTML as products.
- **Parsing (Cheerio)**: listing page → visible product-card links only; filter
  the §9 non-product reject list; source-specific product-URL heuristics (§12);
  product page → title, image URL, price, canonical URL, review blocks (text +
  rating + identifier/date/verified where exposed); strip markup/boilerplate from
  `raw_text` (§13).
- **Content gate** (§9): save only products with real title + image + ≥1 review.
- **AI analysis** (§19): analyze each pending product's reviews. Multi-provider
  failover registry: **Gemini → Groq → Cerebras → Mistral → HuggingFace**, each
  gated on its API key being present. First provider returning a valid,
  zod-validated result wins; failures and fallbacks are logged. No provider key
  → clear error (never a silent empty analysis).
  - Output schema (zod): `trust_score` 0–1, `trust_label` (one of the 5 §19
    labels), `positive_pct/neutral_pct/negative_pct` (0–100, **must sum exactly
    100** — round programmatically before insert to satisfy the CHECK),
    `fake_review_pct`, `authenticity_confidence` 0–1, `red_flags` (array of
    `{type, description}`), `neutral_summary`, `disclaimer`, `model_name`.
- **Embeddings / pgvector** (§20): OpenAI is not available (per user: no
  credit-card providers). Use **Gemini `text-embedding-004` (768-dim, free)** as
  the embedding model, with a provider abstraction so another free embedding
  provider can be swapped in. **Schema change**: `embedding vector(1536)` →
  `embedding vector(768)` in `schema_pgvector.sql` + live migration; HNSW index
  and `match_similar_products(vector(1536), …)` recreated with 768. The
  embedding is generated from neutral summary + title + category and stored with
  the analysis.
- **New dependencies**: `ai`, `@ai-sdk/google`, `@ai-sdk/groq`, `@ai-sdk/cerebras`,
  `@ai-sdk/mistral`, `@ai-sdk/huggingface`, `cheerio` (zod already present).
  Install and read `node_modules/ai/docs` before writing AI SDK code.
- **New env vars** (server-only, fail-fast on use): `OXY_WSA_USERNAME`,
  `OXY_WSA_PASSWORD`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `CEREBRAS_API_KEY`,
  `MISTRAL_API_KEY`, `HUGGINGFACE_API_KEY`, `CRON_SECRET`. Prompt the user to
  paste the Oxylabs + free-tier keys before live testing.
- **Demo source**: one active source, name prefixed `[demo]`, listing URL of a
  public retailer; flagged for later deletion.
- **Milestone 2 chatbot**: client component; collapsed circular button fixed
  bottom-right → expands to a chat panel; `POST /api/chat` route proxies to the
  same multi-provider failover with a simple agent-style tool (e.g. look up a
  product trust score / answer product questions); UI work follows §21 (read
  `ui-ux-pro-max`, verify with Playwright + Chrome DevTools MCP).

## Files likely to change / be created

- New: `lib/oxylabs/client.ts` (auth + endpoints), `lib/scraping/urls.ts`
  (normalize/reject/product-URL heuristics), `lib/scraping/listing.ts`,
  `lib/scraping/product.ts` (Cheerio parsing), `lib/scraping/cleanup.ts`,
  `lib/pipeline/scrape.ts` (shared pipeline + summary), `lib/pipeline/run-summary.ts`
  (types/helpers), `lib/ai/providers.ts` (registry + failover),
  `lib/ai/analysis.ts` (zod schema + analysis call), `lib/ai/embed.ts`,
  `lib/data/reviews-read.ts` (load reviews for analysis), `vercel.json`
- New routes: `app/api/scrape/route.ts`, `app/api/analyze/route.ts`,
  `app/api/oxylabs/schedules/route.ts` (POST added beside GET),
  `app/api/oxylabs/scheduled-results/process/route.ts`,
  `app/api/cron/pipeline/route.ts`, milestone 2: `app/api/chat/route.ts` +
  `components/ai/chat-widget.tsx` (+ client deps)
- Modified: `supabase/schema_pgvector.sql` (768-dim), `.env.local` (add keys),
  `package.json` (deps). `lib/data/similar-products.ts` unchanged unless the RPC
  signature changes.

## Security requirements

- No secrets in client code or logs; all API keys only read server-side; fail-fast
  env module.
- All admin routes reject missing/invalid `x-nicerella-admin-secret` with 401.
- Cron route rejects missing/wrong `CRON_SECRET` with 401 (dev build skips check).
- Never save listing/search/storefront HTML or non-product URLs as products.
- Validate all AI output with zod before insert; round percentages to sum to 100.
- Bind all query params (no raw SQL concatenation).
- Milestone 2 chat route: no prompt injection into pipeline actions; the agent
  tool is read-only (product lookups), rate-aware, and cannot mutate pipeline state.

## Acceptance criteria

1. `POST /api/scrape` with valid secret returns a run summary (status, sources
   checked, candidates, duplicates, inserted products/reviews, rejected, failed,
   duration, rejection reasons) and stores append-only products + reviews.
2. `POST /api/analyze` analyzes pending products, inserts
   `product_trust_analyses` rows (zod-validated, percentages sum to 100), sets
   `analyzed_at`, stores 768-dim embedding, logs each product + failover events.
3. Home grid (`/api/products` → `/`) shows analyzed products with trust score.
4. Scheduler sync creates schedules, stores 64-bit ids losslessly as text,
   deactivates orphans, and returns stored rows.
5. Scheduler process consumes only `result_status === 'done'` runs and inserts
   via the same pipeline.
6. `/api/cron/pipeline` returns 401 without `CRON_SECRET` and runs
   process-then-analyze with it; logs both steps.
7. `tsc --noEmit` clean, `npm run lint` 0 errors, `npm run build` lists new
   routes.
8. Milestone 2: chatbot opens/closes, sends a message, receives an answer,
   verified with Playwright + Chrome DevTools (no console errors).

## Checks to run

- `npx tsc --noEmit`, `npm run lint`, `npm run build`
- Live curl: scrape → analyze → `/api/products` → `/api/logs`
- Supabase MCP: verify new tables/indexes + embedding dimension + function
- Agent reviews: database-reviewer, security-reviewer, typescript-reviewer,
  code-reviewer

## Manual test steps (shared after implementation)

Exact curl commands per endpoint incl. `x-nicerella-admin-secret` header and
`POST /api/cron/pipeline` with `CRON_SECRET` header; user watches the dev-server
terminal for run logs. Milestone 2: Playwright MCP + Chrome DevTools checklist.
