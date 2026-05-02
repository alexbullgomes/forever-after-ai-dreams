# SEO Audit & Domain Migration to everafterca.com

## Audit Findings

A `sitemap.xml` exists at `public/sitemap.xml`, but it (and many other SEO references) point to the unofficial `everafter-studio.lovable.app` domain. The robots.txt also uses that domain.

### Files referencing `everafter-studio.lovable.app` that need fixing:
1. `public/sitemap.xml` — all 3 URLs + missing campaign pages
2. `public/robots.txt` — Sitemap directive
3. `index.html` — og:image, og:url, twitter:image, canonical
4. `src/components/SEO.tsx` — `siteUrl` constant + default `ogImage`
5. `src/pages/Index.tsx` — LocalBusiness schema (`url`, `image`, `@id`)
6. `src/pages/BlogPost.tsx` — schema image + `@id` URLs
7. `src/pages/PromotionalLanding.tsx` — canonical, og:url, schema url
8. `src/components/admin/blog/BlogPostForm.tsx` — admin slug preview hint (cosmetic)

Robots.txt already allows Googlebot/Bingbot/`*` on `/` (with a few admin/internal disallows that should remain). Good.

## Changes

### 1. `public/sitemap.xml` — rewrite
Use `https://www.everafterca.com` and include the 4 requested pages:
- `/` (priority 1.0)
- `/promo/wedding-packages` (0.9)
- `/promo/bussines-content` (0.9) — note: spelling preserved per user request
- `/promo/family-content` (0.9)

Keep `/weddingquiz` (0.7) and `/blog` (0.7) since they are legitimate public pages already indexable. Update `lastmod` to 2026-05-02.

### 2. `public/robots.txt`
Change the `Sitemap:` line to `https://www.everafterca.com/sitemap.xml`. Leave existing allow/disallow rules untouched.

### 3. `index.html`
Replace the 4 lovable.app references (og:image, og:url, twitter:image, canonical) with `https://www.everafterca.com/...`.

### 4. `src/components/SEO.tsx`
- `siteUrl = "https://www.everafterca.com"`
- Default `ogImage = "https://www.everafterca.com/og-image.jpg"`

This automatically fixes canonicals on every page using `<SEO canonical="/..." />` (Home, Blog, BlogPost, WeddingQuiz, etc.) so each canonical resolves to `https://www.everafterca.com/<path>`.

### 5. `src/pages/Index.tsx`
LocalBusiness JSON-LD: replace `url`, `image` with the new domain.

### 6. `src/pages/BlogPost.tsx`
Replace fallback OG image and `@id` schema URL with new domain.

### 7. `src/pages/PromotionalLanding.tsx`
Replace `canonical`, `og:url`, and schema `url` with `https://www.everafterca.com/...`. This makes promo pages (including the 3 in the sitemap) canonical to the official domain.

### 8. `src/components/admin/blog/BlogPostForm.tsx`
Update the admin-only display text from `everafter-studio.lovable.app/blog/...` to `www.everafterca.com/blog/...` (cosmetic, admin UI only).

## Canonical URLs After Changes
| Page | Canonical |
|---|---|
| Home | `https://www.everafterca.com/` |
| Wedding Packages promo | `https://www.everafterca.com/promo/wedding-packages` |
| Business promo | `https://www.everafterca.com/promo/bussines-content` |
| Family promo | `https://www.everafterca.com/promo/family-content` |
| Wedding Quiz | `https://www.everafterca.com/weddingquiz` |
| Blog list | `https://www.everafterca.com/blog` |
| Blog post | `https://www.everafterca.com/blog/{slug}` |

## Out of Scope / Not Touched
- No design, layout, content, or UI changes
- No edge function or DB changes
- Admin/internal `Disallow` rules in robots.txt remain as-is
- The `everafter-studio.lovable.app` preview deployment will still load (Lovable hosts it), but its canonicals will now point to the official domain — which is the desired behavior to consolidate SEO signal.

## Risks
- Very low. Canonicals/sitemaps are metadata; no runtime behavior changes.
- Promo page slug `bussines-content` is misspelled; included as-is per user instruction. If the actual route differs, the sitemap URL would 404 for crawlers. Worth verifying the slug exists in `promotional_campaigns` after deploy.
