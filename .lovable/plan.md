

# Safe Implementation Plan: Dashboard Navigation & Routing Fixes

## Summary of Changes

Four targeted fixes across 3 files. No database changes. No new dependencies.

## Changes

### 1. Sidebars open by default (both dashboards)

**Files**: `src/pages/UserDashboard.tsx`, `src/pages/AdminDashboard.tsx`

Change `<SidebarProvider defaultOpen={false}>` to `<SidebarProvider defaultOpen={true}>` in both files.

The SidebarProvider already persists state via cookies (`sidebar:state` cookie with 7-day expiry in `sidebar.tsx`). So:
- First visit: sidebar opens (new default)
- User collapses: cookie saves `false`, stays collapsed
- Mobile: unaffected (sidebar is overlay-based via `collapsible="icon"`)

### 2. Admin Dashboard button — admin-only visibility

**File**: `src/pages/UserDashboard.tsx`

The "Admin Dashboard" button at line 77-82 renders for ALL users. Fix: import `useRole` and conditionally render the button.

```typescript
// Add import
import { useRole } from '@/hooks/useRole';

// Inside component
const { hasRole: isAdmin, loading: roleLoading } = useRole('admin');

// In header, wrap the Admin Dashboard button:
{isAdmin && (
  <button onClick={() => navigate('/dashboard')} ...>
    Admin Dashboard
  </button>
)}
```

Same fix for the mobile "Quick Links" section in `UserDashboardSidebar.tsx` (line 162) — wrap the Admin Dashboard link with the same role check.

### 3. Account button → Services page

**File**: `src/components/Header.tsx`

Change line 15 from:
```typescript
navigate('/user-dashboard');
```
to:
```typescript
navigate('/user-dashboard/my-services');
```

### 4. Default User Dashboard route → Services

**File**: `src/pages/UserDashboard.tsx`

Change the default route (line 102) from:
```tsx
<Route path="/" element={<AffiliatePortal />} />
```
to:
```tsx
<Route path="/" element={<Navigate to="/user-dashboard/my-services" replace />} />
```

And add the Affiliate route explicitly:
```tsx
<Route path="/affiliate" element={<AffiliatePortal />} />
```

Update the sidebar navigation in `UserDashboardSidebar.tsx` to point "Affiliate" to `/user-dashboard/affiliate` instead of `/user-dashboard`.

## Files Modified

| File | Changes |
|------|---------|
| `src/pages/AdminDashboard.tsx` | `defaultOpen={true}` |
| `src/pages/UserDashboard.tsx` | `defaultOpen={true}`, admin button gated by role, default route → services, add `/affiliate` route |
| `src/components/Header.tsx` | Account → `/user-dashboard/my-services` |
| `src/components/dashboard/UserDashboardSidebar.tsx` | Admin link gated by role, Affiliate URL → `/user-dashboard/affiliate` |

## What stays untouched

- Auth flow (login, logout, Google OAuth)
- Booking flow and redirect system
- Affiliate tracking (localStorage `ref` capture)
- Admin Dashboard routing and access control
- All database tables and RLS policies
- Mobile responsiveness (sidebar is overlay on mobile regardless)

## Edge cases

- **No role flicker**: `useRole` returns `loading=true` initially; the button simply doesn't render until the check completes. The header already waits for auth loading.
- **Cookie override**: Users who previously collapsed the sidebar have a cookie set to `false`. The `defaultOpen` is only used when no cookie exists, so existing users keep their preference.
- **Backward compat**: `/user-dashboard` now redirects to `/user-dashboard/my-services`. Direct links to `/user-dashboard` still work via the redirect.

