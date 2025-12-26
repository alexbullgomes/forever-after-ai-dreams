import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GalleryCard {
  id: string;
  collection_key: string;
  slug?: string;
  title: string;
  subtitle?: string;
  category: string;
  location_city?: string;
  event_season_or_date?: string;
  thumbnail_url?: string;
  video_url?: string;
  video_mp4_url?: string;
  thumb_webm_url?: string;
  thumb_mp4_url?: string;
  thumb_image_url?: string;
  order_index: number;
  featured: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  // Redirect fields
  destination_type?: string | null;
  campaign_id?: string | null;
  custom_url?: string | null;
}

export const useGalleryCards = () => {
  const [cards, setCards] = useState<GalleryCard[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCards = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('gallery_cards')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setCards(data || []);
    } catch (error) {
      console.error('Error fetching gallery cards:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch gallery cards"
      });
    } finally {
      setLoading(false);
    }
  };

  const createCard = async (cardData: Omit<GalleryCard, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('gallery_cards')
        .insert([cardData])
        .select()
        .single();

      if (error) throw error;
      
      await fetchCards();
      toast({
        title: "Success",
        description: "Gallery card created successfully"
      });
      
      return data;
    } catch (error) {
      console.error('Error creating gallery card:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create gallery card"
      });
      throw error;
    }
  };

  const updateCard = async (id: string, updates: Partial<GalleryCard>) => {
    try {
      const { error } = await supabase
        .from('gallery_cards')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      await fetchCards();
      toast({
        title: "Success",
        description: "Gallery card updated successfully"
      });
    } catch (error) {
      console.error('Error updating gallery card:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update gallery card"
      });
      throw error;
    }
  };

  const deleteCard = async (id: string) => {
    try {
      const { error } = await supabase
        .from('gallery_cards')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchCards();
      toast({
        title: "Success",
        description: "Gallery card deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting gallery card:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete gallery card"
      });
      throw error;
    }
  };

  const reorderCards = async (cardUpdates: { id: string; order_index: number }[]) => {
    try {
      const updates = cardUpdates.map(({ id, order_index }) => 
        supabase
          .from('gallery_cards')
          .update({ order_index })
          .eq('id', id)
      );

      await Promise.all(updates);
      await fetchCards();
      
      toast({
        title: "Success",
        description: "Gallery cards reordered successfully"
      });
    } catch (error) {
      console.error('Error reordering gallery cards:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reorder gallery cards"
      });
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
    refetch: fetchCards
  };
};
