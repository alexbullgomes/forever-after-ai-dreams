import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import PromoHero from "@/components/promo/PromoHero";
import PromoPricing from "@/components/promo/PromoPricing";
import Contact from "@/components/Contact";
import ExpandableChatWebhook from "@/components/ui/expandable-chat-webhook";
import { ExpandableChatAssistant } from "@/components/ui/expandable-chat-assistant";
import { useAuth } from "@/contexts/AuthContext";
import { usePromotionalCampaign } from "@/hooks/usePromotionalCampaign";
import { useState } from "react";
import AuthModal from "@/components/AuthModal";

const PromotionalLanding = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { campaign, loading, error } = usePromotionalCampaign(slug || '');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
        <div className="text-center px-4">
          <h1 className="text-6xl font-bold mb-4">404</h1>
          <p className="text-xl text-muted-foreground mb-8">
            {error || 'Campaign not found'}
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold rounded-lg hover:from-rose-600 hover:to-pink-600 transition-all"
          >
            Return Home
          </a>
        </div>
      </div>
    );
  }

  const pricingCards = [
    {
      enabled: campaign.pricing_card_1_enabled,
      title: campaign.pricing_card_1_title,
      price: campaign.pricing_card_1_price,
      description: campaign.pricing_card_1_description || '',
      features: campaign.pricing_card_1_features,
      popular: campaign.pricing_card_1_popular,
      idealFor: campaign.pricing_card_1_ideal_for || undefined,
    },
    {
      enabled: campaign.pricing_card_2_enabled,
      title: campaign.pricing_card_2_title,
      price: campaign.pricing_card_2_price,
      description: campaign.pricing_card_2_description || '',
      features: campaign.pricing_card_2_features,
      popular: campaign.pricing_card_2_popular,
      idealFor: campaign.pricing_card_2_ideal_for || undefined,
    },
    {
      enabled: campaign.pricing_card_3_enabled,
      title: campaign.pricing_card_3_title,
      price: campaign.pricing_card_3_price,
      description: campaign.pricing_card_3_description || '',
      features: campaign.pricing_card_3_features,
      popular: campaign.pricing_card_3_popular,
      idealFor: campaign.pricing_card_3_ideal_for || undefined,
    },
  ];

  return (
    <>
      <Helmet>
        <title>{campaign.meta_title || campaign.title} | Everafter</title>
        <meta name="description" content={campaign.meta_description || campaign.banner_tagline} />
        <meta property="og:title" content={campaign.meta_title || campaign.title} />
        <meta property="og:description" content={campaign.meta_description || campaign.banner_tagline} />
        {campaign.meta_image_url && <meta property="og:image" content={campaign.meta_image_url} />}
        <meta property="og:url" content={`https://everafter.lovable.app/promo/${campaign.slug}`} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header onLoginClick={() => setIsAuthModalOpen(true)} />
        
        <PromoHero
          videoUrl={campaign.banner_video_url}
          posterUrl={campaign.banner_poster_url}
          headline={campaign.banner_headline}
          subheadline={campaign.banner_subheadline}
          tagline={campaign.banner_tagline}
        />

        <PromoPricing cards={pricingCards} />

        <Contact />

        {user ? (
          <ExpandableChatAssistant />
        ) : (
          <ExpandableChatWebhook />
        )}

        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
        />
      </div>
    </>
  );
};

export default PromotionalLanding;
