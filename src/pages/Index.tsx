import Hero from "@/components/Hero";
import Header from "@/components/Header";
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

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Everafter Studio",
  "description": "Premium visual storytelling studio in California specializing in cinematic wedding videography and professional photography",
  "url": "https://everafter-studio.lovable.app",
  "telephone": "(442) 224-4820",
  "email": "contact@everafterca.com",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "California",
    "addressCountry": "US"
  },
  "priceRange": "$$",
  "image": "https://everafter-studio.lovable.app/og-image.jpg",
  "sameAs": [
    "https://www.instagram.com/everafterca",
    "https://www.tiktok.com/@everafter.ca"
  ]
};

const Index = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { user } = useAuth();
  const { showPopup, popupConfig, closePopup } = usePromotionalPopup();

  return (
    <div className="min-h-screen bg-white">
      <main id="main-content">
      <SEO 
        title="Wedding Videography & Photography California"
        description="California's premier wedding videography & photography studio. Award-winning cinematic films and professional photos for weddings, families, and businesses."
        canonical="/"
        schema={localBusinessSchema}
      />
      <Header onLoginClick={() => setIsAuthModalOpen(true)} />
      <Hero onBookingClick={() => setIsAuthModalOpen(true)} />
      <Services onBookingClick={() => setIsAuthModalOpen(true)} />
      <Portfolio onBookingClick={() => setIsAuthModalOpen(true)} />
      <Testimonials />
      <BlogSection />
      <Contact />
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
