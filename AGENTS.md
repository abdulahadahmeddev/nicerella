# AGENTS.md

You are a **principal-level full-stack engineer and AI implementation agent** working on **nicerella**, a production-style AI-powered product review trust and authenticity platform.

Your job is to understand the request, use the right project skills and MCPs, create a clear implementation prompt, ask for approval, then implement.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

---

# 1. Product

nicerella collects real product reviews from configured e-commerce sources, analyzes them with AI to detect fake, bot-written, incentivized, or manipulated reviews, stores everything in Supabase, and displays a reader-friendly trust score and review breakdown for each product.

Build only:

- home page with product cards (trust score badge visible on card)
- product details page with full review analysis
- Clerk authentication
- Supabase persistence
- Oxylabs scraping
- Oxylabs Scheduler
- AI review analysis
- logs
- pgvector similarity search for related/similar products
- Vercel Cron for automatic scheduling
- minimal responsive UI, designed and verified per section 21
- visual QA pass via Playwright MCP + Chrome DevTools MCP before any UI task is marked done

Do not overbuild.

---

# 2. Workflow

For every implementation request:

1. Read `AGENTS.md`.
2. Read the skills and MCPs explicitly mentioned by the user.
3. Read clearly needed supporting skills from the approved skill list.
4. Inspect relevant code.
5. Ask a focused question only if the task has meaningful ambiguity.
6. Create a detailed prompt file in `prompts/`.
7. Ask: `I prepared the implementation prompt at prompts/<file-name>.md. Is this good to execute?`
8. Implement only after user approval.
9. For any UI work, follow the design workflow in section 21 (UI/UX Pro Max skill for decisions, Playwright MCP + Chrome DevTools MCP for verification) before declaring the task done.
10. Run available checks.
11. Share exact steps to test or run the completed feature.

Do not code before creating the prompt unless the user explicitly says to skip prompt creation.

---

# 3. Skills and MCPs

Use only these skills:

- `.agents/skills/clerk`
- `.agents/skills/supabase`
- `.agents/skills/oxylabs-web-scraper`
- `.agents/skills/ai-sdk`
- `.agents/skills/ui-ux-pro-max`
- `.agents/skills/shadcn`
- `.agents/skills/` (The whole folder all skills)

Use only these MCP servers:

- `playwright-mcp`
- `chrome-devtools-mcp`
- `github-mcp-server`
- `vercel-mcp`

Use them for:

- `node_modules/next/dist/docs/`: Next.js, routing, server/client boundaries, API routes, UI patterns
- `clerk`: authentication and protected routes
- `supabase`: schema, migrations, queries, service role usage, dedupe, logs, pgvector
- `oxylabs-web-scraper`: Oxylabs Web Scraper API, Scheduler, scheduled jobs, scraping behavior
- `ai-sdk`: Vercel AI SDK and OpenAI provider usage, model calls, AI analysis output handling
- `ui-ux-pro-max`: layout, typography, spacing, color system, component design, responsive behavior decisions before any UI code is written
- `shadcn-ui` : For sny design or whatever it is used for.
- `.agents/skills` : The whole folder for whatever you want
- `playwright-mcp`: driving the running app like a real user — clicking through flows, filling forms, verifying navigation and interactive states after implementation
- `chrome-devtools-mcp`: inspecting the rendered page — console errors, network requests/failures, rendering/layout issues, performance and basic accessibility snapshot
- `github-mcp-server` : When you want use this for anything you want.
- `vercel-mcp-server`.: Use this for anything you want.

Do not invent new skills or connect new MCPs without asking first.

For Cheerio, and Zod, use existing project patterns, package docs, and `node_modules/next/dist/docs/`.

---

# 4. Prompt files

Prompt files live in the `prompts/` directory. Use names like:

- `prompts/oxylabs-scraping.md`
- `prompts/oxylabs-scheduler.md`
- `prompts/ai-analysis.md`
- `prompts/product-details-page-ui.md`

Each prompt must include:

- goal
- skills and MCPs read/used
- existing code inspected
- decisions or assumptions
- files likely to change
- implementation requirements
- security requirements
- acceptance criteria
- checks to run
- exact manual test steps expected after implementation

For UI tasks, also include visual interpretation, layout, typography, spacing, colors, responsiveness, component states (loading/empty/error), and the Playwright MCP + Chrome DevTools MCP verification checklist from section 21.

---

# 5. Architecture

Keep these layers separate:

- Website: pages, cards, details UI, auth UI
- API: thin route handlers only
- Database: Supabase reads/writes
- Scraping: Oxylabs calls and Scheduler integration
- Parsing: product/review link extraction, cleanup, review validation
- AI: review analysis and output validation
- Pipeline: scrape and analysis orchestration, log tracking
- Vector: pgvector similarity queries and product embedding storage
- Design/QA: UI/UX Pro Max skill decisions plus Playwright MCP and Chrome DevTools MCP verification — this is a development-time layer only, never shipped runtime code, and never touches Supabase or the pipeline

UI must display stored data only.

UI must not scrape, analyze, or mutate pipeline state.

---

# 6. Tech stack

Use:

- Next.js
- Clerk
- Supabase
- Oxylabs Web Scraper API
- Oxylabs Scheduler
- Cheerio
- Vercel AI SDK
- OpenAI provider
- Zod
- Tailwind CSS
- shadcn/ui
- pgvector (via Supabase Extensions)
- Vercel Cron
- Playwright MCP and Chrome DevTools MCP (dev-time verification tooling only — never imported into app code or shipped to production)

Do not use:

- Supabase Auth
- local JSON app storage
- a separate backend framework

---

# 7. Supabase source of truth

Supabase is the source of truth for app data.

Core tables:

- `sources`
- `products`
- `reviews`
- `product_trust_analyses`
- `logs`
- `oxylabs_schedules`
- `oxylabs_schedule_runs`

Scraping must load active sources from the `sources` table.

Do not hardcode source URLs inside scraping logic or `AGENTS.md`.

Each source should store the fields needed by the scraper:

- name
- listing URL (category/search entry page)
- parser strategy if needed
- active status
- optional logo URL

Only active sources should be used for scraping and scheduling.

Each product should store:

- source reference
- original product URL (unique, used for dedupe)
- canonical URL
- title
- image URL (required before saving)
- price (if available)
- first seen timestamp
- last scraped timestamp
- analyzed timestamp (null until trust analysis is saved)

Each review should store:

- product reference
- review identifier or URL if the source exposes one
- rating (numeric)
- raw review text
- review date
- verified purchase flag (if the source exposes it)
- scraped timestamp

Each product trust analysis should store:

- product reference
- trust score (0 to 1)
- trust label (highly trustworthy / mostly trustworthy / mixed / suspicious / likely manipulated — see section 19)
- sentiment breakdown: positive percentage, neutral percentage, negative percentage (each 0–100, must sum to 100)
- estimated fake/bot review percentage
- authenticity confidence (0 to 1)
- red flags (array — e.g. review bursts, duplicate phrasing, incentivized-review language)
- neutral summary of genuine reviewer sentiment
- disclaimer
- model name

The `embedding vector(1536)` column is added to `product_trust_analyses` in section 20 after pgvector is enabled. Do not include it in the initial schema.

When any of these fields are added or changed, update `supabase/schema.sql`, `lib/supabase/types.ts`, and run the corresponding ALTER SQL in Supabase Dashboard → SQL Editor before testing.

---

# 8. Scraping source selection

Before implementing or running scraping behavior, inspect the active sources stored in Supabase and show the user the available source names.

Ask the user which sources to scrape and how many products (and reviews per product) to pull.

If the user already says something like "scrape 3 sources and 5 products per source," use that instruction and fetch the matching active sources from Supabase.

If the user does not choose sources or limits, default to all active sources and the default per-source limit.

Do not invent source URLs.

Do not scrape source sub-endpoints that are not stored in Supabase.

---

# 9. Correct scraping model

Source URLs from Supabase are **listing/category entry pages only**.

## Scrape-to-insert pipeline

This is the canonical scrape-to-insert flow. Both manual scraping (section 16) and scheduler processing (section 18) run these exact steps and differ only in how they are triggered and where the listing HTML comes from:

1. Load the selected active sources from Supabase (all active sources by default).
2. Obtain each source's listing page HTML — manual scraping fetches the stored listing URL live through Oxylabs; scheduler processing uses completed Oxylabs job results (section 18). Never crawl into sublinks to find more listing pages.
3. Extract candidate product links from visible listing product cards only (section 11).
4. Reject anything on the **non-product reject list** before detail scraping.
5. Normalize and dedupe candidate URLs, then skip URLs already stored in Supabase using the **URL existence check** below.
6. Scrape only product detail pages (and their visible review sections) that pass the candidate URL check (section 12).
7. Validate and clean each product page and its reviews (section 13); it must pass the **product content gate** below.
8. Insert products append-only, and append only new reviews for existing products (section 10). Never save a listing, search-results, or seller-storefront page as a product.
9. Emit **run logging** (below) during the run and a final summary object.

## Shared pipeline rules

- **URL existence check** — when checking which candidate product URLs already exist in Supabase, query in small chunks and never pass more than 15 URLs to a single `.in()` filter.
- **Product content gate** — save a product only if it has a real title, an image URL, and at least one extractable review. Full accept/reject criteria and `raw_text` cleanup live in section 13.
- **Run logging** — log neat server-side console messages during the run (scrape started, selected sources, per-source start, listing fetched, candidate links found, candidates rejected before detail scrape, duplicates skipped, detail pages scraped, products inserted, reviews inserted, products rejected after validation, source-level errors, scrape completed or failed) and, at the end, a summary object with: status, sources checked, candidates found, candidates rejected, duplicates skipped, detail pages scraped, products inserted, reviews inserted, products rejected, products failed, total duration, and rejection reasons grouped by count.

## Non-product reject list

- category root and filter/sort pages
- search result pages
- seller storefront / brand landing pages (not a single product page)
- out-of-stock placeholder or discontinued-product pages
- bundle/collection pages with no single clear product
- sponsored/ad placement pages
- navigation, menu, and footer links
- blog, guide, and editorial content pages
- video-only pages unless the page also has full product listing and reviews

When this list changes, update it here only.

---

# 10. Product and review storage rules

Products and reviews must be append-only during scraping.

Never delete, replace, or reset the product or review list during a scrape.

Use original product URL and canonical URL for dedupe.

Do not insert duplicate products or duplicate reviews (dedupe reviews by review identifier/URL where available, otherwise by product + reviewer + review text hash + date).

Do not store invalid, generic, non-product, listing, search, storefront, out-of-stock, bundle, or low-quality pages as products.

---

# 11. Listing page product link extraction

When scraping a source listing page, do not collect every link.

Extract only visible product card links from the listing content.

Ignore everything on the **non-product reject list** (section 9) — navigation, menus, footers, filter/sort links, sponsored placements, storefront links, and editorial content links.

Before detail scraping, each candidate URL must pass a source-specific product URL check.

Examples:

- Amazon-style `/s?k=...` search pages are not product URLs.
- Storefront pages like `/stores/BrandName` are not product URLs.
- Category root pages like `/category/electronics` are not product URLs.
- Sponsored carousel tiles without a real product detail link are not product URLs.

Use source-specific parser strategy when generic listing extraction is not enough.

Use only listing URLs already stored in Supabase.

---

# 12. Candidate URL filtering

Filter candidate URLs before scraping product detail pages.

A candidate should be kept only when it looks like a real single-product detail URL for that source.

Prefer URLs with:

- product-specific IDs (ASIN-style, SKU-style)
- clear single-product path structure
- long product slugs
- source-specific product patterns

Reject candidate URLs that look like listing URLs or anything on the **non-product reject list** (section 9).

If the candidate URL check is uncertain, use the stricter choice and reject before detail scraping.

---

# 13. Product and review validation and cleanup

After scraping a product detail page, validate it before saving.

Accept only if the page has:

- product-specific URL
- a real, non-generic product title
- one clear product (not a bundle or category)
- an image URL
- at least one extractable review with text and a rating

Reject if:

- image URL is missing
- title is generic or is a category/storefront/collection name
- page is a bundle or comparison page with no single clear product
- no reviews can be extracted at all
- canonical URL points to a listing/search/storefront page

Do not reject a product only because it has few reviews — a low review count is stored as-is and reflected in the trust analysis, not treated as a validation failure.

Before saving review `raw_text`, remove HTML markup, unrelated Q&A content, seller responses embedded in review widgets, ad blocks, "helpful votes" boilerplate, navigation labels, and CSS class dumps.

Saved review text should read like an actual review, not a copied webpage dump.

---

# 14. API route method rules

Use consistent API methods.

Use `POST` for actions that start or mutate work:

- `POST /api/scrape`
- `POST /api/analyze`
- `POST /api/oxylabs/schedules`
- `POST /api/oxylabs/scheduled-results/process`

Use `GET` only for read/status routes:

- `GET /api/sources`
- `GET /api/logs`
- `GET /api/oxylabs/schedules`
- `GET /api/oxylabs/runs`

One exception — the Vercel Cron route uses `GET` because Vercel Cron always sends GET requests:

- `GET /api/cron/pipeline` — internal only, protected by `CRON_SECRET`, not callable by browsers or users

Do not switch scraping or AI analysis between `GET` and `POST`.

Scraping and AI analysis must be triggered with `POST` for manual calls. The Vercel Cron route is the only GET exception and must be protected by `CRON_SECRET`.

---

# 15. Admin secret rule

All action routes that start or mutate work must require a shared admin secret sent as the `x-nicerella-admin-secret` request header. Store the value in the `NICERELLA_ADMIN_SECRET` environment variable.

Do not put the secret in the URL query string.

Do not expose the secret to browser code.

Reject missing or invalid secrets with `401`.

---

# 16. Manual scraping behavior and logs

Manual scraping runs the **scrape-to-insert pipeline** (section 9) on demand, fetching each source listing page live through Oxylabs.

Manual-specific rules:

- Trigger with `POST /api/scrape` and require the `x-nicerella-admin-secret` header (section 15).
- Select sources per section 8: use the user's choice (e.g. "3 sources, 5 products per source"); otherwise default to all active sources and up to 5 valid products per source.
- It is better to insert fewer good products with real reviews than to insert bad or reviewless ones.
- Return the same **run logging** summary object (section 9) in the API response.
- Do not rely on a run-id polling test format for basic manual testing.

---

# 17. Testing output after implementation

After completing scraping, scheduler, or AI analysis work, always share exact test steps.

For API features, share the exact curl commands needed to hit each endpoint, including the correct method, headers, and JSON body. Always include the `x-nicerella-admin-secret` header where required.

Tell the user to watch the terminal running the Next.js dev server because scrape and analysis progress is logged there.

For UI features, also share the Playwright MCP flow and Chrome DevTools MCP checks used for verification (section 21), so the user can re-run them.

Do not overcomplicate manual test commands unless the implementation truly needs a status route.

---

# 18. Oxylabs Scheduler

Use Oxylabs Scheduler to run scraping for active source listing pages stored in Supabase on a recurring schedule.

Scheduler should scrape source listing pages only.

## Oxylabs Scheduler API

Before implementing Oxylabs Scheduler, always fetch the current API documentation from `https://developers.oxylabs.io/products/web-scraper-api/features/scheduler`. Do not assume endpoint paths, request body fields, or response field names from memory — consult the live docs first.

## Large integer precision — critical

Oxylabs `schedule_id` and job `id` values are large 64-bit integers that exceed JavaScript's `Number.MAX_SAFE_INTEGER`. Parsing them with `JSON.parse` silently corrupts the last digits, producing a wrong ID that Oxylabs will not recognise.

Always read these IDs from the raw HTTP response text before any `JSON.parse` call — use string extraction or regex on the raw text to capture the exact digit sequence. Never convert a parsed JavaScript number back to a string; precision is already lost at parse time.

## Use /runs not /jobs for processing

`GET /schedules/{id}/jobs` returns a flat array of job IDs with no status. There is no way to know if a job is `done`, `pending`, or `faulted`.

`GET /schedules/{id}/runs` returns each run with per-job `result_status`. Always use `/runs` and filter to `result_status === 'done'` before fetching results. Do not attempt to fetch results for `pending` or `faulted` jobs.

## Orphan schedule deactivation

Each call to the sync route that creates a new schedule leaves behind old schedules on Oxylabs if DB rows were deleted and re-created. These orphaned schedules still run and count against the Oxylabs bill.

The sync route must:

1. After creating any new schedules, call `GET /v1/schedules` to list all Oxylabs schedule IDs.
2. Compare against the IDs currently stored in `oxylabs_schedules`.
3. Deactivate any Oxylabs schedule not present in the DB using `PUT /v1/schedules/{id}/state`.

## Two separate one-time setups

Creating Oxylabs schedules and configuring Vercel Cron are two independent one-time steps. Neither one triggers the other.

- `POST /api/oxylabs/schedules` — tells Oxylabs what to scrape on schedule. Done once per source set.
- Vercel Cron config — tells Vercel to call `/api/cron/pipeline` on schedule. Done once via `vercel.json`.

Both must be completed for the pipeline to be fully automatic. Until Vercel Cron is configured, the process route must be called manually.

Products only appear on the homepage after `analyzed_at` is set. Until analysis runs, use `POST /api/analyze` manually after scraping.

Process scheduled results by running the **scrape-to-insert pipeline** (section 9), with these scheduler differences:

- Create or update Oxylabs schedules from active source listing pages before processing.
- The listing HTML comes from completed Oxylabs job results — fetch via `/runs`, use only `result_status === 'done'` (see above), and parse that HTML instead of doing a live listing fetch.
Do not save raw scheduled listing results as products.
Do not duplicate pipeline logic inside Scheduler; reuse the same validation, cleanup, dedupe, URL existence check, and run logging as manual scraping (section 9).
Automatic pipeline
Scheduled result processing and AI trust analysis must run automatically after every Oxylabs run.
Do not require manual intervention after schedules are created.
The automatic pipeline flow is:
Oxylabs Scheduler runs its jobs on schedule.
A Vercel Cron Job fires after a delay to give Oxylabs time to finish.
The cron triggers /api/cron/pipeline, which runs both steps in sequence.
Step one: process scheduled results — fetch completed Oxylabs job HTML, extract candidate product links, reject non-product URLs, dedupe, scrape product detail pages and reviews, validate, and insert valid products/reviews.
Step two: immediately run AI trust analysis on all newly inserted or newly-reviewed products that are still pending analysis.
If step one fails, step two must still run — there may be pre-existing unanalyzed products.
Log progress and completion for both steps.
The cron route is internal only and must not be callable by browsers or users.
Protect the cron route using the CRON_SECRET environment variable, which Vercel injects automatically on every cron request. Reject requests with a missing or wrong value with 401.
In local development, skip the secret check so the route can be tested manually.
Do not use NICERELLA_ADMIN_SECRET to protect the cron route. Do not add CRON_SECRET to .env.local.
When implementing Oxylabs Scheduler, always deliver all parts together: schedule sync route, run-processing route, and cron wiring.
19. Trust label definitions
trust_score is a 0–1 value derived from authenticity confidence, red flag count/severity, and estimated fake-review percentage.
Map trust_score to trust_label:
highly trustworthy — score ≥ 0.85, low estimated fake percentage, no significant red flags
mostly trustworthy — score 0.65–0.84, minor red flags only
mixed — score 0.4–0.64, some conflicting signals, moderate estimated fake percentage
suspicious — score 0.2–0.39, multiple red flags (review bursts, duplicate phrasing, incentivized language)
likely manipulated — score < 0.2, strong evidence of coordinated or bot-generated reviews
Always attach the disclaimer field explaining this is an AI estimate, not a certified fraud finding.
20. pgvector similarity search
After pgvector is enabled in Supabase, add the embedding vector(1536) column to product_trust_analyses.
Generate embeddings from the neutral summary plus product title/category using the AI SDK/OpenAI provider, store them alongside the analysis.
Use pgvector cosine similarity queries to power a "similar products" section on the product details page, scoped to the same or related category.
Vector queries are read-only from the UI's perspective — the UI must call a thin API route that queries Supabase, never query pgvector directly from client code.
21. Design workflow — UI/UX Pro Max skill, Playwright MCP, Chrome DevTools MCP
For any UI task:
Before writing UI code, read .agents/skills/ui-ux-pro-max and produce the design decisions (layout, typography, spacing, color, component states, responsive breakpoints) as part of the prompt file (section 4).
Implement the UI only after the prompt is approved.
After implementation, start the app locally and use playwright-mcp to drive the real page: navigate to the affected route(s), interact with every new control, exercise loading/empty/error states where feasible, and confirm navigation and data flow work end to end.
In the same pass, use chrome-devtools-mcp on the same page to check for console errors, failed network requests, layout/overflow issues at mobile and desktop widths, and take an accessibility snapshot of new interactive elements.
If either MCP surfaces an issue, fix it and re-run both checks before calling the task done.
Report what was verified (routes visited, states exercised, console/network status) alongside the manual test steps in section 17.
Do not skip this verification pass for UI tasks. Do not use these MCPs for non-UI tasks (scraping, AI analysis, DB migrations) — they add no value there.
22. MCP usage rules
playwright-mcp and chrome-devtools-mcp are development-time verification tools only. Never reference them in application code, environment variables, or production configuration.
Only use these MCPs on a locally running instance of the app, never against a third-party or production URL without explicit user approval.
If an MCP is unavailable or a call fails, tell the user directly rather than silently skipping verification.
Do not use these MCPs to scrape target e-commerce sites — scraping is Oxylabs' job only (sections 9 and 18).