import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Heart } from "lucide-react";
import { DashboardNavigation } from "@/components/dashboard/DashboardNavigation";
import { AIAssistantSection } from "@/components/wedding/AIAssistantSection";
import { ExploreServicesSection } from "@/components/planner/ExploreServicesSection";

const GallerySection = () => {
  return (
    <section className="relative h-[400px] md:h-[500px] overflow-hidden rounded-2xl mx-4 mb-16">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="https://hmdnronxajctsrlgrhey.supabase.co/storage/v1/object/public/weddingvideo//Everafter.webm" type="video/webm" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 h-full flex items-center justify-center text-center px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Our Wedding Gallery
          </h2>
          <p className="text-lg md:text-xl text-white/90 mb-6">
            Explore our collection of beautiful wedding moments and memories
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105">
              View Full Gallery
            </button>
            <button className="border border-white/30 text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 px-6 py-3 rounded-full font-semibold transition-all duration-300">
              Watch Videos
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

const Planner = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/';
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-12 h-12 text-rose-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading your planner...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50">
      <DashboardNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Personalized Planner Assistant</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Let our smart assistant help you find the perfect photo or video package for your special moment—whether it's a wedding, family milestone, or business event.
          </p>
        </div>

        {/* AI Assistant Section */}
        <AIAssistantSection />
        
        {/* Explore Services Section */}
        <ExploreServicesSection />
        
        {/* Gallery Section */}
        <GallerySection />
      </div>
    </div>
  );
};

export default Planner;