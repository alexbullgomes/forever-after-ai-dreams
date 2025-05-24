
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

  const photographyPackages = [
    {
      name: "The Intimate Moments Collection",
      duration: "6 Hours",
      price: "$1,800",
      description: "Perfect for elopements, micro weddings, or couples who want just the essentials captured beautifully.",
      features: [
        "Up to 6 hrs of coverage",
        "Unlimited Pictures",
        "1 Lead Photographer",
        "100+ Edited High-Resolution Photos",
        "Print Release Rights",
        "Sneak Peek Delivery within 72 hrs",
      ],
      popular: false,
    },
    {
      name: "The Ever After Collection",
      duration: "8 Hours",
      price: "$2,600",
      description: "A complete wedding day experience from the ceremony to the first dance.",
      features: [
        "Up to 8 hrs of coverage",
        "Unlimited Pictures",
        "1 Lead Photographer + 1 Assistant",
        "200+ Edited High-Resolution Photos + Raw Pictures",
        "Print Release Rights",
        "Sneak Peek Delivery within 48 hrs",
        "Custom USB Drive with All Final Photos",
        "Candid Moments + Posed Portraits Included",
      ],
      popular: true,
    },
    {
      name: "The Forever Yours Experience",
      duration: "12 Hours",
      price: "$3,900",
      description: "Our most luxurious package — every unforgettable moment captured from sunrise prep to the grand exit.",
      features: [
        "Up to 12 hrs of coverage",
        "Unlimited Pictures",
        "2 Photographers",
        "300+ Edited High-Resolution Photos + Raw",
        "Private Online Gallery",
        "Print Release Rights",
        "Sneak Peek Delivery within 24 hrs",
        "Custom USB Drive",
        "Engagement Session Included",
        "Priority Photo Editing",
        "Full Day Coverage – Getting Ready to Grand Exit",
        "Social Media Highlights Pack",
      ],
      popular: false,
    },
  ];

  const videographyPackages = [
    {
      name: "The Highlight Reel",
      duration: "6 Hours",
      price: "$2,500",
      description: "A short, cinematic film that captures the soul of your ceremony.",
      features: [
        "3–6 min Wedding Film",
        "1 Videographer (Luiz Lopes)",
        "Up to 6 hrs of coverage",
        "Drone Shots",
        "1 min Social Media Teaser included",
        "4K Capture + HD Audio",
      ],
      popular: false,
    },
    {
      name: "The Legacy Film",
      duration: "8 Hours",
      price: "$3,500",
      description: "A full-scope storytelling package that honors every key moment of the day.",
      features: [
        "6–10 min Wedding Film",
        "2 Videographers (Luiz Lopes + 2nd Shooter)",
        "Up to 8 hrs of coverage",
        "Drone Shots",
        "1 min Social Media Teaser included",
        "Full Ceremony Video + Audio",
        "Full Reception Video + Audio",
        "4K Capture + HD Audio",
      ],
      popular: true,
    },
    {
      name: "The Cinematic Love Story",
      duration: "12 Hours",
      price: "$5,000",
      description: "An all-inclusive cinematic production for couples who want the full spotlight treatment — crafted with artistry and intention.",
      features: [
        "6–10 min Wedding Film",
        "3 Videographers (Luiz Lopes + 2 additional videographers)",
        "Up to 12 hrs of coverage",
        "Drone Shots",
        "1 min Social Media Teaser included",
        "Full Ceremony Video + Audio",
        "Full Reception Video + Audio",
        "Love Story Film",
        "IG Reels Best Moments",
        "Raw Footage",
        "4K Capture + HD Audio",
      ],
      popular: false,
    },
  ];

  const PackageCard = ({ pkg, icon: Icon }) => (
    <Card 
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
          <span className="text-sm text-gray-500">{pkg.duration}</span>
        </div>
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
          <Icon className="w-5 h-5 mr-2" />
          Book Consultation
        </Button>
      </CardContent>
    </Card>
  );

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
        <div className="text-center mb-16">
          <Heart className="w-16 h-16 text-rose-500 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Your Dream Wedding Packages
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Thank you for joining our family! Here are our exclusive wedding videography 
            and photography packages, each crafted to capture your love story beautifully.
          </p>
        </div>

        {/* Photography Packages Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full px-6 py-3">
                <Camera className="w-6 h-6 text-purple-600" />
                <span className="text-purple-700 text-lg font-semibold">Wedding Photography Packages</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {photographyPackages.map((pkg, index) => (
              <PackageCard key={index} pkg={pkg} icon={Camera} />
            ))}
          </div>
        </div>

        {/* Videography Packages Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="flex items-center space-x-2 bg-gradient-to-r from-rose-100 to-pink-100 rounded-full px-6 py-3">
                <Video className="w-6 h-6 text-rose-600" />
                <span className="text-rose-700 text-lg font-semibold">Wedding Videography Packages</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {videographyPackages.map((pkg, index) => (
              <PackageCard key={index} pkg={pkg} icon={Video} />
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-4">
              <Camera className="w-12 h-12 text-purple-500" />
              <Heart className="w-8 h-8 text-rose-500" />
              <Video className="w-12 h-12 text-rose-500" />
            </div>
          </div>
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
