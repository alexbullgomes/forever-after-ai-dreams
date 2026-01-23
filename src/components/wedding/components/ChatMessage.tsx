
import { AudioPlayer } from "./AudioPlayer";
import { ChatCardMessage } from "@/components/chat/ChatCardMessage";
import { CardMessageData } from "@/types/chat";

export interface ChatMessage {
  id: string;
  message: string;
  timestamp: string;
  isUser: boolean;
  response?: string;
  type?: 'text' | 'audio' | 'card';
  cardData?: CardMessageData;
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
  onBookProduct?: (data: CardMessageData) => void;
}

export const ChatMessageComponent = ({ chat, playingAudio, onAudioPlay, onBookProduct }: ChatMessageProps) => {
  return (
    <div className={`flex ${chat.isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs lg:max-w-md ${chat.type !== 'card' ? 'px-4 py-2' : 'p-2'} rounded-lg ${
          chat.isUser
            ? 'bg-brand-primary-from text-white'
            : 'bg-card border border-border text-foreground'
        }`}
      >
        {/* Render card message if type is 'card' */}
        {chat.type === 'card' && chat.cardData ? (
          <ChatCardMessage 
            data={chat.cardData} 
            variant={chat.isUser ? 'sent' : 'received'}
            onBookProduct={onBookProduct}
          />
        ) : (
          <p className="text-sm">{chat.message}</p>
        )}
        
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
                      chat.isUser ? 'text-white/70' : 'text-muted-foreground'
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
                    chat.isUser ? 'bg-brand-primary-hover-from' : 'bg-muted'
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
          chat.isUser ? 'text-white/70' : 'text-muted-foreground'
        }`}>
          {new Date(chat.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};
