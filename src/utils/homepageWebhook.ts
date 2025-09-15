interface HomepageWebhookPayload {
  message: string;
  timestamp: string;
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

export const sendHomepageWebhookMessage = async (
  message: string,
  files?: File[]
): Promise<any> => {
  const WEBHOOK_URL = "https://agcreationmkt.cloud/webhook/067583ff-25ca-4f0a-8f67-15d18e8a1264";
  
  const messageType = determineMessageType(files);
  const timestamp = getPacificTimestamp();

  try {
    if (!files || files.length === 0) {
      // Text-only message
      const payload: HomepageWebhookPayload = {
        message,
        timestamp,
        source: "Homepage Visitor",
        type: messageType,
      };

      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } else {
      // Message with files
      const formData = new FormData();
      formData.append("message", message);
      formData.append("timestamp", timestamp);
      formData.append("source", "Homepage Visitor");
      formData.append("type", messageType);

      // Add files to FormData
      files.forEach((file, index) => {
        formData.append(`file_${index}`, file);
        formData.append(`fileName_${index}`, file.name);
        formData.append(`fileType_${index}`, file.type);
        formData.append(`fileSize_${index}`, file.size.toString());
      });

      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    }
  } catch (error) {
    console.error("Error sending homepage webhook message:", error);
    throw error;
  }
};