import { Camera, Heart, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

const ExploreServicesSection = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Explore Our Services
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Discover our complete range of photography and videography services designed to capture your most precious moments.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Photo & Video Services Card */}
        <div onClick={() => { window.location.assign('/photo-video'); }} className="group cursor-pointer">
          <Card className="h-full transition-all duration-300 hover:shadow-2xl hover:scale-105 border-0 bg-gradient-to-br from-rose-50 to-pink-50 overflow-hidden">
            <CardContent className="p-8 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-500/10 to-pink-500/10 rounded-full -translate-y-8 translate-x-8"></div>
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:bg-gradient-to-r group-hover:from-rose-500 group-hover:to-pink-500 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                  Photo & Video Services
                </h3>
                
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Professional photography and videography packages for all occasions. From intimate moments to grand celebrations.
                </p>
                
                <div className="flex items-center text-rose-600 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                  <span className="mr-2">Explore Services</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wedding Packages Card */}
        <Link to="/wedding-packages" className="group">
          <Card className="h-full transition-all duration-300 hover:shadow-2xl hover:scale-105 border-0 bg-gradient-to-br from-pink-50 to-rose-50 overflow-hidden">
            <CardContent className="p-8 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-500/10 to-rose-500/10 rounded-full -translate-y-8 translate-x-8"></div>
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:bg-gradient-to-r group-hover:from-pink-500 group-hover:to-rose-500 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                  Wedding Packages
                </h3>
                
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Exclusive wedding photography and videography collections. Premium packages designed for your special day.
                </p>
                
                <div className="flex items-center text-pink-600 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                  <span className="mr-2">View Packages</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export { ExploreServicesSection };