# Sign Up Page

> Route: `/sign-up`
> Purpose: Clerk authentication — allow new users to create an account

---

## Purpose

The sign-up page provides Clerk authentication for new users. It mirrors the sign-in page design with minimal, focused layout while integrating Clerk's pre-built authentication components.

---

## Layout Structure

```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│  Trust Orb (subtle, positioned top-right)                     │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │                    [Logo]                                 │ │
│  │                                                           │ │
│  │            "Create your account"                          │ │
│  │                                                           │ │
│  │  ┌─────────────────────────────────────────────────┐    │ │
│  │  │ Clerk SignUp component                            │    │ │
│  │  │ - Email field                                    │    │ │
│  │  │ - Password field                                 │    │ │
│  │  │ - Confirm password field                         │    │ │
│  │  │ - Sign Up button                                 │    │ │
│  │  │ - Sign in link                                   │    │ │
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
| **Clerk SignUp** | `@clerk/nextjs` | Registration form |

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

Clerk's SignUp component styled via appearance prop to match design system colors and typography.

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
.auth-card {
  animation: auth-card-enter 300ms ease-out;
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

---

## Loading State

**During registration:**

Clerk handles loading states internally with spinner and disabled button states. Ensure Clerk's loading spinner uses theme colors.

---

## Error State

**Clerk registration errors:**

Clerk displays errors inline within the form.

**Error Display:**
- Text color: `var(--color-destructive)` (#EF4444)
- Background: `rgba(239, 68, 68, 0.1)`
- Border left: `3px solid var(--color-destructive)`
- Padding: `var(--space-sm)` (8px)

---

## Accessibility

- Clerk components are WCAG 2.1 AA compliant by default
- All form fields have associated labels
- Error messages linked to fields via aria-describedby
- Focus management handled by Clerk
- Logo has `alt="Nicerella logo"`

---

## Notes

- This page uses Clerk's pre-built `<SignUp />` component
- Clerk appearance customized via `appearance` prop
- No custom registration logic
- Redirect after successful signup: `/` (home page)
