import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Camera, Sparkles, Video, Film, Star, Award, Gift, Music, Palette, Image, Users, Calendar, Clock, MapPin, Zap, Shield, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLandingPageCards, LandingCard } from "@/hooks/useLandingPageCards";
import { useState } from "react";
import ConsultationForm from "@/components/ConsultationForm";
import type { ServicesHeaderContent } from "@/hooks/useHomepageContent";

// Icon mapping for dynamic rendering
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Heart, Camera, Sparkles, Video, Film, Star, Award, Gift, Music, Palette, Image, Users, Calendar, Clock, MapPin, Zap, Shield, Trophy,
};

interface ServicesProps {
  onBookingClick: () => void;
  content?: ServicesHeaderContent;
}

const Services = ({ onBookingClick, content }: ServicesProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cards, showCardsSection, loading } = useLandingPageCards();
  const [isConsultationFormOpen, setIsConsultationFormOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string>("");
  const [customRedirectLink, setCustomRedirectLink] = useState<string>("");

  const handleServiceClick = (card: LandingCard) => {
    if (user) {
      const targetRoute = card.button_link || '/services';
      navigate(targetRoute);
      setTimeout(() => window.scrollTo(0, 0), 100);
    } else {
      setSelectedService(card.title);
      setCustomRedirectLink(card.button_link || '/services');
      setIsConsultationFormOpen(true);
    }
  };

  if (!showCardsSection || loading) {
    return null;
  }

  const badgeText = content?.badge_text ?? "Our Services";
  const titleLine1 = content?.title_line1 ?? "Capturing";
  const titleLine2 = content?.title_line2 ?? "Every Frame";
  const subtitle = content?.subtitle ?? "Professional videography and photography services designed to tell your unique story.";
  const additionalFeatures = content?.additional_features ?? [
    { icon: "Clock", title: "Quick Turnaround", description: "Receive your highlights within 48 hours" },
    { icon: "Award", title: "Award Winning", description: "Recognized for excellence in wedding cinematography" },
    { icon: "Heart", title: "Personal Touch", description: "Tailored approach to your unique love story" }
  ];

  const iconBgClasses = [
    "bg-brand-icon-bg-primary",
    "bg-brand-icon-bg-secondary",
    "bg-brand-icon-bg-accent",
  ];

  const buttonGradients = [
    "bg-brand-gradient hover:bg-brand-gradient-hover",
    "bg-gradient-to-r from-brand-icon-bg-secondary to-brand-icon-bg-primary hover:opacity-90",
    "bg-gradient-to-r from-brand-icon-bg-accent to-brand-icon-bg-primary hover:opacity-90",
  ];

  return (
    <section id="services" className="hidden sm:block py-20 bg-section-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <div className="flex items-center space-x-2 rounded-full px-4 py-2" style={{ backgroundColor: `hsl(var(--brand-badge-bg))` }}>
              <Heart className="w-5 h-5 text-brand-text-accent" />
              <span className="text-brand-badge-text text-sm font-medium">{badgeText}</span>
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            {titleLine1}
            <span className="block bg-brand-gradient bg-clip-text text-transparent">
              {titleLine2}
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {cards.map((card, index) => {
            const IconComponent = ICON_MAP[card.icon] || Heart;
            return (
              <Card 
                key={index} 
                className="group hover:shadow-2xl transition-all duration-500 border-0 bg-card/70 backdrop-blur-sm hover:scale-105"
              >
                <CardContent className="p-8">
                  <div className={`w-16 h-16 rounded-2xl ${iconBgClasses[index % iconBgClasses.length]} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 bg-service-icon-gradient`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-foreground mb-4">{card.title}</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">{card.description}</p>
                  
                  <ul className="space-y-2 mb-8">
                    {card.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-foreground/80">
                        <div className="w-2 h-2 bg-brand-feature-dot rounded-full mr-3"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button 
                    onClick={() => handleServiceClick(card)} 
                    className={`w-full ${buttonGradients[index % buttonGradients.length]} transition-all duration-300 text-white font-semibold py-3 rounded-xl`}
                  >
                    {card.button_label || "More Details"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional features */}
        <div className="grid md:grid-cols-3 gap-8 text-center">
          {additionalFeatures.map((feature, index) => {
            const FeatureIcon = ICON_MAP[feature.icon] || Heart;
            return (
              <div key={index} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-service-icon-gradient">
                  <FeatureIcon className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h4>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      <ConsultationForm
        isOpen={isConsultationFormOpen}
        onClose={() => setIsConsultationFormOpen(false)}
        portfolioItem={null}
        serviceName={selectedService}
        customRedirectLink={customRedirectLink}
      />
    </section>
  );
};

export default Services;
