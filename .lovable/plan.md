

# Change Chat Auto-Open Delay to 60 Seconds

## Root Cause

The auto-open delay is hardcoded in `src/hooks/useAutoOpenChat.ts` with a default of **10,000ms (10 seconds)**. Neither `ExpandableChatWebhook` nor `ExpandableChatAssistant` passes a custom `delay` prop — both use the default.

## Changes

### 1. `src/hooks/useAutoOpenChat.ts` — Change default delay

Change line 11 from `delay = 10000` to `delay = 60000` (60 seconds).

### 2. (Bonus) Make delay configurable via `site_settings`

Add a new key (e.g., `chat_auto_open_delay`) to the site settings system. Both chat components would read this value via `useHomepageContent` or `useSiteSettings` and pass it as the `delay` prop. Fallback: 60000ms.

**Files involved:**
- `src/hooks/useAutoOpenChat.ts` — already accepts `delay` prop, just change default
- `src/components/ui/expandable-chat-webhook.tsx` — pass `delay` from settings
- `src/components/ui/expandable-chat-assistant.tsx` — pass `delay` from settings
- `src/components/admin/settings/ContentSection.tsx` or new settings section — add number input for delay

### Recommended approach

**Minimal (just change timing):** Edit one line in `useAutoOpenChat.ts`. Done.

**Configurable:** Add `delay` prop from site settings in both chat components. This is low-risk since the hook already supports the `delay` parameter.

## Files Modified

| File | Change |
|------|--------|
| `src/hooks/useAutoOpenChat.ts` | Default delay: 10000 → 60000 |
| *(Optional)* Both chat components | Pass configurable delay from site_settings |

## Safety

- No UI/UX changes — only timing
- Session-based "already opened" flag unchanged
- Manual open/close unaffected
- No webhook or conversation flow changes
- No performance impact (single setTimeout)

