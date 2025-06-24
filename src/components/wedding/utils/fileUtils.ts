
// Helper function to convert file to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = error => reject(error);
  });
};

// Process files for chat display and webhook sending
export const processFiles = async (files: File[]) => {
  // Create object URLs for immediate preview in chat
  const processedFiles = files.map((file) => ({
    fileUrl: URL.createObjectURL(file),
    fileType: file.type,
    fileName: file.name,
    fileSize: file.size
  }));

  // Convert files to base64 for webhook (for audio files) or use URL for others
  const webhookFiles = await Promise.all(files.map(async (file) => {
    if (file.type.startsWith('audio/')) {
      // Convert audio files to base64
      const base64Data = await fileToBase64(file);
      return {
        fileData: base64Data,
        fileType: file.type,
        fileName: file.name,
        fileSize: file.size
      };
    } else {
      // For non-audio files, use the blob URL
      return {
        fileUrl: URL.createObjectURL(file),
        fileType: file.type,
        fileName: file.name,
        fileSize: file.size
      };
    }
  }));

  return { processedFiles, webhookFiles };
};
