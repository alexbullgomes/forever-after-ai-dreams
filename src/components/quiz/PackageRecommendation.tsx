
import { Badge } from "@/components/ui/badge";
import { EstimatedPriceBadge } from "@/components/ui/estimated-price-badge";
import { PackageInfo } from "./utils/packageCalculator";

interface PackageRecommendationProps {
  packageInfo: PackageInfo;
  userFullName: string;
}

const PackageRecommendation = ({ packageInfo, userFullName }: PackageRecommendationProps) => {
  const IconComponent = packageInfo.icon;

  return (
    <div className="bg-section-subtle rounded-xl p-8 mb-8">
      <div className="text-center">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-4 p-4 rounded-full bg-brand-light">
          <IconComponent className="w-full h-full text-brand-primary-from" />
        </div>
        
        {/* Package Type Badge */}
        <Badge variant="secondary" className="mb-4">
          {packageInfo.type}
        </Badge>
        
        {/* Package Name */}
        <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
          {packageInfo.name}
        </h3>
        
        {/* Price */}
        <p className="text-4xl font-bold text-brand-primary-from mb-2">
          {packageInfo.price}
        </p>
        
        {/* Estimated Price Badge */}
        <div className="mb-6">
          <EstimatedPriceBadge />
        </div>
        
        {/* Description */}
        <p className="text-foreground/80 leading-relaxed max-w-md mx-auto">
          Based on your answers, this package perfectly captures your vision for intimate, 
          authentic moments while fitting your style and budget preferences.
        </p>
      </div>
    </div>
  );
};

export default PackageRecommendation;
