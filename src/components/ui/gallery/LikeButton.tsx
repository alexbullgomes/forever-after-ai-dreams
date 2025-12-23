import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { MediaItemType } from './types';
import GalleryLeadForm from './GalleryLeadForm';

interface LikeButtonProps {
  selectedItem: MediaItemType;
  isLiked: boolean;
  onToggleLike: () => void;
  pageSource?: string;
}

const LikeButton: React.FC<LikeButtonProps> = ({ selectedItem, isLiked, onToggleLike, pageSource }) => {
  const [isLiking, setIsLiking] = useState(false);
  const [showConsultationForm, setShowConsultationForm] = useState(false);
  const { user } = useAuth();

  const sendLikeWebhook = async () => {
    if (!user) return;
    
    const webhookUrl = 'https://agcreationmkt.cloud/webhook/8e26e595-d079-4d4b-8c15-a31824f98aed';
    
    const payload = {
      user_id: user.id,
      user_email: user.email,
      user_name: user.user_metadata?.full_name || user.email || 'Anonymous',
      event: 'gallery_like',
      content_id: selectedItem.id,
      content_type: selectedItem.type,
      content_title: selectedItem.title,
      content_url: selectedItem.url,
      timestamp: new Date().toISOString(),
      source: 'Dream Weddings Gallery',
      page_source: pageSource || 'Unknown'
    };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to send like webhook:', error);
      throw error;
    }
  };

  const handleLike = async () => {
    if (isLiking || !user) return;
    
    setIsLiking(true);
    
    // Wait 1 second before opening consultation form
    setTimeout(() => {
      setIsLiking(false);
      setShowConsultationForm(true);
    }, 1000);
  };

  const handleConsultationFormClose = () => {
    setShowConsultationForm(false);
    // Toggle like after successful form submission
    onToggleLike();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-center"
      >
        <Button
          onClick={handleLike}
          disabled={isLiking || !user}
          variant={isLiked ? "default" : "outline"}
          size="lg"
          className={`
            flex items-center gap-2 px-6 py-3 rounded-full
            transition-all duration-300 shadow-lg
            ${isLiked 
              ? 'bg-brand-gradient text-primary-foreground hover:bg-brand-gradient-hover' 
              : 'bg-card/90 text-foreground hover:bg-card border-2 border-brand-primary-from/20 hover:border-brand-primary-from/30'
            }
            ${!user ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <Heart 
            className={`w-5 h-5 transition-all duration-300 ${
              isLiked ? 'fill-current text-primary-foreground' : 'text-brand-primary-from'
            }`} 
          />
          <span className="font-medium">
            {isLiking ? 'Liking...' : isLiked ? 'Liked' : 'Like'}
          </span>
        </Button>
        {!user && (
          <p className="text-sm text-muted-foreground ml-4">
            Sign in to like content
          </p>
        )}
      </motion.div>

      <GalleryLeadForm
        isOpen={showConsultationForm}
        onClose={handleConsultationFormClose}
        cardData={{
          cardId: selectedItem.id,
          cardTitle: selectedItem.title,
          type: selectedItem.type,
          category: pageSource || 'Gallery'
        }}
      />
    </>
  );
};

export default LikeButton;