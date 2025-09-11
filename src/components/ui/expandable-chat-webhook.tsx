"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, Paperclip, Mic, MicOff, Play, Pause } from "lucide-react";
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
import { sendHomepageWebhookMessage } from "@/utils/homepageWebhook";

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
}

const ExpandableChatWebhook: React.FC<ExpandableChatWebhookProps> = ({
  autoOpen = false,
  onOpenLogin,
}) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Add intro message on first render when chat is empty
  useEffect(() => {
    if (messages.length === 0) {
      const introMessage: ChatMessage = {
        id: generateId(),
        content: "intro-with-login",
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages([introMessage]);
    }
  }, []);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if ((!userInput.trim() && selectedFiles.length === 0) || isLoading) return;

    const messageContent = userInput.trim() || (selectedFiles.length > 0 ? `Sent ${selectedFiles.length} file(s)` : "");
    
    const userMessage: ChatMessage = {
      id: generateId(),
      content: messageContent,
      sender: 'user',
      timestamp: new Date(),
      fileUrl: selectedFiles.length > 0 ? URL.createObjectURL(selectedFiles[0]) : undefined,
      fileType: selectedFiles.length > 0 ? selectedFiles[0].type : undefined,
      fileName: selectedFiles.length > 0 ? selectedFiles[0].name : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Send to webhook with 20s timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('timeout')), 20000);
      });

      const response = await Promise.race([
        sendHomepageWebhookMessage(messageContent, selectedFiles),
        timeoutPromise
      ]);

      // Display webhook response
      const assistantMessage: ChatMessage = {
        id: generateId(),
        content: response?.output || "Thank you for your message! Our team will get back to you soon.",
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: ChatMessage = {
        id: generateId(),
        content: "We couldn't reach the assistant. Please try again.",
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }

    setUserInput("");
    setSelectedFiles([]);
    setAudioUrl(null);
  };

  const handleAttachFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
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
        const audioFile = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm; codecs=opus' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Auto-send audio message immediately
        const userMessage: ChatMessage = {
          id: generateId(),
          content: "Voice message",
          sender: 'user',
          timestamp: new Date(),
          fileUrl: audioUrl,
          fileType: "audio/webm; codecs=opus",
          fileName: "voice-message.webm",
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
          // Send to webhook with 20s timeout
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('timeout')), 20000);
          });

          const response = await Promise.race([
            sendHomepageWebhookMessage("Voice message", [audioFile]),
            timeoutPromise
          ]);

          // Display webhook response
          const assistantMessage: ChatMessage = {
            id: generateId(),
            content: response?.output || "I received your voice message. Our team will review it and get back to you soon!",
            sender: 'assistant',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, assistantMessage]);
          setIsLoading(false);
        } catch (error) {
          console.error("Error sending voice message:", error);
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
      setAudioChunks(chunks);
    } catch (error) {
      console.error("Error starting voice recording:", error);
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
      setIsListening(false);
    }
  };

  const sendAudioMessage = async () => {
    if (!audioUrl || selectedFiles.length === 0) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      content: "Voice message",
      sender: 'user',
      timestamp: new Date(),
      fileUrl: audioUrl,
      fileType: "audio/wav",
      fileName: "voice-message.wav",
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Send to webhook with 20s timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('timeout')), 20000);
      });

      const response = await Promise.race([
        sendHomepageWebhookMessage("Voice message", selectedFiles),
        timeoutPromise
      ]);

      // Display webhook response
      const assistantMessage: ChatMessage = {
        id: generateId(),
        content: response?.output || "I received your voice message. Our team will review it and get back to you soon!",
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    } catch (error) {
      console.error("Error sending voice message:", error);
      const errorMessage: ChatMessage = {
        id: generateId(),
        content: "We couldn't reach the assistant. Please try again.",
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }

    setSelectedFiles([]);
    setAudioUrl(null);
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
    
    // Special intro message with login CTA
    if (message.content === "intro-with-login") {
      return (
        <ChatBubble key={message.id} variant="received">
          <ChatBubbleAvatar fallback="EVA" />
          <ChatBubbleMessage variant="received">
            <div className="space-y-3">
              <p>Hi, I'm Eva 👋 How can I help you today? For the full experience — with portfolio, offers, and pricing — log in anytime.</p>
              {onOpenLogin && (
                <Button
                  onClick={onOpenLogin}
                  className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-sm px-4 py-2 rounded-lg w-full"
                  role="button"
                  aria-label="Log in for full experience"
                >
                  Log in for full experience
                </Button>
              )}
            </div>
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
        autoOpen={autoOpen}
        icon={<Bot className="h-6 w-6" />}
      >
        <ExpandableChatHeader className="bg-gradient-to-r from-rose-500 to-pink-500 text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">EVA Assistant</h3>
              <p className="text-xs opacity-90">Here to help with your questions</p>
            </div>
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
          {selectedFiles.length > 0 && (
            <div className="mb-2 p-2 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Selected files:</div>
              {selectedFiles.map((file, index) => (
                <div key={index} className="text-xs p-1 bg-background rounded flex items-center justify-between">
                  <span>{file.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== index))}
                    className="h-4 w-4 p-0"
                  >
                    ×
                  </Button>
                </div>
              ))}
              {audioUrl && (
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => playAudio(audioUrl, 'preview')}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Preview
                  </Button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 rounded-full bg-background border border-input">
            <VoiceInput
              onStart={() => {
                setIsListening(true);
                handleVoiceStart();
              }}
              onStop={handleVoiceStop}
              className="text-rose-500 hover:text-rose-600"
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
              disabled={isLoading || (!userInput.trim() && selectedFiles.length === 0)}
              className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-4 py-2 rounded-full flex items-center gap-1"
            >
              Send Message
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </ExpandableChatFooter>
      </ExpandableChat>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
        accept="image/*,audio/*,.pdf,.doc,.docx"
      />

      <audio ref={audioRef} onEnded={() => setPlayingAudio(null)} />
    </>
  );
};

export default ExpandableChatWebhook;