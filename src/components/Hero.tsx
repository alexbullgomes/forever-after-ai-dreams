import { Button } from "@/components/ui/button";
import { Play, Heart, Camera, Users } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import ConsultationForm from "./ConsultationForm";
import type { HeroContent } from "@/hooks/useHomepageContent";

interface HeroProps {
  onBookingClick: () => void;
  content?: HeroContent;
}

const Hero = ({ onBookingClick, content }: HeroProps) => {
  const [isConsultationFormOpen, setIsConsultationFormOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleBookingClick = () => {
    if (user) {
      navigate('/user-dashboard/my-services');
    } else {
      onBookingClick();
    }
  };

  const badgeText = content?.badge_text ?? "California-Based Premium Visual Storytelling";
  const headlineLine1 = content?.headline_line1 ?? "Everafter";
  const headlineLine2 = content?.headline_line2 ?? "Memories That Last";
  const description = content?.description ?? "California-based visual storytelling brand specialized in cinematic photography and videography for weddings, families, and businesses.";
  const ctaText = content?.cta_text ?? "Let's Plan Together";
  const posterUrl = content?.poster_url ?? "https://supabasestudio.agcreationmkt.cloud/storage/v1/object/public/weddingvideo/Homepicture.webp";
  const videoWebmUrl = content?.video_webm_url ?? "https://supabasestudio.agcreationmkt.cloud/storage/v1/object/public/weddingvideo/bannerhomepage.webm";
  const videoMp4Url = content?.video_mp4_url ?? "https://supabasestudio.agcreationmkt.cloud/storage/v1/object/public/weddingvideo/bannerhomepage.mp4?t=2025-10-06T20%3A46%3A21.431Z";
  const trustIndicators = content?.trust_indicators ?? [
    { emoji: "⭐", text: "500+ Happy Couples" },
    { emoji: "🏆", text: "Award Winning" },
    { emoji: "📍", text: "California Based" }
  ];

  return <>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video 
            autoPlay 
            muted 
            loop 
            playsInline 
            poster={posterUrl}
            className="absolute inset-0 w-full h-full object-cover"
            // @ts-expect-error fetchpriority is not yet in React types
            fetchpriority="high"
          >
            <source src={videoWebmUrl} type="video/webm" />
            <source src={videoMp4Url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="absolute inset-0 bg-hero-overlay/40"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
            <div className="mb-6 flex justify-center">
              <div className="flex items-center space-x-2 bg-hero-badge-bg/10 backdrop-blur-sm rounded-full px-4 py-2">
                <Heart className="w-5 h-5 text-hero-badge-icon" />
                <span className="text-hero-text-primary text-sm font-medium">{badgeText}</span>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-hero-text-primary mb-6 leading-tight mix-blend-exclusion">
              {headlineLine1}
              <span className="block bg-gradient-to-r from-hero-gradient-from via-hero-gradient-via to-hero-gradient-to bg-clip-text text-transparent">{headlineLine2}</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-hero-text-muted/90 mb-8 max-w-2xl mx-auto leading-relaxed">{description} </p>

          <div className="flex justify-center items-center">
            <Button onClick={() => setIsConsultationFormOpen(true)} size="lg" className="bg-brand-gradient hover:bg-brand-gradient-hover text-white px-8 py-4 text-lg font-semibold rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105">
              <Heart className="w-5 h-5 mr-2" />
              {ctaText}
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-hero-trust-text/70">
            {trustIndicators.map((indicator, index) => (
              <div key={index} className="flex items-center space-x-2">
                <span className="text-2xl">{indicator.emoji}</span>
                <span className="text-sm">{indicator.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-hero-glow-1-from/20 to-hero-glow-1-to/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-gradient-to-br from-hero-glow-2-from/20 to-hero-glow-2-to/20 rounded-full blur-xl animate-pulse delay-1000"></div>
      </section>

      <ConsultationForm isOpen={isConsultationFormOpen} onClose={() => setIsConsultationFormOpen(false)} />
    </>;
};
export default Hero;
