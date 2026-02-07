

## Overview

Add the production domains `https://everafterca.com` and `https://www.everafterca.com` to the CORS allowed origins in both webhook proxy edge functions, and also fix the missing `.lovableproject.com` pattern that was causing CORS issues in the preview environment.

---

## Files to Update

### 1. `supabase/functions/webhook-proxy/index.ts`

**Lines 6-10** - Add new domains to ALLOWED_ORIGINS:

```javascript
const ALLOWED_ORIGINS = [
  'https://everafter.lovable.app',
  'https://everafter-studio.lovable.app',
  'https://hmdnronxajctsrlgrhey.lovableproject.com',
  'https://everafterca.com',
  'https://www.everafterca.com',
];
```

**Lines 17-23** - Add `.lovableproject.com` pattern to getCorsHeaders:

```javascript
function getCorsHeaders(origin: string | null): Record<string, string> {
  const isAllowed = origin && (
    ALLOWED_ORIGINS.includes(origin) || 
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    origin.endsWith('.lovable.app') ||
    origin.endsWith('.lovableproject.com')
  );
```

---

### 2. `supabase/functions/consultation-webhook-proxy/index.ts`

**Lines 6-9** - Add new domains to ALLOWED_ORIGINS:

```javascript
const ALLOWED_ORIGINS = [
  'https://everafter.lovable.app',
  'https://hmdnronxajctsrlgrhey.lovableproject.com',
  'https://everafterca.com',
  'https://www.everafterca.com',
];
```

**Lines 17-24** - Add `.lovableproject.com` pattern to getCorsHeaders:

```javascript
function getCorsHeaders(origin: string | null): Record<string, string> {
  const isAllowed = origin && (
    ALLOWED_ORIGINS.includes(origin) || 
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    origin.endsWith('.lovable.app') ||
    origin.endsWith('.lovableproject.com')
  );
```

---

## Summary

| Change | Purpose |
|--------|---------|
| Add `everafterca.com` to ALLOWED_ORIGINS | Allow production domain |
| Add `www.everafterca.com` to ALLOWED_ORIGINS | Allow www subdomain |
| Add `.lovableproject.com` pattern | Allow preview environments |

---

## After Implementation

The edge functions will be automatically redeployed, and all forms will work from:
- `everafterca.com` (production)
- `www.everafterca.com` (www subdomain)
- `*.lovable.app` (Lovable hosted)
- `*.lovableproject.com` (preview environments)
- `localhost` (development)

