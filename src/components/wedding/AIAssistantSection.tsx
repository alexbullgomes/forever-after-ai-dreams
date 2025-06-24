import { useState } from "react";
import { Heart, Play, Pause } from "lucide-react";
import { AIChatInput } from "@/components/ui/ai-chat-input";
import { useAuth } from "@/contexts/AuthContext";

interface ChatMessage {
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

interface WebhookPayload {
  message: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  userName: string;
  source: string;
  files?: Array<{
    fileUrl?: string;
    fileData?: string; // Base64 encoded file data
    fileType: string;
    fileName: string;
    fileSize: number;
  }>;
}

const AIAssistantSection = () => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const { user } = useAuth();

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
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

  const handleSendMessage = async (message: string, files?: File[]) => {
    // Process files if any
    let processedFiles: Array<{
      fileUrl: string;
      fileType: string;
      fileName: string;
      fileSize: number;
    }> = [];

    let webhookFiles: Array<{
      fileUrl?: string;
      fileData?: string;
      fileType: string;
      fileName: string;
      fileSize: number;
    }> = [];

    if (files && files.length > 0) {
      // Create object URLs for immediate preview in chat
      processedFiles = files.map((file) => ({
        fileUrl: URL.createObjectURL(file),
        fileType: file.type,
        fileName: file.name,
        fileSize: file.size
      }));

      // Convert files to base64 for webhook (for audio files) or use URL for others
      webhookFiles = await Promise.all(files.map(async (file) => {
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
      const webhookPayload: WebhookPayload = {
        message: message,
        timestamp: new Date().toISOString(),
        userId: user?.id || "",
        userEmail: user?.email || "",
        userName: user?.user_metadata?.full_name || user?.email || "Anonymous",
        source: "Dream Weddings AI Assistant"
      };

      // Add files to payload if present
      if (webhookFiles.length > 0) {
        webhookPayload.files = webhookFiles;
      }

      console.log('Sending AI Assistant webhook data:', webhookPayload);

      const response = await fetch('https://automation.agcreationmkt.com/webhook/79834679-8b0e-4dfb-9fbe-408593849da1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Add AI response to history
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          message: result.output || result.message || "Thank you for your message!",
          timestamp: new Date().toISOString(),
          isUser: false,
        };
        
        setChatHistory(prev => [...prev, aiMessage]);
      }
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
          Assistant Wedding Planner
        </h2>
        <p className="text-lg text-gray-600 max-w-4xl mx-auto mb-8">
          Let us help you plan your dream day. Tell us about yourself and share any ideas you have in mind. Feel free to 
          send voice notes or files to help us better understand your needs. Together, we'll find the perfect wedding 
          package for you.
        </p>
        
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Talk to me!</h3>
          <span className="text-gray-600 italic">
            I've got answers, plans, good vibes, and maybe a hidden offer, ask me :)
          </span>
        </div>
      </div>
      
      {/* Chat History */}
      {chatHistory.length > 0 && (
        <div className="max-w-4xl mx-auto mb-6">
          <div className="bg-gray-50 rounded-xl p-4 max-h-80 overflow-y-auto space-y-4">
            {chatHistory.map((chat) => (
              <div
                key={chat.id}
                className={`flex ${chat.isUser ? 'justify-end' : 'justify-start'}`}
              >
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
                            <div key={index} className={`flex items-center gap-2 p-2 rounded ${
                              chat.isUser ? 'bg-rose-600' : 'bg-gray-100'
                            }`}>
                              <button
                                onClick={() => handleAudioPlay(file.fileUrl, fileId)}
                                className={`p-1 rounded-full hover:bg-opacity-80 transition ${
                                  chat.isUser ? 'hover:bg-rose-700' : 'hover:bg-gray-200'
                                }`}
                              >
                                {playingAudio === fileId ? (
                                  <Pause size={16} className={chat.isUser ? 'text-white' : 'text-gray-700'} />
                                ) : (
                                  <Play size={16} className={chat.isUser ? 'text-white' : 'text-gray-700'} />
                                )}
                              </button>
                              <div className="flex-1">
                                <p className={`text-xs ${
                                  chat.isUser ? 'text-rose-100' : 'text-gray-600'
                                }`}>
                                  {file.fileName}
                                </p>
                                <audio 
                                  id={fileId}
                                  src={file.fileUrl}
                                  className="hidden"
                                />
                              </div>
                            </div>
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
            ))}
          </div>
        </div>
      )}
      
      {/* AI Chat Input */}
      <div className="max-w-4xl mx-auto">
        <AIChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};

export { AIAssistantSection };
