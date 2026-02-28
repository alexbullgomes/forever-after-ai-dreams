

# Campaign Contact Section -- Two Issues & Fix Plan

## Issue 1: Contact Background Not Reflecting Campaign Theme

**Root cause**: The system is actually correctly wired. `buildCampaignColorStyle` maps `contact_bg_gradient_from/to` to the CSS variables, and the Contact component uses `bg-contact-bg-gradient` which reads those variables. The scoped wrapper in `PromotionalLanding.tsx` (line 210) applies these as inline styles.

**However**, if the campaign's `brand_colors` in the database was saved before the recent THEME_PRESETS expansion, it won't have `contact_bg_gradient_from/to` fields. The fix is: **the admin must re-clone a preset and save** for existing campaigns. No code change needed for this.

**Verification**: I'll confirm there are no CSS specificity overrides blocking inheritance.

## Issue 2: Social Media Links Missing on Campaign Pages

**Root cause found**: On the homepage, Contact receives `content={content.homepage_contact}` which includes the admin-configured social links from `site_settings`. On campaign pages (line 247 of `PromotionalLanding.tsx`), `<Contact />` is called **without any props**, so it falls back to the hardcoded default array (only Instagram, TikTok, WhatsApp with fixed URLs).

**Fix**: In `PromotionalLanding.tsx`, import `useHomepageContent` and pass `content.homepage_contact` to the `<Contact />` component, ensuring campaign pages show the same social links, contact info, and quick response text as the homepage.

## Changes

### File: `src/pages/PromotionalLanding.tsx`
1. Import `useHomepageContent` hook
2. Call `const { content } = useHomepageContent();` inside the component
3. Change `<Contact />` to `<Contact content={content.homepage_contact} />`

This is a single-file, 3-line change. The Contact component already accepts the `content` prop and handles all fields. Campaign brand color overrides will continue to work via the scoped wrapper div.

