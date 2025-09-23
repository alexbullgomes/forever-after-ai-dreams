import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BusinessContentsGalleryCard {
  id: string;
  order_index: number;
  featured: boolean;
  is_published: boolean;
  full_video_enabled: boolean;
  created_at: string;
  updated_at: string;
  slug?: string;
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
}

export const useBusinessContentsGallery = () => {
  const [cards, setCards] = useState<BusinessContentsGalleryCard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('business_contents_gallery')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching business contents gallery cards:', error);
        return;
      }

      setCards(data || []);
    } catch (error) {
      console.error('Error fetching business contents gallery cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCard = async (cardData: Omit<BusinessContentsGalleryCard, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('business_contents_gallery')
        .insert([cardData])
        .select()
        .single();

      if (error) {
        console.error('Error creating business contents gallery card:', error);
        throw error;
      }

      await fetchCards();
      return data;
    } catch (error) {
      console.error('Error creating business contents gallery card:', error);
      throw error;
    }
  };

  const updateCard = async (id: string, updates: Partial<BusinessContentsGalleryCard>) => {
    try {
      const { data, error } = await supabase
        .from('business_contents_gallery')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating business contents gallery card:', error);
        throw error;
      }

      await fetchCards();
      return data;
    } catch (error) {
      console.error('Error updating business contents gallery card:', error);
      throw error;
    }
  };

  const deleteCard = async (id: string) => {
    try {
      const { error } = await supabase
        .from('business_contents_gallery')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting business contents gallery card:', error);
        throw error;
      }

      await fetchCards();
    } catch (error) {
      console.error('Error deleting business contents gallery card:', error);
      throw error;
    }
  };

  const reorderCards = async (cardUpdates: Array<{ id: string; order_index: number }>) => {
    try {
      const updates = cardUpdates.map(({ id, order_index }) =>
        supabase
          .from('business_contents_gallery')
          .update({ order_index })
          .eq('id', id)
      );

      await Promise.all(updates);
      await fetchCards();
    } catch (error) {
      console.error('Error reordering business contents gallery cards:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  return {
    cards,
    loading,
    createCard,
    updateCard,
    deleteCard,
    reorderCards,
    refetch: fetchCards,
  };
};