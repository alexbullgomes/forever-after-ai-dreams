

# Navbar UX Upgrade + Smart Link Selection

## Overview

Three improvements: (1) brand-colored hover/active states for nav links, (2) smart link picker in admin for campaigns/blog, (3) polished admin UI.

## Part 1 — Navbar Brand Color Integration

### Header.tsx Changes

- Import `useLocation` from react-router-dom to detect active route
- Replace static `text-white/80 hover:text-white` with brand-aware styling
- Add animated underline on hover (CSS `after` pseudo-element using brand primary color)
- Active link (matching current path) gets persistent brand color + underline

**Styling approach**: Use inline `style` with CSS custom properties already available (`--brand-primary-from`). The underline animation uses a `group` pattern with `after:` pseudo-element via Tailwind + custom CSS class in `index.css`.

New CSS class in `index.css`:
```css
.nav-link-animated {
  position: relative;
}
.nav-link-animated::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(to right, hsl(var(--brand-primary-from)), hsl(var(--brand-primary-to)));
  transition: width 250ms ease;
}
.nav-link-animated:hover::after,
.nav-link-animated.active::after {
  width: 100%;
}
.nav-link-animated:hover,
.nav-link-animated.active {
  color: hsl(var(--brand-primary-from));
}
```

Header `renderLink` updates:
- Add `nav-link-animated` class to all links
- Add `active` class when `location.pathname` matches the link URL (for internal links) or starts with the link path
- Keep `text-white/80` base, `transition-colors duration-250` for text color transition

### Mobile menu
Same brand color treatment for active links in mobile dropdown.

## Part 2 — Smart Link Picker (Admin)

### NavigationLinksEditor.tsx Changes

Add a "Source" selector when `type === 'internal'`:

**New state**: `sourceType: 'custom' | 'campaign' | 'blog'`

**UI flow**:
1. Type dropdown shows Internal / External (existing)
2. When Internal is selected, show a new "Source" selector: Campaign / Blog / Custom URL
3. When Campaign or Blog is selected, show a searchable dropdown (using existing `Select` + `SelectContent` with search)
4. On selection, auto-fill URL (`/promo/{slug}` or `/blog/{slug}`) and optionally Label

**Data fetching** (lazy, React Query):
- Campaigns: fetch from `promotional_campaigns` (active ones) — reuse pattern from `useActiveCampaigns` or direct query
- Blog posts: fetch from `blog_posts` where `status = 'published'` — reuse pattern from `useBlogPosts`

**New hooks** (lightweight, inline in editor or small hook):
- `useAdminCampaignOptions`: `SELECT id, title, slug FROM promotional_campaigns WHERE is_active = true ORDER BY title`
- `useAdminBlogOptions`: `SELECT id, title, slug FROM blog_posts WHERE status = 'published' ORDER BY title`

Both use React Query with `enabled` flag (only fetch when dropdown opens).

**Auto-fill behavior**:
- Selecting a campaign → URL = full campaign URL (e.g., `https://www.everafterca.com/promo/{slug}`), Label = campaign title (if label is empty)
- Selecting a blog post → URL = `/blog/{slug}`, Label = post title (if label is empty)
- Admin can always override both fields after auto-fill

## Part 3 — Admin UI Polish

### SortableRow improvements
- Add `hover:bg-muted/50 transition-colors` to row container
- Make drag handle slightly larger with `hover:bg-muted rounded p-1`
- Better visual hierarchy: label `text-sm font-semibold`, URL `text-xs text-muted-foreground`

### Form card
- Add a subtle header to the form card: "Add Link" or "Edit Link"
- Better visual separation between form and list

## Files Modified

| File | Change |
|------|--------|
| `src/components/Header.tsx` | Add `useLocation`, brand-colored hover/active states, `nav-link-animated` class |
| `src/index.css` | Add `.nav-link-animated` CSS for underline animation |
| `src/components/admin/settings/NavigationLinksEditor.tsx` | Add smart source picker (campaign/blog/custom), UI polish |

## Safety

- No database changes needed
- Header fallback unchanged — if links fail to load, only logo + Account renders
- Brand colors already globally available via CSS vars
- No changes to auth, booking, campaigns, or chat
- Smart picker is additive — manual URL input always available as fallback

