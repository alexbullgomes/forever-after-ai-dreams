import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useState } from "react";
import ConsultationForm from "@/components/ConsultationForm";

interface PromoHeroProps {
  videoUrl?: string | null;
  posterUrl?: string | null;
  headline: string;
  subheadline: string;
  tagline: string;
}

const PromoHero = ({ videoUrl, posterUrl, headline, subheadline, tagline }: PromoHeroProps) => {
  const [isConsultationFormOpen, setIsConsultationFormOpen] = useState(false);

  return (
    <>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {videoUrl && (
          <video
            autoPlay
            loop
            muted
            playsInline
            poster={posterUrl || undefined}
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
        )}
        
        {!videoUrl && posterUrl && (
          <div 
            className="absolute inset-0 w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${posterUrl})` }}
          />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60" />
        
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="animate-fade-in">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
              {headline}
            </h1>
            <p className="text-2xl sm:text-3xl text-white/90 mb-4 font-light">
              {subheadline}
            </p>
            <p className="text-lg sm:text-xl text-white/80 mb-12 max-w-3xl mx-auto">
              {tagline}
            </p>
            
            <div className="flex justify-center">
              <Button
                onClick={() => setIsConsultationFormOpen(true)}
                size="lg"
                className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-rose-500/25 transition-all duration-300"
              >
                <Heart className="w-5 h-5 mr-2" />
                Let's Plan Together
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-16 text-white">
            <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-6 border border-white/20">
              <div className="text-3xl font-bold mb-2">500+</div>
              <div className="text-sm text-white/80">Happy Couples</div>
            </div>
            <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-6 border border-white/20">
              <div className="text-3xl font-bold mb-2">Award Winning</div>
              <div className="text-sm text-white/80">Excellence</div>
            </div>
            <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-6 border border-white/20">
              <div className="text-3xl font-bold mb-2">California</div>
              <div className="text-sm text-white/80">Based</div>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-white/50 rounded-full animate-bounce"></div>
          </div>
        </div>
        
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-rose-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-full blur-3xl animate-pulse delay-700"></div>
      </section>

      <ConsultationForm 
        isOpen={isConsultationFormOpen}
        onClose={() => setIsConsultationFormOpen(false)}
      />
    </>
  );
};

export default PromoHero;
