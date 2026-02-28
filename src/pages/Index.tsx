import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Portfolio from "@/components/Portfolio";
import Testimonials from "@/components/Testimonials";
import Contact from "@/components/Contact";
import AuthModal from "@/components/AuthModal";
import ExpandableChatWebhook from "@/components/ui/expandable-chat-webhook";
import { ExpandableChatAssistant } from "@/components/ui/expandable-chat-assistant";
import PromotionalFooter from "@/components/PromotionalFooter";
import PromotionalPopup from "@/components/PromotionalPopup";
import SEO from "@/components/SEO";
import BlogSection from "@/components/blog/BlogSection";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePromotionalPopup } from "@/hooks/usePromotionalPopup";
import { useHomepageContent } from "@/hooks/useHomepageContent";

const Index = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { user } = useAuth();
  const { showPopup, popupConfig, closePopup } = usePromotionalPopup();
  const { content } = useHomepageContent();

  const seo = content.homepage_seo;

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": seo.business_name,
    "description": seo.seo_description,
    "url": "https://everafter-studio.lovable.app",
    "telephone": seo.phone,
    "email": seo.email,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": seo.address_locality,
      "addressCountry": "US"
    },
    "priceRange": "$$",
    "image": "https://everafter-studio.lovable.app/og-image.jpg",
    "sameAs": seo.social_urls
  };

  return (
    <div className="min-h-screen bg-white">
      <main id="main-content">
      <SEO 
        title={seo.seo_title}
        description={seo.seo_description}
        canonical="/"
        schema={localBusinessSchema}
      />
      <Header onLoginClick={() => setIsAuthModalOpen(true)} />
      <Hero onBookingClick={() => setIsAuthModalOpen(true)} content={content.homepage_hero} />
      <Services onBookingClick={() => setIsAuthModalOpen(true)} content={content.homepage_services_header} />
      <Portfolio onBookingClick={() => setIsAuthModalOpen(true)} content={content.homepage_portfolio_header} />
      <Testimonials content={content.homepage_testimonials} />
      <BlogSection content={content.homepage_blog_header} />
      <Contact content={content.homepage_contact} />
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
      
      {/* Conditional chat based on login state */}
      {user ? (
        <ExpandableChatAssistant onOpenChange={setIsChatOpen} />
      ) : (
        <ExpandableChatWebhook onOpenLogin={() => setIsAuthModalOpen(true)} onOpenChange={setIsChatOpen} />
      )}
      
      {/* Dynamic promotional popup */}
      {popupConfig && (
        <PromotionalPopup 
          isOpen={showPopup} 
          onClose={closePopup}
          config={popupConfig}
        />
      )}
      
      <PromotionalFooter isChatOpen={isChatOpen} />
      </main>
    </div>
  );
};

export default Index;
