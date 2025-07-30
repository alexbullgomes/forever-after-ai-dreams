import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreatePackageBadge } from "@/components/ui/create-package-badge";
import { Star, Camera } from "lucide-react";
import { useState } from "react";
import PersonalizedConsultationForm from "../PersonalizedConsultationForm";

interface CustomPackageCardProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  popular: boolean;
  idealFor?: string;
}

const CustomPackageCard = ({ name, price, description, features, popular, idealFor }: CustomPackageCardProps) => {
  const [isConsultationFormOpen, setIsConsultationFormOpen] = useState(false);

  return (
    <>
      <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl ${
        popular ? 'ring-2 ring-rose-500 scale-105' : 'hover:scale-105'
      }`}>
        {popular && (
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-center py-2 text-sm font-semibold">
            <Star className="w-4 h-4 inline mr-1" />
            Most Popular
          </div>
        )}
        
        <CardHeader className={popular ? 'pt-12' : ''}>
          <CardTitle className="text-2xl font-bold text-center text-gray-900">
            {name}
          </CardTitle>
          <div className="text-center">
            <span className="text-3xl font-bold text-rose-600">{price}</span>
            <div className="mt-2">
              <CreatePackageBadge />
            </div>
          </div>
          <p className="text-center text-gray-600 italic">{description}</p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                </div>
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
          
          <Button
            onClick={() => setIsConsultationFormOpen(true)}
            className="w-full h-12 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-rose-500/25 transition-all duration-300"
          >
            <Camera className="w-5 h-5 mr-2" />
            Book Consultation
          </Button>
          
          {idealFor && (
            <div className="pt-2 pb-2 text-center">
              <span className="text-sm font-bold text-gray-800">{idealFor}</span>
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
    </>
  );
};

export { CustomPackageCard };