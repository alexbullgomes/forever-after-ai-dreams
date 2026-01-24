"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Bot, Send, Mic, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatInput } from "@/components/ui/chat-input";
import { VoiceInput } from "@/components/ui/voice-input";
import { ChatMessageList } from "@/components/ui/chat-message-list";
import { 
  ChatBubble, 
  ChatBubbleAvatar, 
  ChatBubbleMessage 
} from "@/components/ui/chat-bubble";
import {
  ExpandableChat,
  ExpandableChatHeader,
  ExpandableChatBody,
  ExpandableChatFooter,
} from "@/components/ui/expandable-chat";
import { useToast } from "@/components/ui/use-toast";
import { useAutoOpenChat } from "@/hooks/useAutoOpenChat";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/AuthModal";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateVisitorId, trackVisitorEvent } from "@/utils/visitor";

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  fileUrl?: string;
  fileType?: string;
  fileName?: string;
}

interface ExpandableChatWebhookProps {
  autoOpen?: boolean;
  onOpenLogin?: () => void;
  onOpenChange?: (isOpen: boolean) => void;
}

const SUPABASE_URL = "https://hmdnronxajctsrlgrhey.supabase.co";

const ExpandableChatWebhook: React.FC<ExpandableChatWebhookProps> = ({
  autoOpen = false,
  onOpenLogin,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const shouldAutoOpen = useAutoOpenChat({ 
    sessionKey: 'everafter-chat-auto-opened-visitor',
    enabled: true 
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [visitorId, setVisitorId] = useState<string>("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationMode, setConversationMode] = useState<'ai' | 'human'>('ai');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Convert database message to UI message
  const convertDbMessage = (dbMsg: any): ChatMessage => ({
    id: dbMsg.id?.toString() || generateId(),
    content: dbMsg.content || '',
    sender: dbMsg.role === 'user' ? 'user' : 'assistant',
    timestamp: new Date(dbMsg.created_at),
    fileUrl: dbMsg.audio_url || undefined,
    fileType: dbMsg.audio_url ? 'audio/webm' : undefined,
    fileName: dbMsg.audio_url ? 'voice-message.webm' : undefined,
  });

  // Subscribe to real-time messages
  const subscribeToMessages = useCallback((convId: string) => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    console.log('[VisitorChat] Subscribing to messages for conversation:', convId);
    
    const channel = supabase
      .channel(`visitor-messages-${convId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${convId}`
        },
        (payload) => {
          console.log('[VisitorChat] Received new message:', payload.new);
          const newMsg = payload.new as any;
          
          // Only add messages from non-user (AI or human admin)
          if (newMsg.role !== 'user') {
            setMessages(prev => {
              // Check if message already exists
              if (prev.some(m => m.id === newMsg.id?.toString())) {
                return prev;
              }
              return [...prev, convertDbMessage(newMsg)];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${convId}`
        },
        (payload) => {
          console.log('[VisitorChat] Conversation updated:', payload.new);
          const updated = payload.new as any;
          if (updated.mode) {
            setConversationMode(updated.mode as 'ai' | 'human');
          }
        }
      )
      .subscribe((status) => {
        console.log('[VisitorChat] Subscription status:', status);
      });

    subscriptionRef.current = channel;
  }, []);

  // Initialize visitor chat
  useEffect(() => {
    const initVisitorChat = async () => {
      const storedVisitorId = getOrCreateVisitorId();
      setVisitorId(storedVisitorId);

      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/visitor-chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'get_conversation',
            visitor_id: storedVisitorId
          })
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.conversation_id) {
            setConversationId(data.conversation_id);
            setConversationMode(data.mode || 'ai');
            
            // Convert and set existing messages
            if (data.messages && data.messages.length > 0) {
              const convertedMessages = data.messages.map(convertDbMessage);
              setMessages(convertedMessages);
            }
            
            // Subscribe to real-time updates
            subscribeToMessages(data.conversation_id);
          } else {
            // No existing conversation, show intro message
            const introMessage: ChatMessage = {
              id: generateId(),
              content: "intro-with-login",
              sender: 'assistant',
              timestamp: new Date(),
            };
            setMessages([introMessage]);
          }
        }
      } catch (error) {
        console.error('[VisitorChat] Error initializing:', error);
        // Show intro message on error
        const introMessage: ChatMessage = {
          id: generateId(),
          content: "intro-with-login",
          sender: 'assistant',
          timestamp: new Date(),
        };
        setMessages([introMessage]);
      }

      setIsInitialized(true);
    };

    initVisitorChat();

    // Cleanup subscription on unmount
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [subscribeToMessages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!userInput.trim() || isLoading) return;

    const messageContent = userInput.trim();
    
    const userMessage: ChatMessage = {
      id: generateId(),
      content: messageContent,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setUserInput("");
    setIsLoading(true);

    try {
      // Track chat message event
      trackVisitorEvent('chat_message', 'visitor_chat', {
        message_length: messageContent.length,
        has_conversation: !!conversationId,
      });
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/visitor-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_message',
          visitor_id: visitorId,
          content: messageContent,
          type: 'text'
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Set conversation ID if this was first message
        if (data.conversation_id && !conversationId) {
          setConversationId(data.conversation_id);
          subscribeToMessages(data.conversation_id);
        }

        // If AI mode and we got an immediate response, add it
        // (realtime will handle human mode responses)
        if (data.ai_response && data.mode !== 'human') {
          const assistantMessage: ChatMessage = {
            id: data.ai_message_id?.toString() || generateId(),
            content: data.ai_response,
            sender: 'assistant',
            timestamp: new Date(),
          };
          setMessages(prev => {
            // Avoid duplicates if realtime already added it
            if (prev.some(m => m.id === assistantMessage.id)) {
              return prev;
            }
            return [...prev, assistantMessage];
          });
        }
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error("[VisitorChat] Error sending message:", error);
      const errorMessage: ChatMessage = {
        id: generateId(),
        content: "We couldn't reach the assistant. Please try again.",
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  const handleVoiceStart = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm; codecs=opus" });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm; codecs=opus' });
        const localAudioUrl = URL.createObjectURL(audioBlob);
        
        // Add user voice message to UI immediately with local URL
        const tempMessageId = generateId();
        const userMessage: ChatMessage = {
          id: tempMessageId,
          content: "Voice message",
          sender: 'user',
          timestamp: new Date(),
          fileUrl: localAudioUrl,
          fileType: "audio/webm; codecs=opus",
          fileName: "voice-message.webm",
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
          // Convert audio blob to base64 for upload
          const reader = new FileReader();
          
          reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            
            // Send audio data to edge function for upload
            const response = await fetch(`${SUPABASE_URL}/functions/v1/visitor-chat`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'send_message',
                visitor_id: visitorId,
                content: 'Voice message',
                type: 'audio',
                audio_data: base64Audio
              })
            });

            if (response.ok) {
              const data = await response.json();
              
              if (data.conversation_id && !conversationId) {
                setConversationId(data.conversation_id);
                subscribeToMessages(data.conversation_id);
              }

              // Update the message with the real storage URL if available
              if (data.audio_url) {
                setMessages(prev => prev.map(msg => 
                  msg.id === tempMessageId 
                    ? { ...msg, fileUrl: data.audio_url }
                    : msg
                ));
              }

              if (data.ai_response) {
                const assistantMessage: ChatMessage = {
                  id: data.ai_message_id?.toString() || generateId(),
                  content: data.ai_response,
                  sender: 'assistant',
                  timestamp: new Date(),
                };
                setMessages(prev => {
                  if (prev.some(m => m.id === assistantMessage.id)) {
                    return prev;
                  }
                  return [...prev, assistantMessage];
                });
              }
            } else {
              throw new Error('Failed to send voice message');
            }
            
            setIsLoading(false);
          };
          
          reader.onerror = () => {
            console.error("[VisitorChat] Error reading audio blob");
            const errorMessage: ChatMessage = {
              id: generateId(),
              content: "Failed to process voice message. Please try again.",
              sender: 'assistant',
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
            setIsLoading(false);
          };
          
          // Start reading the blob as base64
          reader.readAsDataURL(audioBlob);
          
        } catch (error) {
          console.error("[VisitorChat] Error sending voice message:", error);
          const errorMessage: ChatMessage = {
            id: generateId(),
            content: "We couldn't reach the assistant. Please try again.",
            sender: 'assistant',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorMessage]);
          setIsLoading(false);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error("[VisitorChat] Error starting voice recording:", error);
      toast({
        title: "Error",
        description: "Unable to access microphone",
        variant: "destructive",
      });
    }
  };

  const handleVoiceStop = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const playAudio = (url: string, messageId: string) => {
    if (playingAudio === messageId) {
      audioRef.current?.pause();
      setPlayingAudio(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setPlayingAudio(messageId);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.sender === 'user';
    
    // Special intro message
    if (message.content === "intro-with-login") {
      return (
        <ChatBubble key={message.id} variant="received">
          <ChatBubbleAvatar fallback="EVA" />
          <ChatBubbleMessage variant="received">
            <p>Hi, I'm Eva 👋 How can I help you today? For the full experience — with portfolio, offers, and pricing — log in anytime.</p>
          </ChatBubbleMessage>
        </ChatBubble>
      );
    }
    
    return (
      <ChatBubble key={message.id} variant={isUser ? "sent" : "received"}>
        {!isUser && (
          <ChatBubbleAvatar fallback="EVA" />
        )}
        <ChatBubbleMessage variant={isUser ? "sent" : "received"}>
          {message.fileType?.startsWith('audio/') ? (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => playAudio(message.fileUrl!, message.id)}
                className="p-1 h-8 w-8"
              >
                {playingAudio === message.id ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <span className="text-sm">Voice message</span>
            </div>
          ) : message.fileType?.startsWith('image/') ? (
            <div className="space-y-2">
              <img 
                src={message.fileUrl} 
                alt={message.fileName}
                className="max-w-xs rounded-lg"
              />
              {message.content && <p>{message.content}</p>}
            </div>
          ) : (
            <p>{message.content}</p>
          )}
        </ChatBubbleMessage>
      </ChatBubble>
    );
  };

  return (
    <>
      <ExpandableChat 
        size="md" 
        position="bottom-right"
        autoOpen={autoOpen || shouldAutoOpen}
        onOpenChange={onOpenChange}
        icon={<Bot className="h-6 w-6" />}
      >
        <ExpandableChatHeader className="bg-brand-gradient text-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">EVA Assistant</h3>
                <p className="text-xs opacity-90">
                  {conversationMode === 'human' ? 'Connected with support' : 'Here to help with your questions'}
                </p>
              </div>
            </div>
            {!user && (
              <Button
                onClick={() => setShowAuthModal(true)}
                className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/20"
                role="button"
                aria-label="Log in for full experience"
              >
                Log in for Full Experience
              </Button>
            )}
          </div>
        </ExpandableChatHeader>

        <ExpandableChatBody>
          <ChatMessageList>
            {messages.map(renderMessage)}
            {isLoading && (
              <ChatBubble variant="received">
                <ChatBubbleAvatar fallback="EVA" />
                <ChatBubbleMessage variant="received" isLoading />
              </ChatBubble>
            )}
          </ChatMessageList>
        </ExpandableChatBody>

        <ExpandableChatFooter>
          <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 rounded-full bg-background border border-input">
            <VoiceInput
              onStart={() => {
                handleVoiceStart();
              }}
              onStop={handleVoiceStop}
              className="text-brand-primary-from hover:text-brand-primary-hover-from"
            />
            
            <div className="flex-1 relative">
              <ChatInput
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tell me about your photo/video needs..."
                disabled={isLoading}
                className="border-0 bg-transparent focus-visible:ring-0 resize-none h-auto py-2 px-0"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !userInput.trim()}
              className="bg-brand-gradient hover:bg-brand-gradient-hover text-white px-4 py-2 rounded-full flex items-center gap-1"
            >
              Send Message
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </ExpandableChatFooter>
      </ExpandableChat>

      <audio ref={audioRef} onEnded={() => setPlayingAudio(null)} />

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
};

export default ExpandableChatWebhook;
