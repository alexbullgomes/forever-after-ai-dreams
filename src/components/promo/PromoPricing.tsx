import { PackageCard } from "@/components/wedding/PackageCard";

interface PricingCard {
  enabled: boolean;
  title: string;
  price: string;
  description: string;
  features: string[];
  popular: boolean;
  idealFor?: string;
}

interface PromoPricingProps {
  cards: PricingCard[];
}

const PromoPricing = ({ cards }: PromoPricingProps) => {
  const enabledCards = cards.filter(card => card.enabled);

  if (enabledCards.length === 0) {
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
          enabledCards.length === 1 ? 'max-w-md mx-auto' :
          enabledCards.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' :
          'md:grid-cols-3'
        }`}>
          {enabledCards.map((card, index) => (
            <PackageCard
              key={index}
              name={card.title}
              price={card.price}
              description={card.description}
              features={card.features}
              popular={card.popular}
              idealFor={card.idealFor}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PromoPricing;
