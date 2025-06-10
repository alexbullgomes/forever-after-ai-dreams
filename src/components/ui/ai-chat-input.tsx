
"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react";
import { Mic, Paperclip, Send, Square } from "lucide-react";
import { motion } from "motion/react";
import { useAudioRecording } from "@/hooks/useAudioRecording";
import { FileAttachments } from "./file-attachments";
import { ChatControls } from "./chat-controls";
import { AnimatedPlaceholder } from "./animated-placeholder";

const PLACEHOLDERS = [
  "Tell us about your dream wedding vision...",
  "What's your ideal wedding style?",
  "How many guests are you planning for?",
  "What's your wedding budget range?",
  "Do you have a preferred venue type?",
  "Any specific photography style in mind?",
];

interface AIChatInputProps {
  onSendMessage?: (message: string, files?: File[]) => void;
}

const AIChatInput = ({ onSendMessage }: AIChatInputProps) => {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [thinkActive, setThinkActive] = useState(false);
  const [deepSearchActive, setDeepSearchActive] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isRecording, startRecording, stopRecording } = useAudioRecording();

  // Cycle placeholder text when input is inactive
  useEffect(() => {
    if (isActive || inputValue) return;

    const interval = setInterval(() => {
      setShowPlaceholder(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        setShowPlaceholder(true);
      }, 400);
    }, 3000);

    return () => clearInterval(interval);
  }, [isActive, inputValue]);

  // Close input when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        if (!inputValue && attachedFiles.length === 0) setIsActive(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [inputValue, attachedFiles]);

  const handleActivate = () => setIsActive(true);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('audio/')
    );
    
    setAttachedFiles(prev => [...prev, ...validFiles]);
    setIsActive(true);
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRecordingToggle = async () => {
    if (isRecording) {
      const audioFile = await stopRecording();
      if (audioFile) {
        setAttachedFiles(prev => [...prev, audioFile]);
      }
    } else {
      await startRecording();
    }
  };

  const handleSend = async () => {
    if ((!inputValue.trim() && attachedFiles.length === 0) || isLoading) return;
    
    setIsLoading(true);
    const message = inputValue;
    const files = [...attachedFiles];
    
    setInputValue("");
    setAttachedFiles([]);
    
    if (onSendMessage) {
      await onSendMessage(message, files);
    } else {
      // Fallback to original webhook call if no onSendMessage prop
      try {
        const formData = new FormData();
        formData.append('message', message);
        formData.append('timestamp', new Date().toISOString());
        
        files.forEach((file, index) => {
          formData.append(`file_${index}`, file);
        });

        const response = await fetch('https://automation.agcreationmkt.com/webhook/79834679-8b0e-4dfb-9fbe-408593849da1', {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('AI Response:', result);
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
    
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const containerVariants = {
    collapsed: {
      height: 68,
      boxShadow: "0 2px 8px 0 rgba(0,0,0,0.08)",
      transition: { type: "spring", stiffness: 120, damping: 18 },
    },
    expanded: {
      height: attachedFiles.length > 0 ? 180 : 128,
      boxShadow: "0 8px 32px 0 rgba(0,0,0,0.16)",
      transition: { type: "spring", stiffness: 120, damping: 18 },
    },
  };

  const isExpanded = isActive || inputValue || attachedFiles.length > 0;
  const animationState = isExpanded ? "expanded" : "collapsed";

  return (
    <div className="w-full flex justify-center items-center">
      <motion.div
        ref={wrapperRef}
        className="w-full max-w-3xl"
        variants={containerVariants}
        animate={animationState}
        initial="collapsed"
        style={{ overflow: "hidden", borderRadius: 32, background: "#fff" }}
        onClick={handleActivate}
      >
        <div className="flex flex-col items-stretch w-full h-full">
          {/* Attached Files Display */}
          <FileAttachments files={attachedFiles} onRemoveFile={removeFile} />

          {/* Input Row */}
          <div className="flex items-center gap-2 p-3 rounded-full bg-white max-w-3xl w-full">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,audio/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <button
              className="p-3 rounded-full hover:bg-gray-100 transition"
              title="Attach file"
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <Paperclip size={20} />
            </button>

            {/* Text Input & Placeholder */}
            <div className="relative flex-1">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 border-0 outline-0 rounded-md py-2 text-base bg-transparent w-full font-normal"
                style={{ position: "relative", zIndex: 1 }}
                onFocus={handleActivate}
                disabled={isLoading}
              />
              <AnimatedPlaceholder
                placeholders={PLACEHOLDERS}
                currentIndex={placeholderIndex}
                showPlaceholder={showPlaceholder}
                isActive={isActive}
                inputValue={inputValue}
              />
            </div>

            <button
              className={`p-3 rounded-full transition ${
                isRecording 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'hover:bg-gray-100'
              }`}
              title={isRecording ? "Stop recording" : "Voice input"}
              type="button"
              tabIndex={-1}
              onClick={handleRecordingToggle}
            >
              {isRecording ? <Square size={20} /> : <Mic size={20} />}
            </button>
            
            <button
              className={`flex items-center gap-1 bg-black hover:bg-zinc-700 text-white p-3 rounded-full font-medium justify-center transition ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Send"
              type="button"
              tabIndex={-1}
              onClick={handleSend}
              disabled={isLoading || (!inputValue.trim() && attachedFiles.length === 0)}
            >
              <Send size={18} />
            </button>
          </div>

          {/* Expanded Controls */}
          <ChatControls
            isVisible={isExpanded}
            thinkActive={thinkActive}
            deepSearchActive={deepSearchActive}
            onThinkToggle={() => setThinkActive(prev => !prev)}
            onDeepSearchToggle={() => setDeepSearchActive(prev => !prev)}
          />
        </div>
      </motion.div>
    </div>
  );
};

export { AIChatInput };
