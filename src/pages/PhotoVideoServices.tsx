import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Heart, Camera, Video, Users, Building } from "lucide-react";
import { DashboardNavigation } from "@/components/dashboard/DashboardNavigation";
import { PackageCard } from "@/components/wedding/PackageCard";
import { CustomPackageCard } from "@/components/wedding/CustomPackageCard";
import PhotoVideoGallery from "@/components/galleries/PhotoVideoGallery";
import BusinessGallery from "@/components/galleries/BusinessGallery";

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

  // Family Milestones Services
  const familyMilestonePackages = [
    {
      name: "Photography Session",
      price: "$250–$850",
      description: "Capture timeless moments with professional photography.",
      features: [
        "1–6 hour session",
        "Location of your choice",
        "50-150 edited images",
        "Online gallery access",
        "Print release rights"
      ],
      popular: false
    },
    {
      name: "Photo & Video Combo",
      price: "Personalize",
      description: "Complete storytelling with both photo and video coverage.",
      features: [
        "8+ hour session",
        "Photo + Video coverage",
        "Location(s) of your choice",
        "Full gallery + Video Highlights",
        "Documentary Style (Opcional)",
        "For all-day celebrations",
        "Online + full rights"
      ],
      popular: true
    },
    {
      name: "Videography Session",
      price: "$350–$1200",
      description: "Cinematic coverage for events, memories, and stories.",
      features: [
        "1–6 hour session",
        "Location of your choice",
        "Highlight video (1–4 minutes)",
        "Full-length edit (optional)",
        "Professionally edited and color-graded",
        "Digital delivery + download link"
      ],
      popular: false
    }
  ];

  // Business Photography Services
  const businessPhotographyPackages = [
    {
      name: "Corporate Headshots",
      price: "$200–$1200",
      description: "Professional headshots tailored to your business needs.",
      features: [
        "1-6 Hour Session",
        "Ideal for Professionals & Events",
        "100-300 Edited images",
        "Professional retouching",
        "High-resolution delivery"
      ],
      popular: false
    },
    {
      name: "Photo & Video Coverage",
      price: "Personalize",
      description: "Professional coverage of your business events and activations with photos and videos.",
      features: [
        "8+ hour session",
        "Photo + Video coverage",
        "Location(s) of your choice",
        "Full gallery + Video Highlights",
        "Documentary Style (Optional)",
        "For all-day celebrations",
        "Online + full rights"
      ],
      popular: true
    },
    {
      name: "Video & Event Coverage",
      price: "$450–$3300",
      description: "Professional documentation of your business events and activations.",
      features: [
        "1–6 hour session",
        "Location of your choice",
        "Highlight video (1–4 minutes)",
        "Full-length edit (optional)",
        "Professionally edited and color-graded",
        "Digital delivery + download link"
      ],
      popular: false
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

        {/* Family Milestones */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <Users className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Family Milestones
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Preserve your family's love and connection with timeless portraits that you'll treasure forever.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {familyMilestonePackages.map((pkg, index) => (
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
              Business Contents
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Professional imagery that elevates your brand and showcases your business in its best light.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {businessPhotographyPackages.map((pkg, index) => {
              // Use CustomPackageCard for "Photo & Video Coverage" card
              if (pkg.name === "Photo & Video Coverage") {
                return (
                  <CustomPackageCard
                    key={index}
                    name={pkg.name}
                    price={pkg.price}
                    description={pkg.description}
                    features={pkg.features}
                    popular={pkg.popular}
                  />
                );
              }
              // Use regular PackageCard for all other cards
              return (
                <PackageCard
                  key={index}
                  name={pkg.name}
                  price={pkg.price}
                  description={pkg.description}
                  features={pkg.features}
                  popular={pkg.popular}
                />
              );
            })}
          </div>
        </div>

        {/* Business Gallery */}
        <div id="business-gallery" className="my-16">
          <BusinessGallery />
        </div>

      </div>
    </div>
  );
};

export default PhotoVideoServices;