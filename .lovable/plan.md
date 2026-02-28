

# Phase 3: Admin UI for Homepage Content Management

## Architecture

Expand the Project Settings sidebar with new sections. Each section gets its own component file under `src/components/admin/settings/`. All editors follow the existing pattern: local temp state, `hasChanges` detection, single Save button, toast feedback.

### Data flow
- New `useHomepageContentAdmin` hook wraps `useHomepageContent` + adds `updateSection(key, value)` method (upserts to `site_settings`)
- Each editor component calls `updateSection('homepage_hero', updatedData)` on save

## Files to Create

### 1. `src/hooks/useHomepageContentAdmin.ts`
- Imports `useHomepageContent` for reading
- Exposes `updateSection(key: HomepageContentKey, value: any): Promise<boolean>` that does `supabase.from('site_settings').update({ value }).eq('key', key)`
- Returns `{ content, loading, updateSection }`

### 2. `src/components/admin/settings/HeroContentEditor.tsx`
- Card with fields: badge_text, headline_line1, headline_line2, description, cta_text
- Video URLs section: video_webm_url, video_mp4_url, poster_url (text inputs)
- Trust indicators: editable list (emoji + text) with add/remove

### 3. `src/components/admin/settings/SectionsContentEditor.tsx`
- Accordion with 3 groups: Services Header, Portfolio Header, Blog Header
- **Services**: badge, title_line1/2, subtitle, additional_features list (icon select + title + description) with add/remove
- **Portfolio**: badge, title_line1/2, subtitle, cta_text, filters list (id + label) with add/remove
- **Blog**: badge, title, subtitle

### 4. `src/components/admin/settings/TestimonialsEditor.tsx`
- Stats section: editable list of {value, label} pairs with add/remove
- Testimonials section: accordion of testimonial cards, each with name, location, rating (1-5 select), text (textarea), image_url
- Add/remove testimonials buttons

### 5. `src/components/admin/settings/ContactContentEditor.tsx`
- Badge, title_line1/2, subtitle, form_title
- Contact info: email, phone, whatsapp_url, address
- Social links: editable list (platform select + url) with add/remove
- Quick response: title + text (textarea)

### 6. `src/components/admin/settings/SeoContentEditor.tsx`
- business_name, seo_title, seo_description (textarea)
- phone, email, address_locality
- social_urls: editable string list with add/remove

## Files to Modify

### 7. `src/components/admin/settings/SettingsSidebar.tsx`
- Add new sections to the `sections` array:
  - `'hero'` (Monitor icon)
  - `'sections'` (Layers icon)  
  - `'testimonials'` (MessageSquareQuote icon)
  - `'contact'` (Mail icon)
  - `'seo'` (Search icon)
- Update `SettingsSection` type union

### 8. `src/pages/ProjectSettings.tsx`
- Import and render new editor components based on `activeSection`

### 9. `src/components/admin/settings/ContentSection.tsx`
- No changes (stays as landing page cards editor)

## UI Pattern (consistent across all editors)

Each editor component follows this pattern:
1. Receives `content` and `updateSection` as props (from parent ProjectSettings)
2. Initializes local `temp` state from `content`
3. Tracks `hasChanges` via JSON comparison
4. Single "Save" button at bottom, disabled when no changes
5. Toast on success/error
6. Amber "unsaved changes" indicator

## Implementation Order

Split into 2-3 prompts:
- **Prompt 1**: Create `useHomepageContentAdmin` hook, update sidebar/settings page, create HeroContentEditor + ContactContentEditor + SeoContentEditor
- **Prompt 2**: Create SectionsContentEditor + TestimonialsEditor (more complex with lists/accordions)

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Saving partial JSON overwrites other fields | Each editor saves its complete section object (not partial) |
| Empty required fields | Non-empty validation on save for critical fields (headline, business_name) |
| No changes to public-facing components | Editors only write to site_settings; real-time subscription updates homepage |

