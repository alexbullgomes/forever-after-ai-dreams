
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Heart, Camera, Video } from "lucide-react";
import { DashboardNavigation } from "@/components/dashboard/DashboardNavigation";
import { PackageSection } from "@/components/wedding/PackageSection";
import { CTASection } from "@/components/wedding/CTASection";
import InteractiveBentoGallery from "@/components/ui/gallery/interactive-bento-gallery";

const WeddingPackages = () => {
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
          <p className="text-gray-600">Loading your wedding packages...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Combined Photo & Video Packages (moved to be first)
  const combinedPackages = [
    {
      name: "Essential Love",
      price: "$2,999",
      description: "Perfect for intimate ceremonies",
      features: [
        "4 hours of coverage",
        "1 videographer + 1 photographer",
        "Highlight reel (2–5 minutes)",
        "150 edited photos",
        "Online gallery access"
      ],
      popular: false
    },
    {
      name: "Dream Wedding",
      price: "$4,999",
      description: "Our most popular package",
      features: [
        "8 hours of coverage",
        "2 videographers + 1 photographers",
        "Cinematic wedding film (3–7 minutes)",
        "Ceremony + reception footage",
        "200+ edited photos",
        "USB drive with all content"
      ],
      popular: true
    },
    {
      name: "Luxury Experience",
      price: "$8,999",
      description: "The ultimate wedding documentation",
      features: [
        "Full day coverage (12+ hours)",
        "3 videographers + 2 photographers",
        "Cinematic wedding film (6–15 minutes)",
        "Drone footage",
        "500+ edited photos",
        "Engagement session included",
        "Premium album + USB",
        "Raw footage access"
      ],
      popular: false
    }
  ];

  // Photography Packages
  const photographyPackages = [
    {
      name: "The Intimate Moments Collection",
      price: "$1,800",
      description: "Perfect for elopements, micro weddings, or couples who want just the essentials captured beautifully.",
      features: [
        "6 hours of coverage",
        "Unlimited photos",
        "1 lead photographer",
        "150+ edited high-resolution images",
        "Print release rights",
        "Sneak peek delivery within 72 hours"
      ],
      popular: false
    },
    {
      name: "The Ever After Collection",
      price: "$2,600",
      description: "A complete wedding day experience from the ceremony to the first dance.",
      features: [
        "8 hours of coverage",
        "1 lead photographer + 1 assistant",
        "250+ edited high-resolution + Raw images",
        "Print release rights",
        "Sneak peek delivery within 48 hours",
        "Custom USB drive with all final images",
        "Social media highlights pack"
      ],
      popular: false
    },
    {
      name: "The Forever Yours Experience",
      price: "$3,900",
      description: "Our most luxurious package — every unforgettable moment captured from sunrise prep to the grand exit.",
      features: [
        "12 hours of coverage",
        "Unlimited photos",
        "2 photographers",
        "350+ edited high-resolution + Raw images",
        "Sneak peek delivery within 24 hours",
        "Print release rights",
        "Custom USB drive",
        "Priority photo editing",
        "Social media highlights pack (Realtime)"
      ],
      popular: false
    }
  ];

  // Videography Packages
  const videographyPackages = [
    {
      name: "The Highlight Reel",
      price: "$2,500",
      description: "A short, cinematic film that captures the soul of your ceremony.",
      features: [
        "6 hours of coverage",
        "1 videographer",
        "2–5 minute wedding film",
        "1-minute social media teaser",
        "Drone shots",
        "4K video + HD audio"
      ],
      popular: false
    },
    {
      name: "The Legacy Film",
      price: "$3,500",
      description: "A full-scope storytelling package that honors every key moment of the day.",
      features: [
        "8 hours of coverage",
        "2 videographers",
        "3–6 minute wedding film",
        "1-minute social media teaser",
        "Drone shots",
        "Full ceremony + reception video + audio",
        "4K video + HD audio"
      ],
      popular: false
    },
    {
      name: "The Cinematic Love Story",
      price: "$5,000",
      description: "An all-inclusive cinematic production for couples who want the full spotlight treatment — crafted with artistry and intention.",
      features: [
        "12 hours of coverage",
        "3 videographers",
        "6–10 minute cinematic wedding film",
        "1-minute social media teaser",
        "Full ceremony + reception videos + Audio",
        "Drone footage",
        "4K video + HD audio"
      ],
      popular: false
    }
  ];

  // Sample wedding gallery media items
  const weddingGalleryItems = [
    {
      id: 1,
      type: "image",
      title: "Romantic Ceremony",
      desc: "Beautiful outdoor ceremony captured in golden hour light",
      url: "/lovable-uploads/160fe8f9-dfe9-4e38-880c-72c42ac5fbdb.png",
      span: "col-span-1 sm:col-span-2 row-span-3"
    },
    {
      id: 2,
      type: "video",
      title: "First Dance",
      desc: "Cinematic capture of the couple's first dance",
      url: "/lovable-uploads/16b44735-6be5-41eb-b64a-a9cd4a2c8571.png",
      span: "col-span-1 sm:col-span-1 row-span-2"
    },
    {
      id: 3,
      type: "image",
      title: "Wedding Details",
      desc: "Elegant wedding rings and floral arrangements",
      url: "/lovable-uploads/2ee7f946-776a-4a8f-a249-03cd6995cb76.png",
      span: "col-span-1 sm:col-span-1 row-span-2"
    },
    {
      id: 4,
      type: "image",
      title: "Bridal Portrait",
      desc: "Stunning bridal portrait with natural lighting",
      url: "/lovable-uploads/8218160d-57f7-4efa-9bcf-f22f3074d54a.png",
      span: "col-span-1 sm:col-span-2 row-span-2"
    },
    {
      id: 5,
      type: "video",
      title: "Reception Highlights",
      desc: "Joyful moments from the wedding reception",
      url: "/lovable-uploads/a7af5164-9a69-4921-87dc-4d167dc3b382.png",
      span: "col-span-1 sm:col-span-1 row-span-3"
    },
    {
      id: 6,
      type: "image",
      title: "Couple's Portrait",
      desc: "Intimate couple's portrait by the beach",
      url: "/lovable-uploads/e4d4b04a-7d06-4b7d-9e8c-4b85c7039d41.png",
      span: "col-span-1 sm:col-span-1 row-span-2"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50">
      <DashboardNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Wedding Packages</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Carefully curated wedding photography and videography collections — each designed to capture your love story with beauty and intention.
          </p>
        </div>

        {/* Combined Photo & Video Packages */}
        <div id="combined-packages">
          <PackageSection 
            title="Your Dream Wedding Photo & Video Packages" 
            subtitle="Your wedding day is more than an event — it's the beginning of your forever." 
            packages={combinedPackages} 
            icon={Heart} 
          />
        </div>

        {/* Wedding Gallery */}
        <div id="wedding-gallery" className="my-16">
          <InteractiveBentoGallery 
            mediaItems={weddingGalleryItems}
            title="Our Wedding Gallery"
            description="Explore our collection of beautiful wedding moments and memories"
          />
        </div>

        {/* Photography Packages */}
        <div id="photography">
          <PackageSection 
            title="Wedding Photography Packages" 
            subtitle="Your wedding day is filled with moments that deserve to be remembered forever — the nervous smiles, the quiet glances, the joyful tears." 
            packages={photographyPackages} 
            icon={Camera} 
          />
        </div>

        {/* Videography Packages */}
        <div id="videography">
          <PackageSection 
            title="Wedding Videography Packages" 
            subtitle="Every wedding tells a story — and we're here to capture yours, frame by frame." 
            packages={videographyPackages} 
            icon={Video} 
          />
        </div>

        {/* CTA Section */}
        <div id="contact-cta">
          <CTASection />
        </div>
      </div>
    </div>
  );
};

export default WeddingPackages;
