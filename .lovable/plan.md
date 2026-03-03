

# Enhance Feature Showcase with 3D Card Effect & Premium Polish

## What Changes
Upgrade the right-column image card in `feature-showcase.tsx` to use a **framer-motion 3D tilt effect** (same spring-based approach as the existing `3d-product-card.tsx` and `3d-card.tsx`), plus visual polish to match EverAfter's premium aesthetic.

## Specific Improvements

### 1. 3D Tilt on Image Card
- Wrap the `Card` in a `motion.div` with `useMotionValue` / `useSpring` / `useTransform` for `rotateX` and `rotateY` — identical spring config (`damping: 15, stiffness: 150`) as existing 3D cards
- Add `perspective: 1000px` on the outer wrapper
- Mouse-move tracks position, mouse-leave resets to 0
- Disable tilt on touch devices (no hover) for clean mobile UX

### 2. Visual Enhancements
- Add a subtle **gradient overlay** on the bottom of the image (transparent → black/20%) for depth
- Add a soft **glow/shadow** on hover (`shadow-xl` + a `shadow-primary/10` brand-tinted shadow)
- Smooth **scale transition** on the image inside the card on hover (`hover:scale-105`, 300ms)
- Add a subtle **border glow** using `ring-1 ring-primary/10` to tie into the campaign theme
- Tab triggers get a slightly more polished treatment with `rounded-lg` pills

### 3. Layout Balance
- Keep `max-w-sm` and `aspect-[9/16]` — no layout structure changes
- Add `items-center` vertically on the left column so content aligns with the card center on desktop
- Ensure the section is well-centered with proper `items-center` on the flex row

### 4. Responsive Behavior
- 3D tilt only active on `lg:` and above (desktop hover); on mobile/tablet the card renders flat
- Stack order maintained: left column (text) then right column (card) on mobile
- All spacing scales down properly with existing `gap-10 lg:gap-16`

## File Changed
**`src/components/ui/feature-showcase.tsx`** — only the right-column card rendering and adding framer-motion imports. No props, types, or data flow changes.

## No Changes To
- Props interface (`FeatureShowcaseProps`, `TabMedia`, `ShowcaseStep`)
- Left column content (Badge, title, description, stats, accordion, CTAs)
- `CampaignShowcaseSection`, `CampaignShowcaseTab`, admin logic
- Database schema, hooks, or any other file

