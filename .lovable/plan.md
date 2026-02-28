

# Campaign-Scoped Brand Colors -- Implementation Plan

## Current System

Brand colors are stored in `site_settings` (key: `brand_colors`) and applied as CSS custom properties on `document.documentElement` (`:root`) via `useSiteSettings`. All components reference these variables through Tailwind utilities (`bg-brand-gradient`, etc.) and direct `hsl(var(--brand-primary-from))` references in `index.css`. Theme presets are predefined sets of these same color values.

CSS custom properties inherit naturally through the DOM tree. A child element with the same variable name overrides the inherited value for all its descendants without affecting siblings or parents.

## Strategy: Scoped CSS Variables on Wrapper Container

The safest approach: set CSS variables on a wrapper `<div>` inside `PromotionalLanding.tsx`. No `:root` modification, no cleanup needed, no global side effects. When the component unmounts (navigation away), the scoped variables disappear automatically.

```text
:root  ← global brand colors (unchanged)
  └─ <div style="--brand-primary-from: ...">  ← campaign wrapper
       └─ PromoHero, PromoPricing, Contact, etc.  ← inherit campaign colors
```

## Database Change

Add `brand_colors` JSONB column to `promotional_campaigns`:

```sql
ALTER TABLE promotional_campaigns
ADD COLUMN brand_colors jsonb DEFAULT NULL;
```

- `NULL` = use global theme (no override)
- JSON structure: same partial `BrandColors` interface (only override what you want)

## Frontend Implementation

### 1. Update `usePromotionalCampaign` hook
- Include `brand_colors` in the fetched data
- Parse as `Partial<BrandColors> | null`

### 2. Create utility: `buildCampaignColorStyle()`
- Accepts `Partial<BrandColors> | null`
- Returns `React.CSSProperties` with only the defined variables
- Maps each key to its CSS variable name (same mapping as `applyCSSVariables` in `useSiteSettings`)
- If null/empty, returns empty object (no override)

### 3. Update `PromotionalLanding.tsx`
- Wrap the page content `<div>` with the computed style:
```tsx
const colorStyle = buildCampaignColorStyle(campaign.brand_colors);
return <div style={colorStyle}>...</div>;
```
- No `useEffect`, no cleanup, no `:root` mutation

### 4. Admin UI: Campaign Brand Colors Tab
- Add a "Brand Colors" tab to `PromotionalCampaignForm.tsx`
- Toggle: "Use custom brand colors for this campaign"
- When enabled: show color pickers for the partial `BrandColors` fields
- Option to "Copy from preset" dropdown (Light, Dark, Ocean, etc.)
- Saves to `brand_colors` column as JSONB

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| `brand_colors` is `null` | No style applied, global theme inherited |
| `brand_colors` has partial fields | Only those variables overridden, rest inherited from global |
| User navigates away | React unmounts component, scoped styles gone instantly |
| Chat widget overlays | Chat components are children of the wrapper, so they inherit campaign colors (consistent UX) |
| Campaign uses dark preset colors on light global theme | Works — only color variables change, layout/spacing unaffected |

## Files to Create/Modify

| File | Action |
|------|--------|
| `promotional_campaigns` table | Add `brand_colors` JSONB column (migration) |
| `src/hooks/usePromotionalCampaign.ts` | Include `brand_colors` in type + fetch |
| `src/utils/campaignColors.ts` | New: `buildCampaignColorStyle()` utility |
| `src/pages/PromotionalLanding.tsx` | Apply scoped style to wrapper div |
| `src/components/admin/PromotionalCampaignForm.tsx` | Add Brand Colors tab |

## What Is NOT Changed

- `useSiteSettings.ts` — untouched
- `:root` CSS variables — never mutated by campaigns
- `index.css` — untouched
- `tailwind.config.ts` — untouched
- Any non-campaign page — unaffected
- Theme preset logic — unaffected
- Global `localStorage` color cache — unaffected

## Estimated Effort

- Migration + utility + hook update + PromotionalLanding wrapper: 1 prompt
- Admin UI (brand colors tab in campaign form): 1 prompt

