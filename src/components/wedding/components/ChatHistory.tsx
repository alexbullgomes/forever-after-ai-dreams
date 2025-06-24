
import { ChatMessage, ChatMessageComponent } from "./ChatMessage";

interface ChatHistoryProps {
  chatHistory: ChatMessage[];
  playingAudio: string | null;
  onAudioPlay: (audioUrl: string, audioId: string) => void;
}

export const ChatHistory = ({ chatHistory, playingAudio, onAudioPlay }: ChatHistoryProps) => {
  if (chatHistory.length === 0) return null;

  return (
    <div className="max-w-4xl mx-auto mb-6">
      <div className="bg-gray-50 rounded-xl p-4 max-h-80 overflow-y-auto space-y-4">
        {chatHistory.map((chat) => (
          <ChatMessageComponent
            key={chat.id}
            chat={chat}
            playingAudio={playingAudio}
            onAudioPlay={onAudioPlay}
          />
        ))}
      </div>
    </div>
  );
};
