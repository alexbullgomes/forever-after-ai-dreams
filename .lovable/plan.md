

## Root Cause Analysis

### Primary Issue: SQL Type Mismatch in `get_global_slot_availability` Function

**Location**: Database function `get_global_slot_availability(timestamptz, timestamptz)`

**Bug**: On line 35, the function uses:
```sql
WHERE product_id IS NULL AND date = v_date::text
```

The `date` column is of type `date`, but `v_date::text` converts the date to a text string. PostgreSQL throws an error:
```
operator does not exist: date = text
```

This causes the function to crash and return the error fallback status `'needs_review'` for every slot.

**Flow**:
1. `getMonthAvailability()` calls `getDayAvailability()` for each day
2. `getDayAvailability()` calls the RPC `get_global_day_availability(p_day)`
3. `get_global_day_availability` internally calls `get_global_slot_availability(timestamptz, timestamptz)` for each slot
4. `get_global_slot_availability` crashes due to the type mismatch
5. Error propagates and the hook returns `status: 'needs_review'` as fallback

### Secondary Issue: Duplicate Override Records

**Location**: Database table `availability_overrides`

**Bug**: The partial unique index `idx_availability_overrides_global_date` was never successfully created. This allows multiple override records per date:
- Feb 16: 2 duplicates
- Feb 18: 3 duplicates  
- Feb 20: 6 duplicates

When creating/updating overrides, the frontend always INSERTs a new record instead of UPSERTing, leading to duplicates.

### Tertiary Issue: Fallback Logic Uses "needs_review"

**Location**: `src/hooks/useAvailabilityComputation.ts` (lines 40-48, 77-86)

When the RPC call fails, the hook returns `status: 'needs_review'` as a fallback. This is incorrect - a failure should not trigger admin review. Instead, it should either retry or return a safe default like `'available'`.

---

## Implementation Plan

### Step 1: Fix SQL Functions - Remove Type Cast Bug

**Database Migration**: Update both versions of `get_global_slot_availability` to fix the type comparison:

```sql
-- Fix timestamptz version
CREATE OR REPLACE FUNCTION public.get_global_slot_availability(...)
...
  -- BEFORE (bug):
  -- WHERE product_id IS NULL AND date = v_date::text
  
  -- AFTER (fixed):
  WHERE product_id IS NULL AND date = v_date
...

-- Fix date/time version  
CREATE OR REPLACE FUNCTION public.get_global_slot_availability(p_event_date date, ...)
...
  -- BEFORE (bug):
  -- WHERE product_id IS NULL AND date = p_event_date::text
  
  -- AFTER (fixed):
  WHERE product_id IS NULL AND date = p_event_date
...
```

### Step 2: Clean Up Duplicate Overrides

**Database Migration**: Delete duplicates keeping only the most recent override per date:

```sql
DELETE FROM availability_overrides a
USING (
  SELECT date, MAX(created_at) as max_created
  FROM availability_overrides
  WHERE product_id IS NULL AND date IS NOT NULL
  GROUP BY date
) b
WHERE a.product_id IS NULL 
  AND a.date IS NOT NULL 
  AND a.date = b.date 
  AND a.created_at < b.max_created;
```

### Step 3: Create Unique Constraint

**Database Migration**: Add a partial unique index to prevent future duplicates:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_availability_overrides_global_date_unique
ON availability_overrides (date) 
WHERE product_id IS NULL AND date IS NOT NULL;
```

### Step 4: Update Frontend Fallback Logic

**File**: `src/hooks/useAvailabilityComputation.ts`

Change the error fallback from `'needs_review'` to `'available'`:

```typescript
// Lines 40-48, 77-86, 91-98
// BEFORE:
status: 'needs_review',
reason: error.message,

// AFTER:
status: 'available',
reason: 'Using default (computation error)',
```

This ensures that computation errors do not incorrectly flag dates for admin review.

### Step 5: Update Override Modal to Use UPSERT Pattern

**File**: `src/hooks/useAvailabilityOverrides.ts`

Modify `createOverride` to check for existing override and update instead of insert:

```typescript
const createOverride = async (override) => {
  // Check if override already exists for this date
  if (override.date) {
    const { data: existing } = await supabase
      .from('availability_overrides')
      .select('id')
      .is('product_id', null)
      .eq('date', override.date)
      .maybeSingle();
    
    if (existing) {
      // Update existing instead of creating duplicate
      return updateOverride(existing.id, override);
    }
  }
  
  // Create new if no existing
  const { data, error } = await supabase
    .from('availability_overrides')
    .insert({...})
    ...
};
```

---

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `supabase/migrations/XXXXXX.sql` | Create | Fix SQL functions + clean duplicates + add unique index |
| `src/hooks/useAvailabilityComputation.ts` | Modify | Change error fallback from `needs_review` to `available` |
| `src/hooks/useAvailabilityOverrides.ts` | Modify | Add UPSERT pattern to prevent duplicate overrides |

---

## Verification Steps

### Test 1: Calendar Shows Correct Status
1. Navigate to Admin > Global Availability Calendar
2. Verify February 2026 shows green (Available) for most days
3. Verify only dates with actual bookings/holds show appropriate status
4. Verify "Needs Review" (orange) no longer appears by default

### Test 2: Manual Override Persists
1. Click any day in the calendar
2. Set status to "Blocked" and save
3. Refresh the page
4. Verify the day remains "Blocked" (gray indicator)
5. Click the same day and delete the override
6. Verify the day reverts to "Available" (green)

### Test 3: Pipeline Shows Correct Availability
1. Navigate to Admin > Bookings Pipeline
2. Verify bookings show "Available", "Limited", or "Full" - NOT "Needs Review"
3. Verify both product and package bookings show correct availability

### Test 4: No Duplicate Overrides
1. Click a day and create an override
2. Click the same day and change the status
3. Query database: `SELECT * FROM availability_overrides WHERE date = 'YYYY-MM-DD'`
4. Verify only ONE record exists for that date

---

## Expected Results After Fix

| Scenario | Before | After |
|----------|--------|-------|
| Calendar days | Orange "Needs Review" | Green/Yellow/Red/Gray based on actual data |
| Pipeline availability | "Needs Review" for all | Correct status per booking |
| Manual override save | Creates duplicate, appears broken | Updates existing, persists correctly |
| Computation error | Shows "Needs Review" | Shows "Available" as safe default |

