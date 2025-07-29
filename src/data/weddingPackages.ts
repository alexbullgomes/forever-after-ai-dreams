export interface WeddingPackage {
  name: string;
  price: string;
  description: string;
  features: string[];
  popular: boolean;
  idealFor?: string;
}

// Combined Photo & Video Packages
export const combinedPackages: WeddingPackage[] = [
  {
    name: "Essential Love Photos",
    price: "$850–$3900",
    description: "Personalized for intimate photos of your ceremony.",
    features: [
      "Our most luxurious photography package",
      "1–8 hours of coverage",
      "1–2 photographers",
      "Social media highlights pack",
      "50 Priority photo editing (Same Day)",
      "100–350 edited photos",
      "Full rights and Fast delivery"
    ],
    idealFor: "Ideal for: Elopements, Couple portraits, Bride and groom moments, full coverage of ceremony and reception.",
    popular: false
  },
  {
    name: "Wedding Photos & Videos",
    price: "Personalize",
    description: "Our best seller personalized ultimate wedding packages made your own way.",
    features: [
      "1-8+ hours of coverage",
      "1 videographers + 1 photographers",
      "100–350 edited photos",
      "Highlight reel (1–2 min)",
      "5–25 minute cinematic wedding film",
      "Ceremony + reception footage + party",
      "Full rights and Fast delivery"
    ],
    idealFor: "Ideal for: Making of, Bridal and groom preparations, Courthouse ceremonies, Coverage of ceremony and reception, and interviews with wedding party.",
    popular: true
  },
  {
    name: "Every Moment Videos",
    price: "$900–$5900",
    description: "The ultimate personalized wedding film documentation",
    features: [
      "1–8 hours of coverage",
      "1–2 videographers",
      "Highlight reel (1–2 min) + Drone",
      "5–25 minute cinematic wedding film",
      "Ceremony + Reception footage + party",
      "Drone footage",
      "4K video + HD audio",
      "Full rights and Fast delivery"
    ],
    idealFor: "Ideal for Intimate Weddings, Courthouse ceremonies, Full-day coverage of ceremony and reception, and interviews with wedding party.",
    popular: false
  }
];

// Photography Packages
export const photographyPackages: WeddingPackage[] = [
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
export const videographyPackages: WeddingPackage[] = [
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