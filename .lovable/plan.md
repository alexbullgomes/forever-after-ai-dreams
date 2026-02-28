

# Footer & Section Colors Not Updating with Theme Presets -- Root Cause & Fix

## Root Cause

The `THEME_PRESETS` object in `useSiteSettings.ts` only defines **12 core brand fields** per preset (primary gradients, icon backgrounds, text accents, badges, feature dot). It does **not** define values for:

- `contact_bg_gradient_from` / `contact_bg_gradient_to` (Contact/Footer section background)
- `hero_overlay_color`, `hero_badge_bg_color`, `hero_gradient_from/via/to`, etc. (13 hero fields)
- `service_icon_gradient_from` / `service_icon_gradient_to` (2 service fields)
- `cta_icon_color` (1 CTA field)

When an admin selects a preset, only the 12 core fields are applied. The remaining ~19 section-specific CSS variables keep their previous database values or fall back to the hardcoded defaults in `index.css` (line 141: `--contact-bg-gradient-from: 222 47% 11%` and `--contact-bg-gradient-to: 350 89% 60%` -- always dark navy to rose).

**The PromotionalFooter itself is correct** -- it uses `bg-brand-gradient` which reads `--brand-primary-from/to` and DOES update. The **Contact section** background (`bg-contact-bg-gradient`) is the visually dominant "footer area" that does NOT update because its CSS variables are not included in presets.

## What Needs to Change

Extend each entry in `THEME_PRESETS` to include cohesive values for all 19 section-specific fields, matching the preset's color palette.

### File: `src/hooks/useSiteSettings.ts`

Add these fields to each preset in `THEME_PRESETS`:

| Preset | contact_bg_gradient_from | contact_bg_gradient_to | hero_overlay_color | hero_gradient_from/via/to | service_icon_gradient_from/to | cta_icon_color | + remaining hero fields |
|--------|--------------------------|------------------------|--------------------|---------------------------|-------------------------------|----------------|------------------------|
| light | 222 47% 11% | 351 95% 40% | 0 0% 0% / 0.6 | matching rose palette | primary_from / primary_to | primary_from | rose-tinted hero glows |
| dark | 222 47% 8% | 351 95% 35% | 0 0% 0% / 0.7 | matching dark rose | same | same | darker hero glows |
| ocean | 210 50% 12% | 199 89% 35% | 210 50% 10% / 0.6 | blue palette | 199 89% 48% / 217 91% 60% | 199 89% 48% | blue hero glows |
| sunset | 15 40% 12% | 25 95% 40% | 15 30% 10% / 0.6 | orange palette | 25 95% 53% / 350 89% 60% | 25 95% 53% | warm hero glows |
| forest | 150 30% 10% | 142 76% 28% | 150 30% 8% / 0.6 | green palette | 142 76% 36% / 160 84% 39% | 142 76% 36% | green hero glows |
| monochrome | 0 0% 8% | 0 0% 25% | 0 0% 0% / 0.7 | gray palette | 0 0% 0% / 0 0% 20% | 0 0% 0% | gray hero glows |

### Fields to add per preset (19 total):
1. `hero_overlay_color`
2. `hero_badge_bg_color`
3. `hero_badge_icon`
4. `hero_gradient_from`
5. `hero_gradient_via`
6. `hero_gradient_to`
7. `hero_text_primary`
8. `hero_text_muted`
9. `hero_trust_text`
10. `hero_glow_1_from`
11. `hero_glow_1_to`
12. `hero_glow_2_from`
13. `hero_glow_2_to`
14. `service_icon_gradient_from`
15. `service_icon_gradient_to`
16. `contact_bg_gradient_from`
17. `contact_bg_gradient_to`
18. `cta_icon_color`

## Impact

- **Only** `src/hooks/useSiteSettings.ts` is modified (expanding `THEME_PRESETS` data)
- Zero changes to CSS, Tailwind config, component files, or campaign override system
- Campaign overrides continue to work via `buildCampaignColorStyle` (already maps all these fields)
- All components already consume these CSS variables -- they just need the presets to define them

## Risk Assessment

- **No regression risk**: adding missing fields to presets is purely additive
- **No layout changes**: only color values change
- **WCAG compliance**: hero text colors (`hero_text_primary`, `hero_text_muted`) will be set to white/white-70% for all presets (dark backgrounds), maintaining contrast
- **Existing database overrides preserved**: if admin has custom-saved brand_colors with these fields, those take precedence over preset defaults

