import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CampaignPackage {
  id: string;
  campaign_id: string;
  title: string;
  price_display: string;
  description: string | null;
  features: string[];
  ideal_for: string | null;
  is_popular: boolean;
  is_enabled: boolean;
  minimum_deposit_cents: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePackageData {
  campaign_id: string;
  title: string;
  price_display: string;
  description?: string;
  features?: string[];
  ideal_for?: string;
  is_popular?: boolean;
  is_enabled?: boolean;
  minimum_deposit_cents: number;
  sort_order?: number;
}

export interface UpdatePackageData {
  id: string;
  title?: string;
  price_display?: string;
  description?: string | null;
  features?: string[];
  ideal_for?: string | null;
  is_popular?: boolean;
  is_enabled?: boolean;
  minimum_deposit_cents?: number;
  sort_order?: number;
}

export function useCampaignPackages(campaignId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ['campaign-packages', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      const { data, error } = await supabase
        .from('campaign_packages')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      
      // Parse features from JSONB
      return (data || []).map((pkg: any) => ({
        ...pkg,
        features: Array.isArray(pkg.features) ? pkg.features : [],
      })) as CampaignPackage[];
    },
    enabled: !!campaignId,
  });

  const createPackage = useMutation({
    mutationFn: async (data: CreatePackageData) => {
      const { data: result, error } = await supabase
        .from('campaign_packages')
        .insert({
          ...data,
          features: data.features || [],
        })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-packages', campaignId] });
      toast({ title: 'Package created', description: 'Package has been created successfully.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updatePackage = useMutation({
    mutationFn: async (data: UpdatePackageData) => {
      const { id, ...updateData } = data;
      const { data: result, error } = await supabase
        .from('campaign_packages')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-packages', campaignId] });
      toast({ title: 'Package updated', description: 'Package has been updated successfully.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deletePackage = useMutation({
    mutationFn: async (packageId: string) => {
      const { error } = await supabase
        .from('campaign_packages')
        .delete()
        .eq('id', packageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-packages', campaignId] });
      toast({ title: 'Package deleted', description: 'Package has been deleted successfully.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const reorderPackages = useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      const promises = updates.map(({ id, sort_order }) =>
        supabase
          .from('campaign_packages')
          .update({ sort_order })
          .eq('id', id)
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-packages', campaignId] });
    },
    onError: (error: any) => {
      toast({ title: 'Error reordering', description: error.message, variant: 'destructive' });
    },
  });

  return {
    packages,
    isLoading,
    createPackage,
    updatePackage,
    deletePackage,
    reorderPackages,
  };
}
