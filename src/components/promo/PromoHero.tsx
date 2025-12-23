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
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          {videoUrl && (
            <video
              autoPlay
              muted
              loop
              playsInline
              poster={posterUrl || undefined}
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}
          {!videoUrl && posterUrl && (
            <div 
              className="absolute inset-0 w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${posterUrl})` }}
            />
          )}
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="mb-6 flex justify-center">
            <div className="flex items-center space-x-2 bg-card/10 backdrop-blur-sm rounded-full px-4 py-2">
              <Heart className="w-5 h-5 text-brand-primary-from" />
              <span className="text-primary-foreground text-sm font-medium">California-Based Premium Visual Storytelling</span>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground mb-6 leading-tight mix-blend-exclusion">
            {headline}
            <span className="block text-brand-gradient bg-brand-gradient bg-clip-text text-transparent">{subheadline}</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto leading-relaxed">{tagline}</p>

          <div className="flex justify-center items-center">
            <Button
              onClick={() => setIsConsultationFormOpen(true)}
              size="lg"
              className="bg-brand-gradient hover:bg-brand-gradient-hover text-primary-foreground px-8 py-4 text-lg font-semibold rounded-full shadow-2xl hover:shadow-brand-primary-from/25 transition-all duration-300 transform hover:scale-105"
            >
              <Heart className="w-5 h-5 mr-2" />
              Let's Plan Together
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-primary-foreground/70">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">⭐</span>
              <span className="text-sm">500+ Happy Couples</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🏆</span>
              <span className="text-sm">Award Winning</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">📍</span>
              <span className="text-sm">California Based</span>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-[radial-gradient(circle,hsl(var(--brand-primary-from)/0.2),hsl(var(--brand-primary-to)/0.2))] rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-[radial-gradient(circle,hsl(var(--accent)/0.2),hsl(var(--brand-primary-to)/0.2))] rounded-full blur-xl animate-pulse delay-1000"></div>
      </section>

      <ConsultationForm 
        isOpen={isConsultationFormOpen}
        onClose={() => setIsConsultationFormOpen(false)}
      />
    </>
  );
};

export default PromoHero;
