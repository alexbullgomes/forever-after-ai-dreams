
import { User } from "@supabase/supabase-js";

export interface WebhookPayload {
  message: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  userName: string;
  source: string;
  files?: Array<{
    fileUrl?: string;
    fileData?: string; // Base64 encoded file data
    fileType: string;
    fileName: string;
    fileSize: number;
  }>;
}

export const sendWebhookMessage = async (
  message: string,
  user: User | null,
  webhookFiles?: Array<{
    fileUrl?: string;
    fileData?: string;
    fileType: string;
    fileName: string;
    fileSize: number;
  }>
): Promise<any> => {
  const webhookPayload: WebhookPayload = {
    message: message,
    timestamp: new Date().toISOString(),
    userId: user?.id || "",
    userEmail: user?.email || "",
    userName: user?.user_metadata?.full_name || user?.email || "Anonymous",
    source: "Dream Weddings AI Assistant"
  };

  // Add files to payload if present
  if (webhookFiles && webhookFiles.length > 0) {
    webhookPayload.files = webhookFiles;
  }

  console.log('Sending AI Assistant webhook data:', webhookPayload);

  const response = await fetch('https://automation.agcreationmkt.com/webhook/79834679-8b0e-4dfb-9fbe-408593849da1', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(webhookPayload),
  });

  if (!response.ok) {
    throw new Error(`Webhook request failed: ${response.status}`);
  }

  return await response.json();
};
