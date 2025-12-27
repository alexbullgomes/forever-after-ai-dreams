import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EstimatedPriceBadge } from "@/components/ui/estimated-price-badge";
import { CreatePackageBadge } from "@/components/ui/create-package-badge";
import { Star, Camera } from "lucide-react";
import { useState } from "react";
import PersonalizedConsultationForm from "../PersonalizedConsultationForm";
import PaymentButton from "./PaymentButton";
import AuthModal from "../AuthModal";

interface PackageCardProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  popular: boolean;
  idealFor?: string;
}

const PackageCard = ({ name, price, description, features, popular, idealFor }: PackageCardProps) => {
  const [isConsultationFormOpen, setIsConsultationFormOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleAuthRequired = () => {
    setIsAuthModalOpen(true);
  };

  return (
    <>
      <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl ${
        popular ? 'ring-2 ring-[hsl(var(--brand-primary-from))] scale-105' : 'hover:scale-105'
      }`}>
        {popular && (
          <div className="absolute top-0 left-0 right-0 bg-brand-gradient text-white text-center py-2 text-sm font-semibold">
            <Star className="w-4 h-4 inline mr-1" />
            Most Popular
          </div>
        )}
        
        <CardHeader className={popular ? 'pt-12' : ''}>
          <CardTitle className="text-2xl font-bold text-center text-foreground">
            {name}
          </CardTitle>
          <div className="text-center">
            <span className="text-3xl font-bold text-brand-primary-from">{price}</span>
            <div className="mt-2">
              {name === "Photo & Video Combo" ? <CreatePackageBadge /> : <EstimatedPriceBadge />}
            </div>
          </div>
          <p className="text-center text-muted-foreground italic">{description}</p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <div className="w-5 h-5 rounded-full bg-[hsl(var(--brand-primary-from)/0.1)] flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-brand-primary-from"></div>
                </div>
                <span className="text-foreground/80">{feature}</span>
              </li>
            ))}
          </ul>
          
          <div className="space-y-3">
            <PaymentButton
              packageName={name}
              packagePrice={price}
              onAuthRequired={handleAuthRequired}
              className="w-full h-12 bg-brand-gradient hover:opacity-90 text-white font-semibold rounded-lg shadow-lg transition-all duration-300"
            />
            
            <Button
              onClick={() => setIsConsultationFormOpen(true)}
              variant="outline"
              className="w-full h-10"
            >
              <Camera className="w-4 h-4 mr-2" />
              Free Consultation First
            </Button>
          </div>
          
          {idealFor && (
            <div className="pt-2 pb-2 text-center">
              <span className="text-sm font-bold text-foreground">{idealFor}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <PersonalizedConsultationForm 
        isOpen={isConsultationFormOpen}
        onClose={() => setIsConsultationFormOpen(false)}
        packageName={name}
        packagePrice={price}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
};

export { PackageCard };
