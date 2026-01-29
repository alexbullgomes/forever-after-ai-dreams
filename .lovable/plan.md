

# Rich Text Editor Enhancement for Blog Content Field

## Overview

This plan upgrades the existing plain `<Textarea>` in the Blog Post editor to a feature-rich Tiptap editor. The change is scoped strictly to the `BlogPostForm.tsx` component within the Admin Dashboard, with corresponding updates to the frontend `BlogPostContent.tsx` renderer to properly display HTML content.

## Current State Analysis

### Current Editor (`BlogPostForm.tsx`)
- Lines 153-162: Plain `<Textarea>` with `font-mono` class
- Placeholder text mentions "Markdown supported"
- Content stored as plain text with basic Markdown notation
- Uses `react-hook-form` with `register("content")`

### Current Renderer (`BlogPostContent.tsx`)
- Lines 17-48: Custom `renderContent()` function
- Splits content by double newlines
- Only handles `## ` and `### ` headings
- Regular paragraphs rendered with simple `<p>` tags
- Does NOT handle bold, italic, lists, links, or embedded videos

### Key Dependencies Already Installed
- `dompurify` v3.3.1 - For HTML sanitization (already used in PromotionalLanding.tsx)
- `@tailwindcss/typography` - Already in devDependencies (for `prose` classes)
- `react-hook-form` - Already managing form state

## Implementation Approach

### New Dependencies Required
```
@tiptap/react
@tiptap/starter-kit
@tiptap/extension-link
@tiptap/extension-youtube
@tiptap/pm
```

**Why Tiptap?**
- Lightweight, modular architecture
- Outputs clean semantic HTML (no inline styles)
- Well-supported with shadcn/ui ecosystem
- Used in shadcn-minimal-tiptap patterns

### File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `package.json` | Modify | Add Tiptap dependencies |
| `src/components/admin/blog/RichTextEditor.tsx` | Create | New Tiptap editor component |
| `src/components/admin/blog/BlogPostForm.tsx` | Modify | Replace Textarea with RichTextEditor |
| `src/components/blog/BlogPostContent.tsx` | Modify | Render HTML content safely |
| `src/index.css` | Modify | Add Tiptap editor styles |
| `tailwind.config.ts` | Modify | Add typography plugin to plugins array |

## Detailed Implementation

### 1. New Component: RichTextEditor.tsx

A self-contained Tiptap editor with toolbar that matches the admin dashboard design.

**Toolbar Features:**
- Headings dropdown (H1, H2, H3)
- Bold, Italic toggle buttons
- Bullet list, Ordered list buttons
- Link insertion/removal
- YouTube/Vimeo embed button
- Blockquote button

**Component Props:**
```typescript
interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}
```

**Key Implementation Details:**
- Uses Tiptap `StarterKit` (includes headings, bold, italic, lists, blockquote)
- Adds `@tiptap/extension-link` for link editing
- Adds `@tiptap/extension-youtube` for video embeds
- Syncs editor content with form via `onUpdate` callback
- Toolbar styled with existing `Button`, `Toggle`, `Popover` from shadcn/ui

**Toolbar Layout (Visual Reference):**
```
┌─────────────────────────────────────────────────────────────────────┐
│ [H▼] │ B │ I │ ⋮ │ • │ 1. │ ⋮ │ 🔗 │ ▶ │ ❝ │                       │
│ ▼    │   │   │   │   │    │   │    │   │   │                       │
│ H1   │   │   │   │   │    │   │    │   │   │                       │
│ H2   │   │   │   │   │    │   │    │   │   │                       │
│ H3   │   │   │   │   │    │   │    │   │   │                       │
└─────────────────────────────────────────────────────────────────────┘
│                                                                     │
│  [Editor content area with placeholder text]                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2. BlogPostForm.tsx Modifications

**Lines 153-162 Changes:**

Remove:
```tsx
<Textarea
  id="content"
  {...register("content")}
  placeholder="Write your blog post content here... (Markdown supported)"
  rows={15}
  className="font-mono"
/>
```

Replace with:
```tsx
<RichTextEditor
  value={content}
  onChange={(html) => setValue("content", html)}
  placeholder="Write your blog post content here..."
/>
```

**Additional Changes:**
- Add import for `RichTextEditor`
- Update reading time calculation to strip HTML tags before word count

### 3. BlogPostContent.tsx Modifications

**Remove:** The entire `renderContent()` function (lines 17-48)

**Replace with:** Sanitized HTML rendering using DOMPurify

```tsx
const renderContent = (content: string | null) => {
  if (!content) return null;
  
  // Sanitize HTML to prevent XSS
  const sanitizedHtml = DOMPurify.sanitize(content, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'src'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
  
  return (
    <div 
      className="prose prose-lg max-w-none"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};
```

**Why iframe is allowed:**
- YouTube/Vimeo embeds require iframe
- DOMPurify sanitizes src attributes to prevent XSS
- Only HTTPS sources will work

### 4. Tailwind Typography Plugin Activation

**tailwind.config.ts:**
```typescript
plugins: [
  require("tailwindcss-animate"),
  require("@tailwindcss/typography"),  // Add this
],
```

### 5. Editor Styles in index.css

Add at the end of the file:
```css
/* Tiptap Editor Styles */
.tiptap-editor {
  @apply min-h-[300px] border rounded-md;
}

.tiptap-editor .ProseMirror {
  @apply p-4 min-h-[280px] focus:outline-none;
}

.tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
  @apply text-muted-foreground pointer-events-none float-left h-0;
  content: attr(data-placeholder);
}

/* Toolbar styling */
.tiptap-toolbar {
  @apply flex flex-wrap gap-1 p-2 border-b bg-muted/50;
}

.tiptap-toolbar button {
  @apply h-8 w-8 rounded hover:bg-accent;
}

/* Content styling in editor */
.tiptap-editor .ProseMirror h1 { @apply text-3xl font-bold mt-6 mb-3; }
.tiptap-editor .ProseMirror h2 { @apply text-2xl font-semibold mt-5 mb-2; }
.tiptap-editor .ProseMirror h3 { @apply text-xl font-medium mt-4 mb-2; }
.tiptap-editor .ProseMirror p { @apply mb-4 leading-relaxed; }
.tiptap-editor .ProseMirror ul { @apply list-disc pl-6 mb-4; }
.tiptap-editor .ProseMirror ol { @apply list-decimal pl-6 mb-4; }
.tiptap-editor .ProseMirror blockquote { 
  @apply border-l-4 border-brand-primary-from/50 pl-4 italic my-4; 
}
.tiptap-editor .ProseMirror a { 
  @apply text-brand-primary-from underline hover:opacity-80; 
}
.tiptap-editor .ProseMirror iframe {
  @apply w-full aspect-video rounded-lg my-4;
}
```

## Reading Time Calculation Update

The `calculateReadingTime` function in `useBlogPostsAdmin.ts` needs to strip HTML:

```typescript
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  // Strip HTML tags for accurate word count
  const textContent = content.replace(/<[^>]*>/g, ' ').trim();
  const wordCount = textContent.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}
```

## Backward Compatibility

### Existing Plain Text Posts
- Old posts stored as plain text will render correctly
- DOMPurify will treat them as safe text content
- No migration needed - they'll just lack HTML formatting

### Mixed Content Handling
- If a post contains both plain text and HTML, both render
- Editor loads existing HTML correctly for re-editing
- No data loss during the transition

## Security Implementation

### Input (Editor):
- Tiptap only generates clean, semantic HTML
- No inline styles or dangerous attributes
- YouTube extension validates URLs before embedding

### Output (Renderer):
- DOMPurify sanitizes all HTML before rendering
- Iframe restricted to allowed attributes only
- XSS vectors blocked by sanitizer

### Allowed HTML Elements:
```
p, h1, h2, h3, strong, em, ul, ol, li, a, blockquote, br, iframe
```

### Blocked Patterns:
```
script, onclick, onerror, javascript:, data:
```

## Files Created/Modified

| File | Action | Lines Changed |
|------|--------|---------------|
| `src/components/admin/blog/RichTextEditor.tsx` | CREATE | ~180 lines |
| `src/components/admin/blog/BlogPostForm.tsx` | MODIFY | ~15 lines |
| `src/components/blog/BlogPostContent.tsx` | MODIFY | ~35 lines |
| `src/hooks/useBlogPostsAdmin.ts` | MODIFY | ~3 lines |
| `src/index.css` | MODIFY | ~40 lines |
| `tailwind.config.ts` | MODIFY | ~1 line |

## What Remains Unchanged

- Database schema (`blog_posts` table)
- All routes (`/blog`, `/blog/:slug`, `/dashboard/blog`)
- BlogAdmin.tsx page structure
- Form tabs structure (Content, SEO, Settings)
- All other form fields (title, slug, excerpt, etc.)
- Public blog page layout
- Blog card components
- Categories and Tags management

## Testing Verification

After implementation, verify:

1. **Editor Functionality**
   - Create new post with H1, H2, H3 headings
   - Apply bold and italic formatting
   - Create bullet and numbered lists
   - Insert and edit links
   - Embed YouTube video URL
   - Add blockquote

2. **Content Persistence**
   - Save post, reload page, re-edit - content preserved
   - Formatting visible in edit mode

3. **Frontend Rendering**
   - Published post shows all formatting correctly
   - Links are clickable
   - YouTube embeds play
   - No console XSS warnings

4. **Backward Compatibility**
   - Edit existing plain-text post
   - Content still readable and editable
   - Can add formatting to old posts

5. **SEO Verification**
   - View page source for published post
   - Confirm semantic HTML (proper h1, h2, p tags)
   - No inline styles or editor artifacts

