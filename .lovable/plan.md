

# Add Feature Showcase Section to Campaign Pages

## Overview
Add a new toggleable "Feature Showcase" section to promotional campaign pages, rendered immediately after the Banner. Includes a full admin tab for content management. All data stored as JSONB columns on the existing `promotional_campaigns` table.

## 1. Database Migration

Add columns to `promotional_campaigns`:
- `showcase_section_enabled` (boolean, default false) — master toggle
- `showcase_eyebrow` (text, nullable) — small label above title
- `showcase_title` (text, nullable) — main heading
- `showcase_description` (text, nullable) — paragraph text
- `showcase_stats` (jsonb, default '[]') — array of stat chip strings
- `showcase_steps` (jsonb, default '[]') — array of `{id, title, text}` accordion items
- `showcase_tabs` (jsonb, default '[]') — array of `{value, label, src, alt}` tab media items
- `showcase_default_tab` (text, nullable) — which tab is initially active
- `showcase_cta_primary_text` (text, nullable) — primary button label
- `showcase_cta_primary_link` (text, nullable) — primary button URL
- `showcase_cta_secondary_text` (text, nullable) — secondary button label
- `showcase_cta_secondary_link` (text, nullable) — secondary button URL

No new tables, no RLS changes needed (existing policies cover the campaign row).

## 2. New Component: `src/components/ui/feature-showcase.tsx`

Adapt the provided component for React/Vite:
- Remove `"use client"`, `next/link`, `next/image`
- Use standard `<img>` tags and `<a>` links
- Use existing project shadcn components (Tabs, Card, Badge, Accordion, Button)
- Accept CTA text/link props instead of hardcoded buttons
- Use semantic design tokens for colors

## 3. New Component: `src/components/promo/CampaignShowcaseSection.tsx`

Thin wrapper that receives campaign showcase data and renders `FeatureShowcase`. Handles the conditional rendering and data mapping.

## 4. New Admin Tab: `src/components/admin/CampaignShowcaseTab.tsx`

Inside the campaign edit modal, a new "Showcase" tab with:
- Master toggle (enable/disable section)
- Text fields: eyebrow, title, description
- Stats chips editor (add/remove string items)
- Steps editor (add/remove/reorder accordion items with title + text)
- Tabs editor (add/remove media tabs with value, label, image URL, alt text)
- Default tab selector
- CTA button text/link fields

## 5. Files Modified

### `src/hooks/usePromotionalCampaign.ts`
- Add showcase fields to the `PromotionalCampaign` interface
- Parse JSONB fields (stats, steps, tabs) in the fetch logic

### `src/components/admin/PromotionalCampaignForm.tsx`
- Add `showcase_*` fields to `Campaign` interface and `formData` state defaults
- Add new "Showcase" tab trigger (grid-cols-9 → grid-cols-10)
- Render `CampaignShowcaseTab` in the new tab content
- Include showcase fields in the `campaignData` submitted to Supabase

### `src/pages/PromotionalLanding.tsx`
- Import and render `CampaignShowcaseSection` immediately after `PromoHero`
- Conditionally render based on `campaign.showcase_section_enabled`

## 6. No Changes To
- Booking, availability, Stripe logic
- Chat system, affiliate tracking
- SEO, auth, or global theme system
- Existing campaign sections (pricing, products, gallery, vendors)
- Any edge functions

