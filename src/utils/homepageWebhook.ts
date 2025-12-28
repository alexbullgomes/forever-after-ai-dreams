import { trackReferralConversion } from './affiliateTracking';

interface HomepageWebhookPayload {
  message: string;
  timestamp: string;
  source: string;
  type: "text" | "audio" | "image";
  visitorId: string;
  files?: Array<{
    fileUrl?: string;
    fileData?: string;
    fileType: string;
    fileName: string;
    fileSize: number;
  }>;
}

const WEBHOOK_URL = "https://agcreationmkt.cloud/webhook/067583ff-25ca-4f0a-8f67-15d18e8a1264";

const determineMessageType = (files?: File[]): "text" | "audio" | "image" => {
  if (!files || files.length === 0) return "text";
  
  const firstFile = files[0];
  if (firstFile.type.startsWith('audio/')) return "audio";
  if (firstFile.type.startsWith('image/')) return "image";
  return "text";
};

const getPacificTimestamp = (): string => {
  return new Date().toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  retries = 1
): Promise<Response> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`[EVA-CHAT-VISITOR] Attempt ${attempt + 1}/${retries + 1}`);
      const response = await fetch(url, options);
      
      if (response.ok) return response;
      
      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        console.error(`[EVA-CHAT-VISITOR] Client error ${response.status}, not retrying`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      if (attempt === retries) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      if (attempt === retries) throw error;
      console.warn(`[EVA-CHAT-VISITOR] Retry ${attempt + 1} after error:`, error);
      await new Promise(r => setTimeout(r, 1500));
    }
  }
  throw new Error('Max retries exceeded');
};

const safeParseResponse = async (response: Response): Promise<any> => {
  try {
    const responseText = await response.text();
    console.log('[EVA-CHAT-VISITOR] Response body preview:', responseText?.substring(0, 200));
    return responseText ? JSON.parse(responseText) : { output: 'Message received.' };
  } catch (parseError) {
    console.warn('[EVA-CHAT-VISITOR] JSON parse failed, using fallback:', parseError);
    return { output: 'Thank you for your message! Our team will get back to you soon.' };
  }
};

export const sendHomepageWebhookMessage = async (
  message: string,
  visitorId: string,
  files?: File[]
): Promise<any> => {
  const messageType = determineMessageType(files);
  const timestamp = getPacificTimestamp();

  console.log('[EVA-CHAT-VISITOR] Initiating request', {
    url: WEBHOOK_URL,
    messageType,
    hasFiles: !!(files && files.length > 0),
    visitorId,
    messageLength: message.length,
    timestamp: new Date().toISOString()
  });

  try {
    if (!files || files.length === 0) {
      // Text-only message
      const payload: HomepageWebhookPayload = {
        message,
        timestamp,
        source: "Homepage Visitor",
        type: messageType,
        visitorId,
      };

      console.log('[EVA-CHAT-VISITOR] Sending JSON payload, size:', JSON.stringify(payload).length);

      const response = await fetchWithRetry(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/plain, */*",
        },
        mode: 'cors',
        body: JSON.stringify(payload),
      });

      console.log('[EVA-CHAT-VISITOR] Response received', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        contentType: response.headers.get('content-type')
      });

      // Track referral conversion for form submission
      await trackReferralConversion('form_submission', {
        message_type: messageType,
        source: 'homepage_chat'
      });

      return await safeParseResponse(response);
    } else {
      // Message with files
      const formData = new FormData();
      formData.append("message", message);
      formData.append("timestamp", timestamp);
      formData.append("source", "Homepage Visitor");
      formData.append("type", messageType);
      formData.append("visitorId", visitorId);

      // Add files to FormData
      files.forEach((file, index) => {
        formData.append(`file_${index}`, file);
        formData.append(`fileName_${index}`, file.name);
        formData.append(`fileType_${index}`, file.type);
        formData.append(`fileSize_${index}`, file.size.toString());
      });

      console.log('[EVA-CHAT-VISITOR] Sending FormData with files:', files.length);

      const response = await fetchWithRetry(WEBHOOK_URL, {
        method: "POST",
        mode: 'cors',
        body: formData,
      });

      console.log('[EVA-CHAT-VISITOR] Response received', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      // Track referral conversion for form submission with files
      await trackReferralConversion('form_submission', {
        message_type: messageType,
        source: 'homepage_chat',
        files_count: files.length
      });

      return await safeParseResponse(response);
    }
  } catch (error) {
    const errorInfo = {
      name: (error as Error)?.name,
      message: (error as Error)?.message,
      type: error instanceof TypeError ? 'NetworkError/CORS' : 'Other',
      url: WEBHOOK_URL,
      timestamp: new Date().toISOString()
    };
    console.error('[EVA-CHAT-VISITOR] Request failed:', errorInfo);
    throw error;
  }
};
