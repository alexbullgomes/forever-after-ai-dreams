import { PackageCard } from "./PackageCard";
import { LucideIcon } from "lucide-react";
interface Package {
  name: string;
  price: string;
  description: string;
  features: string[];
  popular: boolean;
}
interface PackageSectionProps {
  title: string;
  subtitle: string;
  packages: Package[];
  icon: LucideIcon;
}
const PackageSection = ({
  title,
  subtitle,
  packages,
  icon: Icon
}: PackageSectionProps) => {
  return <div className="mb-16">
      

      <div className="grid md:grid-cols-3 gap-8">
        {packages.map((pkg, index) => <PackageCard key={index} name={pkg.name} price={pkg.price} description={pkg.description} features={pkg.features} popular={pkg.popular} />)}
      </div>
    </div>;
};
export { PackageSection };