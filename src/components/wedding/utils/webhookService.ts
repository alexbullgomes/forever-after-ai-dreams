
import { User } from "@supabase/supabase-js";

export interface WebhookPayload {
  message: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  userName: string;
  source: string;
}

export const sendWebhookMessage = async (
  message: string,
  user: User | null,
  files?: File[]
): Promise<any> => {
  console.log('Sending AI Assistant webhook data with files:', { message, filesCount: files?.length || 0 });

  // Create FormData to send files as binary
  const formData = new FormData();
  
  // Add the main payload as JSON
  const webhookPayload: WebhookPayload = {
    message: message,
    timestamp: new Date().toISOString(),
    userId: user?.id || "",
    userEmail: user?.email || "",
    userName: user?.user_metadata?.full_name || user?.email || "Anonymous",
    source: "Dream Weddings AI Assistant"
  };
  
  formData.append('data', JSON.stringify(webhookPayload));
  
  // Add files as binary data
  if (files && files.length > 0) {
    files.forEach((file, index) => {
      formData.append(`file_${index}`, file, file.name);
    });
    formData.append('file_count', files.length.toString());
  }

  const response = await fetch('https://automation.agcreationmkt.com/webhook/79834679-8b0e-4dfb-9fbe-408593849da1', {
    method: 'POST',
    body: formData, // Send as FormData instead of JSON
  });

  if (!response.ok) {
    throw new Error(`Webhook request failed: ${response.status}`);
  }

  return await response.json();
};
