

# Rich Text for Campaign Showcase Description & Accordion Steps

## Summary
Replace plain `<Textarea>` inputs with a minimal TipTap rich text editor for the showcase **description** and each accordion **step description**. Render the stored HTML safely on the public-facing campaign page using DOMPurify (already installed). No schema changes needed — the existing text columns accept HTML strings.

## What Changes

### 1. New Component: `MiniRichTextEditor`
**File**: `src/components/admin/blog/MiniRichTextEditor.tsx`

A lightweight version of the existing `RichTextEditor`, with only:
- Bold
- Bullet list
- Link (add/remove)
- Paragraphs / line breaks

No headings, no YouTube, no blockquote, no ordered list. Compact toolbar, smaller min-height (~100px). Reuses the same TipTap extensions already in the project.

### 2. Admin Editor: `CampaignShowcaseTab.tsx`
**File**: `src/components/admin/CampaignShowcaseTab.tsx`

- Replace the `<Textarea>` for **Description** with `<MiniRichTextEditor>`.
- Replace the `<Textarea>` for each **Step description** (`step.text`) with `<MiniRichTextEditor>`.
- No other fields change.

### 3. Frontend Rendering: `feature-showcase.tsx`
**File**: `src/components/ui/feature-showcase.tsx`

- Import DOMPurify.
- **Description**: Change from `<p>{description}</p>` to a `<div>` with `dangerouslySetInnerHTML` using DOMPurify sanitization. Only allow: `p, br, strong, ul, li, a, ol`.
- **Step text**: Same treatment inside `<AccordionContent>`.
- Add a small prose class (`prose prose-sm`) for consistent paragraph/list spacing.

### 4. Sanitization Config
```ts
const ALLOWED_TAGS = ['p', 'br', 'strong', 'ul', 'ol', 'li', 'a'];
const ALLOWED_ATTR = ['href', 'target', 'rel'];
```
Applied via `DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR })`.

### 5. Backward Compatibility
- Plain text (no HTML tags) renders identically — DOMPurify passes it through, and a `<div>` displays it the same as a `<p>`.
- No data migration required.

## Files Impacted
| File | Change |
|------|--------|
| `src/components/admin/blog/MiniRichTextEditor.tsx` | **New** — minimal TipTap editor |
| `src/components/admin/CampaignShowcaseTab.tsx` | Swap Textarea → MiniRichTextEditor for description + step texts |
| `src/components/ui/feature-showcase.tsx` | Render HTML safely with DOMPurify + prose styling |

## What is NOT Touched
- Database schema (no migration)
- Campaign save/update logic
- Component hierarchy or layout structure
- Existing blog RichTextEditor
- Any chat, booking, or webhook functionality
- Styling system (only adds `prose prose-sm` to content containers)

## Security
- DOMPurify (already installed) with strict tag/attribute allowlist
- No script, iframe, img, or style tags allowed
- Links forced to `rel="noopener noreferrer"` via TipTap config

