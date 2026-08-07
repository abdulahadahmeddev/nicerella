# Product Details Page

> Route: `/products/[id]`
> Purpose: Display full trust analysis, review breakdown, and sentiment summary for a single product

---

## Purpose

The product details page shows comprehensive trust analysis for a single product. It includes the Trust Meter component, sentiment breakdown, red flags list, neutral summary, individual review analysis, and similar products section.

---

## Layout Structure

```
┌──────────────────────────────────────────────────────────────┐
│  Header (Nav)                                                 │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Breadcrumb: Home > [Product Title]                          │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Hero Section                                             │ │
│  │ ┌─────────────┐  ┌────────────────────────────────────┐ │ │
│  │ │ Product     │  │ Product Title                       │ │ │
│  │ │ Image       │  │ Source: Amazon                      │ │ │
│  │ │ (large)     │  │ Price: $XX.XX                       │ │ │
│  │ │             │  │ Review Count: XXX reviews           │ │ │
│  │ └─────────────┘  │ Last Analyzed: [timestamp]          │ │ │
│  │                   └────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Trust Meter (signature component)                        │ │
│  │ - Trust score with progress bar                          │ │
│  │ - Trust label and icon                                    │ │
│  │ - Fake percentage, confidence details                     │ │
│  │ - AI disclaimer                                           │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌──────────────────────┐ ┌──────────────────────┐          │
│  │ Sentiment Breakdown  │ │ Red Flags            │          │
│  │ - Positive XX%       │ │ - Review bursts      │          │
│  │ - Neutral XX%        │ │ - Duplicate phrasing │          │
│  │ - Negative XX%       │ │ - Incentivized       │          │
│  │ (pie/bar chart)      │ │ - [other flags]      │          │
│  └──────────────────────┘ └──────────────────────┘          │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Neutral Summary                                          │ │
│  │ "AI-generated summary of genuine reviewer sentiment..."  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Similar Products (pgvector)                              │ │
│  │ [Card] [Card] [Card] [Card]                              │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Components Used

| Component | Source | Purpose |
|-----------|--------|---------|
| **Header** | `components/layout/header.tsx` | Navigation |
| **Breadcrumb** | `components/ui/breadcrumb.tsx` | Navigation context |
| **TrustMeter** | `components/ui/trust-meter.tsx` | Trust score display |
| **SentimentChart** | `components/ui/sentiment-chart.tsx` | Sentiment breakdown |
| **RedFlagsList** | `components/ui/red-flags-list.tsx` | Warning indicators |
| **ProductCard** | `components/ui/product-card.tsx` | Similar products |
| **TrustOrb** | `components/ui/trust-orb.tsx` | Background atmosphere |

---

## Color & Typography Application

### Hero Section

**Product Title:**
- `color: var(--color-foreground)` (#F1F5F9)
- `font-size: 2.25rem` (H1)
- `font-weight: 700`
- `letter-spacing: -0.01em`

**Metadata (Source, Price, etc.):**
- `color: var(--color-foreground-muted)` (#94A3B8)
- `font-size: 0.875rem` (Body Small)
- `font-weight: 400`

**Product Image Container:**
- `background: var(--color-surface)` (#131825)
- `border: 1px solid var(--color-border)`
- `border-radius: var(--radius-xl)` (16px)

### Trust Meter

See full component spec in DESIGN_SYSTEM.md. Key colors:
- Trust score bar uses semantic trust color
- Glow effect: `box-shadow: 0 0 20px {trust-color}`
- Icon background: 15% opacity of trust color

### Sentiment Breakdown

**Positive:**
- Color: `#10B981` (same as --trust-high)
- Label: `var(--color-foreground-muted)`

**Neutral:**
- Color: `var(--color-foreground-muted)` (#94A3B8)
- Label: `var(--color-foreground-muted)`

**Negative:**
- Color: `var(--color-destructive)` (#EF4444)
- Label: `var(--color-foreground-muted)`

### Red Flags List

**Flag Item:**
- Background: `rgba(239, 68, 68, 0.08)` (subtle destructive tint)
- Border left: `3px solid var(--color-destructive)`
- Text: `var(--color-foreground)`
- Icon: `var(--color-destructive)` (Warning icon)

### Neutral Summary

**Container:**
- Background: `var(--color-surface)`
- Border: `1px solid var(--color-border)`
- Border radius: `var(--radius-lg)` (12px)
- Padding: `var(--space-lg)` (24px)

**Summary Text:**
- Color: `var(--color-foreground)`
- Font size: `1rem` (Body)
- Line height: `1.5`
- Italic styling for AI-generated text

---

## Spacing

| Element | Token | Value |
|---------|-------|-------|
| Page padding | `--space-xl` | 32px |
| Hero gap | `--space-xl` | 32px |
| Section margin | `--space-2xl` | 48px |
| Trust Meter padding | `--space-lg` | 24px |
| Two-column gap | `--space-xl` | 32px |
| Summary padding | `--space-lg` | 24px |
| Similar products margin | `--space-2xl` | 48px |

---

## Responsive Behavior

### Breakpoints

| Breakpoint | Layout | Trust Meter | Sentiment/Flags |
|------------|--------|-------------|-----------------|
| < 640px | Single column | Full width | Stacked vertically |
| 640px – 1023px | Single column | Full width | Side-by-side 2-column |
| ≥ 1024px | Hero 2-column | Full width | Side-by-side 2-column |

### Mobile (< 640px)

- Product image stacked above details
- Trust Meter full width
- Sentiment and Red Flags stacked vertically
- Similar products 1-column grid
- Smaller heading (H2 size)

### Tablet (640px – 1023px)

- Product image and details side-by-side (40/60 split)
- Trust Meter full width
- Sentiment and Red Flags side-by-side
- Similar products 2-column grid

### Desktop (≥ 1024px)

- Full layout with optimal spacing
- Similar products 4-column grid
- Hover effects on similar product cards

---

## Interaction & Motion States

### Trust Meter Animation

```css
/* Progress bar fill */
transition: width 1000ms ease-out;

/* Glow pulse */
animation: trust-glow-pulse 3s ease-in-out infinite;
```

- Progress bar animates from 0 to final score on page load
- Glow effect pulses subtly
- Respects `prefers-reduced-motion`

### Similar Products Hover

- Same hover behavior as ProductCard on home page
- Border highlight, shadow lift, image scale

### Breadcrumb Hover

- `color: var(--color-primary)` on hover
- `transition: color 200ms ease`

---

## Empty State

**When product exists but no analysis:**

```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│  [Product Image]  Product Title                              │
│                   Source: Amazon                             │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │              [Robot icon, large]                          │ │
│  │                                                           │ │
│  │           "Analysis in progress"                          │ │
│  │                                                           │ │
│  │    "This product's reviews are being analyzed by AI.     │ │
│  │     Check back soon for trust insights."                  │ │
│  │                                                           │ │
│  │              [Refresh Page]                               │ │
│  │                                                           │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Colors:**
- Icon: `var(--color-accent)` (#06B6D4)
- Heading: `var(--color-foreground)`, H3
- Body: `var(--color-foreground-muted)`, Body Small
- Button: Secondary style

---

## Loading State

**Initial page load:**

```
┌──────────────────────────────────────────────────────────────┐
│  Breadcrumb: Loading...                                       │
│                                                               │
│  ┌─────────────┐  ┌────────────────────────────────────┐    │
│  │ Skeleton    │  │ ████████████████                    │    │
│  │ Image       │  │ ██████████                          │    │
│  │             │  │ ██████                              │    │
│  └─────────────┘  └────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Skeleton Trust Meter (pulse animation)                   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌──────────────────────┐ ┌──────────────────────┐          │
│  │ Skeleton             │ │ Skeleton             │          │
│  └──────────────────────┘ └──────────────────────┘          │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Skeleton styles:**
- Same pulse animation as home page
- Containers maintain layout stability
- No layout shift when content loads

---

## Error State

**When product not found:**

```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│                    [Search icon, large]                       │
│                  color: var(--color-foreground-muted)         │
│                                                               │
│                  "Product not found"                          │
│                                                               │
│          "The product you're looking for doesn't exist       │
│           or may have been removed."                          │
│                                                               │
│                    [Browse Products]                          │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Colors:**
- Icon: `var(--color-foreground-muted)`
- Heading: `var(--color-foreground)`, H3
- Body: `var(--color-foreground-muted)`, Body Small
- Button: Primary style

---

## Accessibility

- Breadcrumb navigation has `aria-label="Breadcrumb"`
- Trust Meter value announced to screen readers
- Charts have text alternatives (not just color)
- All interactive elements focusable
- Trust score value in `aria-live` region for updates
- Similar products section has `aria-label="Similar products"`
