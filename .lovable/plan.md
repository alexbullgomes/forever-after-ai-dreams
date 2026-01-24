
# Fix Visitor Audio Messages Storage

## Problem Summary

Visitor audio messages are recorded in the browser but never uploaded to storage. The current flow:
1. Visitor records audio → local blob URL created
2. Message sent to edge function with `type: 'audio'` but no file data
3. Database stores `audio_url: null` 
4. Admins see "Voice message sent" text but cannot play the audio

---

## Solution Architecture

```text
┌──────────────────────────────────────────────────────────────────┐
│                    CURRENT (BROKEN) FLOW                         │
├──────────────────────────────────────────────────────────────────┤
│  Browser → Blob URL (local only) → Edge Function → DB (null)     │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                     FIXED FLOW                                   │
├──────────────────────────────────────────────────────────────────┤
│  Browser → Base64 Audio → Edge Function → Storage → DB (URL)     │
│            ↓                                                      │
│      visitor-chat edge function handles upload using              │
│      service_role_key (bypasses RLS)                             │
└──────────────────────────────────────────────────────────────────┘
```

---

## Implementation Tasks

### 1. Update visitor-chat Edge Function

Add audio upload capability to handle visitor audio without authentication.

| Change | Description |
|--------|-------------|
| Accept base64 audio | New field `audio_data` in request body |
| Upload to Storage | Use service role key to bypass RLS |
| Generate public URL | Return URL for database storage |
| Update webhook payload | Include `audio_url` in n8n payload |

**Code Changes:**
- Add `audio_data?: string` to `VisitorChatRequest` interface
- Add `uploadVisitorAudio()` function that uploads base64 audio to `chat-audios` bucket using `visitor-{visitor_id}/` path
- Modify `send_message` action to upload audio if `audio_data` is provided
- Store returned URL in `audio_url` field

### 2. Update Frontend (expandable-chat-webhook.tsx)

Modify voice recording to send audio data to edge function.

| Change | Description |
|--------|-------------|
| Convert blob to base64 | Use FileReader to encode audio |
| Send with message | Include `audio_data` in request body |
| Update optimistic UI | Show audio player immediately |

**Code Changes:**
- In `recorder.onstop` handler, convert blob to base64
- Send `audio_data` field to visitor-chat edge function
- Handle response with proper `audio_url` for playback

### 3. Update Chat Admin Audio Display

Add audio player support for visitor messages.

| Change | Description |
|--------|-------------|
| Import AudioPlayer | Reuse existing component |
| Check for audio_url | Render player when message has audio |
| Add copy URL button | Allow admins to copy audio link |

**Code Changes:**
- Import `AudioPlayer` component
- Update message rendering to check `type === 'audio'` and render player
- Add audio URL in Message interface

### 4. Update Storage Policy (Optional Enhancement)

Add policy for anonymous uploads via edge function.

| Option | Description |
|--------|-------------|
| Service role bypass | Edge function uses service role key (already works) |
| Add visitor policy | Allow uploads to `visitor-*` paths without auth |

The service role key approach is recommended as it's more secure.

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/visitor-chat/index.ts` | Add audio upload logic with base64 handling |
| `src/components/ui/expandable-chat-webhook.tsx` | Convert blob to base64 and send to edge function |
| `src/components/dashboard/ChatAdmin.tsx` | Add audio player for messages with audio_url |

---

## Technical Details

### Edge Function Audio Upload Logic

```typescript
// New function in visitor-chat/index.ts
async function uploadVisitorAudio(
  supabase: SupabaseClient,
  visitorId: string,
  audioData: string
): Promise<string | null> {
  // Decode base64
  const base64Content = audioData.replace(/^data:audio\/\w+;base64,/, '');
  const binaryData = Uint8Array.from(atob(base64Content), c => c.charCodeAt(0));
  
  // Generate unique path
  const timestamp = Date.now();
  const filePath = `visitor-${visitorId}/${timestamp}.webm`;
  
  // Upload using service role (bypasses RLS)
  const { error } = await supabase.storage
    .from('chat-audios')
    .upload(filePath, binaryData, {
      contentType: 'audio/webm',
      upsert: false
    });
    
  if (error) return null;
  
  // Get public URL
  const { data } = supabase.storage
    .from('chat-audios')
    .getPublicUrl(filePath);
    
  return data.publicUrl;
}
```

### Frontend Base64 Conversion

```typescript
// In expandable-chat-webhook.tsx handleVoiceStart
recorder.onstop = async () => {
  const audioBlob = new Blob(chunks, { type: 'audio/webm' });
  
  // Convert to base64 for upload
  const reader = new FileReader();
  reader.onloadend = async () => {
    const base64Audio = reader.result as string;
    
    // Send to edge function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/visitor-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send_message',
        visitor_id: visitorId,
        content: 'Voice message',
        type: 'audio',
        audio_data: base64Audio  // New field
      })
    });
    
    const data = await response.json();
    // data.audio_url will contain the storage URL
  };
  reader.readAsDataURL(audioBlob);
};
```

### Chat Admin Audio Rendering

```typescript
// In ChatAdmin.tsx message rendering
{message.type === 'audio' && message.audio_url ? (
  <div className="flex items-center gap-2">
    <AudioPlayer
      fileUrl={message.audio_url}
      fileName="voice-message.webm"
      fileId={message.id.toString()}
      playingAudio={playingAudio}
      onPlay={(url, id) => setPlayingAudio(id)}
      isUserMessage={message.role === 'user'}
    />
  </div>
) : (
  <p className="text-sm">{message.content}</p>
)}
```

---

## Webhook Payload Enhancement

The n8n webhook will receive enhanced audio data:

```json
{
  "message": "Voice message",
  "visitorId": "abc123...",
  "conversationId": "xyz789...",
  "messageType": "audio",
  "audioUrl": "https://...supabase.co/storage/v1/object/public/chat-audios/visitor-.../timestamp.webm",
  "timestamp": "2026-01-24T02:00:00.000Z"
}
```

---

## Backward Compatibility

| Concern | Resolution |
|---------|------------|
| Logged-in users | No changes to expandable-chat-assistant.tsx - it already works |
| Existing messages | Old visitor audio messages without URLs will show "Voice message sent" text |
| Admin dashboard | Audio player gracefully handles missing URLs |

---

## Testing Checklist

1. Record audio as visitor on homepage chat
2. Verify file appears in `chat-audios` bucket with `visitor-*` prefix
3. Verify `messages` table has valid `audio_url`
4. Verify Chat Admin displays audio player for visitor messages
5. Verify n8n webhook receives `audioUrl` in payload
6. Verify logged-in user audio flow still works unchanged
