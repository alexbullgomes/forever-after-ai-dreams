import { User } from "@supabase/supabase-js";

export interface WebhookPayload {
  message: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  userName: string;
  source: string;
  type: "text" | "audio" | "image";
  files?: Array<{
    fileUrl?: string;
    fileData?: string; // Base64 encoded file data
    fileType: string;
    fileName: string;
    fileSize: number;
  }>;
}

const determineMessageType = (files?: File[]): "text" | "audio" | "image" => {
  if (!files || files.length === 0) {
    return "text";
  }
  
  // Check if any file is audio
  const hasAudio = files.some(file => file.type.startsWith('audio/'));
  if (hasAudio) {
    return "audio";
  }
  
  // Otherwise, consider it image/file
  return "image";
};

export const sendWebhookMessage = async (
  message: string,
  user: User | null,
  files?: File[]
): Promise<any> => {
  const webhookUrl = 'https://automation.agcreationmkt.com/webhook/79834679-8b0e-4dfb-9fbe-408593849da1';
  const messageType = determineMessageType(files);

  // If no files, send as regular JSON
  if (!files || files.length === 0) {
    const webhookPayload: WebhookPayload = {
      message: message,
      timestamp: new Date().toISOString(),
      userId: user?.id || "",
      userEmail: user?.email || "",
      userName: user?.user_metadata?.full_name || user?.email || "Anonymous",
      source: "Dream Weddings AI Assistant",
      type: messageType
    };

    console.log('Sending AI Assistant webhook data (JSON):', webhookPayload);

    const response = await fetch(webhookUrl, {
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
  }

  // If files exist, send as FormData to include binary files
  const formData = new FormData();
  
  // Add text data
  formData.append('message', message);
  formData.append('timestamp', new Date().toISOString());
  formData.append('userId', user?.id || "");
  formData.append('userEmail', user?.email || "");
  formData.append('userName', user?.user_metadata?.full_name || user?.email || "Anonymous");
  formData.append('source', "Dream Weddings AI Assistant");
  formData.append('type', messageType);

  // Add files as binary attachments
  files.forEach((file, index) => {
    formData.append(`file_${index}`, file, file.name);
    formData.append(`file_${index}_type`, file.type);
    formData.append(`file_${index}_size`, file.size.toString());
  });

  console.log('Sending AI Assistant webhook data (FormData with files):', {
    message,
    type: messageType,
    fileCount: files.length,
    files: files.map(f => ({ name: f.name, type: f.type, size: f.size }))
  });

  const response = await fetch(webhookUrl, {
    method: 'POST',
    body: formData, // No Content-Type header needed, browser will set it with boundary
  });

  if (!response.ok) {
    throw new Error(`Webhook request failed: ${response.status}`);
  }

  return await response.json();
};
