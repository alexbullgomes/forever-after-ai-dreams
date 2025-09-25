import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Heart, Camera, Bot } from "lucide-react";
import { DashboardNavigation } from "@/components/dashboard/DashboardNavigation";
import { PackageSection } from "@/components/wedding/PackageSection";
import { CTASection } from "@/components/wedding/CTASection";
import WeddingGallery from "@/components/galleries/WeddingGallery";
import WeddingPackagesHeader from "@/components/wedding/WeddingPackagesHeader";
import LoadingState from "@/components/wedding/LoadingState";
import { combinedPackages } from "@/data/weddingPackages";
import { ExpandableChatAssistant } from "@/components/ui/expandable-chat-assistant";

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

        {/* Wedding Gallery */}
        <div id="wedding-gallery" className="my-16">
          <WeddingGallery />
        </div>

        {/* Combined Photo & Video Packages */}
        <div id="combined-packages">
          <PackageSection 
            title="Your Dream Wedding Photo & Video Packages" 
            subtitle="Your wedding day is more than an event — it's the beginning of your forever." 
            packages={combinedPackages} 
            icon={Heart} 
          />
        </div>


        {/* Explore Our Services Section */}
        <div className="my-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Explore Our Services</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover our complete range of photography and videography services designed to capture your most precious moments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Photo & Video Card */}
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Photo & Video</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Discover our complete photo and video sessions for weddings, families, and brands. Beautifully crafted visuals for every story.
                </p>
                <button
                  onClick={() => { window.location.assign('/photo-video-services'); }}
                  className="inline-flex items-center text-rose-500 font-semibold hover:text-rose-600 transition-colors group-hover:translate-x-1 duration-300"
                >
                  View gallery
                  <svg className="w-5 h-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Assistant Planner Card */}
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Assistant Planner</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Get real-time planning help, timeline tips, and creative ideas — your wedding co-pilot is ready.
                </p>
                <button
                  onClick={() => { window.location.assign('/planner'); }}
                  className="inline-flex items-center text-rose-500 font-semibold hover:text-rose-600 transition-colors group-hover:translate-x-1 duration-300"
                >
                  Ask anything
                  <svg className="w-5 h-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div id="contact-cta">
          <CTASection />
        </div>
      </div>
      
      {/* Expandable Chat Assistant - Available on all authenticated pages */}
      <ExpandableChatAssistant />
    </div>
  );
};

export default WeddingPackages;