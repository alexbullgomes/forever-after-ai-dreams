

# Auto-Assign New Users to Pipeline

## Problem
New users are created with `pipeline_profile = 'Disable'` by default. The Pipeline Process page only shows profiles where `pipeline_profile = 'Enable'`. This means new users are invisible in the pipeline until an admin manually enables them.

Current defaults on the `profiles` table:
- `pipeline_profile` = `'Disable'` -- **this is the problem**
- `pipeline_status` = `'New Lead & Negotiation'` -- already correct
- `status` = `'New Lead'` -- already correct

There are currently **13 users** stuck with `pipeline_profile = 'Disable'` who never appeared in the pipeline.

## Solution
One database migration with two statements:

1. **Change the column default** from `'Disable'` to `'Enable'` so all future users automatically appear in the pipeline
2. **Backfill existing users** who are currently `'Disable'` to `'Enable'` so they appear immediately

```sql
-- 1. Change default for future users
ALTER TABLE public.profiles
ALTER COLUMN pipeline_profile SET DEFAULT 'Enable';

-- 2. Backfill existing hidden users
UPDATE public.profiles
SET pipeline_profile = 'Enable'
WHERE pipeline_profile = 'Disable';
```

## Impact
- All 13 existing hidden users will appear in "New Lead & Negotiation" column
- Every future registration (email or Google OAuth) will automatically land in the pipeline
- No code changes needed -- the `handle_new_user` trigger and Pipeline Process page already work correctly with these values
- No effect on Stripe, booking, or any other system

## Files Changed
- One SQL migration only. No frontend or backend code changes.

