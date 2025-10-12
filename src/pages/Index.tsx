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
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <Header onLoginClick={() => setIsAuthModalOpen(true)} />
      <Hero onBookingClick={() => setIsAuthModalOpen(true)} />
      <Services onBookingClick={() => setIsAuthModalOpen(true)} />
      <Portfolio onBookingClick={() => setIsAuthModalOpen(true)} />
      <Testimonials />
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
      
      <PromotionalFooter isChatOpen={isChatOpen} />
    </div>
  );
};

export default Index;
