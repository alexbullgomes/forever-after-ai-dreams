

## Fix FOUC (Flash of Unstyled Content) - Yellow Theme Flash

### Root Cause

The inline script in `index.html` (lines 41-70) has **default color values in RGB format** (e.g., `244 63 94`), but the entire CSS variable system uses **HSL format** (e.g., `351 95% 71%`). Tailwind renders colors as `hsl(var(--brand-primary-from))`, so when the default `244 63 94` is interpolated as HSL, it produces a bright yellow instead of the intended pink gradient.

The CSS defaults in `index.css` are correct (HSL), but the inline script runs after and **overwrites** them with wrong-format values, causing the yellow flash on every fresh load or cleared cache.

### Fix (Single File Change)

**File: `index.html`** (lines 41-70)

Replace all default color values in the inline script with the correct HSL values that match `index.css`:

| Variable | Current (RGB - WRONG) | Corrected (HSL) |
|----------|----------------------|-----------------|
| `primary_from` | `244 63 94` | `351 95% 71%` |
| `primary_to` | `236 72 153` | `328 86% 70%` |
| `primary_hover_from` | `225 29 72` | `350 89% 60%` |
| `primary_hover_to` | `219 39 119` | `328 86% 60%` |
| `icon_bg_primary` | `244 63 94` | `351 95% 71%` |
| `icon_bg_secondary` | `168 85 247` | `271 91% 65%` |
| `icon_bg_accent` | `236 72 153` | `328 86% 70%` |
| `text_accent` | `244 63 94` | `351 95% 71%` |
| `badge_text` | `225 29 72` | `350 89% 50%` |
| `stats_text` | `244 63 94` | `351 95% 71%` |
| `badge_bg` | `254 242 242` | `350 100% 97%` |
| `feature_dot` | `251 113 133` | `351 95% 75%` |
| `hero_overlay_color` | `0 0 0` | `0 0% 0%` |
| `hero_badge_bg_color` | `0 0 100` | `0 0% 100%` |
| `hero_badge_icon` | `351 95 71` | `351 95% 71%` |
| `hero_gradient_from` | `351 95 71` | `351 95% 71%` |
| `hero_gradient_via` | `328 86 70` | `328 86% 70%` |
| `hero_gradient_to` | `261 90 76` | `261 90% 76%` |
| `hero_text_primary` | `0 0 100` | `0 0% 100%` |
| `hero_text_muted` | `0 0 100` | `0 0% 100%` |
| `hero_trust_text` | `0 0 100` | `0 0% 100%` |
| `hero_glow_1_from` | `351 95 71` | `351 95% 71%` |
| `hero_glow_1_to` | `328 86 70` | `328 86% 70%` |
| `hero_glow_2_from` | `261 90 76` | `261 90% 76%` |
| `hero_glow_2_to` | `328 86 70` | `328 86% 70%` |
| `service_icon_gradient_from` | `351 95 71` | `351 95% 71%` |
| `service_icon_gradient_to` | `328 86 70` | `328 86% 70%` |
| `contact_bg_gradient_from` | `222 47 11` | `222 47% 11%` |
| `contact_bg_gradient_to` | `350 89 60` | `350 89% 60%` |

Also add the missing `cta_icon_color` default: `351 95% 71%`.

### What This Does NOT Change

- No layout, component, or animation changes
- No changes to the theme customization system (`useSiteSettings`)
- No changes to `index.css` (already correct)
- No changes to any component files
- Booking, auth, chat, campaigns all untouched
- localStorage caching logic remains identical
- When cached colors exist, they are used (as before)

### Why This Fully Fixes the Issue

The inline script already runs synchronously before React mounts. The only problem was the **wrong color format** in its hardcoded defaults. Once the defaults match the HSL format used everywhere else, the first paint will show the correct pink gradient immediately -- zero flash, zero loader needed.

### Verification

1. Clear localStorage (`everafter_brand_colors` key) and hard-refresh
2. First paint should show pink gradient (not yellow)
3. Change brand colors in Project Settings -- should still update in real-time
4. Refresh again -- cached colors should load instantly from localStorage
