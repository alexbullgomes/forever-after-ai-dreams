import { Button } from "@/components/ui/button";
import { MessageCircle, Heart } from "lucide-react";

const WhatsAppSection = () => {
  const handleWhatsAppClick = () => {
    window.open("https://wa.me/14422244820", "_blank");
  };

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center space-x-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full px-4 py-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-700 text-sm font-medium">Let's Chat</span>
            </div>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ready to Start Your
            <span className="block bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Story Together?
            </span>
          </h2>
          
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Have questions about our packages or want to discuss your special day? 
            Our team is here to help you create unforgettable memories.
          </p>
          
          <Button 
            onClick={handleWhatsAppClick}
            size="lg" 
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-green-500/25 transition-all duration-300 group"
          >
            <MessageCircle className="w-6 h-6 mr-2 group-hover:animate-pulse" />
            Chat with us on WhatsApp
          </Button>
          
          <p className="text-sm text-gray-500 mt-4">
            Quick response guaranteed • Available 7 days a week
          </p>
        </div>
      </div>
    </section>
  );
};

export default WhatsAppSection;