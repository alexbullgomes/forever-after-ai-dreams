import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Heart } from "lucide-react";
import { DashboardNavigation } from "@/components/dashboard/DashboardNavigation";
import { PackageSection } from "@/components/wedding/PackageSection";
import { CTASection } from "@/components/wedding/CTASection";
import WeddingGallery from "@/components/galleries/WeddingGallery";
import WeddingPackagesHeader from "@/components/wedding/WeddingPackagesHeader";
import LoadingState from "@/components/wedding/LoadingState";
import { combinedPackages } from "@/data/weddingPackages";

const WeddingPackages = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/';
    }
  }, [user, loading]);

  if (loading) {
    return <LoadingState />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50">
      <DashboardNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <WeddingPackagesHeader />

        {/* Combined Photo & Video Packages */}
        <div id="combined-packages">
          <PackageSection 
            title="Your Dream Wedding Photo & Video Packages" 
            subtitle="Your wedding day is more than an event — it's the beginning of your forever." 
            packages={combinedPackages} 
            icon={Heart} 
          />
        </div>

        {/* Wedding Gallery */}
        <div id="wedding-gallery" className="my-16">
          <WeddingGallery />
        </div>


        {/* CTA Section */}
        <div id="contact-cta">
          <CTASection />
        </div>
      </div>
    </div>
  );
};

export default WeddingPackages;