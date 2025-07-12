import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Video, Camera, Sparkles, Heart, Clock, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
interface ServicesProps {
  onBookingClick: () => void;
}
const Services = ({
  onBookingClick
}: ServicesProps) => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const handleServiceClick = (route: string) => {
    if (user) {
      navigate(route);
    } else {
      onBookingClick();
    }
  };
  const services = [{
    icon: Heart,
    title: "Personalized Planner",
    description: "Chat with the \"Planner Assistant\" and let it help you find the perfect package for your special moments and needs.",
    features: ["AI-Powered Recommendations", "Custom Package Planning", "Event Type Matching", "Budget Optimization"],
    gradient: "from-rose-500 to-pink-500",
    route: "/planner"
  }, {
    icon: Camera,
    title: "Photo & Video Services",
    description: "Professional photography and videography for families, businesses, and special occasions.",
    features: ["Family Portraits", "Business Photography", "Corporate Events", "Milestone and Celebrations"],
    gradient: "from-purple-500 to-pink-500",
    route: "/photo-video-services"
  }, {
    icon: Sparkles,
    title: "Wedding Packages",
    description: "Complete wedding documentation combining both videography and photography for your special day.",
    features: ["Photo + Video Packages", "Wedding Photography", "Wedding Videography", "Premium Collections"],
    gradient: "from-pink-500 to-rose-500",
    route: "/wedding-packages"
  }];
  return <section id="services" className="py-20 bg-gradient-to-br from-gray-50 to-rose-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <div className="flex items-center space-x-2 bg-gradient-to-r from-rose-100 to-pink-100 rounded-full px-4 py-2">
              <Heart className="w-5 h-5 text-rose-500" />
              <span className="text-rose-700 text-sm font-medium">Our Services</span>
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Capturing
            <span className="block bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
              Every Frame
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Professional  videography and photography services designed to tell your unique story.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {services.map((service, index) => <Card key={index} className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/70 backdrop-blur-sm hover:scale-105">
              <CardContent className="p-8">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${service.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <service.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{service.title}</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">{service.description}</p>
                
                <ul className="space-y-2 mb-8">
                  {service.features.map((feature, featureIndex) => <li key={featureIndex} className="flex items-center text-gray-700">
                      <div className="w-2 h-2 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full mr-3"></div>
                      {feature}
                    </li>)}
                </ul>

                <Button onClick={() => handleServiceClick(service.route)} className={`w-full bg-gradient-to-r ${service.gradient} hover:shadow-lg transition-all duration-300 text-white font-semibold py-3 rounded-xl`}>
                  More Details
                </Button>
              </CardContent>
            </Card>)}
        </div>

        {/* Additional features */}
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Quick Turnaround</h4>
            <p className="text-gray-600">Receive your highlights within 48 hours</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Award Winning</h4>
            <p className="text-gray-600">Recognized for excellence in wedding cinematography</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Personal Touch</h4>
            <p className="text-gray-600">Tailored approach to your unique love story</p>
          </div>
        </div>
      </div>
    </section>;
};
export default Services;