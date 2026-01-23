import { useState, useEffect, useRef } from "react";
import { Heart } from "lucide-react";
import { AIChatInput } from "@/components/ui/ai-chat-input";
import { useAuth } from "@/contexts/AuthContext";
import { ChatHistory } from "./components/ChatHistory";
import { ChatMessage } from "./components/ChatMessage";
import { processFiles } from "./utils/fileUtils";
import { sendWebhookMessage } from "./utils/webhookService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CardMessageData } from "@/types/chat";

interface DatabaseMessage {
  id: number;
  conversation_id: string;
  user_id: string | null;
  role: 'user' | 'ai' | 'human';
  type: 'text' | 'audio' | 'card';
  content: string | null;
  audio_url: string | null;
  created_at: string;
}

interface AIAssistantSectionProps {
  showHeader?: boolean;
}

const AIAssistantSection = ({ showHeader = true }: AIAssistantSectionProps) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationMode, setConversationMode] = useState<string>('ai');
  const [isInitializing, setIsInitializing] = useState(false);
  const { user } = useAuth();
  
  // Initialize conversation and load messages
  useEffect(() => {
    if (user) {
      initializeConversation();
    }
  }, [user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMessage = payload.new as any;
          // Type assertion after runtime validation
          if (newMessage.role && ['user', 'ai', 'human'].includes(newMessage.role)) {
            const dbMessage: DatabaseMessage = newMessage as DatabaseMessage;
            if (dbMessage.role !== 'user') { // Only add non-user messages from realtime
              addMessageToUI(dbMessage);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const initializeConversation = async () => {
    if (!user || isInitializing) return;
    
    setIsInitializing(true);
    
    try {
      // First, try to find existing conversation
      const { data: existingConversation, error: selectError } = await supabase
        .from('conversations')
        .select('id, mode')
        .eq('customer_id', user.id)
        .single();

      let conversationId: string;

      if (existingConversation && !selectError) {
        // Use existing conversation
        conversationId = existingConversation.id;
        setConversationMode(existingConversation.mode || 'ai');
        console.log('Found existing conversation:', conversationId, 'mode:', existingConversation.mode);
      } else {
        // Create new conversation only if none exists
        const { data: newConversation, error: insertError } = await supabase
          .from('conversations')
          .insert({
            customer_id: user.id,
            mode: 'ai',
            user_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            user_email: user.email
          })
          .select('id, mode')
          .single();

        if (insertError) {
          console.error('Error creating conversation:', insertError);
          toast.error('Failed to initialize chat');
          return;
        }

        conversationId = newConversation.id;
        setConversationMode(newConversation.mode || 'ai');
        console.log('Created new conversation:', conversationId, 'mode:', newConversation.mode);
      }

      setConversationId(conversationId);
      await loadMessages(conversationId);
    } catch (error) {
      console.error('Error initializing conversation:', error);
      toast.error('Failed to initialize chat');
    } finally {
      setIsInitializing(false);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const { data: dbMessages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      const chatMessages: ChatMessage[] = [];

      // Add initial AI greeting if no messages exist
      if (!dbMessages || dbMessages.length === 0) {
        chatMessages.push({
          id: '0',
          message: "Hi there! I'm EVA. You don't need to have it all figured out. Just share what you're thinking — a voice note 🎤, a message 💬, anything. I'm here to help shape your ideas into something beautiful. ✨",
          timestamp: new Date().toISOString(),
          isUser: false,
        });
      } else {
        // Convert database messages to UI format
        dbMessages.forEach(msg => {
          // Type assertion with validation
          if (msg.role && ['user', 'ai', 'human'].includes(msg.role)) {
            chatMessages.push(convertDBMessageToUI(msg as DatabaseMessage));
          }
        });
      }

      setChatHistory(chatMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const convertDBMessageToUI = (dbMessage: DatabaseMessage): ChatMessage => {
    const files: Array<{ fileUrl: string; fileType: string; fileName: string; fileSize: number; }> = [];
    
    if (dbMessage.audio_url) {
      files.push({
        fileUrl: dbMessage.audio_url,
        fileType: 'audio/webm',
        fileName: 'voice-message.webm',
        fileSize: 0
      });
    }

    // Parse card data if message type is 'card'
    let cardData: CardMessageData | undefined;
    if (dbMessage.type === 'card' && dbMessage.content) {
      try {
        cardData = JSON.parse(dbMessage.content);
      } catch (e) {
        console.error('Failed to parse card data:', e);
      }
    }

    return {
      id: dbMessage.id.toString(),
      message: dbMessage.content || (dbMessage.type === 'card' ? '' : 'Audio message'),
      timestamp: dbMessage.created_at,
      isUser: dbMessage.role === 'user',
      type: dbMessage.type,
      cardData,
      files: files.length > 0 ? files : undefined
    };
  };

  const addMessageToUI = (dbMessage: DatabaseMessage) => {
    const chatMessage = convertDBMessageToUI(dbMessage);
    setChatHistory(prev => [...prev, chatMessage]);
  };

  const uploadAudioFile = async (file: File, convId: string): Promise<string | null> => {
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}.webm`;
      const filePath = `${convId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-audios')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading audio:', uploadError);
        return null;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('chat-audios')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading audio file:', error);
      return null;
    }
  };

  const handleSendMessage = async (message: string, files?: File[]) => {
    if (!conversationId || !user) return;

    try {
      let audioUrl: string | null = null;
      
      // Handle audio files
      const audioFiles = files?.filter(file => file.type.startsWith('audio/')) || [];
      if (audioFiles.length > 0) {
        // Upload the first audio file (for simplicity, we handle one audio at a time)
        audioUrl = await uploadAudioFile(audioFiles[0], conversationId);
        if (!audioUrl) {
          toast.error('Failed to upload audio file');
          return;
        }
      }

      // Process files to create URLs for preview (optimistic UI)
      const processedFiles = files?.map(file => ({
        fileUrl: URL.createObjectURL(file),
        fileType: file.type,
        fileName: file.name,
        fileSize: file.size,
      })) || [];

      // Add user message to UI immediately (optimistic UI)
      const tempUserMessage: ChatMessage = {
        id: Date.now().toString(), // Temporary ID
        message: message || (audioUrl ? "Audio message" : "Message"),
        timestamp: new Date().toISOString(),
        isUser: true,
        files: processedFiles.length > 0 ? processedFiles : undefined,
      };

      setChatHistory((prev) => [...prev, tempUserMessage]);

      // Insert message into database
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          user_id: user.id,
          role: 'user',
          type: audioUrl ? 'audio' : 'text',
          content: message || null,
          audio_url: audioUrl,
          user_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          user_email: user.email
        });

      if (insertError) {
        console.error('Error inserting message:', insertError);
        toast.error('Failed to send message');
        // Remove the optimistic message
        setChatHistory(prev => prev.filter(msg => msg.id !== tempUserMessage.id));
        return;
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
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
  
  if (isInitializing) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
        <div className="text-center">
          <Heart className="w-12 h-12 text-brand-primary-from animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Initializing your assistant...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={showHeader ? "bg-white rounded-2xl shadow-xl p-8 mb-16" : ""}>
      {showHeader && (
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-gradient rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Assistant Planner</h2>
          <p className="text-lg text-muted-foreground max-w-4xl mx-auto">Need photo or video services for your family, business, or personal moments? Send a quick message, voice note—we'll help you find the right package for your goals and budget.</p>
        </div>
      )}
      
      <ChatHistory chatHistory={chatHistory} playingAudio={playingAudio} onAudioPlay={handleAudioPlay} />
      
      {/* AI Chat Input */}
      <div className="max-w-4xl mx-auto">
        <AIChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};

export { AIAssistantSection };