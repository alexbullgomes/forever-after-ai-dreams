
"use client"

import * as React from "react"
import { Mic, Paperclip, Square } from "lucide-react";
import { motion } from "motion/react";
import { useAudioRecording } from "@/hooks/useAudioRecording";
import { FileAttachments } from "./file-attachments";
import { ChatControls } from "./chat-controls";
import { useChatInputState } from "./ai-chat-input/use-chat-input-state";
import { containerVariants } from "./ai-chat-input/animations";
import { SendButton } from "./ai-chat-input/send-button";
import { TextInput } from "./ai-chat-input/text-input";

interface AIChatInputProps {
  onSendMessage?: (message: string, files?: File[]) => void;
}

const AIChatInput = ({ onSendMessage }: AIChatInputProps) => {
  const {
    placeholderIndex,
    showPlaceholder,
    isActive,
    thinkActive,
    deepSearchActive,
    inputValue,
    isLoading,
    attachedFiles,
    wrapperRef,
    fileInputRef,
    setThinkActive,
    setDeepSearchActive,
    setInputValue,
    setIsLoading,
    setAttachedFiles,
    handleActivate,
    handleFileSelect,
    removeFile,
  } = useChatInputState();

  const { isRecording, startRecording, stopRecording } = useAudioRecording();

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

  const isExpanded = Boolean(isActive || inputValue || attachedFiles.length > 0);
  const animationState = isExpanded ? "expanded" : "collapsed";
  
  // Update container variants height based on attached files
  const dynamicContainerVariants = {
    ...containerVariants,
    expanded: {
      ...containerVariants.expanded,
      height: attachedFiles.length > 0 ? 180 : 128,
    }
  };

  return (
    <div className="w-full flex justify-center items-center">
      <motion.div
        ref={wrapperRef}
        className="w-full max-w-3xl"
        variants={dynamicContainerVariants}
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

            <TextInput
              inputValue={inputValue}
              onInputChange={setInputValue}
              onKeyPress={handleKeyPress}
              onFocus={handleActivate}
              isLoading={isLoading}
              placeholderIndex={placeholderIndex}
              showPlaceholder={showPlaceholder}
              isActive={isActive}
            />

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
            
            <SendButton
              isLoading={isLoading}
              inputValue={inputValue}
              attachedFiles={attachedFiles}
              onSend={handleSend}
            />
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
