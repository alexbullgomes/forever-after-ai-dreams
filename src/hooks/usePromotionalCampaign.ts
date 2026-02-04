import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CampaignPackage } from './useCampaignPackages';

export interface TrackingScript {
  id: string;
  provider: string;
  name: string;
  placement: 'head' | 'body_end';
  code: string;
  enabled: boolean;
  created_at: string;
}

interface PromotionalCampaign {
  id: string;
  slug: string;
  title: string;
  banner_video_url: string | null;
  banner_poster_url: string | null;
  banner_headline: string;
  banner_subheadline: string;
  banner_tagline: string;
  // Legacy pricing card fields (for backward compatibility)
  pricing_card_1_enabled: boolean;
  pricing_card_1_title: string;
  pricing_card_1_price: string;
  pricing_card_1_description: string | null;
  pricing_card_1_features: string[];
  pricing_card_1_popular: boolean;
  pricing_card_1_ideal_for: string | null;
  pricing_card_2_enabled: boolean;
  pricing_card_2_title: string;
  pricing_card_2_price: string;
  pricing_card_2_description: string | null;
  pricing_card_2_features: string[];
  pricing_card_2_popular: boolean;
  pricing_card_2_ideal_for: string | null;
  pricing_card_3_enabled: boolean;
  pricing_card_3_title: string;
  pricing_card_3_price: string;
  pricing_card_3_description: string | null;
  pricing_card_3_features: string[];
  pricing_card_3_popular: boolean;
  pricing_card_3_ideal_for: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_image_url: string | null;
  is_active: boolean;
  views_count: number;
  tracking_scripts: TrackingScript[];
  products_section_enabled: boolean;
  pricing_section_enabled: boolean;
  vendors_section_enabled: boolean;
  vendors_section_headline: string | null;
  vendors_section_description: string | null;
  // NEW: Packages from campaign_packages table
  packages: CampaignPackage[];
}

export const usePromotionalCampaign = (slug: string) => {
  const [campaign, setCampaign] = useState<PromotionalCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('promotional_campaigns')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (fetchError) {
          throw fetchError;
        }

        if (!data) {
          setError('Campaign not found');
          setCampaign(null);
          return;
        }

        if (!data.is_active) {
          setError('Campaign is not active');
          setCampaign(null);
          return;
        }

        // Fetch packages from campaign_packages table
        const { data: packagesData, error: packagesError } = await supabase
          .from('campaign_packages')
          .select('*')
          .eq('campaign_id', data.id)
          .eq('is_enabled', true)
          .order('sort_order', { ascending: true });

        if (packagesError) {
          console.error('Error fetching packages:', packagesError);
        }

        // Parse packages features from JSONB
        const packages: CampaignPackage[] = (packagesData || []).map((pkg: any) => ({
          ...pkg,
          features: Array.isArray(pkg.features) ? pkg.features : [],
        }));

        // Parse tracking_scripts from JSONB
        const parsedData = {
          ...data,
          tracking_scripts: (data.tracking_scripts as any) || [],
          products_section_enabled: data.products_section_enabled ?? false,
          pricing_section_enabled: data.pricing_section_enabled ?? true,
          vendors_section_enabled: data.vendors_section_enabled ?? false,
          vendors_section_headline: data.vendors_section_headline ?? 'Our Partners',
          vendors_section_description: data.vendors_section_description ?? null,
          packages,
        };
        setCampaign(parsedData as PromotionalCampaign);

        // Track view (only once per session)
        const sessionKey = `viewed-promo-${slug}`;
        if (!sessionStorage.getItem(sessionKey)) {
          await supabase
            .from('promotional_campaigns')
            .update({ views_count: (data.views_count || 0) + 1 })
            .eq('id', data.id);
          sessionStorage.setItem(sessionKey, 'true');
        }
      } catch (err) {
        console.error('Error fetching campaign:', err);
        setError('Failed to load campaign');
        setCampaign(null);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchCampaign();
    }
  }, [slug]);

  return { campaign, loading, error };
};
