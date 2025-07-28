
import { PackageCard } from "./PackageCard";
import { LucideIcon } from "lucide-react";

interface Package {
  name: string;
  price: string;
  description: string;
  features: string[];
  popular: boolean;
  idealFor?: string;
}

interface PackageSectionProps {
  title: string;
  subtitle: string;
  packages: Package[];
  icon: LucideIcon;
}

const PackageSection = ({ title, subtitle, packages, icon: Icon }: PackageSectionProps) => {
  return (
    <div className="mb-16">
      <div className="text-center mb-12">
        <Icon className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {title}
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          {subtitle}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {packages.map((pkg, index) => (
          <PackageCard
            key={index}
            name={pkg.name}
            price={pkg.price}
            description={pkg.description}
            features={pkg.features}
            popular={pkg.popular}
            idealFor={pkg.idealFor}
          />
        ))}
      </div>
    </div>
  );
};

export { PackageSection };
