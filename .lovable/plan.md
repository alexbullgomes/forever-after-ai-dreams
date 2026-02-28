

# Admin UI: Campaign Brand Colors Tab

## Overview
Add a "Colors" tab to `PromotionalCampaignForm.tsx` with a toggle to enable custom brand colors, a "Copy from preset" dropdown, and color pickers for all BrandColors fields. The `brand_colors` JSONB field already exists in the database.

## New File

### `src/components/admin/CampaignBrandColorsTab.tsx`
- Receives `brandColors: Partial<BrandColors> | null` and `onChange: (colors: Partial<BrandColors> | null) => void` props
- Toggle switch: "Use custom brand colors for this campaign"
  - Off: `onChange(null)` -- clears brand_colors, campaign inherits global theme
  - On: shows color editor UI
- "Copy from preset" dropdown using existing `THEME_PRESETS` from `useSiteSettings` (Light, Dark, Ocean, Sunset, Forest, Monochrome) -- populates all fields at once
- Color pickers organized in collapsible sections (Accordion):
  - **Primary Gradient** (4 fields): primary_from, primary_to, primary_hover_from, primary_hover_to
  - **Icon Backgrounds** (3): icon_bg_primary, icon_bg_secondary, icon_bg_accent
  - **Text & Badges** (4): text_accent, badge_text, stats_text, badge_bg
  - **Decorative** (1): feature_dot
  - **Hero Section** (13): all hero_* fields
  - **Services** (2): service_icon_gradient_from/to
  - **Contact** (2): contact_bg_gradient_from/to
  - **CTA** (1): cta_icon_color
- Uses existing `ColorPicker` component from `src/components/admin/ColorPicker.tsx`
- Live preview swatch strip showing primary gradient

## Modified Files

### `src/components/admin/PromotionalCampaignForm.tsx`
- Add `brand_colors` to `Campaign` interface as `Partial<BrandColors> | null`
- Add `brandColors` local state, initialized from `campaign.brand_colors` in the useEffect
- Add "Colors" tab to TabsList (9 columns now: Basic, Banner, Packages, Gallery, Products, Vendors, Colors, Ads, SEO)
- Add TabsContent for "colors" rendering `<CampaignBrandColorsTab>`
- Include `brand_colors: brandColors` in `campaignData` on submit (already handled by spread since it's part of formData, but brand_colors is separate state)

## Implementation Details
- Color values use HSL format (`"351 95% 71%"`) matching the existing system
- Preset copy fills all 30 color fields; admin can then tweak individual ones
- When toggle is off, `brand_colors` saves as `null` to database
- No changes to campaignColors.ts, useSiteSettings, or PromotionalLanding -- those are already done

