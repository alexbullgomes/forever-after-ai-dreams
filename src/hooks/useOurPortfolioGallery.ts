import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PortfolioGalleryCard {
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

export const useOurPortfolioGallery = () => {
  const [cards, setCards] = useState<PortfolioGalleryCard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('our_portfolio_gallery')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching portfolio gallery cards:', error);
        return;
      }

      setCards(data || []);
    } catch (error) {
      console.error('Error fetching portfolio gallery cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCard = async (cardData: Omit<PortfolioGalleryCard, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('our_portfolio_gallery')
        .insert([cardData])
        .select()
        .single();

      if (error) {
        console.error('Error creating portfolio gallery card:', error);
        throw error;
      }

      await fetchCards();
      return data;
    } catch (error) {
      console.error('Error creating portfolio gallery card:', error);
      throw error;
    }
  };

  const updateCard = async (id: string, updates: Partial<PortfolioGalleryCard>) => {
    try {
      const { data, error } = await supabase
        .from('our_portfolio_gallery')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating portfolio gallery card:', error);
        throw error;
      }

      await fetchCards();
      return data;
    } catch (error) {
      console.error('Error updating portfolio gallery card:', error);
      throw error;
    }
  };

  const deleteCard = async (id: string) => {
    try {
      const { error } = await supabase
        .from('our_portfolio_gallery')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting portfolio gallery card:', error);
        throw error;
      }

      await fetchCards();
    } catch (error) {
      console.error('Error deleting portfolio gallery card:', error);
      throw error;
    }
  };

  const reorderCards = async (cardUpdates: Array<{ id: string; order_index: number }>) => {
    try {
      const updates = cardUpdates.map(({ id, order_index }) =>
        supabase
          .from('our_portfolio_gallery')
          .update({ order_index })
          .eq('id', id)
      );

      await Promise.all(updates);
      await fetchCards();
    } catch (error) {
      console.error('Error reordering portfolio gallery cards:', error);
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