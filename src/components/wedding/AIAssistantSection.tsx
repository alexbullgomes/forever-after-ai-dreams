
import { useState } from "react";
import { Heart } from "lucide-react";
import { AIChatInput } from "@/components/ui/ai-chat-input";
import { useAuth } from "@/contexts/AuthContext";
import { ChatHistory } from "./components/ChatHistory";
import { ChatMessage } from "./components/ChatMessage";
import { processFiles } from "./utils/fileUtils";
import { sendWebhookMessage } from "./utils/webhookService";

const AIAssistantSection = () => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const { user } = useAuth();

  const handleSendMessage = async (message: string, files?: File[]) => {
    let processedFiles: Array<{
      fileUrl: string;
      fileType: string;
      fileName: string;
      fileSize: number;
    }> = [];

    if (files && files.length > 0) {
      const result = await processFiles(files);
      processedFiles = result.processedFiles;
    }

    // Add user message to history
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      message,
      timestamp: new Date().toISOString(),
      isUser: true,
      files: processedFiles.length > 0 ? processedFiles : undefined,
    };
    
    setChatHistory(prev => [...prev, userMessage]);

    try {
      // Send original File objects to webhook for binary transfer
      const result = await sendWebhookMessage(message, user, files);
      
      // Add AI response to history
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        message: result.output || result.message || "Thank you for your message!",
        timestamp: new Date().toISOString(),
        isUser: false,
      };
      
      setChatHistory(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message to history
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        message: "Sorry, I'm having trouble responding right now. Please try again.",
        timestamp: new Date().toISOString(),
        isUser: false,
      };
      
      setChatHistory(prev => [...prev, errorMessage]);
    }
  };

  const handleAudioPlay = (audioUrl: string, audioId: string) => {
    const audio = document.getElementById(audioId) as HTMLAudioElement;
    if (audio) {
      if (playingAudio === audioId) {
        audio.pause();
        setPlayingAudio(null);
      } else {
        // Pause any currently playing audio
        if (playingAudio) {
          const currentAudio = document.getElementById(playingAudio) as HTMLAudioElement;
          if (currentAudio) currentAudio.pause();
        }
        audio.play();
        setPlayingAudio(audioId);
        
        audio.onended = () => setPlayingAudio(null);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Heart className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Assistant Planner
        </h2>
        <p className="text-lg text-gray-600 max-w-4xl mx-auto mb-8">
          Need photo or video services for your family, business, or personal moments?
          Send a quick message, voice note, or image—we'll help you find the right package for your goals and budget.
        </p>
        
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">🎤 Voice note   💬 Ask anything</h3>
          <span className="text-gray-600 italic">
            Get personalized options, plus exclusive deals or a free consultation.
          </span>
        </div>
      </div>
      
      <ChatHistory 
        chatHistory={chatHistory}
        playingAudio={playingAudio}
        onAudioPlay={handleAudioPlay}
      />
      
      {/* AI Chat Input */}
      <div className="max-w-4xl mx-auto">
        <AIChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};

export { AIAssistantSection };
