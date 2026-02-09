

## Performance & Accessibility Optimization Plan

This plan addresses Mobile Performance and Accessibility findings without changing any UI/UX, business logic, or media assets.

---

## Audit Summary: Top Bottlenecks

### Performance Issues

| Issue | Location | Impact |
|-------|----------|--------|
| **No route-based code splitting** | `App.tsx` - all pages imported eagerly | Large initial bundle, slow FCP/LCP |
| **No lazy loading for below-fold images** | Testimonials, Hero, Portfolio, Blog | Images loaded before visible |
| **No `font-display: swap`** | No font optimization configured | Potential FOIT (Flash of Invisible Text) |
| **Heavy framer-motion bundle** | 15+ components import framer-motion | Animation library loaded on all routes |
| **Admin pages in initial bundle** | `AdminDashboard.tsx` imports 10+ admin pages | Unnecessary code for public visitors |
| **Video preload strategy** | Hero video uses no preload hint | Delays LCP for hero section |
| **Missing image dimensions** | Multiple `<img>` tags lack width/height | Causes layout shifts (CLS) |

### Accessibility Issues

| Issue | Location | Impact |
|-------|----------|--------|
| **Missing skip link** | `index.html` | Keyboard users cannot skip navigation |
| **No focus-visible styles** | Global CSS | Focus states unclear for keyboard navigation |
| **Images missing lazy + decoding** | Testimonials, Portfolio, Blog | No `loading="lazy"` or `decoding="async"` |
| **Form inputs missing autocomplete** | Contact, Consultation forms | Reduces usability for autofill |
| **No reduced motion support** | Animations throughout | Accessibility for vestibular disorders |
| **External links missing rel attributes** | Contact social links | Security best practice |

---

## Implementation Plan

### Phase 1: Code Splitting (High Impact)

**1.1 Add React.lazy for route-level code splitting**

Update `App.tsx` to lazy-load pages:

```typescript
// Replace static imports with lazy imports
const WeddingPackages = lazy(() => import('./pages/WeddingPackages'));
const WeddingQuiz = lazy(() => import('./pages/WeddingQuiz'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const PromotionalLanding = lazy(() => import('./pages/PromotionalLanding'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const Planner = lazy(() => import('./pages/Planner'));
// Keep Index eager as it's the landing page
```

Wrap routes in Suspense with minimal fallback.

**1.2 Lazy load Admin sub-pages**

Update `AdminDashboard.tsx` to lazy-load all admin routes:

```typescript
const ChatAdmin = lazy(() => import('@/components/dashboard/ChatAdmin'));
const PipelineProcess = lazy(() => import('@/pages/PipelineProcess'));
// ... etc
```

---

### Phase 2: LCP & Image Optimization (Medium Impact)

**2.1 Add fetchpriority to LCP element**

In `Hero.tsx`, mark the hero video/poster with priority:

```tsx
<video
  autoPlay muted loop playsInline
  poster="..."
  fetchpriority="high"  // Signal browser priority
  ...
>
```

**2.2 Add preload hint for hero video poster**

In `index.html`, add preload for LCP image:

```html
<link rel="preload" as="image" href="https://supabasestudio.agcreationmkt.cloud/storage/v1/object/public/weddingvideo/Homepicture.webp" fetchpriority="high" />
```

**2.3 Add lazy loading to below-fold images**

Update these components to add `loading="lazy"` and `decoding="async"`:

- `Testimonials.tsx` - testimonial avatars
- `BlogCard.tsx` - blog cover images
- `Portfolio.tsx` - VideoThumbnail fallback images
- `Contact.tsx` - social icons (if any images)

**2.4 Add aspect-ratio to image containers**

Ensure all image containers have explicit aspect-ratio to prevent CLS:

```tsx
// Already good: BlogCard uses aspect-[16/10]
// Add to: Testimonials avatars (w-16 h-16 is fine)
// Add to: Portfolio cards
```

---

### Phase 3: Reduce Render-Blocking Resources

**3.1 Add font-display: swap for system fonts**

No custom font files detected - system fonts are used. No changes needed.

**3.2 Defer non-critical scripts**

The external script is already `type="module"` which is non-blocking. No changes needed.

---

### Phase 4: Accessibility Fixes (Non-Visual Only)

**4.1 Add skip-to-main link**

Add to `index.html` body:

```html
<a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:rounded focus:shadow-lg">
  Skip to main content
</a>
```

Add `id="main-content"` to main content areas.

**4.2 Add focus-visible utility class**

In `index.css`, add:

```css
@layer base {
  :focus-visible {
    outline: 2px solid hsl(var(--ring-brand));
    outline-offset: 2px;
  }
  
  /* Remove outline for mouse users, keep for keyboard */
  :focus:not(:focus-visible) {
    outline: none;
  }
}
```

**4.3 Add reduced motion media query**

In `index.css`, add:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**4.4 Add autocomplete attributes to forms**

Update form inputs in:

- `Contact.tsx`: name="name" autocomplete="name", email autocomplete="email", phone autocomplete="tel"
- `ConsultationForm.tsx`: Similar updates

**4.5 Add rel="noopener noreferrer" to external links**

Already present in `Contact.tsx` - verified. No changes needed.

---

### Phase 5: Minor Optimizations

**5.1 Add Vite build optimizations**

Update `vite.config.ts`:

```typescript
export default defineConfig(({ mode }) => ({
  // ... existing config
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'vendor-motion': ['framer-motion'],
        }
      }
    }
  }
}));
```

This separates vendor chunks for better caching.

---

## Technical Summary

| Change Category | Files Modified | Risk Level |
|-----------------|---------------|------------|
| Code splitting | App.tsx, AdminDashboard.tsx | Low |
| LCP optimization | index.html, Hero.tsx | Low |
| Image lazy loading | Testimonials.tsx, BlogCard.tsx | Low |
| Accessibility | index.html, index.css, Contact.tsx, ConsultationForm.tsx | Low |
| Build optimization | vite.config.ts | Low |

---

## What This Does NOT Change

- No media asset modifications (URLs, sizes, formats unchanged)
- No UI/UX changes (layout, spacing, colors preserved)
- No business logic changes (booking, auth, payments unchanged)
- No copy or content changes

---

## Verification Checklist

After implementation, test these pages:

| Page | What to Check |
|------|---------------|
| **Homepage (/)** | Hero video loads, Portfolio cards render, Chat works |
| **Services (/services)** | Products display, booking modal opens, chat accessible |
| **Campaign pages (/promo/*)** | Dynamic content loads, pricing cards work |
| **Admin (/dashboard/*)** | Login redirect works, all admin tabs accessible |
| **Booking flow** | Date selection, Stripe checkout, success page |
| **Contact form** | Autocomplete works, submission succeeds |

Run Lighthouse after deployment to verify improvements.

