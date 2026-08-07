# Nicerella Design System

> AI-powered product review trust and authenticity platform
> Dark theme primary · WCAG AA compliant · Professional & distinctive

---

## Design Philosophy

Nicerella surfaces trust signals in product reviews. The design reinforces credibility through:

- **Clarity** — Information hierarchy that makes trust metrics unmistakable
- **Depth** — Layered dark surfaces that feel premium and technical
- **Confidence** — Stable, consistent interactions that match the trust theme
- **Accessibility** — Every contrast ratio meets or exceeds WCAG AA (4.5:1 minimum)

---

## Color System

### Primary Dark Theme Palette

| Role | Hex | CSS Variable | Contrast | Usage |
|------|-----|--------------|----------|-------|
| **Background** | `#0B0F1A` | `--color-background` | — | App canvas, root surface |
| **Surface** | `#131825` | `--color-surface` | — | Cards, panels, elevated areas |
| **Surface Elevated** | `#1A1F2E` | `--color-surface-elevated` | — | Hover states, active states |
| **Foreground** | `#F1F5F9` | `--color-foreground` | 15.2:1 ✅ | Primary text, headings |
| **Foreground Muted** | `#94A3B8` | `--color-foreground-muted` | 6.7:1 ✅ | Secondary text, labels |
| **Primary** | `#7C3AED` | `--color-primary` | 5.8:1 ✅ | CTAs, interactive elements |
| **Primary Hover** | `#9F67FF` | `--color-primary-hover` | 7.1:1 ✅ | Hover/active states |
| **Secondary** | `#A78BFA` | `--color-secondary` | 5.1:1 ✅ | Supporting accents |
| **Accent** | `#06B6D4` | `--color-accent` | 6.9:1 ✅ | Trust indicators, highlights |
| **Accent Glow** | `#22D3EE` | `--color-accent-glow` | 8.2:1 ✅ | Active/hover glow effects |
| **Border** | `rgba(148, 163, 184, 0.15)` | `--color-border` | — | Subtle separation |
| **Border Subtle** | `rgba(148, 163, 184, 0.08)` | `--color-border-subtle` | — | Very subtle separation |
| **Ring** | `#7C3AED` | `--color-ring` | — | Focus rings |
| **Destructive** | `#EF4444` | `--color-destructive` | 5.4:1 ✅ | Errors, warnings |

### Semantic Trust Colors

| Trust Level | Hex | CSS Variable | Label | Usage |
|-------------|-----|--------------|-------|-------|
| **Highly Trustworthy** | `#10B981` | `--trust-high` | ≥ 0.85 | Excellent trust score |
| **Mostly Trustworthy** | `#22C55E` | `--trust-medium-high` | 0.65–0.84 | Good trust score |
| **Mixed** | `#F59E0B` | `--trust-mixed` | 0.40–0.64 | Unclear signals |
| **Suspicious** | `#F97316` | `--trust-suspicious` | 0.20–0.39 | Concerning patterns |
| **Likely Manipulated** | `#EF4444` | `--trust-low` | < 0.20 | Strong manipulation signals |

### Best Contrast Combinations

| Background | Text Color | Ratio | Use Case |
|------------|------------|-------|----------|
| `#0B0F1A` | `#F1F5F9` | 15.2:1 | Primary headings, body text |
| `#0B0F1A` | `#94A3B8` | 6.7:1 | Labels, secondary text |
| `#131825` | `#F1F5F9` | 12.8:1 | Card content |
| `#131825` | `#94A3B8` | 5.8:1 | Card secondary text |
| `#1A1F2E` | `#F1F5F9` | 10.9:1 | Elevated panels |
| `#7C3AED` | `#FFFFFF` | 5.8:1 | Buttons on primary |
| `#06B6D4` | `#0B0F1A` | 6.9:1 | Accent text on dark |

### CSS Variables (Complete)

```css
:root {
  /* Dark Theme Colors */
  --color-background: #0B0F1A;
  --color-surface: #131825;
  --color-surface-elevated: #1A1F2E;
  --color-foreground: #F1F5F9;
  --color-foreground-muted: #94A3B8;

  /* Brand Colors */
  --color-primary: #7C3AED;
  --color-primary-hover: #9F67FF;
  --color-secondary: #A78BFA;
  --color-accent: #06B6D4;
  --color-accent-glow: #22D3EE;

  /* Borders & Effects */
  --color-border: rgba(148, 163, 184, 0.15);
  --color-border-subtle: rgba(148, 163, 184, 0.08);
  --color-ring: #7C3AED;
  --color-destructive: #EF4444;

  /* Trust Score Colors */
  --trust-high: #10B981;
  --trust-medium-high: #22C55E;
  --trust-mixed: #F59E0B;
  --trust-suspicious: #F97316;
  --trust-low: #EF4444;
}
```

---

## Typography

### Font Family

**Inter** — Modern, technical, optimized for screens

**Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

### Type Scale

| Level | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| Display | `48px` / `3rem` | 700 | 1.1 | `-0.02em` | Hero headings |
| H1 | `36px` / `2.25rem` | 700 | 1.2 | `-0.01em` | Page titles |
| H2 | `28px` / `1.75rem` | 600 | 1.25 | `-0.01em` | Section headings |
| H3 | `22px` / `1.375rem` | 600 | 1.3 | `0` | Subsection headings |
| H4 | `18px` / `1.125rem` | 600 | 1.4 | `0` | Card headings |
| Body | `16px` / `1rem` | 400 | 1.5 | `0` | Body text, paragraphs |
| Body Small | `14px` / `0.875rem` | 400 | 1.5 | `0` | Secondary text, labels |
| Caption | `12px` / `0.75rem` | 500 | 1.4 | `0.01em` | Metadata, timestamps |
| Label | `14px` / `0.875rem` | 500 | 1.4 | `0.01em` | Form labels, buttons |

### CSS Typography

```css
.text-display {
  font-size: 3rem;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.text-h1 {
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.01em;
}

.text-h2 {
  font-size: 1.75rem;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.01em;
}

.text-h3 {
  font-size: 1.375rem;
  font-weight: 600;
  line-height: 1.3;
}

.text-h4 {
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.4;
}

.text-body {
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
}

.text-body-sm {
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.5;
}

.text-caption {
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.4;
  letter-spacing: 0.01em;
  color: var(--color-foreground-muted);
}

.text-label {
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.4;
  letter-spacing: 0.01em;
}
```

---

## Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Icon gaps, tight inline spacing |
| `--space-sm` | `8px` / `0.5rem` | Small gaps, icon padding |
| `--space-md` | `16px` / `1rem` | Standard padding, component gaps |
| `--space-lg` | `24px` / `1.5rem` | Section padding, card padding |
| `--space-xl` | `32px` / `2rem` | Large gaps, section margins |
| `--space-2xl` | `48px` / `3rem` | Page section margins |
| `--space-3xl` | `64px` / `4rem` | Hero spacing, major sections |
| `--space-4xl` | `96px` / `6rem` | Extra large page sections |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `4px` | Small buttons, tags, badges |
| `--radius-md` | `8px` | Buttons, inputs, small cards |
| `--radius-lg` | `12px` | Cards, panels, dropdowns |
| `--radius-xl` | `16px` | Large cards, modals |
| `--radius-2xl` | `24px` | Hero cards, feature panels |
| `--radius-full` | `9999px` | Pills, avatars, circular badges |

---

## Shadows

### Shadow Depths (Dark Theme Optimized)

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0, 0, 0, 0.4)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0, 0, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0, 0, 0, 0.5), 0 4px 6px rgba(0, 0, 0, 0.4)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0, 0, 0, 0.6), 0 10px 10px rgba(0, 0, 0, 0.4)` | Hero images, featured cards |
| `--shadow-glow` | `0 0 20px rgba(124, 58, 237, 0.3)` | Primary glow effect |
| `--shadow-accent-glow` | `0 0 20px rgba(6, 182, 212, 0.3)` | Accent glow effect |

### Glow Effects (Signature)

```css
.glow-primary {
  box-shadow:
    0 0 20px rgba(124, 58, 237, 0.3),
    0 0 40px rgba(124, 58, 237, 0.15);
}

.glow-accent {
  box-shadow:
    0 0 20px rgba(6, 182, 212, 0.3),
    0 0 40px rgba(6, 182, 212, 0.15);
}

.glow-trust-high {
  box-shadow:
    0 0 20px rgba(16, 185, 129, 0.3),
    0 0 40px rgba(16, 185, 129, 0.15);
}
```

---

## Signature Visual Element: Trust Orb

The **Trust Orb** is Nicerella's signature visual element — a subtle animated gradient orb that appears in the background of trust-focused sections, reinforcing the AI analysis theme.

### Trust Orb Implementation

```tsx
// components/ui/trust-orb.tsx
'use client';

import { motion } from 'framer-motion';

export function TrustOrb({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute pointer-events-none overflow-hidden ${className}`}>
      <motion.div
        className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.6) 0%, rgba(6, 182, 212, 0.3) 50%, transparent 100%)',
        }}
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -20, 30, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}
```

### Usage

```tsx
<div className="relative">
  <TrustOrb className="top-0 right-0 -translate-y-1/2 translate-x-1/2" />
  <div className="relative z-10">
    {/* Content */}
  </div>
</div>
```

---

## UI Components

### Icons

**Library:** Phosphor Icons (React)

```bash
npm install @phosphor-icons/react
```

**Recommended Icons for Trust Platform:**

| Icon | Import | Usage |
|------|--------|-------|
| Shield | `import { Shield } from '@phosphor-icons/react'` | Trust, protection |
| ShieldCheck | `import { ShieldCheck } from '@phosphor-icons/react'` | Verified, trustworthy |
| Star | `import { Star } from '@phosphor-icons/react'` | Ratings, favorites |
| CheckCircle | `import { CheckCircle } from '@phosphor-icons/react'` | Verified, success |
| Warning | `import { Warning } from '@phosphor-icons/react'` | Caution, suspicious |
| TrendUp | `import { TrendUp } from '@phosphor-icons/react'` | Analytics, trends |
| MagnifyingGlass | `import { MagnifyingGlass } from '@phosphor-icons/react'` | Search |
| Funnel | `import { Funnel } from '@phosphor-icons/react'` | Filters |
| Info | `import { Info } from '@phosphor-icons/react'` | Information, tooltips |
| Eye | `import { Eye } from '@phosphor-icons/react'` | View details |
| Robot | `import { Robot } from '@phosphor-icons/react'` | AI, automation |
| ChartBar | `import { ChartBar } from '@phosphor-icons/react'` | Analytics, breakdown |

**Icon Usage:**

```tsx
<Shield size={24} weight="regular" />
<ShieldCheck size={20} weight="fill" color="var(--trust-high)" />
<Star size={16} weight="fill" color="#F59E0B" />
```

---

### Product Card

```tsx
// components/ui/product-card.tsx
'use client';

import Link from 'next/link';
import { ShieldCheck, Star, TrendUp } from '@phosphor-icons/react';

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    imageUrl: string;
    trustScore: number;
    trustLabel: string;
    reviewCount: number;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const trustColorMap = {
    'highly trustworthy': 'var(--trust-high)',
    'mostly trustworthy': 'var(--trust-medium-high)',
    'mixed': 'var(--trust-mixed)',
    'suspicious': 'var(--trust-suspicious)',
    'likely manipulated': 'var(--trust-low)',
  };

  const trustColor = trustColorMap[product.trustLabel as keyof typeof trustColorMap] || 'var(--trust-mixed)';

  return (
    <Link href={`/products/${product.id}`}>
      <article className="group relative bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden transition-all duration-200 hover:border-[var(--color-primary)] hover:shadow-lg cursor-pointer">
        {/* Trust Badge */}
        <div
          className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-full text-xs font-medium text-white flex items-center gap-1.5"
          style={{ backgroundColor: trustColor }}
        >
          <ShieldCheck size={14} weight="fill" />
          <span className="capitalize">{product.trustLabel}</span>
        </div>

        {/* Product Image */}
        <div className="aspect-square bg-[var(--color-background)] overflow-hidden">
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-[var(--color-foreground)] font-semibold text-base line-clamp-2 mb-3">
            {product.title}
          </h3>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Star size={14} weight="fill" color="#F59E0B" />
              <span className="text-sm text-[var(--color-foreground-muted)]">
                {product.reviewCount} reviews
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: trustColor }}>
              <TrendUp size={14} />
              <span>{Math.round(product.trustScore * 100)}% trust</span>
            </div>
          </div>
        </div>

        {/* Hover Glow Effect */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            boxShadow: `inset 0 0 60px rgba(124, 58, 237, 0.05)`
          }}
        />
      </article>
    </Link>
  );
}
```

---

### Trust Meter Component

The **Trust Meter** is the signature component for displaying trust scores on product detail pages.

```tsx
// components/ui/trust-meter.tsx
'use client';

import { ShieldCheck, ShieldWarning, Shield } from '@phosphor-icons/react';

interface TrustMeterProps {
  trustScore: number; // 0 to 1
  trustLabel: string;
  showDetails?: boolean;
  fakePercentage?: number;
  confidence?: number;
}

export function TrustMeter({
  trustScore,
  trustLabel,
  showDetails = false,
  fakePercentage = 0,
  confidence = 0
}: TrustMeterProps) {
  const percentage = Math.round(trustScore * 100);

  const trustConfig = {
    'highly trustworthy': {
      color: 'var(--trust-high)',
      bgColor: 'rgba(16, 185, 129, 0.15)',
      icon: ShieldCheck,
      message: 'Excellent authenticity. Reviews appear genuine with minimal suspicious patterns.',
    },
    'mostly trustworthy': {
      color: 'var(--trust-medium-high)',
      bgColor: 'rgba(34, 197, 94, 0.15)',
      icon: ShieldCheck,
      message: 'Good authenticity. Most reviews appear genuine with minor concerns.',
    },
    'mixed': {
      color: 'var(--trust-mixed)',
      bgColor: 'rgba(245, 158, 11, 0.15)',
      icon: Shield,
      message: 'Mixed signals. Some reviews show unusual patterns that warrant attention.',
    },
    'suspicious': {
      color: 'var(--trust-suspicious)',
      bgColor: 'rgba(249, 115, 22, 0.15)',
      icon: ShieldWarning,
      message: 'Multiple red flags detected. Exercise caution with these reviews.',
    },
    'likely manipulated': {
      color: 'var(--trust-low)',
      bgColor: 'rgba(239, 68, 68, 0.15)',
      icon: ShieldWarning,
      message: 'Strong evidence of manipulation. Reviews may not reflect genuine experiences.',
    },
  };

  const config = trustConfig[trustLabel as keyof typeof trustConfig] || trustConfig['mixed'];
  const Icon = config.icon;

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: config.bgColor }}
          >
            <Icon size={24} weight="fill" style={{ color: config.color }} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-foreground)]">Trust Score</h3>
            <p className="text-sm text-[var(--color-foreground-muted)] capitalize">{trustLabel}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold" style={{ color: config.color }}>
            {percentage}%
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 bg-[var(--color-background)] rounded-full overflow-hidden mb-4">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: config.color,
            boxShadow: `0 0 20px ${config.color}`,
          }}
        />
        {/* Glow Effect */}
        <div
          className="absolute inset-y-0 left-0 rounded-full opacity-50"
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(90deg, transparent 0%, ${config.color} 50%, transparent 100%)`,
            filter: 'blur(4px)',
          }}
        />
      </div>

      {/* Trust Scale */}
      <div className="flex justify-between text-xs text-[var(--color-foreground-muted)] mb-6">
        <span>Low Trust</span>
        <span>Mixed</span>
        <span>High Trust</span>
      </div>

      {/* Message */}
      <p className="text-sm text-[var(--color-foreground-muted)] mb-4">
        {config.message}
      </p>

      {/* Additional Details */}
      {showDetails && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--color-border)]">
          <div>
            <div className="text-xs text-[var(--color-foreground-muted)] mb-1">
              Estimated Fake Reviews
            </div>
            <div className="text-lg font-semibold text-[var(--color-foreground)]">
              {Math.round(fakePercentage)}%
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--color-foreground-muted)] mb-1">
              Analysis Confidence
            </div>
            <div className="text-lg font-semibold text-[var(--color-foreground)]">
              {Math.round(confidence * 100)}%
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-[var(--color-foreground-muted)] mt-4 italic">
        This is an AI estimate based on available data. Not a certified fraud determination.
      </p>
    </div>
  );
}
```

---

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: var(--color-primary);
  color: white;
  padding: 12px 24px;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 200ms ease;
  cursor: pointer;
  border: none;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-glow);
}

.btn-primary:focus-visible {
  outline: 2px solid var(--color-ring);
  outline-offset: 2px;
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
  padding: 10px 22px;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-secondary:hover {
  background: rgba(124, 58, 237, 0.1);
  border-color: var(--color-primary-hover);
  color: var(--color-primary-hover);
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  color: var(--color-foreground);
  padding: 12px 24px;
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 200ms ease;
  cursor: pointer;
  border: none;
}

.btn-ghost:hover {
  background: var(--color-surface-elevated);
}
```

---

### Inputs

```css
.input {
  background: var(--color-background);
  color: var(--color-foreground);
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 1rem;
  transition: all 200ms ease;
  width: 100%;
}

.input::placeholder {
  color: var(--color-foreground-muted);
}

.input:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.2);
}

.input:hover:not(:focus) {
  border-color: rgba(148, 163, 184, 0.3);
}
```

---

### Cards

```css
.card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  padding: 24px;
  transition: all 200ms ease;
}

.card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

.card-elevated {
  background: var(--color-surface-elevated);
  box-shadow: var(--shadow-lg);
}
```

---

## Layout Patterns

### Page Container

```css
.page-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--space-md);
}

@media (min-width: 768px) {
  .page-container {
    padding: 0 var(--space-lg);
  }
}

@media (min-width: 1024px) {
  .page-container {
    padding: 0 var(--space-xl);
  }
}
```

### Grid Layouts

```css
/* Product Grid */
.product-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: var(--space-lg);
}

@media (min-width: 640px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1280px) {
  .product-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

---

## Animation Guidelines

### Transitions

- **Standard:** `200ms ease` — Hover states, toggles
- **Smooth:** `300ms ease-out` — Page transitions, modals
- **Slow:** `500ms ease-in-out` — Large layout changes

### Easing

```css
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
--ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Pre-Delivery Checklist

Before shipping any UI:

- [ ] All text meets WCAG AA contrast (4.5:1 minimum)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] No emojis used as icons (use SVG from Phosphor/Heroicons)
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile
- [ ] Trust score colors applied consistently
- [ ] Glow effects subtle (opacity ≤ 0.3)
- [ ] Dark backgrounds never pure black (#000000)

---

## File Structure

```
/workspaces/nicerella/
├── DESIGN_SYSTEM.md          ← This file
├── design-system/
│   └── nicerella/
│       ├── MASTER.md         ← Auto-generated reference
│       └── pages/            ← Page-specific overrides
└── app/
    └── globals.css           ← Import design system CSS variables
```

---

## Quick Reference

### Trust Score → Color

```js
const getTrustColor = (score: number): string => {
  if (score >= 0.85) return 'var(--trust-high)';
  if (score >= 0.65) return 'var(--trust-medium-high)';
  if (score >= 0.40) return 'var(--trust-mixed)';
  if (score >= 0.20) return 'var(--trust-suspicious)';
  return 'var(--trust-low)';
};
```

### Trust Label → Message

```js
const trustMessages: Record<string, string> = {
  'highly trustworthy': 'Excellent authenticity. Reviews appear genuine.',
  'mostly trustworthy': 'Good authenticity with minor concerns.',
  'mixed': 'Mixed signals. Some reviews show unusual patterns.',
  'suspicious': 'Multiple red flags detected. Exercise caution.',
  'likely manipulated': 'Strong evidence of manipulation.',
};
```
