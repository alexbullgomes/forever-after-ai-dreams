"use client";

import { useState, FormEvent } from "react";
import { Send, Bot, Paperclip, Mic, CornerDownLeft } from "lucide-react";
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
import { sendWebhookMessage } from "@/components/wedding/utils/webhookService";

interface ChatMessage {
  id: number;
  content: string;
  sender: "user" | "ai";
  timestamp: string;
}

export function ExpandableChatAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      content: "Hello! I'm your personal planner assistant. How can I help you find the perfect photo or video package today?",
      sender: "ai",
      timestamp: new Date().toISOString(),
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { user } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() && selectedFiles.length === 0) return;

    const userMessage: ChatMessage = {
      id: messages.length + 1,
      content: input || "Shared files",
      sender: "user",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Send message using the same webhook service as the main chat
      const result = await sendWebhookMessage(userMessage.content, user, selectedFiles.length > 0 ? selectedFiles : undefined);
      
      // Add AI response
      const aiMessage: ChatMessage = {
        id: messages.length + 2,
        content: result.output || result.message || "Thank you for your message! I'll help you find the perfect package for your needs.",
        sender: "ai",
        timestamp: new Date().toISOString(),
      };
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: messages.length + 2,
        content: "Sorry, I'm having trouble responding right now. Please try again.",
        sender: "ai",
        timestamp: new Date().toISOString(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setSelectedFiles([]);
    }
  };

  const handleAttachFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,audio/*';
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      setSelectedFiles(prev => [...prev, ...files]);
    };
    input.click();
  };

  const handleMicrophoneClick = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        setSelectedFiles(prev => [...prev, audioFile]);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      // Record for 5 seconds or until user clicks again
      mediaRecorder.start();
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 5000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  return (
    <ExpandableChat
      size="lg"
      position="bottom-right"
      icon={<Bot className="h-6 w-6" />}
      className="bg-gradient-to-br from-rose-50 to-pink-50 border-0 shadow-2xl"
    >
      <ExpandableChatHeader className="flex-col text-center justify-center bg-gradient-to-r from-rose-500 to-pink-500 text-white border-0">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-white">Assistant Planner</h1>
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
                {message.content}
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
                  <span className="text-sm text-rose-700 truncate max-w-32">{file.name}</span>
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
        
        <form
          onSubmit={handleSubmit}
          className="relative rounded-xl border border-rose-200 bg-white focus-within:ring-2 focus-within:ring-rose-500 focus-within:border-rose-500 p-1 shadow-md"
        >
          <ChatInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell me about your photo/video needs..."
            className="min-h-12 resize-none rounded-xl bg-white border-0 p-3 shadow-none focus-visible:ring-0 placeholder:text-rose-400"
          />
          <div className="flex items-center p-3 pt-0 justify-between">
            <div className="flex">
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={handleAttachFile}
                className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
              >
                <Paperclip className="size-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={handleMicrophoneClick}
                className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
              >
                <Mic className="size-4" />
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