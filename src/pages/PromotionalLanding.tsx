import { useParams } from "react-router-dom";
import { usePromotionalCampaign, TrackingScript } from "@/hooks/usePromotionalCampaign";
import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import Header from "@/components/Header";
import PromoHero from "@/components/promo/PromoHero";
import PromoPricing from "@/components/promo/PromoPricing";
import Contact from "@/components/Contact";
import ExpandableChatWebhook from "@/components/ui/expandable-chat-webhook";
import { ExpandableChatAssistant } from "@/components/ui/expandable-chat-assistant";
import { useAuth } from "@/contexts/AuthContext";
import { PromotionalCampaignGallery } from "@/components/galleries/PromotionalCampaignGallery";
import { CampaignProductsSection } from "@/components/promo/CampaignProductsSection";
import AuthModal from "@/components/AuthModal";

// Allowed tracking script domains for validation
const ALLOWED_SCRIPT_DOMAINS = [
  'googletagmanager.com',
  'google-analytics.com',
  'analytics.google.com',
  'facebook.net',
  'connect.facebook.net',
  'pixel.facebook.com',
  'snap.licdn.com',
  'analytics.tiktok.com',
  'sc-static.net',
  'ads-twitter.com',
  'static.ads-twitter.com',
  'pinterest.com',
  'pinimg.com',
];

// Sanitize and validate tracking script content
const sanitizeTrackingScript = (code: string): string | null => {
  // Remove any script tags - we'll wrap in script ourselves
  const strippedCode = code.replace(/<\/?script[^>]*>/gi, '').trim();
  
  if (!strippedCode) return null;

  // Check for dangerous patterns
  const dangerousPatterns = [
    /document\.cookie/i,
    /localStorage/i,
    /sessionStorage/i,
    /eval\s*\(/i,
    /new\s+Function\s*\(/i,
    /\.innerHTML\s*=/i,
    /\.outerHTML\s*=/i,
    /document\.write/i,
    /window\.location\s*=/i,
    /fetch\s*\([^)]*(?!googletagmanager|google-analytics|facebook|pinterest|tiktok|twitter|linkedin)/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(strippedCode)) {
      console.warn('Blocked potentially dangerous tracking script pattern');
      return null;
    }
  }

  // Validate that external URLs are from allowed domains
  const urlPattern = /https?:\/\/([^\/\s'"]+)/gi;
  const matches = strippedCode.matchAll(urlPattern);
  
  for (const match of matches) {
    const domain = match[1].toLowerCase();
    const isAllowed = ALLOWED_SCRIPT_DOMAINS.some(allowed => 
      domain === allowed || domain.endsWith('.' + allowed)
    );
    
    if (!isAllowed) {
      console.warn(`Blocked tracking script with disallowed domain: ${domain}`);
      return null;
    }
  }

  return strippedCode;
};

const PromotionalLanding = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { campaign, loading, error } = usePromotionalCampaign(slug || '');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Inject tracking scripts for body_end placement with sanitization
  useEffect(() => {
    if (!campaign?.tracking_scripts) return;

    const enabledBodyScripts = campaign.tracking_scripts.filter(
      (s: TrackingScript) => s.enabled && s.placement === 'body_end'
    );

    const scriptElements: HTMLScriptElement[] = [];

    try {
      enabledBodyScripts.forEach((script: TrackingScript) => {
        const sanitizedCode = sanitizeTrackingScript(script.code);
        if (!sanitizedCode) {
          console.warn(`Skipped unsafe tracking script: ${script.name || script.id}`);
          return;
        }
        
        const scriptEl = document.createElement('script');
        scriptEl.textContent = sanitizedCode; // Use textContent instead of innerHTML
        scriptEl.setAttribute('data-tracking-id', script.id);
        document.body.appendChild(scriptEl);
        scriptElements.push(scriptEl);
      });
    } catch (error) {
      console.error('Error injecting tracking scripts:', error);
    }

    return () => {
      scriptElements.forEach(el => el.remove());
    };
  }, [campaign]);

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

  // Get enabled HEAD tracking scripts
  const headTrackingScripts = campaign?.tracking_scripts?.filter(
    (s: TrackingScript) => s.enabled && s.placement === 'head'
  ) || [];

  // Prepare pricing cards from campaign data
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

  // Build Service schema for structured data
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": campaign.title,
    "description": campaign.meta_description || campaign.banner_tagline,
    "provider": {
      "@type": "LocalBusiness",
      "name": "Everafter Studio",
      "url": "https://everafter-studio.lovable.app"
    },
    "areaServed": "California, USA",
    "image": campaign.meta_image_url || campaign.banner_poster_url
  };

  return (
    <>
      <Helmet>
        <title>{campaign.meta_title || campaign.title} | Everafter Studio</title>
        <meta name="description" content={campaign.meta_description || campaign.banner_tagline} />
        <link rel="canonical" href={`https://everafter-studio.lovable.app/promo/${campaign.slug}`} />
        
        <meta property="og:title" content={`${campaign.meta_title || campaign.title} | Everafter Studio`} />
        <meta property="og:description" content={campaign.meta_description || campaign.banner_tagline} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Everafter Studio" />
        {campaign.meta_image_url && <meta property="og:image" content={campaign.meta_image_url} />}
        <meta property="og:url" content={`https://everafter-studio.lovable.app/promo/${campaign.slug}`} />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@everafterca" />
        <meta name="twitter:title" content={`${campaign.meta_title || campaign.title} | Everafter Studio`} />
        <meta name="twitter:description" content={campaign.meta_description || campaign.banner_tagline} />
        {campaign.meta_image_url && <meta name="twitter:image" content={campaign.meta_image_url} />}
        
        {/* Structured Data */}
        <script type="application/ld+json">{JSON.stringify(serviceSchema)}</script>
        
        {/* Inject HEAD tracking scripts with sanitization */}
        {headTrackingScripts.map((script: TrackingScript) => {
          const sanitizedCode = sanitizeTrackingScript(script.code);
          if (!sanitizedCode) return null;
          return <script key={script.id} dangerouslySetInnerHTML={{ __html: sanitizedCode }} />;
        })}
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

        {/* Pricing Section - now appears first after Hero */}
        {campaign.pricing_section_enabled && (
          <PromoPricing cards={pricingCards} campaignId={campaign.id} campaignSlug={campaign.slug} />
        )}

        {/* Campaign Products Section */}
        {campaign.products_section_enabled && (
          <CampaignProductsSection campaignId={campaign.id} campaignSlug={slug!} />
        )}

        {/* Campaign Gallery Section */}
        <PromotionalCampaignGallery campaignId={campaign.id} />

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
