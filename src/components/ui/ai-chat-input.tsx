"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react";
import { Mic, Paperclip, Send, X, Image, MicIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useIsMobile } from "@/hooks/use-mobile";
import { VoiceInput } from "@/components/ui/voice-input";
import { toast } from "sonner";

const DESKTOP_PLACEHOLDERS = [
  "Tell us a bit about your event or session — what are you planning?",
  "How many hours of coverage do you think you'll need?",
  "Do you need photography, videography, or both?",
  "Roughly how many people will be at your event?",
  "Do you already have a date and location in mind?",
  "What's your estimated budget for this special occasion?",
  "Would you prefer one creative or a full team to capture everything?",
  "Is this for personal, family, or professional purposes?",
  "What kind of result are you hoping for — digital gallery, video highlights, or both?",
  "Do you have any ideas or inspiration you'd like to share with us?"
];

const MOBILE_PLACEHOLDERS = [
  "What are you planning?",
  "How many hours do you need?",
  "Photo, video, or both?",
  "How many guests?",
  "Date and location set?",
  "What's your budget?",
  "Solo or full team?",
  "Personal, family, or business?",
  "Photos, videos, or both?",
  "Got any ideas or inspo?"
];

interface AIChatInputProps {
  onSendMessage?: (message: string, files?: File[]) => void;
}

const AIChatInput = ({ onSendMessage }: AIChatInputProps) => {
  const isMobile = useIsMobile();
  const currentPlaceholders = isMobile ? MOBILE_PLACEHOLDERS : DESKTOP_PLACEHOLDERS;
  
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cycle placeholder text when input is inactive
  useEffect(() => {
    if (isActive || inputValue) return;

    const interval = setInterval(() => {
      setShowPlaceholder(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % currentPlaceholders.length);
        setShowPlaceholder(true);
      }, 400);
    }, 5000);

    return () => clearInterval(interval);
  }, [isActive, inputValue, currentPlaceholders.length]);

  // Close input when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        if (!inputValue) setIsActive(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [inputValue]);

  const handleActivate = () => setIsActive(true);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const allowedTypes = ['image/', 'audio/'];
    const allowedExtensions = ['.heic', '.heif']; // Support iPhone HEIC/HEIF formats
    const maxImageSize = 5 * 1024 * 1024; // 5MB for images
    
    const validFiles = files.filter(file => {
      // Check file type or extension for HEIC/HEIF support
      const isValidType = allowedTypes.some(type => file.type.startsWith(type));
      const isValidExtension = allowedExtensions.some(ext => 
        file.name.toLowerCase().endsWith(ext)
      );
      
      if (!isValidType && !isValidExtension) {
        console.warn(`File ${file.name} rejected: unsupported type ${file.type}`);
        return false;
      }
      
      // Check image file size (5MB limit for images)
      const isImageFile = file.type.startsWith('image/') || 
        allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
      
      if (isImageFile && file.size > maxImageSize) {
        console.warn(`Image file ${file.name} exceeds 5MB limit (${Math.round(file.size / 1024 / 1024)}MB)`);
        return false;
      }
      
      console.log(`File ${file.name} accepted: type=${file.type}, size=${Math.round(file.size / 1024)}KB`);
      return true;
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleVoiceStart = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const newMediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      newMediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      newMediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        setMediaRecorder(null);
        
        // Auto-send the audio message
        await sendAudioMessage(audioFile);
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
      toast.error('Failed to access microphone');
    }
  };

  const handleVoiceStop = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const sendAudioMessage = async (audioFile: File) => {
    if (!onSendMessage) return;
    
    try {
      setIsLoading(true);
      await onSendMessage("Audio message", [audioFile]);
      setIsLoading(false);
    } catch (error) {
      console.error('Error sending audio message:', error);
      toast.error('Failed to send audio message');
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if ((!inputValue.trim() && selectedFiles.length === 0) || isLoading) return;
    
    setIsLoading(true);
    const message = inputValue || "Shared files";
    const files = selectedFiles.length > 0 ? selectedFiles : undefined;
    
    setInputValue("");
    setSelectedFiles([]);
    
    if (onSendMessage) {
      await onSendMessage(message, files);
    } else {
      // Fallback to original webhook call if no onSendMessage prop
      try {
        const response = await fetch('https://automation.agcreationmkt.com/webhook/79834679-8b0e-4dfb-9fbe-408593849da1', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: message,
            timestamp: new Date().toISOString(),
          }),
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
      height: selectedFiles.length > 0 || isActive ? 128 + (selectedFiles.length * 30) : 68,
      boxShadow: "0 2px 8px 0 rgba(0,0,0,0.08)",
      transition: { type: "spring" as const, stiffness: 120, damping: 18 },
    },
    expanded: {
      height: 128 + (selectedFiles.length * 30),
      boxShadow: "0 8px 32px 0 rgba(0,0,0,0.16)",
      transition: { type: "spring" as const, stiffness: 120, damping: 18 },
    },
  };

  const placeholderContainerVariants = {
    initial: {},
    animate: { transition: { staggerChildren: 0.025 } },
    exit: { transition: { staggerChildren: 0.015, staggerDirection: -1 } },
  };

  const letterVariants = {
    initial: {
      opacity: 0,
      filter: "blur(12px)",
      y: 10,
    },
    animate: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        opacity: { duration: 0.25 },
        filter: { duration: 0.4 },
        y: { type: "spring" as const, stiffness: 80, damping: 20 },
      },
    },
    exit: {
      opacity: 0,
      filter: "blur(12px)",
      y: -10,
      transition: {
        opacity: { duration: 0.2 },
        filter: { duration: 0.3 },
        y: { type: "spring" as const, stiffness: 80, damping: 20 },
      },
    },
  };

  return (
    <div className="w-full flex justify-center items-center">
      <motion.div
        ref={wrapperRef}
        className="w-full max-w-3xl"
        variants={containerVariants}
        animate={isActive || inputValue || selectedFiles.length > 0 ? "expanded" : "collapsed"}
        initial="collapsed"
        style={{ overflow: "hidden", borderRadius: 32, background: "#fff" }}
        onClick={handleActivate}
      >
        <div className="flex flex-col items-stretch w-full h-full">
          {/* Recording Indicator */}
          {isRecording && (
            <div className="px-4 pt-3">
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-red-700 font-medium">Recording... (click mic to stop)</span>
              </div>
            </div>
          )}

          {/* Selected Files Display */}
          {selectedFiles.length > 0 && (
            <div className="px-4 pt-3">
              <div className="flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1">
                    {(file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) ? (
                      <Image size={16} className="text-gray-600" />
                    ) : (
                      <MicIcon size={16} className="text-gray-600" />
                    )}
                    <span className="text-sm text-gray-700 truncate max-w-32">
                      {file.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input Row */}
          <div className="flex items-center gap-2 p-3 rounded-full bg-white max-w-3xl w-full">

            {/* Text Input & Placeholder */}
            <div className="relative flex-1">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className={`flex-1 border-0 outline-0 rounded-md bg-transparent w-full font-normal ${
                  isMobile ? 'py-1 text-sm' : 'py-2 text-base'
                }`}
                style={{ position: "relative", zIndex: 1 }}
                onFocus={handleActivate}
                disabled={isLoading}
              />
              <div className="absolute left-0 top-0 w-full h-full pointer-events-none flex items-center px-3 py-2">
                <AnimatePresence mode="wait">
                  {showPlaceholder && !isActive && !inputValue && (
                    <motion.span
                      key={placeholderIndex}
                      className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 select-none pointer-events-none text-base sm:text-base md:text-base"
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        zIndex: 0,
                        fontSize: "14px",
                      }}
                      variants={placeholderContainerVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      {currentPlaceholders[placeholderIndex]
                        .split("")
                        .map((char, i) => (
                          <motion.span
                            key={i}
                            variants={letterVariants}
                            style={{ display: "inline-block" }}
                          >
                            {char === " " ? "\u00A0" : char}
                          </motion.span>
                        ))}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <VoiceInput
              onStart={handleVoiceStart}
              onStop={handleVoiceStop}
              className="text-rose-500 hover:text-rose-600"
            />
            
            <button
              className={`flex items-center gap-1 bg-black hover:bg-zinc-700 text-white p-3 rounded-full font-medium justify-center transition ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Send"
              type="button"
              tabIndex={-1}
              onClick={handleSend}
              disabled={isLoading || (!inputValue.trim() && selectedFiles.length === 0)}
            >
              <Send size={18} />
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export { AIChatInput };
