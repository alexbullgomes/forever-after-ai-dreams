import { Button } from "@/components/ui/button";
import { Play, Heart, Camera } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import ConsultationForm from "./ConsultationForm";
interface HeroProps {
  onBookingClick: () => void;
}
const Hero = ({
  onBookingClick
}: HeroProps) => {
  const [isConsultationFormOpen, setIsConsultationFormOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleBookingClick = () => {
    if (user) {
      navigate('/planner');
    } else {
      onBookingClick();
    }
  };
  return <>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video autoPlay muted loop playsInline poster="https://hmdnronxajctsrlgrhey.supabase.co/storage/v1/object/public/weddingvideo//Homepicture.webp" className="absolute inset-0 w-full h-full object-cover">
            <source src="https://hmdnronxajctsrlgrhey.supabase.co/storage/v1/object/public/weddingvideo//Everafter.webm" type="video/webm" />
            <source src="https://hmdnronxajctsrlgrhey.supabase.co/storage/v1/object/public/weddingvideo//Homeeverafte.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
            <div className="mb-6 flex justify-center">
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <Heart className="w-5 h-5 text-rose-400" />
                <span className="text-white text-sm font-medium">California-Based Premium Visual Storytelling</span>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight mix-blend-exclusion">
              Everafter
              <span className="block bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">Memories That Lasts</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">California-based visual storytelling brand specialized in cinematic photography and videography for weddings, families, and businesses. </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button onClick={handleBookingClick} size="lg" className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-2xl hover:shadow-rose-500/25 transition-all duration-300 transform hover:scale-105">
              <Camera className="w-5 h-5 mr-2" />
              View Packages & Book
            </Button>
            
            <Button variant="outline" size="lg" className="border-white/30 text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300" onClick={() => setIsConsultationFormOpen(true)}>
              Book Consultation
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-white/70">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">⭐</span>
              <span className="text-sm">500+ Happy Couples</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🏆</span>
              <span className="text-sm">Award Winning</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">📍</span>
              <span className="text-sm">California Based</span>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-rose-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
      </section>

      <ConsultationForm isOpen={isConsultationFormOpen} onClose={() => setIsConsultationFormOpen(false)} />
    </>;
};
export default Hero;