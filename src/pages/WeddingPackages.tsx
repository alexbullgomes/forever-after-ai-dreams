import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Heart, Camera, Video } from "lucide-react";
import { DashboardNavigation } from "@/components/dashboard/DashboardNavigation";
import { PackageSection } from "@/components/wedding/PackageSection";
import { CTASection } from "@/components/wedding/CTASection";
import InteractiveBentoGallery from "@/components/ui/gallery/interactive-bento-gallery";
import WeddingPackagesHeader from "@/components/wedding/WeddingPackagesHeader";
import LoadingState from "@/components/wedding/LoadingState";
import { combinedPackages, photographyPackages, videographyPackages } from "@/data/weddingPackages";
import { weddingGalleryItems } from "@/data/weddingGallery";

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
          <InteractiveBentoGallery 
            mediaItems={weddingGalleryItems}
            title="Our Wedding Gallery"
            description="Explore our collection of beautiful wedding moments and memories"
          />
        </div>

        {/* Photography Packages */}
        <div id="photography">
          <PackageSection 
            title="Wedding Photography Packages" 
            subtitle="Your wedding day is filled with moments that deserve to be remembered forever — the nervous smiles, the quiet glances, the joyful tears." 
            packages={photographyPackages} 
            icon={Camera} 
          />
        </div>

        {/* Videography Packages */}
        <div id="videography">
          <PackageSection 
            title="Wedding Videography Packages" 
            subtitle="Every wedding tells a story — and we're here to capture yours, frame by frame." 
            packages={videographyPackages} 
            icon={Video} 
          />
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