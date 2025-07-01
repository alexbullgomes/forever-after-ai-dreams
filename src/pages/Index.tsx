
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Portfolio from "@/components/Portfolio";
import Testimonials from "@/components/Testimonials";
import Contact from "@/components/Contact";
import AuthModal from "@/components/AuthModal";
import Navigation from "@/components/Navigation";
import { useState } from "react";

const Index = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <Hero onBookingClick={() => setIsAuthModalOpen(true)} />
      <Services onBookingClick={() => setIsAuthModalOpen(true)} />
      <Portfolio />
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
