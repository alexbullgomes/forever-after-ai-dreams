

# Fix n8n Integration for Visitor Chat

## Problem Identified

The `visitor-chat` edge function is configured with an incorrect n8n webhook URL that doesn't resolve:

| Current (Broken) | Error |
|-----------------|-------|
| `https://n8n.eaproduction.co/webhook/...` | DNS lookup failure - domain doesn't exist |

All your other working webhooks use the `agcreationmkt.cloud` domain.

---

## Solution

Update the webhook URL in the `visitor-chat` edge function to match your working n8n instance.

### File to Modify

**`supabase/functions/visitor-chat/index.ts`** (Line 10)

```text
Change:
const N8N_WEBHOOK_URL = "https://n8n.eaproduction.co/webhook/3effc2b9-81b9-4f02-ae33-5eb16dc1ac36";

To:
const N8N_WEBHOOK_URL = "https://agcreationmkt.cloud/webhook/067583ff-25ca-4f0a-8f67-15d18e8a1264";
```

This uses the same webhook URL as your `homepage_chat` webhook in `webhook-proxy/index.ts`, which is designed for visitor chat.

---

## Alternative: Use Environment Variable

For better maintainability, use an environment variable like your other webhooks:

```typescript
const N8N_WEBHOOK_URL = Deno.env.get('N8N_VISITOR_CHAT_WEBHOOK') 
  || 'https://agcreationmkt.cloud/webhook/067583ff-25ca-4f0a-8f67-15d18e8a1264';
```

This allows changing the URL without code changes.

---

## Changes Summary

| Task | Description |
|------|-------------|
| Update URL | Replace `n8n.eaproduction.co` with `agcreationmkt.cloud` |
| Redeploy | Deploy the updated edge function |
| Test | Send a visitor message and verify AI response |

---

## Technical Details

### Working Webhook URLs in Your Project

Based on `webhook-proxy/index.ts`, these are your active n8n endpoints:

| Purpose | URL Domain |
|---------|------------|
| Homepage Chat | `agcreationmkt.cloud` |
| Auth Events | `agcreationmkt.cloud` |
| Quiz Completion | `agcreationmkt.cloud` |
| Consultation | `agcreationmkt.cloud` |
| Contact Form | `automation.agcreationmkt.com` |

All use working domains, confirming `agcreationmkt.cloud` is your active n8n instance.

### After Fix

Once deployed, the visitor chat flow will be:
1. Visitor sends message
2. Message saved to database
3. Forwarded to `agcreationmkt.cloud/webhook/...`
4. AI response received and stored
5. Visitor sees response in real-time

