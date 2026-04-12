

# Pipeline Metrics Overview — Dashboard Upgrade

## Summary
Add a new "Pipeline Overview" section to the Admin Dashboard (`DashboardContent.tsx`) showing real-time counts per pipeline stage, with time filters and click-to-navigate behavior. Single new query, no changes to existing components.

## Pipeline Stages (from `PipelineProcess.tsx`)
1. New Lead & Negotiation (gray)
2. Closed Deal & Pre-Production (amber)
3. Production (blue)
4. Post-Production (Editing) (purple)
5. Delivery & Finalization (green)

## Implementation

### 1. Extend `DashboardContent.tsx`

**New state & query:**
- Add a `pipelineFilter` state (`all | today | week | month`)
- Single Supabase query: fetch all profiles where `pipeline_profile = 'Enable'`, selecting only `id, pipeline_status, created_at`
- Client-side: filter by `created_at` based on selected range, then group-count by `pipeline_status`

**New UI section** — inserted between the existing Metrics Grid and the Recent Customers section:
- Section header: "Pipeline Overview" with subtitle
- Filter tabs (top-right): All / Today / This Week / This Month — same pill style as Pipeline Process page
- 5 metric cards in a responsive grid (`grid-cols-2 md:grid-cols-3 lg:grid-cols-5`)
- Each card: colored left border matching stage color, stage name, count, Lucide icon
- Glass effect: `bg-card/80 backdrop-blur-sm border border-border/50 shadow-sm`
- Hover: `hover:shadow-md hover:scale-[1.02] transition-all duration-200`

**Click behavior:**
- Clicking a card navigates to `/dashboard/pipeline-process?status={encoded_status}&range={filter}`
- Example: `/dashboard/pipeline-process?status=New+Lead+%26+Negotiation&range=today`

### 2. Update `PipelineProcess.tsx` (minor)

- On mount, read `status` and `range` query params from URL
- If `range` param exists, set `dateFilter` accordingly
- If `status` param exists, auto-scroll or highlight that column (optional visual cue — subtle pulse animation on the matching column header for 2 seconds)

### 3. Icons per Stage
| Stage | Icon |
|-------|------|
| New Lead & Negotiation | `UserPlus` |
| Closed Deal & Pre-Production | `Handshake` |
| Production | `Camera` |
| Post-Production (Editing) | `Film` |
| Delivery & Finalization | `CheckCircle` |

### 4. Empty State
- If count is `0`, display "0" normally — no special empty state needed
- If the entire query fails, show a subtle error message inline

## Files Impacted
| File | Change |
|------|--------|
| `src/components/dashboard/DashboardContent.tsx` | Add pipeline metrics section with query, filters, cards, navigation |
| `src/pages/PipelineProcess.tsx` | Read URL params to auto-apply filters on load |

## What Does NOT Change
- Existing 4 metric cards (Total Customers, New Leads, Phone Numbers, Unread Messages)
- Recent Customers table
- Pipeline Process drag-and-drop, real-time subscriptions, kanban logic
- Any RLS policies or database schema
- Any other admin pages or components

## Technical Notes
- Query uses existing `profiles` table with `pipeline_profile = 'Enable'` filter (same as Pipeline Process page)
- No new hooks needed — inline fetch in `useEffect` matching existing pattern in `DashboardContent`
- Real-time subscription on `profiles` table (same channel pattern as Pipeline Process) to keep counts live
- No Framer Motion dependency added — using CSS transitions for hover effects (consistent with existing dashboard)

