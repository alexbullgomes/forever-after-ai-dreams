
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Portfolio from "@/components/Portfolio";
import Testimonials from "@/components/Testimonials";
import Contact from "@/components/Contact";
import AuthModal from "@/components/AuthModal";
import ExpandableChatWebhook from "@/components/ui/expandable-chat-webhook";
import { ExpandableChatAssistant } from "@/components/ui/expandable-chat-assistant";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
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
        <ExpandableChatAssistant />
      ) : (
        <ExpandableChatWebhook onOpenLogin={() => setIsAuthModalOpen(true)} />
      )}
    </div>
  );
};

export default Index;
