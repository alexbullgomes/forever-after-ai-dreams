

# Homepage Content Management -- Implementation Plan

## Audit Summary

### Currently Dynamic (already managed)
- **Service Cards** (3 cards): via `site_settings` key `landing_page_cards` + toggle
- **Portfolio/Gallery Cards**: via `gallery_cards` table (admin dashboard)
- **Blog Section Posts**: via `blog_posts` table
- **Promotional Footer**: via `promotional_campaigns` table
- **Brand Colors/Theme**: via `site_settings` key `brand_colors`

### Fully Hardcoded (needs migration)
| Section | Component | Hardcoded Content |
|---------|-----------|-------------------|
| **Hero** | `Hero.tsx` | Badge text, headline ("Everafter"), subtitle ("Memories That Last"), description, CTA text, video URLs, poster URL, trust indicators (3 items) |
| **Services Header** | `Services.tsx` | Badge "Our Services", title "Capturing / Every Frame", subtitle, 3 additional feature items (Quick Turnaround, Award Winning, Personal Touch) |
| **Portfolio Header** | `Portfolio.tsx` | Badge "Our Portfolio", title "Recent / Stories", subtitle, CTA "View Complete Portfolio", filter labels |
| **Testimonials** | `Testimonials.tsx` | Badge "Happy Couples", title, subtitle, 4 testimonials (name, location, rating, text, image), 4 stats (500+, 5★, 50+, 8+) |
| **Blog Header** | `BlogSection.tsx` | Badge "Latest Stories", title "Insights & Inspiration", subtitle with "EverAfter Studio" |
| **Contact** | `Contact.tsx` | Badge "Get In Touch", title, subtitle, email, phone, WhatsApp URL, address, social links (Instagram, TikTok, WhatsApp), "Quick Response Promise" text |
| **SEO/Schema** | `Index.tsx` | Business name, phone, email, social URLs, structured data |

---

## Data Architecture

### Strategy: All via `site_settings` JSON keys (no new tables)

Testimonials could warrant a dedicated table, but using `site_settings` keeps the pattern consistent, avoids new migrations/RLS, and is sufficient for ~4-10 testimonials. A dedicated table can be added later if needed.

### New `site_settings` Keys

**Key: `homepage_hero`**
```json
{
  "badge_text": "California-Based Premium Visual Storytelling",
  "headline_line1": "Everafter",
  "headline_line2": "Memories That Last",
  "description": "California-based visual storytelling brand...",
  "cta_text": "Let's Plan Together",
  "video_webm_url": "https://supabasestudio...",
  "video_mp4_url": "https://supabasestudio...",
  "poster_url": "https://supabasestudio...",
  "trust_indicators": [
    { "emoji": "⭐", "text": "500+ Happy Couples" },
    { "emoji": "🏆", "text": "Award Winning" },
    { "emoji": "📍", "text": "California Based" }
  ]
}
```

**Key: `homepage_services_header`**
```json
{
  "badge_text": "Our Services",
  "title_line1": "Capturing",
  "title_line2": "Every Frame",
  "subtitle": "Professional videography and photography...",
  "additional_features": [
    { "icon": "Clock", "title": "Quick Turnaround", "description": "Receive your highlights within 48 hours" },
    { "icon": "Award", "title": "Award Winning", "description": "Recognized for excellence..." },
    { "icon": "Heart", "title": "Personal Touch", "description": "Tailored approach..." }
  ]
}
```

**Key: `homepage_portfolio_header`**
```json
{
  "badge_text": "Our Portfolio",
  "title_line1": "Recent",
  "title_line2": "Stories",
  "subtitle": "All stories are unique...",
  "cta_text": "View Complete Portfolio",
  "filters": [
    { "id": "all", "label": "Highlights" },
    { "id": "photo-videos", "label": "Photo & Videos" },
    { "id": "weddings", "label": "Weddings" }
  ]
}
```

**Key: `homepage_testimonials`**
```json
{
  "badge_text": "Happy Couples",
  "title_line1": "Loved by Couples",
  "title_line2": "Families & Brands",
  "subtitle": "See why people across California...",
  "testimonials": [
    {
      "name": "Alana & Michael",
      "location": "San Diego Couple Family Documentary",
      "rating": 5,
      "text": "Absolutely breathtaking!...",
      "image_url": "/lovable-uploads/8218160d-..."
    }
  ],
  "stats": [
    { "value": "500+", "label": "Happy Couples" },
    { "value": "5★", "label": "Average Rating" },
    { "value": "50+", "label": "Venues Covered" },
    { "value": "8+", "label": "Years Experience" }
  ]
}
```

**Key: `homepage_blog_header`**
```json
{
  "badge_text": "Latest Stories",
  "title": "Insights & Inspiration",
  "subtitle": "Tips, behind-the-scenes stories, and inspiration from our team."
}
```

**Key: `homepage_contact`**
```json
{
  "badge_text": "Get In Touch",
  "title_line1": "Let's Create Something",
  "title_line2": "Beautiful Together",
  "subtitle": "Ready to turn your wedding day into...",
  "form_title": "Send us a message",
  "email": "contact@everafterca.com",
  "phone": "(442) 224-4820",
  "whatsapp_url": "https://wa.me/message/Z3PCMXW6HCTQF1",
  "address": "California, USA",
  "social_links": [
    { "platform": "instagram", "url": "https://www.instagram.com/everafterca" },
    { "platform": "tiktok", "url": "https://www.tiktok.com/@everafter.ca" },
    { "platform": "whatsapp", "url": "https://wa.me/message/Z3PCMXW6HCTQF1" }
  ],
  "quick_response_title": "Quick Response Promise",
  "quick_response_text": "We understand how exciting..."
}
```

**Key: `homepage_seo`**
```json
{
  "business_name": "Everafter Studio",
  "seo_title": "Wedding Videography & Photography California",
  "seo_description": "California's premier wedding...",
  "phone": "(442) 224-4820",
  "email": "contact@everafterca.com",
  "address_locality": "California",
  "social_urls": ["https://www.instagram.com/everafterca", "https://www.tiktok.com/@everafter.ca"]
}
```

---

## Implementation Plan

### Phase 1: Create hook + seed data (no UI changes yet)
- Create `useHomepageContent` hook that fetches all 7 keys in a single query (`key=in.(...)`)
- Return typed objects with hardcoded defaults as fallbacks
- Real-time subscription for live updates
- Seed current hardcoded values into `site_settings` via migration

### Phase 2: Wire components to hook
- Update `Hero.tsx`, `Services.tsx`, `Portfolio.tsx`, `Testimonials.tsx`, `BlogSection.tsx`, `Contact.tsx`, `Index.tsx` to consume the hook
- Every field falls back to current hardcoded value if DB returns null
- No visual change -- purely data source swap

### Phase 3: Admin UI in Project Settings
- Add new settings sections in the sidebar: "Hero", "Sections", "Testimonials", "Contact & Footer", "SEO"
- Or keep it simpler: add them all under the existing "Content" tab using accordion groups
- Forms for each section with save buttons
- Testimonials: add/edit/delete/reorder with drag-and-drop (reuse existing dnd-kit)
- Stats: editable list of value + label pairs
- Section toggles: show/hide per section

### Phase 4: Media management for Hero
- Allow admin to update hero video URLs and poster via URL input fields
- Future: file upload integration with storage bucket

---

## Backward Compatibility

Every component uses this pattern:
```
const heroContent = useHomepageContent('homepage_hero');
const badgeText = heroContent?.badge_text ?? "California-Based Premium Visual Storytelling";
```

If the `site_settings` row doesn't exist, the component renders identically to today.

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Large JSON in site_settings causes slow queries | Low | JSON is small (<10KB per key); indexed by `key` |
| Admin accidentally clears content | Medium | Require non-empty validation on critical fields; keep defaults |
| Too many real-time subscriptions (7 keys) | Low | Single subscription with filter `key=in.(...)` or one channel per table |
| Breaking existing landing page cards pattern | None | Extends same pattern, no changes to existing keys |
| Migration seeds wrong data | Low | Seed uses exact current hardcoded values; backward-compatible |
| Performance: extra DB call on homepage load | Low | Single query fetches all keys; cached by React Query |

**No risks to**: booking logic, Stripe, chat, gallery media priority, availability, edge functions, webhooks.

---

## Estimated Effort

- Phase 1 (hook + seed): 1 prompt
- Phase 2 (wire 6 components): 2-3 prompts (batch 2-3 components per prompt)
- Phase 3 (admin UI): 2-3 prompts
- Phase 4 (hero media): 1 prompt

Total: ~7-8 prompts, fully incremental and safe.

