import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Heart } from "lucide-react";
import { DashboardNavigation } from "@/components/dashboard/DashboardNavigation";
import { AIAssistantSection } from "@/components/wedding/AIAssistantSection";
import { ExploreServicesSection } from "@/components/planner/ExploreServicesSection";
import PlannerGallery from "@/components/galleries/PlannerGallery";
import { ExpandableChatAssistant } from "@/components/ui/expandable-chat-assistant";

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
        <PlannerGallery />
      </div>
      
      {/* Expandable Chat Assistant - Additional Entry Point */}
      <ExpandableChatAssistant autoOpen={!!new URLSearchParams(window.location.search).get('openChat')} />
    </div>
  );
};

export default Planner;