
// Process files for chat display only
export const processFiles = async (files: File[]) => {
  // Create object URLs for immediate preview in chat
  const processedFiles = files.map((file) => ({
    fileUrl: URL.createObjectURL(file),
    fileType: file.type,
    fileName: file.name,
    fileSize: file.size
  }));

  return { processedFiles };
};
