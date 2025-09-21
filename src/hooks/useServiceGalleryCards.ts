import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ServiceGalleryCard {
  id: string;
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
  order_index: number;
  featured: boolean;
  is_published: boolean;
  full_video_enabled: boolean;
  full_video_url?: string;
  created_at: string;
  updated_at: string;
}

export const useServiceGalleryCards = () => {
  const [cards, setCards] = useState<ServiceGalleryCard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCards = async () => {
    try {
      const { data, error } = await supabase
        .from('service_gallery_cards')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching service gallery cards:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch service gallery cards"
        });
        return;
      }

      setCards(data || []);
    } catch (error) {
      console.error('Error fetching service gallery cards:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch service gallery cards"
      });
    } finally {
      setLoading(false);
    }
  };

  const createCard = async (cardData: Omit<ServiceGalleryCard, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('service_gallery_cards')
        .insert([cardData])
        .select()
        .single();

      if (error) {
        console.error('Error creating service gallery card:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to create service gallery card"
        });
        return null;
      }

      toast({
        title: "Success",
        description: "Service gallery card created successfully"
      });

      await fetchCards();
      return data;
    } catch (error) {
      console.error('Error creating service gallery card:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create service gallery card"
      });
      return null;
    }
  };

  const updateCard = async (id: string, updates: Partial<ServiceGalleryCard>) => {
    try {
      const { error } = await supabase
        .from('service_gallery_cards')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating service gallery card:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update service gallery card"
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Service gallery card updated successfully"
      });

      await fetchCards();
      return true;
    } catch (error) {
      console.error('Error updating service gallery card:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update service gallery card"
      });
      return false;
    }
  };

  const deleteCard = async (id: string) => {
    try {
      const { error } = await supabase
        .from('service_gallery_cards')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting service gallery card:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete service gallery card"
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Service gallery card deleted successfully"
      });

      await fetchCards();
      return true;
    } catch (error) {
      console.error('Error deleting service gallery card:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete service gallery card"
      });
      return false;
    }
  };

  const reorderCards = async (cardUpdates: { id: string; order_index: number }[]) => {
    try {
      const promises = cardUpdates.map(({ id, order_index }) =>
        supabase
          .from('service_gallery_cards')
          .update({ order_index })
          .eq('id', id)
      );

      const results = await Promise.all(promises);
      
      const hasError = results.some(result => result.error);
      if (hasError) {
        console.error('Error reordering service gallery cards');
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to reorder service gallery cards"
        });
        return false;
      }

      await fetchCards();
      return true;
    } catch (error) {
      console.error('Error reordering service gallery cards:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reorder service gallery cards"
      });
      return false;
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