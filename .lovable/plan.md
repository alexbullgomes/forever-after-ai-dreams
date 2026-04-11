

# Leads / Customers Admin Page

## Summary
Create a new admin-only Leads page at `/dashboard/leads` with a filterable, searchable, paginated table of all profiles. Make existing dashboard metric cards clickable to navigate there with pre-applied filters.

## Architecture

```text
src/
  pages/LeadsAdmin.tsx              ← NEW page component
  hooks/useLeads.ts                 ← NEW React Query hook
  components/dashboard/
    AppSidebar.tsx                   ← ADD nav item
    DashboardContent.tsx             ← MAKE cards clickable
  pages/AdminDashboard.tsx           ← ADD route
```

## Files to Create

### 1. `src/hooks/useLeads.ts`
React Query hook that accepts filter params and queries `profiles` table:
- `hasPhone` boolean filter: `user_number IS NOT NULL AND != ''`
- `dateRange` filter: `created_at` between start/end
- `search` text: ilike match on `name` or `email`
- `hasReferral` boolean: `referred_by IS NOT NULL`
- Pagination via `.range(from, to)` with page size of 25
- Returns `{ data, totalCount, isLoading, refetch }`
- Separate count query for total (for pagination)

### 2. `src/pages/LeadsAdmin.tsx`
Full page component with:
- **Filter bar**: "Has Phone" toggle, date range quick buttons (Today, 7d, 30d, All), search input, optional "Affiliate Leads" toggle
- **URL state**: reads/writes filters to URL search params (`useSearchParams`)
- **Table**: Name, Email, Phone, Source (referred/direct), Created At columns
- **Pagination**: Previous/Next with page count
- **CSV Export**: button that downloads current filtered results as CSV to browser
- **Click row** → opens existing `UserProfileModal`
- Uses same styling patterns as BookingsPipeline (Table components, Badge, Button, Input)

## Files to Modify

### 3. `src/components/dashboard/AppSidebar.tsx`
Add nav item after "Dashboard":
```typescript
{ title: "Leads", url: "/dashboard/leads", icon: UserCheck }
```

### 4. `src/pages/AdminDashboard.tsx`
- Lazy import `LeadsAdmin`
- Add route: `<Route path="/leads" element={<LeadsAdmin />} />`

### 5. `src/components/dashboard/DashboardContent.tsx`
Make two metric cards clickable with `useNavigate`:
- "Total Customers" → `/dashboard/leads`
- "Users with Phone Numbers" → `/dashboard/leads?hasPhone=true`

## URL State Examples
- `/dashboard/leads` — all users, no filters
- `/dashboard/leads?hasPhone=true` — phone filter on
- `/dashboard/leads?range=7d` — last 7 days
- `/dashboard/leads?hasPhone=true&range=30d&search=john` — combined
- `/dashboard/leads?referral=true` — affiliate leads only

## Security
- Page is inside `/dashboard/*` which is already admin-gated by `AdminDashboard`
- Queries use existing `profiles` RLS (admin has full read access via `has_role`)
- No schema changes, no new tables, no RLS modifications

## Non-Breaking Guarantees
- Zero changes to `profiles` table structure
- No existing queries modified
- DashboardContent only adds `onClick` props to two cards (no logic changes)
- AppSidebar only adds one nav item to the array
- AdminDashboard only adds one lazy import + route

