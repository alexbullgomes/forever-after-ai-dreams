import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type PromotionalPopup = Database['public']['Tables']['promotional_popups']['Row'];
type PromotionalPopupInsert = Database['public']['Tables']['promotional_popups']['Insert'];
type PromotionalPopupUpdate = Database['public']['Tables']['promotional_popups']['Update'];

export const usePromotionalPopupAdmin = () => {
  const [popups, setPopups] = useState<PromotionalPopup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPopups = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('promotional_popups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPopups(data || []);
    } catch (error) {
      console.error('Error fetching popups:', error);
      toast({
        title: 'Error',
        description: 'Failed to load promotional popups',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPopups();
  }, []);

  const createPopup = async (popup: PromotionalPopupInsert) => {
    try {
      const { data, error } = await supabase
        .from('promotional_popups')
        .insert(popup)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Promotional popup created successfully',
      });

      fetchPopups();
      return data;
    } catch (error: any) {
      console.error('Error creating popup:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create promotional popup',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updatePopup = async (id: string, updates: PromotionalPopupUpdate) => {
    try {
      const { data, error } = await supabase
        .from('promotional_popups')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Promotional popup updated successfully',
      });

      fetchPopups();
      return data;
    } catch (error: any) {
      console.error('Error updating popup:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update promotional popup',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deletePopup = async (id: string) => {
    try {
      const { error } = await supabase
        .from('promotional_popups')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Promotional popup deleted successfully',
      });

      fetchPopups();
    } catch (error: any) {
      console.error('Error deleting popup:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete promotional popup',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('promotional_popups')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Popup ${!currentStatus ? 'activated' : 'deactivated'}`,
      });

      fetchPopups();
    } catch (error: any) {
      console.error('Error toggling active status:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update popup status',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    popups,
    loading,
    createPopup,
    updatePopup,
    deletePopup,
    toggleActive,
    refresh: fetchPopups,
  };
};
