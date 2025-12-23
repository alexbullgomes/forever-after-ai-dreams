
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Video, Heart, Star, Clock, Award } from "lucide-react";

const ServicesWithImages = () => {
  const services = [
    {
      icon: Camera,
      title: "Wedding Photography",
      description: "Capturing every precious moment with artistic vision and professional expertise.",
      image: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92",
      features: ["High-resolution images", "Same-day sneak peeks", "Print release included", "Professional editing"]
    },
    {
      icon: Video,
      title: "Wedding Videography", 
      description: "Cinematic films that tell your unique love story with emotion and artistry.",
      image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc",
      features: ["4K video quality", "Drone footage", "Same-day highlights", "Social media versions"]
    },
    {
      icon: Heart,
      title: "Complete Packages",
      description: "Full-service photography and videography to capture every angle of your day.",
      image: "https://images.unsplash.com/photo-1519741497674-611481863552",
      features: ["Photo + video combo", "Multiple photographers", "Extended coverage", "Premium albums"]
    }
  ];

  const features = [
    {
      icon: Clock,
      title: "Quick Turnaround",
      description: "Sneak peeks within 24-72 hours, full galleries within 2-4 weeks"
    },
    {
      icon: Star,
      title: "Award-Winning Quality",
      description: "Recognized excellence in wedding photography and videography"
    },
    {
      icon: Award,
      title: "Personal Touch",
      description: "Every couple receives personalized attention and custom service"
    }
  ];

  return (
    <div className="py-20 bg-section-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Heart className="w-12 h-12 text-brand-primary-from mx-auto mb-4" />
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            <span className="bg-brand-gradient bg-clip-text text-transparent">
              Our Services
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Professional wedding photography and videography services crafted to preserve 
            your most treasured moments with artistry and care.
          </p>
        </div>

        {/* Main Services */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {services.map((service, index) => (
            <Card key={index} className="group overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="relative overflow-hidden">
                <img 
                  src={service.image} 
                  alt={service.title}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <service.icon className="w-8 h-8 text-white" />
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-foreground">
                  {service.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{service.description}</p>
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-brand-primary-from rounded-full mr-3"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button className="w-full bg-brand-gradient hover:bg-brand-gradient-hover text-white rounded-lg transition-all duration-300">
                  Learn More
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Section */}
        <div className="bg-card rounded-2xl shadow-xl p-8 mb-16">
          <h3 className="text-3xl font-bold text-center text-foreground mb-12">
            Why Choose Dream Weddings?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-brand-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h4>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Button 
            size="lg"
            className="bg-brand-gradient hover:bg-brand-gradient-hover text-white px-8 py-4 text-lg font-semibold rounded-full shadow-2xl hover:shadow-brand-primary-from/25 transition-all duration-300"
          >
            View All Packages
          </Button>
        </div>
      </div>
    </div>
  );
};

export { ServicesWithImages };
