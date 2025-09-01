"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { Send, Bot, Paperclip, Mic, CornerDownLeft, Play, Pause, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat-bubble";
import { ChatInput } from "@/components/ui/chat-input";
import {
  ExpandableChat,
  ExpandableChatHeader,
  ExpandableChatBody,
  ExpandableChatFooter,
} from "@/components/ui/expandable-chat";
import { ChatMessageList } from "@/components/ui/chat-message-list";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AudioPlayer } from "@/components/wedding/components/AudioPlayer";
import { toast } from "sonner";

interface DatabaseMessage {
  id: number;
  conversation_id: string;
  user_id: string | null;
  role: 'user' | 'ai' | 'human';
  type: 'text' | 'audio';
  content: string | null;
  audio_url: string | null;
  created_at: string;
}

interface ChatMessage {
  id: number;
  content: string;
  sender: "user" | "ai";
  timestamp: string;
  files?: Array<{
    fileUrl: string;
    fileType: string;
    fileName: string;
    fileSize: number;
  }>;
}

interface ExpandableChatAssistantProps {
  autoOpen?: boolean;
}

export function ExpandableChatAssistant({ autoOpen = false }: ExpandableChatAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationMode, setConversationMode] = useState<string>('ai');
  const [isInitializing, setIsInitializing] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
          id: 0,
          content: "Hi there! I'm EVA. You don't need to have it all figured out. Just share what you're thinking — a voice note 🎤, a message 💬, anything. I'm here to help shape your ideas into something beautiful. ✨",
          sender: "ai",
          timestamp: new Date().toISOString(),
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

      setMessages(chatMessages);
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

    return {
      id: dbMessage.id,
      content: dbMessage.content || 'Audio message',
      sender: dbMessage.role === 'user' ? 'user' : 'ai',
      timestamp: dbMessage.created_at,
      files: files.length > 0 ? files : undefined
    };
  };

  const addMessageToUI = (dbMessage: DatabaseMessage) => {
    const chatMessage = convertDBMessageToUI(dbMessage);
    setMessages(prev => [...prev, chatMessage]);
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() && selectedFiles.length === 0) return;
    if (!conversationId || !user) return;

    try {
      let audioUrl: string | null = null;
      
      // Handle audio files
      const audioFiles = selectedFiles.filter(file => file.type.startsWith('audio/'));
      if (audioFiles.length > 0) {
        // Upload the first audio file (for simplicity, we handle one audio at a time)
        audioUrl = await uploadAudioFile(audioFiles[0], conversationId);
        if (!audioUrl) {
          toast.error('Failed to upload audio file');
          return;
        }
      }

      // Process files to create URLs for preview (optimistic UI)
      const processedFiles = selectedFiles.map(file => ({
        fileUrl: URL.createObjectURL(file),
        fileType: file.type,
        fileName: file.name,
        fileSize: file.size,
      }));

      // Add user message to UI immediately (optimistic UI)
      const tempUserMessage: ChatMessage = {
        id: Date.now(), // Temporary ID
        content: input || (audioUrl ? "Audio message" : "Message"),
        sender: "user",
        timestamp: new Date().toISOString(),
        files: processedFiles.length > 0 ? processedFiles : undefined,
      };

      setMessages((prev) => [...prev, tempUserMessage]);
      setInput("");
      setSelectedFiles([]);
      setIsLoading(true);

      // Insert message into database
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          user_id: user.id,
          role: 'user',
          type: audioUrl ? 'audio' : 'text',
          content: input || null,
          audio_url: audioUrl,
          user_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          user_email: user.email
        });

      if (insertError) {
        console.error('Error inserting message:', insertError);
        toast.error('Failed to send message');
        // Remove the optimistic message
        setMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id));
        return;
      }

      setIsLoading(false);

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setIsLoading(false);
    }
  };

  const handleAttachFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,audio/*,.heic,.heif'; // Include HEIC/HEIF for iPhone photos
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      const maxImageSize = 5 * 1024 * 1024; // 5MB for images
      const allowedExtensions = ['.heic', '.heif'];
      
      const validFiles = files.filter(file => {
        // Check file type or extension for HEIC/HEIF support
        const isValidType = file.type.startsWith('image/') || file.type.startsWith('audio/');
        const isValidExtension = allowedExtensions.some(ext => 
          file.name.toLowerCase().endsWith(ext)
        );
        
        if (!isValidType && !isValidExtension) {
          console.warn(`File ${file.name} rejected: unsupported type ${file.type}`);
          return false;
        }
        
        // Check if file is an image (including HEIC/HEIF)
        const isImageFile = file.type.startsWith('image/') || 
          allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
        
        // Check image file size (5MB limit for images)
        if (isImageFile && file.size > maxImageSize) {
          console.warn(`Image file ${file.name} exceeds 5MB limit (${Math.round(file.size / 1024 / 1024)}MB)`);
          return false;
        }
        
        console.log(`File ${file.name} accepted: type=${file.type}, size=${Math.round(file.size / 1024)}KB`);
        return true;
      });
      
      setSelectedFiles(prev => [...prev, ...validFiles]);
    };
    input.click();
  };

  const handleMicrophoneClick = async () => {
    if (isRecording && mediaRecorder) {
      // Stop recording
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const newMediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      newMediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      newMediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        setSelectedFiles(prev => [...prev, audioFile]);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setMediaRecorder(null);
      };

      // Start recording
      newMediaRecorder.start();
      setIsRecording(true);
      setMediaRecorder(newMediaRecorder);
      
      // Auto-stop after 3 minutes
      setTimeout(() => {
        if (newMediaRecorder.state === 'recording') {
          newMediaRecorder.stop();
        }
      }, 180000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setIsRecording(false);
      setMediaRecorder(null);
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
    <ExpandableChat
      size="lg"
      position="bottom-right"
      icon={<Bot className="h-6 w-6" />}
      className="border-0 shadow-2xl bg-transparent"
      autoOpen={autoOpen}
    >
      <ExpandableChatHeader className="flex-col text-center justify-center bg-gradient-to-r from-rose-500 to-pink-500 text-white border-0">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-white">EVA Assistant Planner</h1>
        <p className="text-sm text-rose-100">
          Get personalized photo & video package recommendations
        </p>
      </ExpandableChatHeader>

      <ExpandableChatBody className="bg-gradient-to-br from-rose-50 to-pink-50 p-4">
        <ChatMessageList className="h-full">
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              variant={message.sender === "user" ? "sent" : "received"}
            >
              <ChatBubbleAvatar
                className="h-8 w-8 shrink-0 border-2 border-white shadow-md"
                src={
                  message.sender === "user"
                    ? user?.user_metadata?.avatar_url || undefined
                    : undefined
                }
                fallback={message.sender === "user" ? "You" : "AI"}
              />
               <ChatBubbleMessage
                variant={message.sender === "user" ? "sent" : "received"}
                className={message.sender === "user" 
                  ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg" 
                  : "bg-white text-gray-800 border border-rose-100 shadow-md"
                }
              >
                <div className="space-y-2">
                  {message.content}
                  
                   {/* File previews */}
                   {message.files && message.files.map((file, fileIndex) => (
                     <div key={fileIndex} className={`mt-2 ${file.fileType.startsWith('audio/') ? 'w-full' : ''}`}>
                       {(file.fileType.startsWith('image/') || file.fileName.toLowerCase().endsWith('.heic') || file.fileName.toLowerCase().endsWith('.heif')) ? (
                         <img 
                           src={file.fileUrl} 
                           alt={file.fileName}
                           className="max-w-48 max-h-32 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                           onClick={() => window.open(file.fileUrl, '_blank')}
                         />
                       ) : file.fileType.startsWith('audio/') ? (
                         <AudioPlayer
                           fileUrl={file.fileUrl}
                           fileName={file.fileName}
                           fileId={`audio-${message.id}-${fileIndex}`}
                           playingAudio={playingAudio}
                           onPlay={handleAudioPlay}
                           isUserMessage={message.sender === "user"}
                         />
                       ) : null}
                     </div>
                   ))}
                </div>
              </ChatBubbleMessage>
            </ChatBubble>
          ))}

          {isLoading && (
            <ChatBubble variant="received">
              <ChatBubbleAvatar
                className="h-8 w-8 shrink-0 border-2 border-white shadow-md"
                fallback="AI"
              />
              <ChatBubbleMessage 
                isLoading 
                className="bg-white text-gray-800 border border-rose-100 shadow-md"
              />
            </ChatBubble>
          )}
        </ChatMessageList>
      </ExpandableChatBody>

      <ExpandableChatFooter className="bg-white border-t border-rose-100 p-4">
        {selectedFiles.length > 0 && (
          <div className="mb-2">
            <div className="flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-gradient-to-r from-rose-100 to-pink-100 border border-rose-200 rounded-lg px-3 py-1 shadow-sm">
                  {file.type.startsWith('audio/') ? (
                    <div className="flex items-center gap-2">
                      <Mic className="size-3 text-rose-600" />
                      <span className="text-sm text-rose-700 truncate max-w-32">{file.name}</span>
                    </div>
                  ) : (file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) ? (
                    <div className="flex items-center gap-2">
                      <Image className="size-3 text-rose-600" />
                      <span className="text-sm text-rose-700 truncate max-w-32">{file.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-rose-700 truncate max-w-32">{file.name}</span>
                  )}
                  <button
                    onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                    className="text-rose-400 hover:text-rose-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {isRecording && (
          <div className="mb-2 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-red-700 font-medium">Recording... (click mic to stop)</span>
          </div>
        )}
        
        <form
          onSubmit={handleSubmit}
          className="relative rounded-xl border border-rose-200 bg-white focus-within:ring-2 focus-within:ring-rose-500 focus-within:border-rose-500 p-1 shadow-md"
        >
          <ChatInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as any);
              }
            }}
            placeholder="Tell me about your photo/video needs..."
            className="min-h-12 resize-none rounded-xl bg-white border-0 p-3 shadow-none focus-visible:ring-0 placeholder:text-rose-400"
          />
          <div className="flex items-center p-3 pt-0 justify-between">
            <div className="flex">
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={handleMicrophoneClick}
                className={`${isRecording 
                  ? 'text-red-500 hover:text-red-600 hover:bg-red-50 bg-red-50' 
                  : 'text-rose-500 hover:text-rose-600 hover:bg-rose-50'
                }`}
              >
                <Mic className={`size-4 ${isRecording ? 'animate-pulse' : ''}`} />
              </Button>
            </div>
            <Button 
              type="submit" 
              size="sm" 
              className="ml-auto gap-1.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg transition-all duration-200"
              disabled={isLoading || (!input.trim() && selectedFiles.length === 0)}
            >
              Send Message
              <CornerDownLeft className="size-3.5" />
            </Button>
          </div>
        </form>
      </ExpandableChatFooter>
    </ExpandableChat>
  );
}