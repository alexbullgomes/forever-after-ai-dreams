# Google Analytics 4 Integration Plan

## Current state
- `index.html` CSP already allow-lists `googletagmanager.com` and `google-analytics.com` — no CSP changes required.
- `react-helmet-async` provides `<title>` per page.
- `PromotionalLanding` injects campaign-specific tracking scripts (Meta/TikTok/GA, etc.) — keep untouched; new global GA4 runs alongside.
- React Router lives in `src/App.tsx` inside a `<BrowserRouter>`, with a `VisitorTracker` already mounted as a route listener (good pattern to mirror).

## Approach
Load the gtag base script once in `index.html`, disable automatic `page_view` (`send_page_view: false`), and emit `page_view` manually on every React Router navigation. Wrap all event calls in a small typed helper that no-ops when `window.gtag` is missing, so failures never crash the app.

## Files

### 1. `index.html` — add gtag base loader (in `<head>`, async)
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-M1BNE1BC7Z"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', 'G-M1BNE1BC7Z', { send_page_view: false, anonymize_ip: true });
</script>
```
Hardcode the ID (matches current pattern for `VITE_SUPABASE_*`); also read `import.meta.env.VITE_GA_MEASUREMENT_ID` inside the helper as an override for future flexibility. No CSP edits needed.

### 2. `src/utils/analytics.ts` (new) — central helper
- `GA_MEASUREMENT_ID` constant.
- `trackPageView(path: string, title?: string)` → `gtag('event', 'page_view', { page_path, page_title, page_location })`.
- `trackEvent(name: string, params?: Record<string, string | number | boolean>)` → guarded `gtag('event', ...)`.
- Sanitizer that strips obviously-PII keys (`email`, `phone`, `name`, `user_id`, `visitor_id`, `session_id`, anything containing `id` unless explicitly allow-listed like `campaign_slug`).
- All functions no-op if `typeof window === 'undefined' || !window.gtag`.

### 3. `src/components/GoogleAnalyticsTracker.tsx` (new)
- Mounted once inside `<BrowserRouter>` next to `VisitorTracker`.
- Uses `useLocation()` to fire `trackPageView` on every pathname/search change.
- Skips `/dashboard/*` admin routes (treat as internal — not tracked) per requirement. `/user-dashboard/*` tracked with generic titles only (no IDs in path beyond what router shows).

### 4. `src/App.tsx`
- Mount `<GoogleAnalyticsTracker />` next to `<VisitorTracker />`.

### 5. Event instrumentation (surgical, no UI changes)
Add `trackEvent(...)` calls only — no markup, styling, or logic changes:

| Event | Location | Params (safe only) |
|---|---|---|
| `cta_click` | `Hero`, `PromoHero` primary buttons | `cta_label`, `source_page` |
| `service_card_click` | `Services` / `ServicesWithImages` | `service_category` |
| `product_card_click` | `ProductsSection`, `CampaignProductsSection` | `product_title` |
| `campaign_view` | `PromotionalLanding` mount | `campaign_slug` |
| `campaign_package_click` | `CampaignPricingCard` reserve button | `campaign_slug`, `package_name` |
| `booking_started` | `BookingFunnelModal` open | `product_title`, `campaign_slug?` |
| `booking_date_selected` | `BookingStepDate.onSubmit` | `product_title` |
| `booking_time_selected` | `BookingStepSlots` slot select | `product_title` |
| `checkout_started` | right before redirect to Stripe in booking + wedding flows | `product_title`, `package_name?` |
| `payment_success_viewed` | `PaymentSuccess` mount | (none) |
| `consultation_form_opened` | `ConsultationPopup` open | `source_page` |
| `consultation_form_submitted` | `ConsultationForm` submit success | `source_page` |
| `chat_opened` | `ExpandableChatWebhook` + `ExpandableChatAssistant` open | `chat_surface` (visitor/auth) |
| `chat_message_sent` | same components, on send | `chat_surface` |
| `blog_post_viewed` | `BlogPost` mount | `post_slug`, `category?` |
| `gallery_item_click` | `Portfolio` / gallery modal open | `gallery_type`, `item_position` |

No user IDs, emails, phones, Stripe session IDs, visitor IDs, or DB IDs are ever passed.

## Safety & non-regression
- Helper guards every call → if gtag fails to load, app behaves identically.
- No changes to routing, auth, Stripe, chat, RLS, webhooks, or campaign tracking scripts.
- CSP unchanged (already permits GA domains).
- Async script load — no render blocking.
- `send_page_view: false` + manual SPA tracking eliminates duplicate page views.
- Admin `/dashboard/*` excluded; `/user-dashboard/*` tracked with path only.

## Test checklist after build
1. Initial load fires exactly one `page_view` (DevTools Network → `collect?v=2`).
2. Navigate Home → Services → Blog → fires one `page_view` per nav.
3. `/promo/:slug` fires `page_view` + `campaign_view` with `campaign_slug`.
4. Open booking modal, pick date/time, start checkout → 4 events, no PII in payloads.
5. `/dashboard/...` produces zero GA hits.
6. Console clean; no CSP violations; no UI shifts.