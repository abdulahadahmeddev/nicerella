# Home Page — Product Grid

> Route: `/`
> Purpose: Display all analyzed products with trust badges in a responsive grid

---

## Purpose

The home page is the primary entry point for authenticated users. It displays a grid of product cards, each showing the product image, title, trust score badge, and review count. Users can browse products and click through to view detailed trust analysis.

---

## Layout Structure

```
┌──────────────────────────────────────────────────────────────┐
│  Header (Nav)                                                 │
│  Logo · Search Bar · User Menu                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Hero Section                                                 │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Trust Orb (background signature element)              │  │
│  │  Heading: "Analyze Product Review Trust"               │  │
│  │  Subheading: "AI-powered authenticity analysis"        │  │
│  │  Search Bar (large, prominent)                         │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Product Grid Section                                         │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐    │
│  │ Product   │ │ Product   │ │ Product   │ │ Product   │    │
│  │ Card      │ │ Card      │ │ Card      │ │ Card      │    │
│  │           │ │           │ │           │ │           │    │
│  │ Trust     │ │ Trust     │ │ Trust     │ │ Trust     │    │
│  │ Badge     │ │ Badge     │ │ Badge     │ │ Badge     │    │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘    │
│                                                               │
│  [Load More Button] or [Pagination]                          │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Components Used

| Component | Source | Purpose |
|-----------|--------|---------|
| **Header** | `components/layout/header.tsx` | Navigation, search, user menu |
| **TrustOrb** | `components/ui/trust-orb.tsx` | Signature background animation |
| **ProductCard** | `components/ui/product-card.tsx` | Individual product display |
| **SearchBar** | `components/ui/search-bar.tsx` | Hero and header search |
| **Button** | `components/ui/button.tsx` | Load more, CTAs |

---

## Color & Typography Application

### Hero Section

**Background:**
- `background: var(--color-background)` (#0B0F1A)
- Trust Orb positioned top-right with `opacity: 0.2`

**Heading:**
- `color: var(--color-foreground)` (#F1F5F9)
- `font-size: 3rem` (Display)
- `font-weight: 700`
- `letter-spacing: -0.02em`

**Subheading:**
- `color: var(--color-foreground-muted)` (#94A3B8)
- `font-size: 1.125rem` (H4)
- `font-weight: 400`

**Search Bar:**
- `background: var(--color-surface)` (#131825)
- `border: 1px solid var(--color-border)`
- `border-radius: var(--radius-lg)` (12px)
- `padding: 16px 24px`

### Product Grid

**Grid Container:**
- `gap: var(--space-lg)` (24px)
- `padding: var(--space-2xl)` (48px) vertical

**Product Cards:**
- See ProductCard component spec in DESIGN_SYSTEM.md

---

## Spacing

| Element | Token | Value |
|---------|-------|-------|
| Hero padding (vertical) | `--space-3xl` | 64px |
| Hero padding (horizontal) | `--space-xl` | 32px |
| Section margin (grid) | `--space-2xl` | 48px |
| Grid gap | `--space-lg` | 24px |
| Card padding | `--space-lg` | 24px |
| Card internal gaps | `--space-sm` | 8px |

---

## Responsive Behavior

### Breakpoints

| Breakpoint | Grid Columns | Card Width | Layout |
|------------|--------------|------------|--------|
| < 640px | 1 | 100% | Single column, stacked |
| 640px – 767px | 2 | 50% | Two columns |
| 768px – 1023px | 2 | 50% | Two columns, larger cards |
| 1024px – 1279px | 3 | 33.33% | Three columns |
| ≥ 1280px | 4 | 25% | Four columns |

### Mobile (< 640px)

- Hero text centered, smaller heading (2.25rem)
- Search bar full width
- Product cards full width
- Trust badge smaller (10px font)
- Header collapsed with hamburger menu

### Tablet (640px – 1023px)

- Hero text left-aligned
- Search bar 60% width
- 2-column product grid
- Header shows logo + search + user menu

### Desktop (≥ 1024px)

- Full header visible
- Search bar in header + hero
- 3-4 column grid
- Hover effects active on cards

---

## Interaction & Motion States

### Product Card Hover

```css
transition: all 200ms ease;
```

- Border color: `var(--color-border)` → `var(--color-primary)`
- Box shadow: none → `var(--shadow-md)`
- Image scale: 1.0 → 1.05 (300ms ease)
- Glow overlay: opacity 0 → 0.1

### Search Bar Focus

```css
transition: border-color 200ms ease, box-shadow 200ms ease;
```

- Border color: `var(--color-border)` → `var(--color-primary)`
- Box shadow: `0 0 0 3px rgba(124, 58, 237, 0.2)`

### Trust Orb Animation

- 8-second loop with translateX/Y oscillation
- Easing: `easeInOut`
- Respects `prefers-reduced-motion`

---

## Empty State

**When no products exist:**

```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│                    [Database icon, large]                     │
│                                                               │
│              "No products analyzed yet"                       │
│                                                               │
│      "Products will appear here after scraping and           │
│       AI trust analysis is complete."                         │
│                                                               │
│              [Refresh] or [View Logs]                         │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Colors:**
- Icon: `var(--color-foreground-muted)` at 48px size
- Heading: `var(--color-foreground)`, H3
- Body: `var(--color-foreground-muted)`, Body Small
- Buttons: Secondary button style

---

## Loading State

**Initial page load:**

```
┌──────────────────────────────────────────────────────────────┐
│  Hero (skeleton loaded immediately)                           │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐    │
│  │ Skeleton  │ │ Skeleton  │ │ Skeleton  │ │ Skeleton  │    │
│  │ Card      │ │ Card      │ │ Card      │ │ Card      │    │
│  │ (pulse    │ │ (pulse    │ │ (pulse    │ │ (pulse    │    │
│  │ animation)│ │ animation)│ │ animation)│ │ animation)│    │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘    │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Skeleton Card:**
- Background: `var(--color-surface)`
- Pulse animation: 1.5s ease-in-out infinite
- Border radius: `var(--radius-lg)`

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface) 0%,
    var(--color-surface-elevated) 50%,
    var(--color-surface) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## Error State

**When products fail to load:**

```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│                    [Warning icon, large]                      │
│                       color: var(--color-destructive)         │
│                                                               │
│              "Failed to load products"                        │
│                                                               │
│         "Unable to fetch product data. Please check          │
│          your connection and try again."                      │
│                                                               │
│                    [Retry]                                    │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Colors:**
- Icon: `var(--color-destructive)` (#EF4444)
- Heading: `var(--color-foreground)`, H3
- Body: `var(--color-foreground-muted)`, Body Small
- Button: Primary button style

---

## Accessibility

- All product cards have descriptive `aria-label`
- Trust badges include `aria-label` with full trust label text
- Search bar has associated `<label>` element
- Keyboard navigation: Tab through cards, Enter to select
- Focus visible on all interactive elements
- Skip link to main content
