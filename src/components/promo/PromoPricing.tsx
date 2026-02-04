import { CampaignPricingCard } from "./CampaignPricingCard";
import { CampaignPackage } from "@/hooks/useCampaignPackages";

interface PromoPricingProps {
  packages: CampaignPackage[];
  campaignId: string;
  campaignSlug: string;
}

const PromoPricing = ({ packages, campaignId, campaignSlug }: PromoPricingProps) => {
  const enabledPackages = packages.filter(pkg => pkg.is_enabled);

  if (enabledPackages.length === 0) {
    return null;
  }

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
            Special Promotional Packages
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Take advantage of our limited-time promotional offers
          </p>
        </div>

        <div className={`grid gap-8 ${
          enabledPackages.length === 1 ? 'max-w-md mx-auto' :
          enabledPackages.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' :
          'md:grid-cols-3'
        }`}>
          {enabledPackages.map((pkg) => (
            <CampaignPricingCard
              key={pkg.id}
              name={pkg.title}
              price={pkg.price_display}
              description={pkg.description || ''}
              features={pkg.features}
              popular={pkg.is_popular}
              idealFor={pkg.ideal_for || undefined}
              campaignId={campaignId}
              campaignSlug={campaignSlug}
              packageId={pkg.id}
              minimumDepositCents={pkg.minimum_deposit_cents}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PromoPricing;
