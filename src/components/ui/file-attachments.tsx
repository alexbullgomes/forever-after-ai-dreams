
import { Image, Mic } from "lucide-react";

interface FileAttachmentsProps {
  files: File[];
  onRemoveFile: (index: number) => void;
}

export const FileAttachments = ({ files, onRemoveFile }: FileAttachmentsProps) => {
  if (files.length === 0) return null;

  return (
    <div className="px-4 py-2 border-b border-gray-100">
      <div className="flex flex-wrap gap-2">
        {files.map((file, index) => (
          <div key={index} className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1 text-sm">
            {file.type.startsWith('image/') ? (
              <Image size={16} className="text-gray-600" />
            ) : (
              <Mic size={16} className="text-gray-600" />
            )}
            <span className="truncate max-w-[150px]">{file.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFile(index);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
