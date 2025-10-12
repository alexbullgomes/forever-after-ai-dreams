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
  const [campaign, setCampaign] = useState<FooterCampaign | null>(null);
  const navigate = useNavigate();

  const fetchFooterCampaign = async () => {
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
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching footer campaign:', error);
      return;
    }

    setCampaign(data);
  };

  useEffect(() => {
    fetchFooterCampaign();

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
          fetchFooterCampaign();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!campaign) return null;

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
      onClick={() => navigate(`/promo/${campaign.slug}`)}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 transition-all duration-300 cursor-pointer py-3 px-4 text-white text-center shadow-lg",
        "md:block", // Always show on desktop
        isChatOpen ? "hidden" : "block" // Hide on mobile when chat is open
      )}
    >
      <div className="flex items-center justify-center gap-2 md:gap-4 lg:gap-8 text-xs sm:text-sm md:text-base flex-wrap">
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
