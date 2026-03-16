import { CampaignCardsSection } from "@/components/planner/CampaignCardsSection";
import { ProductsSection } from "@/components/planner/ProductsSection";
import EverAfterGallery from "@/components/galleries/EverAfterGallery";
import SEO from "@/components/SEO";

const MyServices = () => {
  return (
    <div>
      <SEO 
        title="Services"
        description="Explore our wedding photography and videography services."
        noIndex={true}
      />
      
      {/* Welcome Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Services</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Let our smart assistant help you find the perfect photo or video package for your special moment—whether it's a wedding, family milestone, or business event.
        </p>
      </div>

      {/* Active Campaigns Section */}
      <CampaignCardsSection />

      {/* Products Section */}
      <ProductsSection />

      {/* EverAfter Gallery */}
      <div id="everafter-gallery" className="my-16">
        <EverAfterGallery />
      </div>
    </div>
  );
};

export default MyServices;
