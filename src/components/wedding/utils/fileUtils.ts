
// Process files for chat display
export const processFiles = (files: File[]) => {
  // Create object URLs for immediate preview in chat
  const processedFiles = files.map((file) => ({
    fileUrl: URL.createObjectURL(file),
    fileType: file.type,
    fileName: file.name,
    fileSize: file.size
  }));

  // Return original files for webhook (will be sent as binary via FormData)
  return { processedFiles, originalFiles: files };
};
