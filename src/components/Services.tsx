import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Video, Camera, Sparkles, Heart, Clock, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import ConsultationForm from "@/components/ConsultationForm";
interface ServicesProps {
  onBookingClick: () => void;
}
const Services = ({
  onBookingClick
}: ServicesProps) => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const [isConsultationFormOpen, setIsConsultationFormOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string>("");

  const handleServiceClick = (route: string, serviceTitle: string) => {
    if (user) {
      navigate(route);
      // Scroll to top after navigation
      setTimeout(() => window.scrollTo(0, 0), 100);
    } else {
      // For non-logged-in users, open consultation form with service pre-filled
      setSelectedService(serviceTitle);
      setIsConsultationFormOpen(true);
    }
  };
  const services = [{
    icon: Heart,
    title: "Personalized Planner",
    description: "Meet EVA — our smart assistant who builds your ideal package and unlocks exclusive deals.",
    features: ["EVA, AI-Powered Recommendations", "Smart Custom Packages for You", "Matches for Your Event Type", "Thoughtful Budget Optimization"],
    iconBg: "bg-brand-icon-bg-primary",
    buttonGradient: "bg-brand-gradient hover:bg-brand-gradient-hover",
    route: "/services"
  }, {
    icon: Camera,
    title: "Photo & Video Services",
    description: "Life moves fast, but memories don't have to fade. We capture moments you'll want to hold onto forever.",
    features: ["Genuine Family Portraits", "Stories Behind Your Business", "Corporate Gatherings", "Celebrations and Milestones"],
    iconBg: "bg-brand-icon-bg-secondary",
    buttonGradient: "bg-gradient-to-r from-brand-icon-bg-secondary to-brand-icon-bg-accent hover:opacity-90",
    route: "/photo-video-services"
  }, {
    icon: Sparkles,
    title: "Wedding Packages",
    description: "Your love story feels like a movie — we'll film the moment that matters most.",
    features: ["Photos + Video Packages", "Artistic & Emotional Photography", "Cinematic Wedding Films", "Personalized & Fast Delivery"],
    iconBg: "bg-brand-icon-bg-accent",
    buttonGradient: "bg-gradient-to-r from-brand-icon-bg-accent to-brand-icon-bg-primary hover:opacity-90",
    route: "/wedding-packages"
  }];
  return <section id="services" className="hidden sm:block py-20 bg-gradient-to-br from-gray-50 to-rose-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <div className="flex items-center space-x-2 rounded-full px-4 py-2" style={{ backgroundColor: `hsl(var(--brand-badge-bg))` }}>
              <Heart className="w-5 h-5 text-brand-text-accent" />
              <span className="text-brand-badge-text text-sm font-medium">Our Services</span>
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Capturing
            <span className="block bg-brand-gradient bg-clip-text text-transparent">
              Every Frame
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Professional  videography and photography services designed to tell your unique story.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {services.map((service, index) => <Card key={index} className="group hover:shadow-2xl transition-all duration-500 border-0 bg-card/70 backdrop-blur-sm hover:scale-105">
              <CardContent className="p-8">
                <div className={`w-16 h-16 rounded-2xl ${service.iconBg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 bg-service-icon-gradient`}>
                  <service.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-foreground mb-4">{service.title}</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">{service.description}</p>
                
                <ul className="space-y-2 mb-8">
                  {service.features.map((feature, featureIndex) => <li key={featureIndex} className="flex items-center text-foreground/80">
                      <div className="w-2 h-2 bg-brand-feature-dot rounded-full mr-3"></div>
                      {feature}
                    </li>)}
                </ul>

                <Button onClick={() => handleServiceClick(service.route, service.title)} className={`w-full ${service.buttonGradient} transition-all duration-300 text-white font-semibold py-3 rounded-xl`}>
                  More Details
                </Button>
              </CardContent>
            </Card>)}
        </div>

        {/* Additional features */}
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-service-icon-gradient">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-foreground mb-2">Quick Turnaround</h4>
            <p className="text-muted-foreground">Receive your highlights within 48 hours</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-service-icon-gradient">
              <Award className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-foreground mb-2">Award Winning</h4>
            <p className="text-muted-foreground">Recognized for excellence in wedding cinematography</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-service-icon-gradient">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-foreground mb-2">Personal Touch</h4>
            <p className="text-muted-foreground">Tailored approach to your unique love story</p>
          </div>
        </div>
      </div>

      <ConsultationForm
        isOpen={isConsultationFormOpen}
        onClose={() => setIsConsultationFormOpen(false)}
        portfolioItem={null}
        serviceName={selectedService}
      />
    </section>;
};
export default Services;