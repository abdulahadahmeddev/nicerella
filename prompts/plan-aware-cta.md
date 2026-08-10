# Plan-Aware Upgrade CTA (article + product consistency)

## Goal

The article page bottom card is **hardcoded** — every visitor (Free, trialing, Pro, Enterprise)
sees "Check any product with an AI trust score … Start 14-day free trial" even when they already
have an active trial/Pro/Enterprise plan. Make this CTA adapt automatically to the signed-in
user's plan everywhere it appears, and confirm the product page gate is already plan-aware.

## Skills and MCPs read

- `ui-ux-pro-max` design tokens (card, text-h4, text-body-sm, Button sizes, `--color-*` vars).
- Existing project patterns: `components/billing/pro-gate.tsx`, `app/products/[id]/page.tsx`
  (server-side `auth()` + `getUserPlan()`), `lib/data/subscriptions.ts` (`UserPlan` shape),
  `lib/stripe/plans.ts` (`PlanId` = free | pro | enterprise).
- `clerk` auth pattern already used by product/pricing pages.

## Root cause (verified)

- `app/articles/[slug]/page.tsx` lines 103–116: a static `<section>` with `Start 14-day free
  trial` button shown to **all** visitors. The article page never calls `auth()`/`getUserPlan()`.
- `components/billing/pro-gate.tsx`: the product-page gate is already correct — it renders the
  full analysis only when `isPro` (pro/enterprise on active/trialing/past_due), and its upgrade
  card is therefore only ever shown to Free/anonymous users, where "Start 14-day free trial" is
  the right copy. No behavioral bug; kept as the single source of the upgrade card design.

## Design decisions

1. New shared server component `components/billing/plan-cta.tsx` that takes the user's
   `UserPlan` and renders the article-bottom card with plan-aware copy:
   - **Free / anonymous** → keep current copy + "Start 14-day free trial" → `/pricing`.
   - **Pro · trialing** → "Your Pro trial is active" + "Manage billing" → `/pricing`.
   - **Pro · active** → "You're on Pro" + "Manage billing" → `/pricing`.
   - **Enterprise · trialing** → "Enterprise trial active" + "Manage billing" → `/pricing`.
   - **Enterprise · active** → "You're on Enterprise" + "Manage billing" → `/pricing`.
2. Article page fetches the plan server-side exactly like the product/pricing pages
   (`const { userId } = await auth(); const plan = await getUserPlan(userId);`) and replaces the
   hardcoded section with `<PlanCta plan={plan} />`. This makes the page dynamic (ƒ) — same as
   product & pricing — which is required for plan-aware rendering.
3. Export the copy helper `planCtaContent(plan)` from `plan-cta.tsx` so the string logic lives
   in one place. `ProGate`'s upgrade card copy already matches the free variant — it is left
   untouched (its audience is only ever Free users), but it is verified below.

## Files likely to change

- `components/billing/plan-cta.tsx` (NEW)
- `app/articles/[slug]/page.tsx` (fetch plan, swap CTA)

## Implementation requirements

- `components/billing/plan-cta.tsx`: server component (no "use client"). Props `{ plan: UserPlan }`.
  Uses existing `Button` (`href`, `size="lg"`), `card` class, `text-h4`, `text-body-sm`,
  `text-[var(--color-foreground-muted)]`, `max-w-md`, `mt-8 … p-8 text-center` — byte-for-byte
  matching the current article card styling so no visual regression on Free.
- `app/articles/[slug]/page.tsx`:
  - add imports: `auth` from `@clerk/nextjs/server`, `getUserPlan` from
    `@/lib/data/subscriptions`, `PlanCta` from `@/components/billing/plan-cta`.
  - inside `ArticlePage`, before return: `const { userId } = await auth(); const plan =
    await getUserPlan(userId);`
  - delete the static section (current lines 103–116) and render `<PlanCta plan={plan} />`.
  - do not change metadata / keyPoints / related logic.

## Security requirements

- No client-side plan fetch — the CTA is decided server-side from the Clerk session, matching
  AGENTS.md section 5 (server decides, UI only displays).
- `getUserPlan(null)` already returns the Free plan for anonymous visitors, so signed-out
  readers always see the Free CTA — no leak of Pro state to visitors.

## Acceptance criteria

1. Signed-in Pro (trialing or active) viewing any article sees the plan-aware card
   ("Your Pro trial is active" / "You're on Pro") with a "Manage billing" button, never
   "Start 14-day free trial".
2. Signed-in Enterprise user sees the Enterprise card.
3. Anonymous / Free visitor sees the original "Check any product with an AI trust score …
   Start 14-day free trial" card (no change).
4. Product page behavior is unchanged and still plan-aware (`ProGate isPro`).
5. `npx next build` passes; article route is now dynamic (ƒ).

## Checks to run

- `npx next build`.
- Playwright MCP on the running app: open an article as the signed-in (Pro) user → Pro CTA;
  open the same article in an isolated anonymous context → Free CTA.
- Chrome DevTools MCP on the same pages: no console errors, no failed requests.
- Product page still renders the Pro analysis for the signed-in user (gate verified).

## Manual test steps (after implementation)

1. Watch dev-server terminal.
2. Signed-in Pro: visit any `/articles/<slug>` → scroll to bottom → plan-aware card with
   "Manage billing" (no "Start 14-day free trial").
3. Signed-out (private window): same article → original Free CTA with "Start 14-day free trial".
4. Product page `/products/<id>` → signed-in Pro still sees full sentiment/red-flags; signed-out
   sees the ProGate upgrade card with "Start 14-day free trial".
