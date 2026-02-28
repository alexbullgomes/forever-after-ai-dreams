

# Footer Theme Awareness -- Analysis & Refactor Plan

## Finding

The `PromotionalFooter` already uses `bg-brand-gradient` (line 128), which resolves to:
```css
background: linear-gradient(to right, hsl(var(--brand-primary-from)), hsl(var(--brand-primary-to)));
```

These CSS variables ARE set on `:root` by `useSiteSettings` when the global theme changes. So **the footer already adapts to global theme preset changes**.

However, there is a **specificity override** in `index.css` (lines 355-371) that forces hardcoded fallback colors on elements matching `button[class*="bg-primary"]` and certain `.bg-brand-gradient` selectors. The footer uses a `<div>` with `role="button"`, not a `<button>`, so this override should not apply -- but it's worth verifying visually.

## Root Cause of Perceived Issue

The footer is rendered **only on the homepage** (`Index.tsx`), which is **outside** any campaign-scoped wrapper. Campaign color overrides are applied via scoped CSS variables on `PromotionalLanding.tsx`'s wrapper div. The footer is never a child of that wrapper, so it correctly cannot inherit campaign overrides.

The footer **does** adapt to global theme changes because `bg-brand-gradient` reads from `:root` variables. If it appears not to update, the most likely cause is **browser caching of the old gradient** or the admin needing to refresh after saving.

## What Actually Needs No Change

- The footer already uses `bg-brand-gradient` -- no hardcoded colors
- Global theme changes already propagate to the footer via `:root` CSS variables
- Campaign overrides correctly don't affect the footer (it's on a different page)

## Conclusion

**The footer is already theme-aware for global presets.** No refactor is needed. The `bg-brand-gradient` utility class correctly reads from `--brand-primary-from` and `--brand-primary-to` CSS variables, which are updated by `useSiteSettings` whenever the global theme changes.

For campaign pages: the footer is not rendered on `/promo/:slug` at all (only on `Index.tsx`), so campaign override compatibility is not applicable.

If the user wants the footer to also appear on campaign pages and reflect campaign colors, that would be a new feature (rendering `PromotionalFooter` inside the scoped wrapper in `PromotionalLanding.tsx`).

