import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ActiveCampaign {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  videoUrl: string | null;
  href: string;
}

export const useActiveCampaigns = () => {
  const [campaigns, setCampaigns] = useState<ActiveCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActiveCampaigns = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('promotional_campaigns')
          .select('id, slug, title, banner_tagline, banner_poster_url, banner_video_url')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        const mappedCampaigns: ActiveCampaign[] = (data || []).map((campaign) => ({
          id: campaign.id,
          slug: campaign.slug,
          title: campaign.title,
          subtitle: campaign.banner_tagline || 'Limited-time offer',
          imageUrl: campaign.banner_poster_url || '',
          videoUrl: campaign.banner_video_url || null,
          href: `/promo/${campaign.slug}`,
        }));

        setCampaigns(mappedCampaigns);
      } catch (err) {
        console.error('Error fetching active campaigns:', err);
        setError('Failed to load campaigns');
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveCampaigns();
  }, []);

  return { campaigns, loading, error };
};
