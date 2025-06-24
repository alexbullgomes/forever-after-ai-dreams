
import { AudioPlayer } from "./AudioPlayer";

export interface ChatMessage {
  id: string;
  message: string;
  timestamp: string;
  isUser: boolean;
  response?: string;
  files?: Array<{
    fileUrl: string;
    fileType: string;
    fileName: string;
    fileSize: number;
  }>;
}

interface ChatMessageProps {
  chat: ChatMessage;
  playingAudio: string | null;
  onAudioPlay: (audioUrl: string, audioId: string) => void;
}

export const ChatMessageComponent = ({ chat, playingAudio, onAudioPlay }: ChatMessageProps) => {
  return (
    <div className={`flex ${chat.isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          chat.isUser
            ? 'bg-rose-500 text-white'
            : 'bg-white border border-gray-200 text-gray-800'
        }`}
      >
        <p className="text-sm">{chat.message}</p>
        
        {/* Display files if present */}
        {chat.files && chat.files.length > 0 && (
          <div className="mt-2 space-y-2">
            {chat.files.map((file, index) => {
              const fileId = `${chat.id}-file-${index}`;
              
              if (file.fileType.startsWith('image/')) {
                return (
                  <div key={index} className="mt-2">
                    <img 
                      src={file.fileUrl} 
                      alt={file.fileName}
                      className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ maxHeight: '200px' }}
                      onClick={() => window.open(file.fileUrl, '_blank')}
                    />
                    <p className={`text-xs mt-1 ${
                      chat.isUser ? 'text-rose-100' : 'text-gray-500'
                    }`}>
                      {file.fileName}
                    </p>
                  </div>
                );
              } else if (file.fileType.startsWith('audio/')) {
                return (
                  <AudioPlayer
                    key={index}
                    fileUrl={file.fileUrl}
                    fileName={file.fileName}
                    fileId={fileId}
                    playingAudio={playingAudio}
                    onPlay={onAudioPlay}
                    isUserMessage={chat.isUser}
                  />
                );
              } else {
                return (
                  <div key={index} className={`text-xs p-2 rounded ${
                    chat.isUser ? 'bg-rose-600' : 'bg-gray-100'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span>📎</span>
                      <span className="truncate">{file.fileName}</span>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        )}
        
        <p className={`text-xs mt-1 ${
          chat.isUser ? 'text-rose-100' : 'text-gray-500'
        }`}>
          {new Date(chat.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};
