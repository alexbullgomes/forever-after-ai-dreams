
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Portfolio from "@/components/Portfolio";
import WhatsAppSection from "@/components/WhatsAppSection";
import Testimonials from "@/components/Testimonials";
import Contact from "@/components/Contact";
import AuthModal from "@/components/AuthModal";
import { useState } from "react";

const Index = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <Hero onBookingClick={() => setIsAuthModalOpen(true)} />
      <Services onBookingClick={() => setIsAuthModalOpen(true)} />
      <Portfolio onBookingClick={() => setIsAuthModalOpen(true)} />
      <WhatsAppSection />
      <Testimonials />
      <Contact />
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
};

export default Index;
