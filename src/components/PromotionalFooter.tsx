import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface PricingCard {
  title: string;
  price: string;
}

interface FooterCampaign {
  id: string;
  slug: string;
  banner_headline: string;
  cards: PricingCard[];
}

interface PromotionalFooterProps {
  isChatOpen?: boolean;
}

const PromotionalFooter = ({ isChatOpen = false }: PromotionalFooterProps) => {
  const [campaigns, setCampaigns] = useState<FooterCampaign[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();

  const fetchFooterCampaigns = useCallback(async () => {
    const { data: campaignRows, error } = await supabase
      .from('promotional_campaigns')
      .select(`
        id,
        slug,
        banner_headline,
        pricing_card_1_title,
        pricing_card_1_price,
        pricing_card_1_enabled,
        pricing_card_2_title,
        pricing_card_2_price,
        pricing_card_2_enabled,
        pricing_card_3_title,
        pricing_card_3_price,
        pricing_card_3_enabled
      `)
      .eq('is_active', true)
      .eq('visibility_mode', 'public')
      .eq('promotional_footer_enabled', true)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching footer campaigns:', error);
      return;
    }

    const rows = campaignRows || [];
    if (rows.length === 0) {
      setCampaigns([]);
      return;
    }

    const ids = rows.map((c: any) => c.id);
    const { data: pkgRows, error: pkgError } = await supabase
      .from('campaign_packages')
      .select('campaign_id,title,price_display,sort_order,is_enabled')
      .in('campaign_id', ids)
      .eq('is_enabled', true)
      .order('sort_order', { ascending: true });

    if (pkgError) {
      console.error('Error fetching campaign packages:', pkgError);
    }

    const pkgsByCampaign = new Map<string, PricingCard[]>();
    (pkgRows || []).forEach((p: any) => {
      const list = pkgsByCampaign.get(p.campaign_id) || [];
      list.push({ title: p.title, price: p.price_display });
      pkgsByCampaign.set(p.campaign_id, list);
    });

    const result: FooterCampaign[] = rows.map((c: any) => {
      const pkgCards = pkgsByCampaign.get(c.id);
      let cards: PricingCard[];
      if (pkgCards && pkgCards.length > 0) {
        cards = pkgCards.slice(0, 3);
      } else {
        // Legacy fallback
        cards = [
          c.pricing_card_1_enabled && { title: c.pricing_card_1_title, price: c.pricing_card_1_price },
          c.pricing_card_2_enabled && { title: c.pricing_card_2_title, price: c.pricing_card_2_price },
          c.pricing_card_3_enabled && { title: c.pricing_card_3_title, price: c.pricing_card_3_price },
        ].filter(Boolean) as PricingCard[];
      }
      return {
        id: c.id,
        slug: c.slug,
        banner_headline: c.banner_headline,
        cards,
      };
    });

    setCampaigns(result);
  }, []);

  useEffect(() => {
    fetchFooterCampaigns();

    const campaignsChannel = supabase
      .channel('promotional-footer-campaigns')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'promotional_campaigns' },
        () => { fetchFooterCampaigns(); }
      )
      .subscribe();

    const packagesChannel = supabase
      .channel('promotional-footer-packages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'campaign_packages' },
        () => { fetchFooterCampaigns(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(campaignsChannel);
      supabase.removeChannel(packagesChannel);
    };
  }, [fetchFooterCampaigns]);

  // Auto-rotate campaigns every 5 seconds if multiple campaigns exist
  useEffect(() => {
    if (campaigns.length <= 1) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % campaigns.length);
        setIsTransitioning(false);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, [campaigns.length]);

  if (campaigns.length === 0) return null;

  const safeIndex = currentIndex % campaigns.length;
  const campaign = campaigns[safeIndex];
  const pricingCards = campaign.cards;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`View promotion: ${campaign.banner_headline}`}
      onClick={() => navigate(`/promo/${campaign.slug}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/promo/${campaign.slug}`);
        }
      }}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-brand-gradient hover:bg-brand-gradient-hover cursor-pointer py-3 px-4 text-white text-center shadow-lg overflow-hidden",
        "md:block",
        isChatOpen ? "hidden" : "block"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center gap-2 md:gap-4 lg:gap-8 text-xs sm:text-sm md:text-base flex-wrap transition-all duration-500",
          isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
        )}
      >
        <span className="font-medium whitespace-nowrap">{campaign.banner_headline}</span>
        {pricingCards.map((card, index) => (
          <div key={index} className="flex items-center gap-2 md:gap-4">
            <span className="hidden sm:inline text-white/80">|</span>
            <span className="whitespace-nowrap">
              {card.title}: <span className="font-bold">{card.price}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PromotionalFooter;
