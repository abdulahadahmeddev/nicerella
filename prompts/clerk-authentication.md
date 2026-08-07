# Clerk Authentication Implementation

## Goal
Implement Clerk authentication for nicerella, wiring up the existing sign-in and sign-up pages with Clerk components, adding middleware protection, and updating the header with auth-aware navigation.

## Skills and MCPs Used
- `.agents/skills/clerk` (router → `clerk-nextjs-patterns` for middleware and SSR patterns)
- `.agents/skills/clerk-setup` for environment setup verification
- `node_modules/next/dist/docs/` (Next.js16 file conventions — proxy vs middleware)
- Playwright MCP + Chrome DevTools MCP for UI verification (section 21)

## Existing Code Inspected
- `.env.local` - Clerk keys already configured (pk_test and sk_test)
- `package.json` - `@clerk/nextjs@^7.7.0` already installed (current SDK v7+)
- `app/layout.tsx` - Root layout without ClerkProvider
- `app/sign-in/page.tsx` - Placeholder auth card with slot for Clerk `<SignIn />`
- `app/sign-up/page.tsx` - Placeholder auth card with slot for Clerk `<SignUp />`
- `app/page.tsx` - Home page with Header component
- `components/ui/logo.tsx` - Logo component used in auth pages
- `components/layout/header.tsx` - Has an `actions` slot reserved for auth controls
- `components/ui/button.tsx` - Primary/secondary/ghost button with `href` link support
- `app/globals.css` - Design system variables: `--color-primary: #7c3aed`, `--color-primary-hover: #9f67ff`, `--color-background: #0b0f1a`, dark theme
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/middleware.md` + `proxy.md` - **Middleware is DEPRECATED in Next.js16 and renamed to `proxy.ts`** (export `proxy`, not `middleware`)
- `node_modules/@clerk/nextjs/dist/types/` - Clerk v7.7 exports confirmed: `ClerkProvider`, `SignIn`, `SignUp`, `SignInButton`, `UserButton`, `SignedIn`, `SignedOut` from `@clerk/nextjs`; `clerkMiddleware`, `createRouteMatcher`, `auth`, `currentUser` from `@clerk/nextjs/server`

## Decisions and Assumptions
- Using Clerk SDK v7+ (current) patterns, Next.js16 `proxy.ts` convention
- Public routes: `/`, `/sign-in`, `/sign-up`, `/products/**` (browse products should be public)
- Protected routes: All API routes that mutate data (already protected by `NICERELLA_ADMIN_SECRET`)
- The header should show "Sign in" button when unauthenticated, user menu when authenticated
- Clerk's default appearance will be customized via the `appearance` prop to match nicerella's dark design system (#7c3aed primary, dark surface/background)
- Since the site content is public browsing, the middleware uses public-first strategy: keep the proxy matcher in place (so Clerk session auth works) but only protect future admin/dashboard routes via `createRouteMatcher` — no route is hard-protected yet (AGENTS.md section 1 has no private area to gate)

## Files Likely to Change
1. `app/layout.tsx` - Wrap with `<ClerkProvider>` (reads `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` automatically)
2. `proxy.ts` - Create at project root (NOT `middleware.ts` — Next.js16 rename) with `clerkMiddleware` + `createRouteMatcher`
3. `app/sign-in/page.tsx` - Replace placeholder with Clerk `<SignIn />` component
4. `app/sign-up/page.tsx` - Replace placeholder with Clerk `<SignUp />` component
5. `components/layout/header.tsx` - Add auth-aware navigation (Sign in button / UserButton) via the existing `actions` slot
6. `app/page.tsx` - Pass auth actions to `<Header />`

## Files Likely to Change
1. `app/layout.tsx` - Wrap with `<ClerkProvider>`
2. `middleware.ts` - Create with `clerkMiddleware` for route protection
3. `app/sign-in/page.tsx` - Replace placeholder with Clerk `<SignIn />` component
4. `app/sign-up/page.tsx` - Replace placeholder with Clerk `<SignUp />` component
5. `components/layout/header.tsx` - Add auth-aware navigation (Sign in button / UserButton)
6. `app/globals.css` - May need to add Clerk CSS variables or overrides

## Implementation Requirements

### 1. ClerkProvider Setup
- Wrap the root layout with `<ClerkProvider>`
- Pass the publishable key from environment
- Configure appearance to match design system:
  - Primary color: `#7c3aed` (violet-600)
  - Border radius: `var(--radius-lg)`
  - Font: Inter (already set on html)

### 2. Proxy (Next.js16 — NOT middleware.ts)
- Create `proxy.ts` at project root (Next.js16 deprecated `middleware.ts` in favor of `proxy.ts`; the file exports `proxy`, not `middleware`)
- Use `clerkMiddleware` from `@clerk/nextjs/server` with `createRouteMatcher`
- Public-first strategy: define a route matcher for current public pages (`/`, `/sign-in`, `/sign-up`, `/products`) and allow everything else through; no hard-protected routes exist yet (AGENTS.md has no private area)
- The proxy matcher config must still run for `/api(.*)` so Clerk session auth is available on API routes
- Include the standard negative matcher to skip `_next`, static assets, and images

### 3. Sign-in Page
- Import `<SignIn />` from `@clerk/nextjs`
- Replace placeholder div with `<SignIn />` component
- Configure `appearance` prop to match design system
- Set `routing="path"` and `path="/sign-in"`
- Keep the existing TrustOrb background and auth card structure

### 4. Sign-up Page
- Import `<SignUp />` from `@clerk/nextjs`
- Replace placeholder div with `<SignUp />` component
- Configure `appearance` prop to match design system
- Set `routing="path"` and `path="/sign-up"`
- Keep the existing TrustOrb background and auth card structure

### 5. Header Auth State
- Home page (`app/page.tsx`) is a Server Component — use `auth()` from `@clerk/nextjs/server` (await it!) or `<SignedIn>/<SignedOut>` client controls to decide what to render in the header `actions` slot
- Prefer a small client component `AuthActions` using `<SignedIn>` / `<SignedOut>` from `@clerk/nextjs`:
  - Unauthenticated: render a "Sign in" `<Button href="/sign-in">` (link styled as button, matches `btn-primary`)
  - Authenticated: render `<UserButton afterSignOutUrl="/" />`
- This keeps the header auth state live on the client without making the whole home page dynamic

### 6. Redirect Configuration
- After sign-in: redirect to home `/`
- After sign-up: redirect to home `/`
- Configure in Clerk dashboard or via `afterSignInUrl` / `afterSignUpUrl` props

## Security Requirements
- Never expose `CLERK_SECRET_KEY` to client
- Middleware protects routes automatically
- API routes already protected by `NICERELLA_ADMIN_SECRET` (per AGENTS.md section 15)
- Webhook routes ignored by Clerk middleware (they have their own verification)

## Acceptance Criteria
- [ ] Root layout wrapped with ClerkProvider
- [ ] `proxy.ts` created (Next.js16 convention) with clerkMiddleware and route matcher
- [ ] Sign-in page renders Clerk SignIn component with design system styling
- [ ] Sign-up page renders Clerk SignUp component with design system styling
- [ ] Header shows "Sign in" button when unauthenticated
- [ ] Header shows UserButton when authenticated
- [ ] Sign-in and sign-up flows work end to end (email/password)
- [ ] No TypeScript errors
- [ ] Build passes successfully

## Checks to Run
1. `npm run build` - TypeScript and build verification
2. `npm run dev` - Start development server
3. Visual QA with Playwright MCP + Chrome DevTools MCP

## Manual Test Steps

### 1. Start the dev server
```bash
npm run dev
```

### 2. Test sign-up flow
- Navigate to `http://localhost:3000/sign-up`
- Create a new account with email/password
- Verify redirect to home page after successful sign-up
- Verify header shows UserButton with avatar

### 3. Test sign-in flow
- Sign out (via UserButton menu)
- Navigate to `http://localhost:3000/sign-in`
- Sign in with the created account
- Verify redirect to home page
- Verify header shows UserButton

### 4. Test header auth state
- When signed out: verify "Sign in" button is visible
- When signed in: verify UserButton is visible
- Click UserButton, verify dropdown shows profile/sign-out options

### 5. Test proxy/session behavior
- Verify Clerk session cookie is set after sign-in (Chrome DevTools MCP — Application/Cookies)
- Verify the `proxy.ts` matcher runs on page requests (no auth errors in console)
- Since no route is hard-protected yet (AGENTS.md has no private area), skip route-redirect testing — that comes when an admin/dashboard area is built

## Visual QA Checklist (Playwright MCP + Chrome DevTools MCP)

After implementation, run these checks:

### Sign-in Page
- [ ] Navigate to `/sign-in`
- [ ] Verify TrustOrb background renders
- [ ] Verify Logo is visible and centered
- [ ] Verify Clerk SignIn form renders with correct styling
- [ ] Check console for errors (Chrome DevTools MCP)
- [ ] Check network requests for failures (Chrome DevTools MCP)
- [ ] Take accessibility snapshot of SignIn form

### Sign-up Page
- [ ] Navigate to `/sign-up`
- [ ] Verify TrustOrb background renders
- [ ] Verify Logo is visible and centered
- [ ] Verify Clerk SignUp form renders with correct styling
- [ ] Check console for errors
- [ ] Check network requests for failures
- [ ] Take accessibility snapshot of SignUp form

### Header (Desktop)
- [ ] Load home page while signed out
- [ ] Verify "Sign in" button is visible and styled correctly
- [ ] Sign in
- [ ] Verify UserButton appears in header
- [ ] Click UserButton, verify dropdown menu

### Header (Mobile)
- [ ] Resize to mobile width (375px)
- [ ] Verify responsive behavior of auth controls

### Authentication Flow
- [ ] Complete sign-up flow
- [ ] Verify redirect to home
- [ ] Verify authenticated state in header
- [ ] Sign out via UserButton
- [ ] Verify redirect to home and unauthenticated state
- [ ] Complete sign-in flow
- [ ] Verify authenticated state restored
