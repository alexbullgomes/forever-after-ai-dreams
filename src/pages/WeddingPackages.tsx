
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Camera, Video, Star, ArrowLeft, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const WeddingPackages = () => {
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to home if not authenticated
      window.location.href = '/';
    }
  }, [user, loading]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "Thank you for visiting Dream Weddings!",
      });
      window.location.href = '/';
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-12 h-12 text-rose-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading your exclusive packages...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  const packages = [
    {
      name: "Essential Love",
      price: "$2,999",
      description: "Perfect for intimate ceremonies",
      features: [
        "4 hours of coverage",
        "1 videographer + 1 photographer",
        "Highlight reel (3-5 minutes)",
        "50 edited photos",
        "Online gallery access",
      ],
      popular: false,
    },
    {
      name: "Dream Wedding",
      price: "$4,999",
      description: "Our most popular package",
      features: [
        "8 hours of coverage",
        "2 videographers + 2 photographers",
        "Cinematic wedding film (8-12 minutes)",
        "Ceremony + reception footage",
        "200+ edited photos",
        "Same-day highlights (1 minute)",
        "USB drive with all content",
      ],
      popular: true,
    },
    {
      name: "Luxury Experience",
      price: "$8,999",
      description: "The ultimate wedding documentation",
      features: [
        "Full day coverage (12+ hours)",
        "3 videographers + 3 photographers",
        "Feature-length documentary",
        "Drone footage (weather permitting)",
        "500+ edited photos",
        "Engagement session included",
        "Premium album + USB",
        "Raw footage access",
      ],
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => window.location.href = '/'}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user.user_metadata?.full_name || user.email}!
              </span>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <Heart className="w-16 h-16 text-rose-500 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Your Dream Wedding Packages
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Thank you for joining our family! Here are our exclusive wedding videography 
            and photography packages, each crafted to capture your love story beautifully.
          </p>
        </div>

        {/* Packages Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {packages.map((pkg, index) => (
            <Card 
              key={index} 
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl ${
                pkg.popular 
                  ? 'ring-2 ring-rose-500 scale-105' 
                  : 'hover:scale-105'
              }`}
            >
              {pkg.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-center py-2 text-sm font-semibold">
                  <Star className="w-4 h-4 inline mr-1" />
                  Most Popular
                </div>
              )}
              
              <CardHeader className={pkg.popular ? 'pt-12' : ''}>
                <CardTitle className="text-2xl font-bold text-center text-gray-900">
                  {pkg.name}
                </CardTitle>
                <div className="text-center">
                  <span className="text-4xl font-bold text-rose-600">{pkg.price}</span>
                </div>
                <p className="text-center text-gray-600">{pkg.description}</p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {pkg.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full h-12 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-rose-500/25 transition-all duration-300"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Book Consultation
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <Video className="w-16 h-16 text-rose-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Capture Your Love Story?
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Let's schedule a consultation to discuss your vision and customize the perfect 
            package for your special day. Our team is excited to work with you!
          </p>
          <Button 
            size="lg"
            className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-2xl hover:shadow-rose-500/25 transition-all duration-300"
          >
            Schedule Free Consultation
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WeddingPackages;
