

# Fix: Manual Payment Admin Role Check

## Problem
The `manual-payment` edge function correctly authenticates the user but `has_role('admin')` returns `false`. The database has two `has_role` overloads — one checks `user_roles` table (enum param), the other checks `profiles.role` (text param). The RPC call is resolving to the wrong overload, or the admin user only has their role in `profiles.role` but not in `user_roles`.

## Solution
Modify the `manual-payment` edge function to use the `check_user_role_only()` function instead, which directly checks `profiles.role`. This matches how the rest of the app verifies admin status.

## Changes

### 1. Update `supabase/functions/manual-payment/index.ts`
Replace the `has_role` RPC call:
```typescript
// BEFORE
const { data: isAdmin } = await supabase.rpc('has_role', {
  _user_id: adminUserId,
  _role: 'admin',
});

// AFTER  
const { data: userRole } = await supabase.rpc('check_user_role_only', {
  _user_id: adminUserId,
});
const isAdmin = userRole === 'admin';
```

### 2. No other changes needed
- The shared `processBookingPayment` function is unaffected
- The stripe-webhook flow is unaffected
- The frontend BookingsPipeline UI is unaffected

## Why This Works
`check_user_role_only()` is a `SECURITY DEFINER` function that reads `profiles.role` directly — the same field used by the existing admin checks throughout the app (e.g., `useRole` hook). This ensures the manual-payment function uses the same admin verification as everything else.

