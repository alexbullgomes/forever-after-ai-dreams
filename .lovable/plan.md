

# Booking Pipeline Insights — Dashboard Section

## Summary
Add a new "Booking Pipeline Insights" component to the Admin Dashboard below the Pipeline Overview section. This is a **read-only analytics layer** using existing `booking_requests`, `products`, and `campaign_packages` tables. No schema changes, no edge function modifications, no changes to existing booking logic.

## Current Data (484 total booking requests)
- date_selected: 271 | time_selected: 104 | checkout_started: 95 | contacted: 8 | paid: 6
- All records have `user_id` (no anonymous booking requests in practice)
- Mix of product-based (product_id) and campaign-based (package_id) bookings

## Architecture

### New Files
| File | Purpose |
|------|---------|
| `src/components/dashboard/BookingInsights.tsx` | Main insights component with all sub-sections |

### Modified Files
| File | Change |
|------|--------|
| `src/components/dashboard/DashboardContent.tsx` | Import and render `<BookingInsights />` below `<PipelineOverview />` |

No other files touched.

## Component Structure: `BookingInsights.tsx`

### Data Fetching (single query)
One Supabase query fetches all booking requests with joined product/package data:
```sql
booking_requests.select('*, products:product_id(title, price), campaign_packages:package_id(title, minimum_deposit_cents)')
```
- Client-side filtering for time ranges (Today/Week/Month/All) using `created_at`
- Client-side grouping by stage
- Real-time subscription on `booking_requests` table for live updates
- React Query not needed here — matches existing `DashboardContent` pattern (useEffect + setState)

### Section 1: Metric Cards (top row)
Grid of 6 cards (`grid-cols-2 md:grid-cols-3 lg:grid-cols-6`):

| Card | Value | Icon | Color |
|------|-------|------|-------|
| Total in Flow | all non-paid | `Activity` | blue |
| Date Selected | count | `CalendarDays` | gray |
| Time Selected | count | `Clock` | indigo |
| Checkout Started | count | `CreditCard` | amber |
| Paid | count | `CheckCircle` | green |
| Abandoned (>24h inactive, not paid) | count | `AlertTriangle` | red |

- Time filter tabs (All/Today/Weekly/Monthly) at top-right — same pill style as PipelineOverview
- Each card clickable → navigates to `/dashboard/bookings-pipeline?stage={stage}`
- Glass style: `bg-card/80 backdrop-blur-sm border border-border/50 shadow-sm`

### Section 2: Pipeline Flow Visualization
Horizontal flow bar showing conversion funnel:
```text
Date Selected (271) → Time Selected (104) → Checkout Started (95) → Paid (6)
```
- Each step is a rounded block with count and a connecting arrow/chevron
- Width proportional to count (visual funnel narrowing)
- Drop-off percentage shown between steps (e.g., "62% drop-off")
- Responsive: stacks vertically on mobile

### Section 3: Revenue Opportunity
Single card showing estimated potential revenue from in-progress bookings:
- Sums `products.price` for product bookings in `time_selected` and `checkout_started` stages
- Sums `campaign_packages.minimum_deposit_cents / 100` for campaign bookings
- Displays as: "Estimated Pipeline Value: $X,XXX" with breakdown by stage
- No new pricing logic — uses existing joined data

### Section 4: Urgency Alerts (Hot Leads)
Compact table showing booking requests needing follow-up, sorted by inactivity:
- Filters: non-paid stages where `last_seen_at` is stale
- Columns: Product/Package | Stage | Last Activity | Urgency
- Urgency badges:
  - `< 12h`: green "Recent"
  - `12–24h`: amber "Needs Attention"
  - `> 24h`: red "Urgent"
- Quick action buttons per row:
  - Eye icon → opens booking detail in `/dashboard/bookings-pipeline` with query param
  - MessageSquare icon → opens chat admin (if user_id exists, navigates to `/dashboard/chat-admin?conversationId=...` by looking up conversation by customer_id)
- Max 10 rows shown, with "View All →" link to bookings pipeline page
- Empty state: "No urgent follow-ups"

### Section 5: Auto-filter on BookingsPipeline page (minor enhancement)
`BookingsPipeline.tsx` reads `stage` query param on mount:
- If `?stage=checkout_started` → sets `stageFilter` to that value
- Non-breaking: falls back to 'all' if no param

## UI Design
- Matches existing glassmorphism: `bg-card/80 backdrop-blur-sm`
- Section header: "Booking Pipeline Insights" with subtitle
- Consistent with PipelineOverview filter pill style
- Hover animations: `hover:shadow-md hover:scale-[1.02] transition-all duration-200`
- No Framer Motion — CSS transitions only (consistent with rest of dashboard)

## Performance
- Single query for all booking requests (484 rows currently — well within limits)
- Client-side aggregation (fast, avoids multiple round-trips)
- Real-time channel subscription for live updates
- No RPC functions needed at current scale

## Risks & Edge Cases
- Booking requests without product_id or package_id → "Unknown" label, $0 revenue (handled)
- Guest bookings (visitor_id only) → no chat link available (graceful fallback)
- Large dataset (>1000 rows) → add `.limit(1000)` and note in code for future pagination
- No schema changes needed
- No RLS changes needed (admin already has full SELECT on booking_requests, products, campaign_packages)

## What Does NOT Change
- Booking flow, edge functions, Stripe logic
- Existing BookingsPipeline page (only adds query param reading)
- Pipeline Process, chat, availability systems
- Any database schema or RLS policies

