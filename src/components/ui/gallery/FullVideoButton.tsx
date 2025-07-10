import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface FullVideoButtonProps {
  videoUrl: string;
  eventName: string;
  buttonText?: string;
  icon?: React.ReactNode;
}

const FullVideoButton: React.FC<FullVideoButtonProps> = ({ 
  videoUrl, 
  eventName, 
  buttonText = "Watch Full Video",
  icon = <Play className="w-4 h-4" />
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleClick = async () => {
    setIsLoading(true);
    
    try {
      // Send webhook data
      const webhookData = {
        action: "watch_full_video",
        videoUrl,
        eventName,
        timestamp: new Date().toISOString(),
        user: user ? {
          id: user.id,
          fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown',
          email: user.email || 'unknown@email.com'
        } : {
          id: 'anonymous',
          fullName: 'Anonymous User',
          email: 'anonymous@email.com'
        }
      };

      // Send webhook request
      await fetch('https://agcreationmkt.cloud/webhook/8e26e595-d079-4d4b-8c15-a31824f98aed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      });

      // Open video in new tab
      window.open(videoUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error sending webhook:', error);
      // Still open the video even if webhook fails
      window.open(videoUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={isLoading}
      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 
                 backdrop-blur-sm border border-white/20 rounded-lg 
                 text-white font-medium transition-all duration-200
                 disabled:opacity-50 disabled:cursor-not-allowed
                 hover:scale-105 active:scale-95"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {isLoading ? (
        <motion.div
          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      ) : (
        icon
      )}
      <span className="text-sm">
        {isLoading ? 'Opening...' : buttonText}
      </span>
      <ExternalLink className="w-3 h-3 opacity-70" />
    </motion.button>
  );
};

export default FullVideoButton;