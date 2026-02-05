
# Fix Booking Pipeline to Display Campaign Package Data

## Problem Analysis

The Bookings Pipeline shows "Unknown" and "$-" for campaign package bookings because:

### Current Query (Line 92-98)
```typescript
.select(`
  *,
  products:product_id (title, price)
`)
```

This only joins with `products` table. Campaign bookings have:
- `product_id = NULL`
- `package_id = UUID` (linking to `campaign_packages`)

### Database Verification
Running a test query confirmed:
- Product bookings: `product_title: "Corporate Headshots Session"`, `product_price: 250`
- Campaign bookings: `package_title: "Brand Photography Content"`, `minimum_deposit_cents: 10000`

The data EXISTS in the database - it's just not being fetched.

---

## Solution

### Single File Change: `src/pages/BookingsPipeline.tsx`

**1. Update Query to Include Package Join**

```typescript
// Before
.select(`
  *,
  products:product_id (title, price)
`)

// After
.select(`
  *,
  products:product_id (title, price),
  campaign_packages:package_id (title, minimum_deposit_cents)
`)
```

**2. Update Interface to Include Package Data**

```typescript
interface BookingRequest {
  // ... existing fields
  campaign_id: string | null;
  package_id: string | null;
  products?: { title: string; price: number } | null;
  campaign_packages?: { title: string; minimum_deposit_cents: number } | null;  // NEW
}
```

**3. Update Product Display Logic (Table Row)**

```typescript
// Before (line 349-354)
<TableCell>
  <div>
    <p className="font-medium">{booking.products?.title || 'Unknown'}</p>
    <p className="text-sm text-muted-foreground">
      ${booking.products?.price?.toLocaleString() || '-'}
    </p>
  </div>
</TableCell>

// After - Resolve from either products OR campaign_packages
<TableCell>
  <div>
    <p className="font-medium">
      {booking.products?.title || booking.campaign_packages?.title || 'Unknown'}
    </p>
    <p className="text-sm text-muted-foreground">
      {booking.products?.price 
        ? `$${booking.products.price.toLocaleString()}`
        : booking.campaign_packages?.minimum_deposit_cents
          ? `$${(booking.campaign_packages.minimum_deposit_cents / 100).toLocaleString()}`
          : '$-'
      }
    </p>
  </div>
</TableCell>
```

**4. Update Detail Modal Display (line 466-472)**

Same pattern - check both products and campaign_packages.

**5. Update Search Filter (line 221-229)**

Add campaign_packages.title to search:
```typescript
const filteredBookings = bookings.filter((b) => {
  if (!searchQuery) return true;
  const query = searchQuery.toLowerCase();
  return (
    b.visitor_id?.toLowerCase().includes(query) ||
    b.user_id?.toLowerCase().includes(query) ||
    b.products?.title?.toLowerCase().includes(query) ||
    b.campaign_packages?.title?.toLowerCase().includes(query)  // NEW
  );
});
```

---

## Expected Result

| Booking Type | Product Column | Price Column |
|--------------|----------------|--------------|
| Product Booking | "Corporate Headshots Session" | "$250" |
| Campaign Package | "Brand Photography Content" | "$100" |
| Neither (edge case) | "Unknown" | "$-" |

---

## What Stays the Same (No Changes)

- Campaign Package UI in Edit Campaign
- Campaign landing page cards
- Booking modal and flow
- Stripe integration
- Hold/availability logic
- All package fields and data

---

## Files Changed

| File | Change |
|------|--------|
| `src/pages/BookingsPipeline.tsx` | Add campaign_packages join, update display logic |

---

## Technical Notes

### Why This Works
- Foreign key `booking_requests.package_id` → `campaign_packages.id` already exists
- Supabase PostgREST supports multiple FK joins in single query
- TypeScript types in `types.ts` already have the relationship defined

### Backward Compatible
- Existing product bookings continue working (no change to products join)
- The `|| 'Unknown'` fallback handles edge cases
- No database migration needed - just a query/display fix
