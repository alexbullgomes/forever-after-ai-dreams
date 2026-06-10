
# Goal

Replace `hmdnronxajctsrlgrhey.supabase.co` on the Google OAuth screen with an EverAfter-branded domain (recommended: `auth.everafterca.com`), without breaking sessions, bookings, Stripe, chat, dashboard, or storage.

# Current state (verified)

- Frontend Supabase client (`src/integrations/supabase/client.ts`) hardcodes `SUPABASE_URL = https://hmdnronxajctsrlgrhey.supabase.co`. `.env` mirrors the same in `VITE_SUPABASE_URL`.
- Google OAuth is initiated in `src/components/auth/GoogleAuthButton.tsx` via `supabase.auth.signInWithOAuth({ provider: 'google', redirectTo: <app url> })`. The "Continue to ..." text on Google's screen is driven by the **OAuth client's authorized redirect URI host**, which today is Supabase's project URL: `https://hmdnronxajctsrlgrhey.supabase.co/auth/v1/callback`. That is why users see `hmdnronxajctsrlgrhey.supabase.co`.
- `redirectTo` passed from our app is only the final post-auth landing URL — it does **not** change what Google displays. Only the Supabase auth callback host does.
- Public media stays on `supabasestudio.agcreationmkt.cloud` (unrelated, untouched).
- Edge Functions, Stripe webhook, n8n webhooks, RLS, and the JWT issuer all key off the Supabase project — none need URL changes for this work.

# Why a custom domain is the only real fix

The Google consent screen shows the host of the OAuth redirect URI registered in Google Cloud. To replace it with EverAfter branding, Supabase must expose its auth endpoint on `auth.everafterca.com`, and Google's redirect URI must be re-registered to that host. Supabase offers two products for this:

- **Custom Domain** (paid add-on, ~$10/mo per project, available on Pro plan and above) — gives `auth.everafterca.com/auth/v1/callback`. This is what we want.
- **Vanity Subdomain** (free, Pro plan) — only changes to `<name>.supabase.co`. Does not satisfy the branding goal.

**Action item for user:** confirm the project is on Pro plan (or upgrade) and enable the Custom Domain add-on. The plan below assumes Custom Domain.

# Migration plan (zero-downtime)

The project ref URL keeps working forever after a custom domain is added — Supabase serves both. So we cut over OAuth first, then optionally update the client.

## Phase 1 — Supabase custom domain (no code changes)

1. In Supabase Dashboard → Settings → Custom Domains: add `auth.everafterca.com`.
2. Add the CNAME record Supabase shows (typically `auth → <project-ref>.supabase.co`) plus a TXT verification record at the DNS provider for `everafterca.com`.
3. Wait for "Activated".
4. In Authentication → URL Configuration: set **Site URL** to `https://www.everafterca.com` and add to **Redirect URLs**:
   - `https://www.everafterca.com/**`
   - `https://everafterca.com/**`
   - `https://everafter-studio.lovable.app/**`
   - `https://id-preview--*.lovable.app/**`
   - `http://localhost:*/**`

   (Site URL only affects fallback redirects, not Google's screen.)

## Phase 2 — Google Cloud Console

In the existing OAuth Client ID (Web application):

- **Authorized JavaScript origins** — add (keep old entries during transition):
  - `https://auth.everafterca.com`
  - `https://www.everafterca.com`
  - `https://everafterca.com`
- **Authorized redirect URIs** — add:
  - `https://auth.everafterca.com/auth/v1/callback`
  - Keep `https://hmdnronxajctsrlgrhey.supabase.co/auth/v1/callback` until Phase 3 is verified, then remove.

OAuth consent screen (App branding):
- App name: `EverAfter`
- User support email: support address on `everafterca.com`
- App logo: upload EverAfter logo (square, ≥120px, <1MB)
- App domain: `https://www.everafterca.com`
- Authorized domains: add `everafterca.com`
- Privacy policy: `https://www.everafterca.com/privacy`
- Terms of service: `https://www.everafterca.com/terms`
- Developer contact: same support address

Result: the Google sign-in screen says **"Continue to auth.everafterca.com"** with the EverAfter logo and "EverAfter" app name.

## Phase 3 — Point Supabase Auth to the custom domain

In Supabase → Authentication → Providers → Google: paste Client ID and Client Secret (re-paste if needed). Supabase auto-generates the callback URL on the active custom domain. No code change required for this phase — the JS client can still talk to the project-ref URL; Google's screen is already branded because it's driven by Google's redirect-URI host, not by the JS client URL.

## Phase 4 (optional) — Repoint the JS client

Only do this after Phase 3 is verified live for 24-48h. Update `src/integrations/supabase/client.ts` and `.env` `VITE_SUPABASE_URL` to `https://auth.everafterca.com`. The publishable key and JWT issuer stay valid because Supabase serves both hosts. Existing user sessions remain valid (JWTs aren't tied to host). Realtime, RLS, edge function invocation URLs from the client, and Stripe checkout all keep working.

**Skip Phase 4 if you want zero code risk** — the OAuth branding goal is already met by Phase 1-3.

# What we explicitly do NOT change

- `supabase/config.toml` `project_id` — stays `hmdnronxajctsrlgrhey`.
- Edge Function URLs (Stripe webhook endpoint registered in Stripe Dashboard, n8n callbacks, webhook-proxy targets) — all remain on the project-ref URL.
- `chat-audios` bucket URLs and all public media URLs.
- `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`, and other secrets.
- Anon/publishable key.

# Rollback

If anything breaks during Phase 2-3, remove the new redirect URI from Google Cloud — Google immediately reverts to the old Supabase URL. The custom domain itself is non-destructive (both hosts serve auth).

# Deliverables in build mode

Build mode work is minimal and only needed for Phase 4:
1. Update `src/integrations/supabase/client.ts` `SUPABASE_URL` constant.
2. Update `.env` `VITE_SUPABASE_URL`.
3. Smoke test: login (email + Google), session persistence, booking checkout, chat send/receive, admin dashboard.

Everything else (DNS, Supabase dashboard, Google Cloud) is configuration the user performs in their accounts — I can guide step-by-step but cannot execute.

# Open questions before build mode

1. Is the project on Supabase **Pro plan** with budget for the Custom Domain add-on (~$10/mo)? If not, the only free option is a vanity subdomain like `everafter.supabase.co` — better than the random ref but still shows `.supabase.co`.
2. Preferred subdomain: `auth.everafterca.com` (recommended, clearest intent) or `api.everafterca.com`?
3. Do you want Phase 4 (repoint the JS client) included, or stop at Phase 3 for maximum safety?
