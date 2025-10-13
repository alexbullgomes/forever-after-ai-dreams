import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PromotionalCampaignGalleryItem {
  id: string;
  campaign_id: string;
  order_index: number;
  featured: boolean;
  is_published: boolean;
  full_video_enabled: boolean;
  created_at: string;
  updated_at: string;
  title: string;
  subtitle?: string;
  category: string;
  location_city?: string;
  event_season_or_date?: string;
  thumbnail_url?: string;
  thumb_webm_url?: string;
  thumb_mp4_url?: string;
  thumb_image_url?: string;
  full_video_url?: string;
  slug?: string;
}

export const usePromotionalCampaignGallery = (campaignId?: string) => {
  const [cards, setCards] = useState<PromotionalCampaignGalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCards = async () => {
    if (!campaignId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('promotional_campaign_gallery')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('order_index', { ascending: true });

      if (fetchError) throw fetchError;

      setCards(data || []);
    } catch (err) {
      console.error('Error fetching campaign gallery:', err);
      setError('Failed to load gallery items');
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();

    if (!campaignId) return;

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`promotional_campaign_gallery:${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'promotional_campaign_gallery',
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => {
          fetchCards();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  const createCard = async (cardData: Omit<PromotionalCampaignGalleryItem, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('promotional_campaign_gallery')
        .insert(cardData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Gallery item created successfully',
      });

      return data;
    } catch (err) {
      console.error('Error creating gallery item:', err);
      toast({
        title: 'Error',
        description: 'Failed to create gallery item',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updateCard = async (id: string, updates: Partial<PromotionalCampaignGalleryItem>) => {
    try {
      const { data, error } = await supabase
        .from('promotional_campaign_gallery')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Gallery item updated successfully',
      });

      return data;
    } catch (err) {
      console.error('Error updating gallery item:', err);
      toast({
        title: 'Error',
        description: 'Failed to update gallery item',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const deleteCard = async (id: string) => {
    try {
      const { error } = await supabase
        .from('promotional_campaign_gallery')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Gallery item deleted successfully',
      });
    } catch (err) {
      console.error('Error deleting gallery item:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete gallery item',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const reorderCards = async (cardUpdates: { id: string; order_index: number }[]) => {
    try {
      const updates = cardUpdates.map(({ id, order_index }) =>
        supabase
          .from('promotional_campaign_gallery')
          .update({ order_index })
          .eq('id', id)
      );

      await Promise.all(updates);

      toast({
        title: 'Success',
        description: 'Gallery order updated successfully',
      });
    } catch (err) {
      console.error('Error reordering gallery items:', err);
      toast({
        title: 'Error',
        description: 'Failed to reorder gallery items',
        variant: 'destructive',
      });
      throw err;
    }
  };

  return {
    cards,
    loading,
    error,
    fetchCards,
    createCard,
    updateCard,
    deleteCard,
    reorderCards,
  };
};
