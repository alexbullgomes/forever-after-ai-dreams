import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PromotionalCampaign {
  id: string;
  slug: string;
  title: string;
  banner_video_url: string | null;
  banner_poster_url: string | null;
  banner_headline: string;
  banner_subheadline: string;
  banner_tagline: string;
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

        setCampaign(data as PromotionalCampaign);

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
