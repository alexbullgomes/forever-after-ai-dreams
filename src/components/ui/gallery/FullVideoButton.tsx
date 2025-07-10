import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="flex items-center justify-center mt-4"
    >
      <Button
        onClick={handleClick}
        disabled={isLoading}
        variant="outline"
        size="lg"
        className="
          flex items-center gap-2 px-6 py-3 rounded-full
          transition-all duration-300 shadow-lg
          bg-white/90 text-gray-700 hover:bg-white border-2 border-rose-200 hover:border-rose-300
        "
      >
        {isLoading ? (
          <motion.div
            className="w-5 h-5 border-2 border-rose-300 border-t-rose-500 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        ) : (
          <Play className="w-5 h-5 text-rose-500" />
        )}
        <span className="font-medium">
          {isLoading ? 'Opening...' : buttonText}
        </span>
      </Button>
    </motion.div>
  );
};

export default FullVideoButton;