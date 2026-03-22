

# Dynamic Admin-Controlled Navbar Links

## Overview

Add a `navigation_links` table and admin UI so admins can manage header nav links. The Header component will fetch and render active links between the logo and the Account button.

## Changes

### 1. Database Migration

```sql
CREATE TABLE navigation_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  url text NOT NULL,
  type text NOT NULL DEFAULT 'internal' CHECK (type IN ('internal', 'external')),
  open_in_new_tab boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE navigation_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active links" ON navigation_links
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage links" ON navigation_links
  FOR ALL USING (has_role(auth.uid(), 'admin'::text));
```

### 2. New Hook: `src/hooks/useNavigationLinks.ts`

- Fetch from `navigation_links` where `is_active = true`, ordered by `sort_order`
- Use React Query with stale time of 5 minutes
- Return `{ links, loading }`

### 3. New Admin Hook: `src/hooks/useNavigationLinksAdmin.ts`

- Full CRUD: fetch all links (active + inactive), create, update, delete, reorder
- Reorder updates `sort_order` for all items

### 4. Header Component Update (`src/components/Header.tsx`)

- Import `useNavigationLinks` hook
- Render links as `<nav>` between logo and Account button
- Internal links: use React Router `<Link>` (no reload)
- External links: use `<a href>` with optional `target="_blank" rel="noopener noreferrer"`
- Style: `text-white/80 hover:text-white text-sm font-medium transition-colors`
- Mobile: collapse into a hamburger menu (Menu icon toggle)
- If fetch fails or loading: render nothing (Account button still shows)

Layout change:
```
[Logo] ---- [Nav Links (center/left)] ---- [Account Button (right)]
```

Use flex with `gap-6` for links, hidden on mobile, shown via hamburger.

### 5. Admin UI: Navigation Editor

New file: `src/components/admin/settings/NavigationLinksEditor.tsx`

- List all links with drag-and-drop reorder (@dnd-kit, already in project)
- Each row: label, URL, type badge, active toggle, edit/delete buttons
- Add/Edit form: label, URL, type (internal/external), open in new tab toggle, active toggle
- Inline editing pattern matching existing admin forms

### 6. Integrate into Project Settings

- Add `'navigation'` to `SettingsSection` type in `SettingsSidebar.tsx`
- Add new sidebar item with `Link` icon, label "Navigation"
- Add case in `ProjectSettings.tsx` `renderContent()` to render `NavigationLinksEditor`

## Files Modified/Created

| File | Change |
|------|--------|
| Migration | Create `navigation_links` table + RLS |
| `src/hooks/useNavigationLinks.ts` | New — public read hook |
| `src/hooks/useNavigationLinksAdmin.ts` | New — admin CRUD hook |
| `src/components/Header.tsx` | Add nav links + mobile hamburger |
| `src/components/admin/settings/NavigationLinksEditor.tsx` | New — admin editor |
| `src/components/admin/settings/SettingsSidebar.tsx` | Add "Navigation" section |
| `src/pages/ProjectSettings.tsx` | Add navigation case |

## Safety

- Header renders links only if fetch succeeds; falls back to current behavior
- No changes to auth flow, booking, chat, or campaign pages
- `hideAccountButton` prop continues working independently
- Campaign pages inherit the same Header with dynamic links
- No layout shift: links container has fixed min-height of 0

