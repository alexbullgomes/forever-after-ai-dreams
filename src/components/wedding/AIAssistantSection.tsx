
import { useState } from "react";
import { Heart } from "lucide-react";
import { AIChatInput } from "@/components/ui/ai-chat-input";
import { useAuth } from "@/contexts/AuthContext";

interface ChatMessage {
  id: string;
  message: string;
  timestamp: string;
  isUser: boolean;
  response?: string;
  files?: Array<{
    name: string;
    type: string;
    size: number;
  }>;
}

const AIAssistantSection = () => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const { user } = useAuth();

  const handleSendMessage = async (message: string, files?: File[]) => {
    // Add user message to history
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      message,
      timestamp: new Date().toISOString(),
      isUser: true,
      files: files?.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size,
      })),
    };
    
    setChatHistory(prev => [...prev, userMessage]);

    try {
      // Create FormData to handle files
      const formData = new FormData();
      
      const webhookData = {
        message: message,
        timestamp: new Date().toISOString(),
        userId: user?.id || null,
        userEmail: user?.email || null,
        userName: user?.user_metadata?.full_name || user?.email || "Anonymous",
        source: "Dream Weddings AI Assistant",
        fileCount: files?.length || 0,
      };

      // Add text data as JSON string
      formData.append('data', JSON.stringify(webhookData));

      // Add files
      if (files && files.length > 0) {
        files.forEach((file, index) => {
          formData.append(`file_${index}`, file);
        });
      }

      console.log('Sending AI Assistant webhook data:', {
        ...webhookData,
        files: files?.map(f => ({ name: f.name, type: f.type, size: f.size })) || [],
      });

      const response = await fetch('https://automation.agcreationmkt.com/webhook/79834679-8b0e-4dfb-9fbe-408593849da1', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Add AI response to history
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          message: result.output || result.message || "Thank you for your message and files!",
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
                  {chat.message && (
                    <p className="text-sm mb-1">{chat.message}</p>
                  )}
                  
                  {chat.files && chat.files.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {chat.files.map((file, index) => (
                        <div key={index} className={`text-xs ${
                          chat.isUser ? 'text-rose-100' : 'text-gray-600'
                        } flex items-center gap-1`}>
                          <span>📎</span>
                          <span className="truncate">{file.name}</span>
                          <span>({(file.size / 1024 / 1024).toFixed(1)}MB)</span>
                        </div>
                      ))}
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
