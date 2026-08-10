# Stripe Trial Activation + Security + Mobile Nav Fixes

## Goal

Fix three real production issues found on `nicerella.vercel.app`:

1. **Stripe trial never activates.** A user completes Pro checkout, is redirected to
   `/pricing?success=1`, but the plan stays Free forever and the page shows
   "Subscription activating…" on every refresh.
2. **Unsecured success URL.** `/pricing?success=1` is a fixed, guessable query
   string — anyone can visit it and see the success/activating banner. No
   verification that a real checkout happened for the signed-in user.
3. **Missing mobile navigation.** The header nav (`Products / Pricing / Articles`)
   is hidden below `sm` with no mobile replacement — the links are unreachable on
   phones.

## Skills and MCPs read

- `clerk-billing`, `clerk` (auth/session), `shadcn` design tokens, Stripe API
  docs (live-verified), `node_modules/next/dist/docs` (Next.js 16 server
  components / searchParams).
- For final UI verification: `playwright-mcp` + `chrome-devtools-mcp` (section 21).

## Root cause (verified)

- Stripe fires the correct events: `checkout.session.completed` +
  `customer.subscription.created` (status=`trialing`) for the user.
- The webhook endpoint `we_1U2WasQYCRI27SJaissdqtCy` exists and points at
  `https://nicerella.vercel.app/api/stripe/webhook` with the right events.
- **But** the `logs` table shows repeated `signature verification failed` from
  `stripe/webhook` at exactly the checkout times. The `STRIPE_WEBHOOK_SECRET`
  configured in Vercel does **not** match the signing secret on the Stripe
  endpoint. Every event is rejected with 400 before `handleStripeEvent` runs.
- Result: `subscriptions` row stays `plan: free, status: active`,
  `stripe_subscription_id: null`, so `getUserPlan().isPro` is false and the
  pricing page's honest "activating" banner never resolves.

## Design decisions

### 1. Secure, self-verifying checkout return (replaces `?success=1`)

Use Stripe's own random, unguessable session id as the return token instead of a
fixed `success=1` flag:

- Checkout `success_url` becomes `.../pricing?session_id={CHECKOUT_SESSION_ID}`.
  Stripe fills in a long random id like
  `cs_test_a1b2c3d4…` — this is the "hashed random URL" big sites use.
- The pricing page reads `session_id`; when present and the user is signed in,
  it **verifies server-side against Stripe**:
  - fetch the Checkout Session via the Stripe SDK,
  - confirm `metadata.userId` / `client_reference_id` equals the signed-in user,
  - confirm the session is `complete` and paid/trialing.
- Only on that verification does the page mirror the subscription into Supabase
  (same `applySubscription` path the webhook uses) and show "Welcome to Pro".
- If verification fails (wrong user, forged id, expired), show **no** success
  banner — treat it as a plain pricing visit. No plan change.
- This makes activation deterministic (no reliance on webhook timing) and
  closes the `?success=1` hole: the token is random, unguessable, and bound to
  the user who created it.

### 2. Fix the webhook secret (root cause)

- The signing secret on the Stripe endpoint cannot be read back via the API, so
  recreate the webhook endpoint with a known secret:
  1. `POST /v1/webhook_endpoints` with the same URL + events →
     capture the returned `secret` (only ever returned at creation).
  2. Update `.env.local` with that `STRIPE_WEBHOOK_SECRET`.
  3. Deactivate the old broken endpoint so it stops failing.
- Vercel env must then be updated with the same value (user action — see manual
  test steps). After deploy, Stripe retries the failed events and the existing
  `trialing` subscription lands in Supabase.

### 3. Mobile navigation

- Header nav links are `hidden sm:flex` — invisible on phones. Add a mobile
  menu (hamburger) rendered below the `sm` breakpoint with the same links,
  matching the existing design system (surface-elevated bg, blur, border,
  `page-container` width, `text-body-sm` links).

## Files likely to change

- `lib/stripe/server.ts` — `success_url` to use `{CHECKOUT_SESSION_ID}`.
- `app/pricing/page.tsx` — verify `session_id` server-side; success banner only
  after verified; keep `canceled` handling.
- `components/layout/header.tsx` — mobile menu toggle + links.
- `.env.local` — updated `STRIPE_WEBHOOK_SECRET`.
- Stripe account: new webhook endpoint (old one deactivated).

## Implementation requirements

- `lib/stripe/server.ts`: change success_url to
  `` `${origin}/pricing?session_id={CHECKOUT_SESSION_ID}` ``. Keep `canceled=1`.
- `app/pricing/page.tsx`:
  - searchParams now includes `session_id`.
  - When `session_id` present AND `userId` exists: retrieve session via
    `getStripe().checkout.sessions.retrieve(id)`; require
    `session.metadata?.userId === userId || session.client_reference_id === userId`
    and `session.status === "complete"` (and for non-trial, payment captured).
    On success call `applySubscription` for `session.subscription` and re-read
    the plan so the banner reflects Pro immediately.
  - Wrap the verify in try/catch; on any failure or mismatch, no banner, no
    plan change. Never log the session id at error level in full.
- `components/layout/header.tsx`: add a hamburger button (`sm:hidden`) toggling
  a dropdown with NAV_LINKS (and the auth actions when provided), closing on
  navigation / Escape / outside click. Client component ("use client") where
  state lives; keep the existing desktop `<nav>` for `sm+`.

## Security requirements

- No fixed success token. Only a Stripe session id bound to the authenticated
  user's checkout unlocks the success banner / plan mirror.
- Session id is never trusted from the URL alone — always re-verified against
  Stripe server-side with ownership + status checks.
- No plan mutation from the client. The pricing page is a server component;
  the mirror uses the service-role client exactly like the webhook.
- Webhook remains the source of truth for ongoing subscription events; the page
  mirror is only the immediate post-checkout confirmation.

## Acceptance criteria

1. Completing Pro checkout redirects to `/pricing?session_id=cs_...` and the
   page shows "Welcome to Pro" without a manual refresh.
2. Visiting `/pricing?success=1` (no session id) shows no success banner and
   changes nothing.
3. Visiting a session id for a different user, a random/forged id, or signed
   out, shows no banner and changes nothing.
4. Webhook logs show `handled checkout.session.completed` (no more
   `signature verification failed`) once Vercel env is updated.
5. On mobile width (<640px) the hamburger opens a menu with Products, Pricing,
   Articles; desktop keeps the inline nav.

## Checks to run

- `npx next build` (TypeScript + Next build).
- Local: `npm run dev`, sign in, complete a trial checkout, confirm redirect +
  immediate Pro banner, and confirm the `subscriptions` row updated.
- Playwright MCP + Chrome DevTools MCP on the live local app at 375px and
  1280px: nav toggle works, no console errors, no overflow, accessibility
  snapshot of the new menu.

## Manual test steps (after implementation)

Watch the dev-server terminal for logs.

1. **Webhook secret (Vercel):** In Vercel → Settings → Environment Variables,
   set `STRIPE_WEBHOOK_SECRET` to the new value from `.env.local` and redeploy.
2. Restart dev server (webhook secret changed).
3. Sign in → `/pricing` → Start free trial → complete Stripe test checkout →
   expect redirect to `/pricing?session_id=cs_test_…` and an immediate
   "Welcome to Pro" banner. Refresh → still Pro.
4. Open `/pricing?success=1` in a private window → no banner.
5. Open the old `/pricing?canceled=1` → canceled banner still shows (harmless).
6. After redeploy, confirm Supabase `logs` shows a recent `stripe/webhook`
   info row: `handled checkout.session.completed`.
