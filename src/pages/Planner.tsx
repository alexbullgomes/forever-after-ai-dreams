import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Heart } from "lucide-react";
import { DashboardNavigation } from "@/components/dashboard/DashboardNavigation";
import { AIAssistantSection } from "@/components/wedding/AIAssistantSection";
import { ExploreServicesSection } from "@/components/planner/ExploreServicesSection";
import InteractiveBentoGallery from "@/components/ui/interactive-bento-gallery";

const GallerySection = () => {
  const mediaItems = [
    {
      id: 1,
      type: "image",
      title: "Romantic Ceremony",
      desc: "Capturing precious wedding moments",
      url: "https://images.unsplash.com/photo-1519741497674-611481863552",
      span: "md:col-span-1 md:row-span-3 sm:col-span-1 sm:row-span-2",
    },
    {
      id: 2,
      type: "image",
      title: "Dream Reception",
      desc: "Elegant celebration memories",
      url: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3",
      span: "md:col-span-2 md:row-span-2 col-span-1 sm:col-span-2 sm:row-span-2",
    },
    {
      id: 3,
      type: "image",
      title: "Portrait Magic",
      desc: "Beautiful couple portraits",
      url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc",
      span: "md:col-span-1 md:row-span-3 sm:col-span-2 sm:row-span-2",
    },
    {
      id: 4,
      type: "image",
      title: "Golden Hour",
      desc: "Romantic sunset photography",
      url: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92",
      span: "md:col-span-2 md:row-span-2 sm:col-span-1 sm:row-span-2",
    },
    {
      id: 5,
      type: "image",
      title: "Wedding Details",
      desc: "Every detail perfectly captured",
      url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf",
      span: "md:col-span-1 md:row-span-3 sm:col-span-1 sm:row-span-2",
    },
    {
      id: 6,
      type: "image",
      title: "Celebration Joy",
      desc: "Dancing and joyful moments",
      url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a",
      span: "md:col-span-2 md:row-span-2 sm:col-span-1 sm:row-span-2",
    },
  ];

  return (
    <InteractiveBentoGallery
      mediaItems={mediaItems}
      title="Our Wedding Gallery"
      description="Explore our collection of beautiful wedding moments and memories"
    />
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