# Not Found (404) Page

> Route: `*` (catch-all)
> Purpose: Display when users navigate to a non-existent route

---

## Purpose

The 404 page provides a friendly, on-brand error experience when users attempt to access a route that doesn't exist. It maintains the dark theme aesthetic and offers clear navigation back to the app.

---

## Layout Structure

```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│  Trust Orb (subtle, centered background)                      │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │                  [Search icon, large]                     │ │
│  │                                                           │ │
│  │                    "Page not found"                       │ │
│  │                                                           │ │
│  │         "The page you're looking for doesn't exist       │ │
│  │          or may have been moved."                         │ │
│  │                                                           │ │
│  │                  [Go Home]                                │ │
│  │                                                           │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Components Used

| Component | Source | Purpose |
|-----------|--------|---------|
| **Logo** | `components/ui/logo.tsx` | Brand identity (optional) |
| **TrustOrb** | `components/ui/trust-orb.tsx` | Background atmosphere |
| **Button** | `components/ui/button.tsx` | Navigation action |

---

## Color & Typography Application

### Page Background

- `background: var(--color-background)` (#0B0F1A)

### Container

- Text centered
- `max-width: 480px`
- `padding: var(--space-3xl)` (64px)

### Icon

- `color: var(--color-foreground-muted)` (#94A3B8)
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

### Button

- Primary button style
- `background: var(--color-primary)`
- `color: white`

---

## Spacing

| Element | Token | Value |
|---------|-------|-------|
| Page vertical padding | `--space-3xl` | 64px |
| Icon margin bottom | `--space-lg` | 24px |
| Heading margin bottom | `--space-md` | 16px |
| Body margin bottom | `--space-xl` | 32px |
| Container max-width | — | 480px |

---

## Responsive Behavior

### Mobile (< 640px)

- Smaller icon (48px)
- Heading: `font-size: 1.75rem` (H2)
- Full-width button
- Reduced padding (32px)

### Desktop (≥ 768px)

- Full-size icon (64px)
- Heading: `font-size: 2.25rem` (H1)
- Auto-width button
- Standard padding (64px)

---

## Interaction & Motion States

### Button Hover

- Same as primary button hover
- `background: var(--color-primary-hover)`
- `transform: translateY(-1px)`
- `box-shadow: var(--shadow-glow)`

### Trust Orb

- Subtle animation (same as other pages)
- Lower opacity (0.15)
- Respects `prefers-reduced-motion`

---

## Accessibility

- Semantic HTML: `<main>`, `<h1>`
- Icon has `aria-hidden="true"` (decorative)
- Button has descriptive text
- Focus visible on button
- Can be dismissed with browser back button

---

## Notes

- This is a simple, static error page
- No data fetching required
- Should work even if JS fails to load (consider static rendering)
- Logo optional — keeps the page focused on the error message
