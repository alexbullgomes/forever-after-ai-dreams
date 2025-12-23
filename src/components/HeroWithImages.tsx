
import { Button } from "@/components/ui/button";
import { Heart, Play } from "lucide-react";
import { useState } from "react";
import AuthModal from "./AuthModal";

const HeroWithImages = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
      <div className="relative min-h-screen bg-section-subtle overflow-hidden">
        {/* Background Images */}
        <div className="absolute inset-0 grid grid-cols-3 md:grid-cols-4 gap-4 p-4 opacity-10">
          <img 
            src="https://images.unsplash.com/photo-1519741497674-611481863552" 
            alt="Wedding couple" 
            className="w-full h-32 md:h-48 object-cover rounded-lg"
          />
          <img 
            src="https://images.unsplash.com/photo-1606216794074-735e91aa2c92" 
            alt="Wedding rings" 
            className="w-full h-32 md:h-48 object-cover rounded-lg mt-8"
          />
          <img 
            src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc" 
            alt="Wedding ceremony" 
            className="w-full h-32 md:h-48 object-cover rounded-lg"
          />
          <img 
            src="https://images.unsplash.com/photo-1520854221256-17451cc331bf" 
            alt="Wedding bouquet" 
            className="w-full h-32 md:h-48 object-cover rounded-lg mt-8 hidden md:block"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <Heart className="w-16 h-16 text-brand-primary-from mx-auto mb-6 animate-pulse" />
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6">
              <span className="bg-brand-gradient bg-clip-text text-transparent">
                Dream Weddings
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Capturing your love story through cinematic films and stunning photography. 
              Creating timeless memories across California's most beautiful venues.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                size="lg" 
                onClick={() => setShowAuthModal(true)}
                className="bg-brand-gradient hover:bg-brand-gradient-hover text-white px-8 py-4 text-lg font-semibold rounded-full shadow-2xl hover:shadow-brand-primary-from/25 transition-all duration-300"
              >
                View Exclusive Packages
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-brand-primary-from/30 text-brand-primary-from hover:bg-brand-primary-from/5 px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300"
              >
                <Play className="w-5 h-5 mr-2" />
                Watch Our Films
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-brand-primary-from">500+</div>
                <div className="text-muted-foreground">Happy Couples</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-brand-primary-from">50+</div>
                <div className="text-muted-foreground">Venues</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-brand-primary-from">8+</div>
                <div className="text-muted-foreground">Years Experience</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-brand-primary-from">5★</div>
                <div className="text-muted-foreground">Average Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
};

export { HeroWithImages };
