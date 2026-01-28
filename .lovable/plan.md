
# EverAfter Blog System Implementation Plan

## Overview

This plan implements a complete blog system for EverAfter Studio following the existing patterns and design system. The implementation is **additive only** - no existing functionality will be modified.

## Database Schema

### New Tables

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BLOG TABLES                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  blog_posts                    blog_categories          blog_tags           │
│  ┌──────────────────────┐      ┌─────────────────┐      ┌──────────────┐   │
│  │ id (uuid, PK)        │      │ id (uuid, PK)   │      │ id (uuid, PK)│   │
│  │ title (text)         │      │ name (text)     │      │ name (text)  │   │
│  │ slug (text, unique)  │      │ slug (text)     │      │ slug (text)  │   │
│  │ excerpt (text)       │      │ created_at      │      │ created_at   │   │
│  │ content (text)       │      │ updated_at      │      │ updated_at   │   │
│  │ cover_image_url      │      └─────────────────┘      └──────────────┘   │
│  │ author_name (text)   │                                                   │
│  │ status (text)        │◄──────────────────────────────────────────────►  │
│  │ published_at (ts)    │                                                   │
│  │ seo_title (text)     │      blog_posts_categories   blog_posts_tags     │
│  │ seo_description      │      ┌──────────────────┐    ┌──────────────────┐│
│  │ seo_image_url        │      │ post_id (FK)     │    │ post_id (FK)     ││
│  │ canonical_url        │      │ category_id (FK) │    │ tag_id (FK)      ││
│  │ reading_time_minutes │      └──────────────────┘    └──────────────────┘│
│  │ created_at           │                                                   │
│  │ updated_at           │                                                   │
│  └──────────────────────┘                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Table: `blog_posts`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| title | text | NOT NULL | Post title |
| slug | text | UNIQUE, NOT NULL | URL-friendly identifier |
| excerpt | text | | Short summary for cards |
| content | text | | Full post content (Markdown) |
| cover_image_url | text | | Hero image URL |
| author_name | text | DEFAULT 'EverAfter Team' | Author display name |
| status | text | DEFAULT 'draft' | draft, scheduled, published |
| published_at | timestamptz | | Publication date (supports scheduling) |
| seo_title | text | | Custom SEO title |
| seo_description | text | | Meta description |
| seo_image_url | text | | OG image override |
| canonical_url | text | | Canonical URL override |
| reading_time_minutes | integer | DEFAULT 5 | Estimated reading time |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

### Table: `blog_categories`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| name | text | NOT NULL | Category name |
| slug | text | UNIQUE, NOT NULL | URL-friendly identifier |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

### Table: `blog_tags`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| name | text | NOT NULL | Tag name |
| slug | text | UNIQUE, NOT NULL | URL-friendly identifier |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

### Pivot Tables

**blog_posts_categories**
| Column | Type | Constraints |
|--------|------|-------------|
| post_id | uuid | FK to blog_posts.id, ON DELETE CASCADE |
| category_id | uuid | FK to blog_categories.id, ON DELETE CASCADE |
| PRIMARY KEY | | (post_id, category_id) |

**blog_posts_tags**
| Column | Type | Constraints |
|--------|------|-------------|
| post_id | uuid | FK to blog_posts.id, ON DELETE CASCADE |
| tag_id | uuid | FK to blog_tags.id, ON DELETE CASCADE |
| PRIMARY KEY | | (post_id, tag_id) |

### RLS Policies

All tables will have RLS enabled with:
- **Public read** for published posts (`status = 'published' AND published_at <= now()`)
- **Admin full access** via `has_role(auth.uid(), 'admin')`

### Database Triggers

- `update_blog_posts_updated_at` - Auto-update `updated_at` on blog_posts changes
- `update_blog_categories_updated_at` - Auto-update `updated_at` on categories
- `update_blog_tags_updated_at` - Auto-update `updated_at` on tags

---

## File Structure

### New Files to Create

```text
src/
├── components/
│   ├── blog/
│   │   ├── BlogSection.tsx           # Homepage 4-card section
│   │   ├── BlogCard.tsx              # Reusable blog card component
│   │   └── BlogPostContent.tsx       # Single post content renderer
│   └── admin/
│       ├── blog/
│       │   ├── BlogPostForm.tsx      # Create/Edit form with tabs
│       │   ├── BlogCategoryForm.tsx  # Category CRUD form
│       │   └── BlogTagForm.tsx       # Tag CRUD form
├── hooks/
│   ├── useBlogPosts.ts               # Public posts hook
│   ├── useBlogPostsAdmin.ts          # Admin posts CRUD hook
│   ├── useBlogCategories.ts          # Categories hook
│   └── useBlogTags.ts                # Tags hook
└── pages/
    ├── Blog.tsx                       # /blog - All posts
    ├── BlogPost.tsx                   # /blog/:slug - Single post
    └── BlogAdmin.tsx                  # Admin blog management
```

---

## Component Details

### 1. Homepage Blog Section (`src/components/blog/BlogSection.tsx`)

**Placement**: After `Testimonials` section, before `Contact` section in `Index.tsx`

**Design**:
- Matches existing section patterns (Portfolio, Testimonials)
- Uses brand color tokens
- Badge header: "Latest Stories" with BookOpen icon
- 4 cards in a responsive grid
- "View all articles" button linking to `/blog`

**Data Fetching**:
```typescript
// Fetch only 4 published posts, ordered by published_at DESC
const { data: posts } = await supabase
  .from('blog_posts')
  .select('*')
  .eq('status', 'published')
  .lte('published_at', new Date().toISOString())
  .order('published_at', { ascending: false })
  .limit(4);
```

### 2. Blog Card (`src/components/blog/BlogCard.tsx`)

**Props**:
```typescript
interface BlogCardProps {
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string;
  authorName: string;
  publishedAt: string;
  readingTime: number;
}
```

**Design**:
- Reuses Card, CardContent from shadcn/ui
- Cover image with hover scale effect
- Title, excerpt, author, date, reading time
- Matches existing card styles (Portfolio, Services)

### 3. Public Blog Page (`src/pages/Blog.tsx`)

**Route**: `/blog`

**Features**:
- SEO component with unique title/description
- H1: "Our Blog" or "Stories & Insights"
- All published posts in responsive grid
- Pagination (8-12 posts per page)
- Category filter tabs (optional enhancement)

**SEO**:
```typescript
<SEO 
  title="Blog | EverAfter Studio"
  description="Wedding photography tips, behind-the-scenes stories, and inspiration from EverAfter Studio in California."
  canonical="/blog"
/>
```

### 4. Single Blog Post Page (`src/pages/BlogPost.tsx`)

**Route**: `/blog/:slug`

**Features**:
- Fetch post by slug
- 404 if not found or not published
- H1: Post title
- Meta: date, author, reading time
- Cover image (full width)
- Content rendered from Markdown
- Back to blog link

**SEO with Structured Data**:
```typescript
const blogPostSchema = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": post.title,
  "image": post.cover_image_url,
  "author": {
    "@type": "Person",
    "name": post.author_name
  },
  "publisher": {
    "@type": "Organization",
    "name": "EverAfter Studio",
    "logo": "https://everafter-studio.lovable.app/og-image.jpg"
  },
  "datePublished": post.published_at,
  "dateModified": post.updated_at,
  "description": post.seo_description || post.excerpt
};
```

### 5. Admin Blog Management (`src/pages/BlogAdmin.tsx`)

**Tabs Structure**:
1. **Posts** - Table with filters, actions
2. **Categories** - Simple CRUD list
3. **Tags** - Simple CRUD list

**Posts Table Columns**:
- Title
- Status (badge: draft/scheduled/published)
- Published date
- Actions (Edit, Preview, Duplicate, Delete)

**Filters**:
- Status dropdown
- Category dropdown
- Date range picker

### 6. Blog Post Form (`src/components/admin/blog/BlogPostForm.tsx`)

**Form Tabs**:

**Tab 1: Content**
- Title (required)
- Slug (auto-generated, editable)
- Excerpt (textarea, 200 char limit suggestion)
- Content (textarea for Markdown - future: rich text)
- Cover image URL
- Author name

**Tab 2: SEO**
- SEO Title (with character count, max 60)
- Meta Description (with character count, max 160)
- OG Image URL
- Canonical URL
- Google-style preview component

**Tab 3: Organization**
- Categories (multi-select)
- Tags (multi-select)
- Status (select: draft, scheduled, published)
- Publish date (date-time picker)
- Reading time (auto-calculated or manual)

---

## Routing Changes

### App.tsx Additions

```typescript
// New imports
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";

// New routes (add BEFORE the catch-all)
<Route path="/blog" element={<Blog />} />
<Route path="/blog/:slug" element={<BlogPost />} />
```

### AdminDashboard.tsx Additions

```typescript
// New import
import BlogAdmin from "@/pages/BlogAdmin";

// New route in admin Routes
<Route path="/blog" element={<BlogAdmin />} />
```

### AppSidebar.tsx Additions

```typescript
// Add to navigationItems array
{
  title: "Blog",
  url: "/dashboard/blog",
  icon: BookOpen, // from lucide-react
},
```

---

## Hooks Implementation

### `useBlogPosts.ts` (Public)

```typescript
export function useBlogPosts(options?: { limit?: number }) {
  // Fetch published posts only
  // Returns: posts, loading, error
}
```

### `useBlogPostsAdmin.ts` (Admin)

```typescript
export function useBlogPostsAdmin() {
  // Full CRUD for admin
  // Returns: posts, loading, createPost, updatePost, deletePost, duplicatePost
}
```

### `useBlogCategories.ts`

```typescript
export function useBlogCategories(options?: { adminMode?: boolean }) {
  // Categories with post count
  // Returns: categories, loading, create, update, delete
}
```

### `useBlogTags.ts`

```typescript
export function useBlogTags(options?: { adminMode?: boolean }) {
  // Tags with post count
  // Returns: tags, loading, create, update, delete
}
```

---

## Index.tsx Modification

The only change to Index.tsx will be adding the BlogSection component:

```typescript
// Add import
import BlogSection from "@/components/blog/BlogSection";

// In the component JSX, after Testimonials:
<Testimonials />
<BlogSection />  {/* NEW */}
<Contact />
```

---

## Safety Checklist

| Requirement | Implementation |
|-------------|----------------|
| No existing routes modified | New routes only: /blog, /blog/:slug, /dashboard/blog |
| No existing components refactored | New components in src/components/blog/ and src/components/admin/blog/ |
| No homepage layout changed | BlogSection inserted as a new section (same pattern as others) |
| No booking/chat/campaigns affected | Isolated blog functionality with separate tables |
| Reuses existing tokens | Uses bg-brand-gradient, text-brand-text-accent, etc. |
| Reuses existing UI components | Card, Button, Badge, Table, Form, Dialog from shadcn/ui |

---

## Implementation Order

### Phase 1: Database
1. Create blog_posts table with RLS
2. Create blog_categories table with RLS
3. Create blog_tags table with RLS
4. Create pivot tables
5. Add update triggers

### Phase 2: Hooks
1. Create useBlogPosts.ts
2. Create useBlogPostsAdmin.ts
3. Create useBlogCategories.ts
4. Create useBlogTags.ts

### Phase 3: Public Pages
1. Create BlogCard.tsx component
2. Create BlogSection.tsx (homepage)
3. Create Blog.tsx page (/blog)
4. Create BlogPost.tsx page (/blog/:slug)
5. Add routes to App.tsx
6. Add BlogSection to Index.tsx

### Phase 4: Admin
1. Create BlogPostForm.tsx
2. Create BlogCategoryForm.tsx
3. Create BlogTagForm.tsx
4. Create BlogAdmin.tsx page
5. Add route to AdminDashboard.tsx
6. Add sidebar item to AppSidebar.tsx

---

## Estimated Reading Time Calculation

Auto-calculate based on content:
```typescript
const calculateReadingTime = (content: string): number => {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
};
```

---

## SEO Implementation Summary

| Page | Title Pattern | Meta Description | Canonical | Structured Data |
|------|--------------|------------------|-----------|-----------------|
| /blog | Blog \| EverAfter Studio | Wedding tips and stories... | /blog | WebPage |
| /blog/:slug | {Post Title} \| EverAfter Blog | {Post excerpt or seo_description} | /blog/{slug} | BlogPosting |

---

## Pagination Strategy (SEO-Friendly)

For /blog page:
- Use query params: `/blog?page=2`
- Add rel="prev" and rel="next" link tags
- 8 posts per page (configurable)
- Show page numbers, not infinite scroll

