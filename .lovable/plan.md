

# Fix External Supabase Video URLs Blocked by CSP

## Problem Summary

After a recent security update, public video links from the external Supabase project (`supabasestudio.agcreationmkt.cloud`) stopped working. The Content Security Policy (CSP) in `index.html` was hardened to only allow media from the main EverAfter Supabase (`hmdnronxajctsrlgrhey.supabase.co`), blocking all videos from the external storage.

## Root Cause

The `media-src` directive in the CSP meta tag is missing the external Supabase domain:

```text
Current CSP media-src:
  media-src 'self' https://hmdnronxajctsrlgrhey.supabase.co blob:;
                   ▲
                   Only allows main Supabase, NOT external

Missing domain:
  https://supabasestudio.agcreationmkt.cloud
```

### Affected Content

| Source | Examples |
|--------|----------|
| `Hero.tsx` | Banner video `bannerhomepage.webm/mp4`, poster `Homepicture.webp` |
| `gallery_cards` table | Multiple video URLs for portfolio items |
| `service_gallery_cards` table | Service gallery videos |
| Promotional campaigns | Campaign banner videos |

## Solution

Add the external Supabase storage domain to the `media-src` directive in the CSP. This is the correct, standards-compliant approach that:
- Allows only the specific external domain needed
- Does not weaken security globally
- Is scalable for future external media sources
- Requires no code changes to components

## File to Modify

`index.html` (line 7)

## Technical Change

**Current CSP `media-src`:**
```
media-src 'self' https://hmdnronxajctsrlgrhey.supabase.co blob:;
```

**Fixed CSP `media-src`:**
```
media-src 'self' https://hmdnronxajctsrlgrhey.supabase.co https://supabasestudio.agcreationmkt.cloud blob:;
```

### Full Updated CSP Line

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.gpteng.co https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://s.pinimg.com https://analytics.tiktok.com https://snap.licdn.com https://static.ads-twitter.com; connect-src 'self' https://hmdnronxajctsrlgrhey.supabase.co wss://hmdnronxajctsrlgrhey.supabase.co https://www.google-analytics.com https://facebook.com https://analytics.tiktok.com https://snap.licdn.com; img-src * data: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; media-src 'self' https://hmdnronxajctsrlgrhey.supabase.co https://supabasestudio.agcreationmkt.cloud blob:; frame-src 'self' https://js.stripe.com https://hooks.stripe.com;" />
```

## Why This Is Safe

| Concern | Mitigation |
|---------|------------|
| Opens up to untrusted media? | No - only whitelists a specific, known domain under your control |
| Affects other CSP rules? | No - only modifies `media-src` directive |
| Allows arbitrary external domains? | No - explicit domain allowlist pattern |
| Can be exploited? | External Supabase bucket must already be configured as public |

## Security Considerations

The external Supabase storage (`supabasestudio.agcreationmkt.cloud`) is:
1. A known, controlled domain (your external Supabase project)
2. Using HTTPS (secure transport)
3. Already configured with public bucket access
4. Only serving media files (videos/images), not executable code

Adding it to `media-src` is the appropriate CSP approach for this use case.

## Verification

After implementation, verify:
1. Homepage hero video plays correctly (`bannerhomepage.webm/mp4`)
2. Portfolio gallery videos from external Supabase load and autoplay
3. Service gallery videos play on `/services` page
4. Promotional campaign banner videos work
5. No CSP violation errors in browser console
6. All internal Supabase videos still work

## Alternative Approaches (Not Recommended)

| Approach | Why Not Recommended |
|----------|-------------------|
| Migrate all files to main Supabase | User explicitly stated not to do this |
| Use `media-src *` | Weakens security globally |
| Create a proxy edge function | Adds latency and complexity unnecessarily |
| Remove CSP entirely | Severely weakens security |

## Future Scalability

If additional external media domains are needed in the future, they can be added to the `media-src` directive using the same pattern:

```
media-src 'self' https://domain1.com https://domain2.com blob:;
```

