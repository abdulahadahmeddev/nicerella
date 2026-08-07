# Sign In Page

> Route: `/sign-in`
> Purpose: Clerk authentication — allow existing users to sign in

---

## Purpose

The sign-in page provides Clerk authentication for returning users. It's a minimal, focused page that follows the dark theme design system while integrating Clerk's pre-built authentication components.

---

## Layout Structure

```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│  Trust Orb (subtle, positioned top-left)                      │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │                    [Logo]                                 │ │
│  │                                                           │ │
│  │              "Welcome back"                               │ │
│  │                                                           │ │
│  │  ┌─────────────────────────────────────────────────┐    │ │
│  │  │ Clerk <SignIn /> component                       │    │ │
│  │  │ - Email/username field                           │    │ │
│  │  │ - Password field                                 │    │ │
│  │  │ - Sign In button                                 │    │ │
│  │  │ - Forgot password link                           │    │ │
│  │  │ - Sign up link                                   │    │ │
│  │  └─────────────────────────────────────────────────┘    │ │
│  │                                                           │ │
│  │                                                           │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Components Used

| Component | Source | Purpose |
|-----------|--------|---------|
| **Logo** | `components/ui/logo.tsx` | Brand identity |
| **TrustOrb** | `components/ui/trust-orb.tsx` | Background atmosphere |
| **Clerk SignIn** | `@clerk/nextjs` | Authentication form |

---

## Color & Typography Application

### Page Background

- `background: var(--color-background)` (#0B0F1A)

### Card Container

- `background: var(--color-surface)` (#131825)
- `border: 1px solid var(--color-border)`
- `border-radius: var(--radius-2xl)` (24px)
- `box-shadow: var(--shadow-xl)`
- `max-width: 400px`
- `padding: var(--space-2xl)` (48px)

### Heading

- `color: var(--color-foreground)` (#F1F5F9)
- `font-size: 1.75rem` (H2)
- `font-weight: 600`
- `text-align: center`
- `margin-bottom: var(--space-lg)`

### Clerk Component Styling

Clerk's SignIn component can be styled via Clerk's appearance prop:

```tsx
<SignIn
  appearance={{
    baseTheme: dark,
    elements: {
      rootBox: "mx-auto",
      card: "bg-transparent",
      headerTitle: "text-[var(--color-foreground)]",
      headerSubtitle: "text-[var(--color-foreground-muted)]",
      formButtonPrimary: "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]",
      formFieldInput: "bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-foreground)]",
      footerActionLink: "text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]",
    },
  }}
/>
```

**Overridden Clerk Elements:**
- Primary button: `var(--color-primary)` background
- Input fields: `var(--color-background)` background, `var(--color-border)` border
- Links: `var(--color-primary)` text
- Text: `var(--color-foreground)` for labels

---

## Spacing

| Element | Token | Value |
|---------|-------|-------|
| Page vertical padding | `--space-3xl` | 64px |
| Card padding | `--space-2xl` | 48px |
| Logo margin bottom | `--space-lg` | 24px |
| Heading margin bottom | `--space-lg` | 24px |
| Form field gaps | `--space-md` | 16px |

---

## Responsive Behavior

### Breakpoints

| Breakpoint | Card Width | Padding |
|------------|------------|---------|
| < 640px | 100% (minus 32px) | 24px |
| 640px – 767px | 400px | 32px |
| ≥ 768px | 400px | 48px |

### Mobile (< 640px)

- Card takes full width minus 16px margin on each side
- Reduced padding (24px)
- Heading size smaller (H3)
- Trust Orb scaled down

### Desktop (≥ 768px)

- Centered card at 400px max-width
- Full padding (48px)
- Trust Orb visible at 20% opacity

---

## Interaction & Motion States

### Card Entrance

```css
/* Subtle fade in on page load */
.auth-card {
  animation: auth-card-enter 300ms ease-out;
}

@keyframes auth-card-enter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Form Button (Clerk Override)

- Hover: `var(--color-primary-hover)` background
- Active: `transform: scale(0.98)`
- Focus: `var(--color-ring)` outline
- Transition: `200ms ease`

### Input Fields (Clerk Override)

- Focus: `var(--color-primary)` border, glow shadow
- Hover: Border brightens slightly
- Transition: `200ms ease`

### Trust Orb

- Same animation as home page
- Reduced opacity (0.15 instead of 0.2)
- Respects `prefers-reduced-motion`

---

## Empty State

Not applicable — this is an authentication form.

---

## Loading State

**During authentication:**

Clerk handles loading states internally with spinner and disabled button states. Ensure Clerk's loading spinner uses theme colors:

```tsx
appearance={{
  elements: {
    formButtonPrimary: "bg-[var(--color-primary)]",
    spinner: "border-[var(--color-primary)]",
  },
}}
```

---

## Error State

**Clerk authentication errors:**

Clerk displays errors inline within the form. Ensure error text uses design system colors:

```tsx
appearance={{
  elements: {
    alertText: "text-[var(--color-destructive)]",
    formFieldErrorText: "text-[var(--color-destructive)]",
  },
}}
```

**Error Display:**
- Text color: `var(--color-destructive)` (#EF4444)
- Background: `rgba(239, 68, 68, 0.1)` (subtle red tint)
- Border left: `3px solid var(--color-destructive)`
- Padding: `var(--space-sm)` (8px)

---

## Accessibility

- Clerk components are WCAG 2.1 AA compliant by default
- All form fields have associated labels
- Error messages linked to fields via aria-describedby
- Focus management handled by Clerk
- "Forgot password" and "Sign up" links have descriptive text
- Logo has `alt="Nicerella logo"`

---

## Notes

- This page uses Clerk's pre-built `<SignIn />` component
- Clerk appearance is customized via the `appearance` prop to match design system
- No custom authentication logic should be added
- Redirect after successful login: `/` (home page)
