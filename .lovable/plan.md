

# Expandable Chat – Configurable Initial Message & Behavior via Project Settings

## Summary
Add a "Chat Configuration" section to Project Settings that lets admins customize the chat's initial greeting messages, auto-open behavior, and delay timing. All values stored in the existing `site_settings` table. No changes to chat architecture, message flow, webhooks, or database schema.

## Current Behavior (Hardcoded)
- **Visitor intro**: `"Hi, I'm Eva 👋 How can I help you today? For the full experience — with portfolio, offers, and pricing — log in anytime."` (rendered when no conversation exists)
- **Authenticated intro**: `"Hi there! I'm EVA. You don't need to have it all figured out..."` (injected when message history is empty)
- **Auto-open delay**: hardcoded 60 seconds in `useAutoOpenChat` hook
- **Show once per session**: always true (hardcoded via sessionStorage)

## Architecture

```text
site_settings table
  key: "chat_config"
  value: {
    visitor_initial_message: string,
    user_initial_message: string,
    auto_open_enabled: boolean,
    auto_open_delay_seconds: number,
    show_once_per_session: boolean
  }

Settings UI → useSiteSettingsAdmin → site_settings (upsert)
Chat components → useChatConfig hook → reads from site_settings with defaults
```

## Changes

### 1. New Hook: `src/hooks/useChatConfig.ts`
- Reads `chat_config` key from `site_settings` table
- Returns typed config with safe defaults:
  - `visitor_initial_message`: current hardcoded text
  - `user_initial_message`: current hardcoded text
  - `auto_open_enabled`: `true`
  - `auto_open_delay_seconds`: `60`
  - `show_once_per_session`: `true`
- Caches in localStorage for instant access (same pattern as brand colors)

### 2. New Settings Section: `src/components/admin/settings/ChatConfigEditor.tsx`
- Textarea: Visitor Initial Message (with current default as placeholder)
- Textarea: Logged-in User Initial Message (optional, falls back to visitor message)
- Toggle: Auto Open Chat (on/off)
- Number input: Auto Open Delay (seconds, default 30)
- Toggle: Show Only Once Per Session
- Save button with toast feedback
- Uses `useSiteSettingsAdmin` pattern (upsert to `site_settings` with key `chat_config`)

### 3. Update Settings Sidebar: `src/components/admin/settings/SettingsSidebar.tsx`
- Add `'chat'` to `SettingsSection` type
- Add sidebar item with `MessageCircle` icon, label "Chat"

### 4. Update Project Settings Page: `src/pages/ProjectSettings.tsx`
- Import `ChatConfigEditor`
- Add `case 'chat'` to `renderContent()`

### 5. Update `src/components/ui/expandable-chat-webhook.tsx`
- Import `useChatConfig`
- Replace hardcoded intro message text (line 727) with `config.visitor_initial_message`
- Pass `config.auto_open_delay_seconds * 1000` and `config.auto_open_enabled` to `useAutoOpenChat`
- No changes to message persistence, webhook flow, or realtime subscriptions

### 6. Update `src/components/ui/expandable-chat-assistant.tsx`
- Import `useChatConfig`
- Replace hardcoded greeting (line 208) with `config.user_initial_message` (falling back to `config.visitor_initial_message`)
- Pass config values to `useAutoOpenChat`

### 7. Update `src/hooks/useAutoOpenChat.ts`
- Already accepts `delay` and `enabled` params -- no structural changes needed
- Chat components will just pass dynamic values from config instead of hardcoded ones

## Message Injection Safety
- Initial messages are **local-only UI messages** (id=0 or generated client-side ID)
- They are NOT inserted into the database
- They are NOT sent to webhooks or n8n
- They only appear when no conversation/messages exist
- On reload with existing conversation, messages load from DB -- no duplicate risk

## Files Changed
| File | Change |
|------|--------|
| `src/hooks/useChatConfig.ts` | **New** -- hook to read chat config from site_settings |
| `src/components/admin/settings/ChatConfigEditor.tsx` | **New** -- admin UI for chat settings |
| `src/components/admin/settings/SettingsSidebar.tsx` | Add 'chat' section |
| `src/pages/ProjectSettings.tsx` | Wire ChatConfigEditor |
| `src/components/ui/expandable-chat-webhook.tsx` | Use dynamic config for intro + auto-open |
| `src/components/ui/expandable-chat-assistant.tsx` | Use dynamic config for greeting + auto-open |

## What is NOT Touched
- Database schema (uses existing `site_settings` key-value pattern)
- `visitor-chat` edge function
- `chat-webhook-callback` edge function
- `messages` table or RLS policies
- Realtime subscriptions or broadcast channels
- n8n webhook flow
- AI/Human handoff logic
- `useAutoOpenChat` hook structure

