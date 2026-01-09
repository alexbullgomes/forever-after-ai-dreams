import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';

export interface CampaignProduct {
  id: string;
  campaign_id: string;
  product_id: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  product?: Product;
}

export function useCampaignProducts(campaignId: string | undefined) {
  const [campaignProducts, setCampaignProducts] = useState<CampaignProduct[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCampaignProducts = useCallback(async () => {
    if (!campaignId) {
      setCampaignProducts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch campaign products with product details
      const { data: cpData, error: cpError } = await supabase
        .from('promotional_campaign_products')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('sort_order', { ascending: true });

      if (cpError) throw cpError;

      // Fetch all products to get details
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('sort_order', { ascending: true });

      if (productsError) throw productsError;

      // Map product details to campaign products
      const productsMap = new Map(productsData?.map(p => [p.id, p]) || []);
      const enrichedCampaignProducts = (cpData || []).map(cp => ({
        ...cp,
        product: productsMap.get(cp.product_id) as Product | undefined,
      }));

      setCampaignProducts(enrichedCampaignProducts);

      // Set available products (not linked to this campaign)
      const linkedProductIds = new Set((cpData || []).map(cp => cp.product_id));
      const available = ((productsData || []) as Product[]).filter(p => !linkedProductIds.has(p.id));
      setAvailableProducts(available);
    } catch (err: any) {
      console.error('Error fetching campaign products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchCampaignProducts();
  }, [fetchCampaignProducts]);

  const linkProduct = async (productId: string) => {
    if (!campaignId) return;

    try {
      const maxSortOrder = campaignProducts.reduce((max, cp) => Math.max(max, cp.sort_order), -1);
      
      const { error } = await supabase
        .from('promotional_campaign_products')
        .insert({
          campaign_id: campaignId,
          product_id: productId,
          sort_order: maxSortOrder + 1,
          is_active: true,
        });

      if (error) throw error;

      toast({ title: 'Product linked', description: 'Product added to campaign' });
      await fetchCampaignProducts();
    } catch (err: any) {
      console.error('Error linking product:', err);
      toast({ 
        title: 'Error', 
        description: err.message || 'Failed to link product',
        variant: 'destructive',
      });
    }
  };

  const unlinkProduct = async (productId: string) => {
    if (!campaignId) return;

    try {
      const { error } = await supabase
        .from('promotional_campaign_products')
        .delete()
        .eq('campaign_id', campaignId)
        .eq('product_id', productId);

      if (error) throw error;

      toast({ title: 'Product unlinked', description: 'Product removed from campaign' });
      await fetchCampaignProducts();
    } catch (err: any) {
      console.error('Error unlinking product:', err);
      toast({ 
        title: 'Error', 
        description: err.message || 'Failed to unlink product',
        variant: 'destructive',
      });
    }
  };

  const toggleProductActive = async (productId: string) => {
    if (!campaignId) return;

    const current = campaignProducts.find(cp => cp.product_id === productId);
    if (!current) return;

    try {
      const { error } = await supabase
        .from('promotional_campaign_products')
        .update({ is_active: !current.is_active })
        .eq('campaign_id', campaignId)
        .eq('product_id', productId);

      if (error) throw error;

      setCampaignProducts(prev =>
        prev.map(cp =>
          cp.product_id === productId ? { ...cp, is_active: !cp.is_active } : cp
        )
      );
    } catch (err: any) {
      console.error('Error toggling product active:', err);
      toast({ 
        title: 'Error', 
        description: err.message || 'Failed to toggle product',
        variant: 'destructive',
      });
    }
  };

  const reorderProducts = async (updates: { product_id: string; sort_order: number }[]) => {
    if (!campaignId) return;

    try {
      // Update locally first for optimistic UI
      setCampaignProducts(prev => {
        const updated = [...prev];
        updates.forEach(u => {
          const idx = updated.findIndex(cp => cp.product_id === u.product_id);
          if (idx !== -1) {
            updated[idx] = { ...updated[idx], sort_order: u.sort_order };
          }
        });
        return updated.sort((a, b) => a.sort_order - b.sort_order);
      });

      // Persist to database
      for (const update of updates) {
        await supabase
          .from('promotional_campaign_products')
          .update({ sort_order: update.sort_order })
          .eq('campaign_id', campaignId)
          .eq('product_id', update.product_id);
      }
    } catch (err: any) {
      console.error('Error reordering products:', err);
      toast({ 
        title: 'Error', 
        description: err.message || 'Failed to reorder products',
        variant: 'destructive',
      });
      // Refetch to reset state
      await fetchCampaignProducts();
    }
  };

  return {
    campaignProducts,
    availableProducts,
    loading,
    error,
    linkProduct,
    unlinkProduct,
    toggleProductActive,
    reorderProducts,
    refetch: fetchCampaignProducts,
  };
}
