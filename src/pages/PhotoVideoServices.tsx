import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Heart, Camera, Video, Users, Building, Bot } from "lucide-react";
import { DashboardNavigation } from "@/components/dashboard/DashboardNavigation";
import { PackageCard } from "@/components/wedding/PackageCard";
import { CustomPackageCard } from "@/components/wedding/CustomPackageCard";
import PhotoVideoGallery from "@/components/galleries/PhotoVideoGallery";
import BusinessGallery from "@/components/galleries/BusinessGallery";
import { ExpandableChatAssistant } from "@/components/ui/expandable-chat-assistant";

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
      price: "$250–$1200",
      description: "Personalize timeless moments with professional photography.",
      features: [
        "Personalize your package",
        "1-8 hours session",
        "1–2 photographers",
        "Location of your choice",
        "25 –200 edited images",
        "Fast Delivery",
        "Print release rights",
        "Ideal for: Couples & Families; Pregnancy Photoshoot; Children Photoshoots; Milestone Celebrations; Greeting Cards; Lifestyle Sessions; Anniversary and Birthdays."
      ],
      popular: false
    },
    {
      name: "Photo & Video Combo",
      price: "Personalize",
      description: "Personalize a full storytelling with both photo and video coverage.",
      features: [
        "1-8+ hour session",
        "Photo + 4K Video Full Coverage",
        "2 Professionals",
        "Full-day Highlights & Storytelling",
        "Location of your choice",
        "Full rights and Fast delivery",
        "Special add-ons (f.e. Drone footage)",
        "Ideal for: Save the Date, Anniversaries and Birthdays, Pregnancy moments, Friends and Family Testimonials and Reunions."
      ],
      popular: true
    },
    {
      name: "Videography Session",
      price: "$350–$1200",
      description: "Personalize cinematic coverage for events, memories, and stories.",
      features: [
        "1–8 hours session",
        "Location of your choice",
        "4K Video full coverage",
        "Highlights & Storytelling videos",
        "Professionally editing and color-grading",
        "Full rights and Fast delivery",
        "Special Add-ons",
        "Ideal for: Couples, Anniversaries, Birthdays, Baby showers, Pregnancy moments, Gifting."
      ],
      popular: false
    }
  ];

  // Business Photography Services
  const businessPhotographyPackages = [
    {
      name: "Corporate Headshots",
      price: "$200–$1200",
      description: "Professional headshots tailored to elevate your business.",
      features: [
        "1-6 hours session",
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
      name: "Brand & Corporate Events",
      price: "$450–$3300",
      description: "Professional video coverage of your business events and brand content.",
      features: [
        "2-6 hours session",
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

        {/* Explore Our Services Section */}
        <div className="my-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Explore Our Services
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Discover our complete range of photography and videography services designed to capture your most precious moments.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Wedding Packages Card */}
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Wedding Packages</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Exclusive wedding photography and videography collections. Premium packages designed for your special day.
                </p>
                <button
                  onClick={() => { window.location.assign('/wedding-packages'); }}
                  className="inline-flex items-center text-rose-500 font-semibold hover:text-rose-600 transition-colors group-hover:translate-x-1 duration-300"
                >
                  Explore Services
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
                  Your personal wedding assistant — get real-time answers, ideas, and timeline support to help you plan with confidence.
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

      </div>
      
      {/* Expandable Chat Assistant - Available on all authenticated pages */}
      <ExpandableChatAssistant />
    </div>
  );
};

export default PhotoVideoServices;