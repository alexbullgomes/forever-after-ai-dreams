import { User } from "@supabase/supabase-js";
import { formatInTimeZone } from 'date-fns-tz';

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
    fileData?: string;
    fileType: string;
    fileName: string;
    fileSize: number;
  }>;
}

const WEBHOOK_URL = 'https://agcreationmkt.cloud/webhook/79834679-8b0e-4dfb-9fbe-408593849da1';

const determineMessageType = (files?: File[]): "text" | "audio" | "image" => {
  if (!files || files.length === 0) {
    return "text";
  }
  
  const hasAudio = files.some(file => file.type.startsWith('audio/'));
  if (hasAudio) {
    return "audio";
  }
  
  return "image";
};

const getPacificTimestamp = (): string => {
  const now = new Date();
  return formatInTimeZone(now, 'America/Los_Angeles', "yyyy-MM-dd'T'HH:mm:ssxxx");
};

const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  retries = 1
): Promise<Response> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`[EVA-CHAT-USER] Attempt ${attempt + 1}/${retries + 1}`);
      const response = await fetch(url, options);
      
      if (response.ok) return response;
      
      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        console.error(`[EVA-CHAT-USER] Client error ${response.status}, not retrying`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      if (attempt === retries) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      if (attempt === retries) throw error;
      console.warn(`[EVA-CHAT-USER] Retry ${attempt + 1} after error:`, error);
      await new Promise(r => setTimeout(r, 1500));
    }
  }
  throw new Error('Max retries exceeded');
};

const safeParseResponse = async (response: Response): Promise<any> => {
  try {
    const responseText = await response.text();
    console.log('[EVA-CHAT-USER] Response body preview:', responseText?.substring(0, 200));
    return responseText ? JSON.parse(responseText) : { output: 'Message received.' };
  } catch (parseError) {
    console.warn('[EVA-CHAT-USER] JSON parse failed, using fallback:', parseError);
    return { output: 'Thank you for your message! Our team will get back to you soon.' };
  }
};

export const sendWebhookMessage = async (
  message: string,
  user: User | null,
  files?: File[]
): Promise<any> => {
  const messageType = determineMessageType(files);
  const pacificTimestamp = getPacificTimestamp();

  console.log('[EVA-CHAT-USER] Initiating request', {
    url: WEBHOOK_URL,
    messageType,
    hasFiles: !!(files && files.length > 0),
    userId: user?.id,
    userEmail: user?.email,
    messageLength: message.length,
    timestamp: new Date().toISOString()
  });

  try {
    // If no files, send as regular JSON
    if (!files || files.length === 0) {
      const webhookPayload: WebhookPayload = {
        message: message,
        timestamp: pacificTimestamp,
        userId: user?.id || "",
        userEmail: user?.email || "",
        userName: user?.user_metadata?.full_name || user?.email || "Anonymous",
        source: "Dream Weddings AI Assistant",
        type: messageType
      };

      console.log('[EVA-CHAT-USER] Sending JSON payload, size:', JSON.stringify(webhookPayload).length);

      const response = await fetchWithRetry(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*',
        },
        mode: 'cors',
        body: JSON.stringify(webhookPayload),
      });

      console.log('[EVA-CHAT-USER] Response received', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        contentType: response.headers.get('content-type')
      });

      return await safeParseResponse(response);
    }

    // If files exist, send as FormData to include binary files
    const formData = new FormData();
    
    formData.append('message', message);
    formData.append('timestamp', pacificTimestamp);
    formData.append('userId', user?.id || "");
    formData.append('userEmail', user?.email || "");
    formData.append('userName', user?.user_metadata?.full_name || user?.email || "Anonymous");
    formData.append('source', "Dream Weddings AI Assistant");
    formData.append('type', messageType);

    files.forEach((file, index) => {
      formData.append(`file_${index}`, file, file.name);
      formData.append(`file_${index}_type`, file.type);
      formData.append(`file_${index}_size`, file.size.toString());
    });

    console.log('[EVA-CHAT-USER] Sending FormData with files:', {
      fileCount: files.length,
      files: files.map(f => ({ name: f.name, type: f.type, size: f.size }))
    });

    const response = await fetchWithRetry(WEBHOOK_URL, {
      method: 'POST',
      mode: 'cors',
      body: formData,
    });

    console.log('[EVA-CHAT-USER] Response received', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    return await safeParseResponse(response);
  } catch (error) {
    const errorInfo = {
      name: (error as Error)?.name,
      message: (error as Error)?.message,
      type: error instanceof TypeError ? 'NetworkError/CORS' : 'Other',
      url: WEBHOOK_URL,
      userId: user?.id,
      timestamp: new Date().toISOString()
    };
    console.error('[EVA-CHAT-USER] Request failed:', errorInfo);
    throw error;
  }
};
