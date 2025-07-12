import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Heart, Camera, Video, Users, Building } from "lucide-react";
import { DashboardNavigation } from "@/components/dashboard/DashboardNavigation";
import { PackageCard } from "@/components/wedding/PackageCard";
import PhotoVideoGallery from "@/components/galleries/PhotoVideoGallery";

const PhotoVideoServices = () => {
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
          <p className="text-gray-600">Loading your services...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Family Photography Services
  const familyPhotographyPackages = [
    {
      name: "Family Portrait Session",
      price: "$250–$450",
      description: "Capture beautiful family memories in a relaxed setting.",
      features: [
        "1–3 hour session",
        "Location of your choice",
        "50+ edited high-resolution images",
        "Online gallery access",
        "Print release rights"
      ],
      popular: false
    },
    {
      name: "Extended Family Experience",
      price: "$450–$750",
      description: "Perfect for larger families and special occasions.",
      features: [
        "3–6 hour session",
        "Multiple locations available",
        "100+ edited high-resolution images",
        "Professional styling consultation",
        "Custom USB drive",
        "Print release rights"
      ],
      popular: true
    },
    {
      name: "Milestone Photography",
      price: "On Consult",
      description: "Celebrate special moments and achievements together.",
      features: [
        "8+ hour session",
        "Indoor or outdoor location",
        "30+ edited high-resolution images",
        "Perfect for graduations, anniversaries",
        "Online gallery access",
        "Print release rights"
      ],
      popular: false
    }
  ];

  // Business Photography Services
  const businessPhotographyPackages = [
    {
      name: "Corporate Headshots",
      price: "$200",
      description: "Professional headshots for your business needs.",
      features: [
        "30-minute session per person",
        "Studio or office location",
        "5+ edited images per person",
        "Professional retouching",
        "High-resolution files"
      ],
      popular: false
    },
    {
      name: "Brand Photography Package",
      price: "$1,200",
      description: "Complete visual branding for your business.",
      features: [
        "4-hour session",
        "Product and lifestyle photography",
        "100+ edited images",
        "Usage rights for marketing",
        "Brand consultation included"
      ],
      popular: false
    },
    {
      name: "Commercial Event Coverage",
      price: "$850",
      description: "Professional documentation of your business events.",
      features: [
        "Full event coverage",
        "Candid and posed shots",
        "75+ edited high-resolution images",
        "Same-day preview selection",
        "Marketing usage rights"
      ],
      popular: true
    }
  ];


  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50">
      <DashboardNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Photo & Video Services</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Beyond weddings, we capture life's precious moments for families and businesses with the same artistic excellence.
          </p>
        </div>

        {/* Family Photography */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <Users className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Family Photography
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Preserve your family's love and connection with timeless portraits that you'll treasure forever.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {familyPhotographyPackages.map((pkg, index) => (
              <PackageCard
                key={index}
                name={pkg.name}
                price={pkg.price}
                description={pkg.description}
                features={pkg.features}
                popular={pkg.popular}
              />
            ))}
          </div>
        </div>

        {/* Portfolio Gallery */}
        <div id="portfolio-gallery" className="my-16">
          <PhotoVideoGallery />
        </div>

        {/* Business Photography */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <Building className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Business Photography
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Professional imagery that elevates your brand and showcases your business in its best light.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {businessPhotographyPackages.map((pkg, index) => (
              <PackageCard
                key={index}
                name={pkg.name}
                price={pkg.price}
                description={pkg.description}
                features={pkg.features}
                popular={pkg.popular}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PhotoVideoServices;