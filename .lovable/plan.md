

# Phase 2: Wire 6 Homepage Components to `useHomepageContent`

## Approach
Each component will import `useHomepageContent` and destructure only its relevant section. Every text field uses `??` fallback to the current hardcoded value, ensuring zero visual change. The hook is called once in `Index.tsx` and content is passed as props to avoid redundant fetches.

## Implementation

### 1. Update `Index.tsx` (parent orchestrator)
- Import `useHomepageContent`
- Call hook once, destructure all 7 sections
- Pass `content.homepage_hero` to `<Hero>`, `content.homepage_services_header` to `<Services>`, etc. as new optional props
- Build `localBusinessSchema` dynamically from `content.homepage_seo`
- Update `<SEO>` title/description from `content.homepage_seo`

### 2. Update `Hero.tsx`
- Add optional `content?: HeroContent` prop
- Replace hardcoded badge text, headline lines, description, CTA text, video URLs, poster URL, and trust indicators with `content?.field ?? "hardcoded default"`
- No changes to `ConsultationForm`, navigation logic, or animation classes

### 3. Update `Services.tsx`
- Add optional `content?: ServicesHeaderContent` prop
- Replace badge text, title lines, subtitle with prop values
- Replace 3 hardcoded additional features with `content.additional_features` array
- Icon mapping already exists (`ICON_MAP`) -- reuse it for dynamic feature icons
- No changes to card rendering (cards come from `useLandingPageCards`), consultation form, or button logic

### 4. Update `Portfolio.tsx`
- Add optional `content?: PortfolioHeaderContent` prop
- Replace badge text, title lines, subtitle, CTA button text with prop values
- Replace hardcoded `filters` array with `content.filters`
- No changes to gallery card fetching, click handlers, `VideoThumbnail`, or `GalleryLeadForm`

### 5. Update `Testimonials.tsx`
- Add optional `content?: TestimonialsContent` prop
- Replace badge, title, subtitle with prop values
- Replace hardcoded `testimonials` array with `content.testimonials`
- Replace hardcoded stats array with `content.stats`
- No changes to card layout, animations, or star rendering

### 6. Update `BlogSection.tsx`
- Add optional `content?: BlogHeaderContent` prop
- Replace badge text, title, subtitle with prop values
- No changes to blog post fetching, `BlogCard`, or loading states

### 7. Update `Contact.tsx`
- Add optional `content?: ContactContent` prop
- Replace badge text, title lines, subtitle, form title, email, phone, WhatsApp URL, address, social links, quick response text with prop values
- Social links rendered dynamically from `content.social_links` array (platform determines icon)
- No changes to form submission logic, webhook calls, referral tracking, or `PhoneNumberField`

## Safety Guarantees
- Every field has `?? "original hardcoded value"` fallback
- Hook returns `DEFAULTS` immediately on mount (no flash of empty content)
- If DB rows don't exist or query fails, components render identically to current production
- No changes to any business logic, booking flow, chat, or gallery media priority
- All existing props remain optional/backward-compatible

## Files Modified
- `src/pages/Index.tsx`
- `src/components/Hero.tsx`
- `src/components/Services.tsx`
- `src/components/Portfolio.tsx`
- `src/components/Testimonials.tsx`
- `src/components/blog/BlogSection.tsx`
- `src/components/Contact.tsx`

## Files NOT Modified
- `src/hooks/useHomepageContent.ts` (already complete)
- Any booking, chat, gallery modal, edge function, or webhook file

