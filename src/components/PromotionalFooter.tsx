import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface FooterCampaign {
  slug: string;
  banner_headline: string;
  pricing_card_1_title: string;
  pricing_card_1_price: string;
  pricing_card_1_enabled: boolean;
  pricing_card_2_title: string;
  pricing_card_2_price: string;
  pricing_card_2_enabled: boolean;
  pricing_card_3_title: string;
  pricing_card_3_price: string;
  pricing_card_3_enabled: boolean;
}

interface PromotionalFooterProps {
  isChatOpen?: boolean;
}

const PromotionalFooter = ({ isChatOpen = false }: PromotionalFooterProps) => {
  const [campaigns, setCampaigns] = useState<FooterCampaign[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();

  const fetchFooterCampaigns = async () => {
    const { data, error } = await supabase
      .from('promotional_campaigns')
      .select(`
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
      .eq('promotional_footer_enabled', true)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching footer campaigns:', error);
      return;
    }

    setCampaigns(data || []);
  };

  useEffect(() => {
    fetchFooterCampaigns();

    const channel = supabase
      .channel('promotional-footer-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'promotional_campaigns'
        },
        () => {
          fetchFooterCampaigns();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-rotate campaigns every 5 seconds if multiple campaigns exist
  useEffect(() => {
    if (campaigns.length <= 1) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % campaigns.length);
        setIsTransitioning(false);
      }, 300); // Half of transition duration for crossfade effect
    }, 5000);

    return () => clearInterval(interval);
  }, [campaigns.length]);

  if (campaigns.length === 0) return null;

  const campaign = campaigns[currentIndex];

  const pricingCards = [
    campaign.pricing_card_1_enabled && {
      title: campaign.pricing_card_1_title,
      price: campaign.pricing_card_1_price
    },
    campaign.pricing_card_2_enabled && {
      title: campaign.pricing_card_2_title,
      price: campaign.pricing_card_2_price
    },
    campaign.pricing_card_3_enabled && {
      title: campaign.pricing_card_3_title,
      price: campaign.pricing_card_3_price
    }
  ].filter(Boolean);

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
        "md:block", // Always show on desktop
        isChatOpen ? "hidden" : "block" // Hide on mobile when chat is open
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
