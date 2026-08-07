# Design System Implementation

## Goal

Implement the complete Nicerella design system from `DESIGN_SYSTEM.md` and page specifications from `design-system/nicerella/pages/`. This creates the foundation for all UI components and pages.

## Skills and MCPs Used

- **shadcn**: Component patterns and utility-first approach
- **ui-ux-pro-max**: Design decisions verified before implementation

## Existing Code Inspected

- `/workspaces/nicerella/DESIGN_SYSTEM.md` - Complete design system specification
- `/workspaces/nicerella/design-system/nicerella/pages/*.md` - Page-specific designs
- `/workspaces/nicerella/app/globals.css` - Current minimal CSS (needs replacement)
- `/workspaces/nicerella/package.json` - Dependencies (Next.js 16, React 19, Tailwind 4)

## Decisions & Assumptions

1. **Font**: Use Inter as specified (not Geist) via Google Fonts
2. **Tailwind 4**: Uses new CSS-first configuration with `@theme` directive
3. **No shadcn-ui CLI**: Build custom components matching exact design spec
4. **Phosphor Icons**: Use for all iconography as specified
5. **Framer Motion**: Required for Trust Orb animation
6. **CSS Variables**: All colors defined as CSS custom properties for theming

## Files to Create/Modify

### Core CSS & Configuration
- `app/globals.css` - Replace with complete design system variables
- `tailwind.config.ts` - Create for custom theme extensions

### UI Components (`components/ui/`)
- `trust-orb.tsx` - Signature animated background element
- `product-card.tsx` - Product display with trust badge
- `trust-meter.tsx` - Trust score visualization
- `button.tsx` - Primary, secondary, ghost variants
- `input.tsx` - Form input styling
- `search-bar.tsx` - Search component with icon
- `skeleton.tsx` - Loading skeleton components

### Layout Components (`components/layout/`)
- `header.tsx` - Main navigation header
- `page-container.tsx` - Consistent page wrapper

### Utility Files
- `lib/utils.ts` - Tailwind class merge utility
- `lib/design-tokens.ts` - Type-safe design token access

## Implementation Requirements

### Phase 1: Core Design Tokens (globals.css)

Must include ALL tokens from DESIGN_SYSTEM.md:
- Color system (dark theme + trust colors)
- Typography scale (display through caption)
- Spacing tokens (xs through 4xl)
- Border radius (sm through full)
- Shadows (including glow effects)
- Transitions and animations

### Phase 2: UI Components

Each component must:
- Match exact specifications from DESIGN_SYSTEM.md
- Use CSS variables (not hardcoded colors)
- Include all interactive states (hover, focus, active)
- Support responsive breakpoints
- Respect `prefers-reduced-motion`
- Meet WCAG AA contrast requirements
- Use Phosphor Icons (no emoji icons)

### Phase 3: Trust Orb Animation

- Framer Motion for smooth animation
- 8-second infinite loop
- Position-absolute with pointer-events-none
- Respects reduced motion preference

## Security Requirements

- No hardcoded credentials
- No external API keys in client code
- All interactive elements properly typed

## Acceptance Criteria

- [ ] All CSS variables defined and accessible
- [ ] Inter font loaded and applied
- [ ] Product card renders with trust badge
- [ ] Trust meter displays score correctly
- [ ] Buttons have all variants (primary, secondary, ghost)
- [ ] Trust Orb animates smoothly
- [ ] All components use design tokens
- [ ] Focus states visible for keyboard navigation
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] WCAG AA contrast verified
- [ ] No console errors
- [ ] TypeScript strict mode passes

## Checks to Run

```bash
npm run build  # Verify no TypeScript errors
npm run lint   # Check code quality
```

## Manual Test Steps

1. Start dev server: `npm run dev`
2. Navigate to http://localhost:3000
3. Verify dark theme applied
4. Check Inter font rendering
5. Inspect CSS variables in DevTools
6. Test component hover states
7. Verify responsive breakpoints
8. Check focus states with Tab key
9. Verify Trust Orb animation
10. Test reduced motion preference

## Page Implementation Order

After design system is complete, implement pages in this order:
1. Home page (`app/page.tsx`)
2. Sign in page (`app/sign-in/page.tsx`)
3. Sign up page (`app/sign-up/page.tsx`)
4. Product details (`app/products/[id]/page.tsx`)
5. Error pages (`app/error.tsx`, `app/not-found.tsx`)
