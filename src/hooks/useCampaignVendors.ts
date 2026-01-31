import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CampaignVendor {
  id: string;
  campaign_id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useCampaignVendors(campaignId: string | undefined) {
  const [vendors, setVendors] = useState<CampaignVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchVendors = useCallback(async () => {
    if (!campaignId) {
      setVendors([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('campaign_vendors')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;

      setVendors(data || []);
    } catch (err: any) {
      console.error('Error fetching campaign vendors:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const createVendor = async (vendor: { name: string; logo_url?: string; website_url?: string }) => {
    if (!campaignId) return;

    try {
      const maxSortOrder = vendors.reduce((max, v) => Math.max(max, v.sort_order), -1);
      
      const { data, error } = await supabase
        .from('campaign_vendors')
        .insert({
          campaign_id: campaignId,
          name: vendor.name,
          logo_url: vendor.logo_url || null,
          website_url: vendor.website_url || null,
          sort_order: maxSortOrder + 1,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setVendors(prev => [...prev, data]);
      toast({ title: 'Vendor added', description: 'Vendor has been added to the campaign' });
      return data;
    } catch (err: any) {
      console.error('Error creating vendor:', err);
      toast({ 
        title: 'Error', 
        description: err.message || 'Failed to create vendor',
        variant: 'destructive',
      });
    }
  };

  const updateVendor = async (vendorId: string, updates: Partial<CampaignVendor>) => {
    try {
      const { error } = await supabase
        .from('campaign_vendors')
        .update(updates)
        .eq('id', vendorId);

      if (error) throw error;

      setVendors(prev =>
        prev.map(v => v.id === vendorId ? { ...v, ...updates } : v)
      );
      toast({ title: 'Vendor updated', description: 'Vendor has been updated successfully' });
    } catch (err: any) {
      console.error('Error updating vendor:', err);
      toast({ 
        title: 'Error', 
        description: err.message || 'Failed to update vendor',
        variant: 'destructive',
      });
    }
  };

  const deleteVendor = async (vendorId: string) => {
    try {
      const { error } = await supabase
        .from('campaign_vendors')
        .delete()
        .eq('id', vendorId);

      if (error) throw error;

      setVendors(prev => prev.filter(v => v.id !== vendorId));
      toast({ title: 'Vendor deleted', description: 'Vendor has been removed from the campaign' });
    } catch (err: any) {
      console.error('Error deleting vendor:', err);
      toast({ 
        title: 'Error', 
        description: err.message || 'Failed to delete vendor',
        variant: 'destructive',
      });
    }
  };

  const toggleActive = async (vendorId: string) => {
    const vendor = vendors.find(v => v.id === vendorId);
    if (!vendor) return;

    try {
      const { error } = await supabase
        .from('campaign_vendors')
        .update({ is_active: !vendor.is_active })
        .eq('id', vendorId);

      if (error) throw error;

      setVendors(prev =>
        prev.map(v => v.id === vendorId ? { ...v, is_active: !v.is_active } : v)
      );
    } catch (err: any) {
      console.error('Error toggling vendor active:', err);
      toast({ 
        title: 'Error', 
        description: err.message || 'Failed to toggle vendor visibility',
        variant: 'destructive',
      });
    }
  };

  const reorderVendors = async (updates: { id: string; sort_order: number }[]) => {
    try {
      // Update locally first for optimistic UI
      setVendors(prev => {
        const updated = [...prev];
        updates.forEach(u => {
          const idx = updated.findIndex(v => v.id === u.id);
          if (idx !== -1) {
            updated[idx] = { ...updated[idx], sort_order: u.sort_order };
          }
        });
        return updated.sort((a, b) => a.sort_order - b.sort_order);
      });

      // Persist to database
      for (const update of updates) {
        await supabase
          .from('campaign_vendors')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }
    } catch (err: any) {
      console.error('Error reordering vendors:', err);
      toast({ 
        title: 'Error', 
        description: err.message || 'Failed to reorder vendors',
        variant: 'destructive',
      });
      // Refetch to reset state
      await fetchVendors();
    }
  };

  return {
    vendors,
    loading,
    error,
    createVendor,
    updateVendor,
    deleteVendor,
    toggleActive,
    reorderVendors,
    refetch: fetchVendors,
  };
}
