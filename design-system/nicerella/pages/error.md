# Error Page

> Route: `_error.tsx` (Next.js error boundary)
> Purpose: Display when a runtime error occurs in the application

---

## Purpose

The error page catches unexpected runtime errors and displays a friendly error message. It provides options to retry the action or return to safety (home page), maintaining the dark theme aesthetic even in failure states.

---

## Layout Structure

```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│  Trust Orb (subtle, positioned top-right)                     │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │                 [Warning icon, large]                     │ │
│  │                                                           │ │
│  │                 "Something went wrong"                    │ │
│  │                                                           │ │
│  │         "An unexpected error occurred. Please try        │ │
│  │          again or return to the home page."               │ │
│  │                                                           │ │
│  │           [Try Again]  [Go Home]                          │ │
│  │                                                           │ │
│  │                                                           │ │
│  │         Error ID: [error-id] (collapsible)               │ │
│  │                                                           │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Components Used

| Component | Source | Purpose |
|-----------|--------|---------|
| **TrustOrb** | `components/ui/trust-orb.tsx` | Background atmosphere |
| **Button** | `components/ui/button.tsx` | Action buttons |

---

## Color & Typography Application

### Page Background

- `background: var(--color-background)` (#0B0F1A)

### Container

- Text centered
- `max-width: 480px`
- `padding: var(--space-3xl)` (64px)

### Icon

- `color: var(--color-destructive)` (#EF4444)
- `size: 64px`
- `margin-bottom: var(--space-lg)` (24px)

### Heading

- `color: var(--color-foreground)` (#F1F5F9)
- `font-size: 2.25rem` (H1)
- `font-weight: 700`
- `margin-bottom: var(--space-md)` (16px)

### Body Text

- `color: var(--color-foreground-muted)` (#94A3B8)
- `font-size: 1rem` (Body)
- `line-height: 1.5`
- `margin-bottom: var(--space-xl)` (32px)

### Buttons

**Primary (Try Again):**
- `background: var(--color-primary)`
- `color: white`

**Secondary (Go Home):**
- `background: transparent`
- `border: 2px solid var(--color-primary)`
- `color: var(--color-primary)`

### Error ID

- `color: var(--color-foreground-muted)`
- `font-size: 0.75rem` (Caption)
- `font-family: monospace`
- Background: `rgba(148, 163, 184, 0.08)`
- `padding: var(--space-xs)` (4px)
- `border-radius: var(--radius-sm)` (4px)

---

## Spacing

| Element | Token | Value |
|---------|-------|-------|
| Page vertical padding | `--space-3xl` | 64px |
| Icon margin bottom | `--space-lg` | 24px |
| Heading margin bottom | `--space-md` | 16px |
| Body margin bottom | `--space-xl` | 32px |
| Button gap | `--space-md` | 16px |
| Container max-width | — | 480px |

---

## Responsive Behavior

### Mobile (< 640px)

- Smaller icon (48px)
- Heading: `font-size: 1.75rem` (H2)
- Buttons stacked vertically
- Full-width buttons
- Reduced padding (32px)

### Desktop (≥ 768px)

- Full-size icon (64px)
- Heading: `font-size: 2.25rem` (H1)
- Buttons side-by-side
- Auto-width buttons
- Standard padding (64px)

---

## Interaction & Motion States

### Buttons

- Primary button: standard hover/focus states
- Secondary button: standard hover/focus states

### Error ID Toggle

- Collapsed by default (just "Error ID: [id]")
- Expandable to show full stack trace in development
- Toggle with chevron icon

---

## Accessibility

- Semantic HTML: `<main>`, `<h1>`
- Icon has `aria-hidden="true"` (decorative)
- Both buttons have descriptive labels
- Focus visible on buttons
- Error ID available for support reference

---

## Development vs Production

**Development:**
- Show full error stack trace
- Show component stack
- Show error ID prominently

**Production:**
- Hide stack traces
- Show generic message
- Error ID available but collapsed

---

## Notes

- This is Next.js error boundary (`_error.tsx`)
- Should capture error details for logging (Sentry, etc.)
- "Try Again" should attempt to re-render or reload
- "Go Home" navigates to `/`
