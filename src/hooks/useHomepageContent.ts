import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ─── Type Definitions ───────────────────────────────────────────────

export interface HeroContent {
  badge_text: string;
  headline_line1: string;
  headline_line2: string;
  description: string;
  cta_text: string;
  video_webm_url: string;
  video_mp4_url: string;
  poster_url: string;
  trust_indicators: Array<{ emoji: string; text: string }>;
}

export interface ServicesHeaderContent {
  badge_text: string;
  title_line1: string;
  title_line2: string;
  subtitle: string;
  additional_features: Array<{ icon: string; title: string; description: string }>;
}

export interface PortfolioHeaderContent {
  badge_text: string;
  title_line1: string;
  title_line2: string;
  subtitle: string;
  cta_text: string;
  filters: Array<{ id: string; label: string }>;
}

export interface TestimonialItem {
  name: string;
  location: string;
  rating: number;
  text: string;
  image_url: string;
}

export interface StatItem {
  value: string;
  label: string;
}

export interface TestimonialsContent {
  badge_text: string;
  title_line1: string;
  title_line2: string;
  subtitle: string;
  testimonials: TestimonialItem[];
  stats: StatItem[];
}

export interface BlogHeaderContent {
  badge_text: string;
  title: string;
  subtitle: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface ContactContent {
  badge_text: string;
  title_line1: string;
  title_line2: string;
  subtitle: string;
  form_title: string;
  email: string;
  phone: string;
  whatsapp_url: string;
  address: string;
  social_links: SocialLink[];
  quick_response_title: string;
  quick_response_text: string;
}

export interface SeoContent {
  business_name: string;
  seo_title: string;
  seo_description: string;
  phone: string;
  email: string;
  address_locality: string;
  social_urls: string[];
}

// ─── Default Values (current hardcoded content) ─────────────────────

export const DEFAULTS: {
  homepage_hero: HeroContent;
  homepage_services_header: ServicesHeaderContent;
  homepage_portfolio_header: PortfolioHeaderContent;
  homepage_testimonials: TestimonialsContent;
  homepage_blog_header: BlogHeaderContent;
  homepage_contact: ContactContent;
  homepage_seo: SeoContent;
} = {
  homepage_hero: {
    badge_text: "California-Based Premium Visual Storytelling",
    headline_line1: "Everafter",
    headline_line2: "Memories That Last",
    description: "California-based visual storytelling brand specialized in cinematic photography and videography for weddings, families, and businesses.",
    cta_text: "Let's Plan Together",
    video_webm_url: "https://supabasestudio.agcreationmkt.cloud/storage/v1/object/public/weddingvideo/bannerhomepage.webm",
    video_mp4_url: "https://supabasestudio.agcreationmkt.cloud/storage/v1/object/public/weddingvideo/bannerhomepage.mp4?t=2025-10-06T20%3A46%3A21.431Z",
    poster_url: "https://supabasestudio.agcreationmkt.cloud/storage/v1/object/public/weddingvideo/Homepicture.webp",
    trust_indicators: [
      { emoji: "⭐", text: "500+ Happy Couples" },
      { emoji: "🏆", text: "Award Winning" },
      { emoji: "📍", text: "California Based" }
    ]
  },
  homepage_services_header: {
    badge_text: "Our Services",
    title_line1: "Capturing",
    title_line2: "Every Frame",
    subtitle: "Professional videography and photography services designed to tell your unique story.",
    additional_features: [
      { icon: "Clock", title: "Quick Turnaround", description: "Receive your highlights within 48 hours" },
      { icon: "Award", title: "Award Winning", description: "Recognized for excellence in wedding cinematography" },
      { icon: "Heart", title: "Personal Touch", description: "Tailored approach to your unique love story" }
    ]
  },
  homepage_portfolio_header: {
    badge_text: "Our Portfolio",
    title_line1: "Recent",
    title_line2: "Stories",
    subtitle: "All stories are unique. Here are some of our recent celebrations captured across California.",
    cta_text: "View Complete Portfolio",
    filters: [
      { id: "all", label: "Highlights" },
      { id: "photo-videos", label: "Photo & Videos" },
      { id: "weddings", label: "Weddings" }
    ]
  },
  homepage_testimonials: {
    badge_text: "Happy Couples",
    title_line1: "Loved by Couples",
    title_line2: "Families & Brands",
    subtitle: "See why people across California trust Ever After to capture their most meaningful moments.",
    testimonials: [
      {
        name: "Alana & Michael",
        location: "San Diego Couple Family Documentary",
        rating: 5,
        text: "Absolutely breathtaking! They captured every moment perfectly. Our wedding film brings tears of joy every time we watch it. The attention to detail and artistic vision exceeded all our expectations.",
        image_url: "/lovable-uploads/8218160d-57f7-4efa-9bcf-f22f3074d54a.png"
      },
      {
        name: "Emma & David",
        location: "Malibu Beach Ceremony",
        rating: 5,
        text: "Professional, creative, and so much fun to work with! They made us feel comfortable and the results were simply magical. Our photos are like artwork - we display them proudly in our home.",
        image_url: "/lovable-uploads/a7af5164-9a69-4921-87dc-4d167dc3b382.png"
      },
      {
        name: "Jessica & Ryan",
        location: "Sonoma Garden Wedding",
        rating: 5,
        text: "The best investment we made for our wedding! The cinematic quality and storytelling approach created memories we'll treasure forever. They truly understand how to capture love.",
        image_url: "/lovable-uploads/16b44735-6be5-41eb-b64a-a9cd4a2c8571.png"
      },
      {
        name: "Lauren & James",
        location: "San Francisco City Wedding",
        rating: 5,
        text: "Incredible team with amazing artistic vision. They captured moments we didn't even know were happening. The final film was beyond our wildest dreams - it's our love story told beautifully.",
        image_url: "/lovable-uploads/e4d4b04a-7d06-4b7d-9e8c-4b85c7039d41.png"
      }
    ],
    stats: [
      { value: "500+", label: "Happy Couples" },
      { value: "5★", label: "Average Rating" },
      { value: "50+", label: "Venues Covered" },
      { value: "8+", label: "Years Experience" }
    ]
  },
  homepage_blog_header: {
    badge_text: "Latest Stories",
    title: "Insights & Inspiration",
    subtitle: "Tips, behind-the-scenes stories, and inspiration from our team at EverAfter Studio."
  },
  homepage_contact: {
    badge_text: "Get In Touch",
    title_line1: "Let's Create Something",
    title_line2: "Beautiful Together",
    subtitle: "Ready to turn your wedding day into a cinematic masterpiece? Let's discuss your vision and create magic together.",
    form_title: "Send us a message",
    email: "contact@everafterca.com",
    phone: "(442) 224-4820",
    whatsapp_url: "https://wa.me/message/Z3PCMXW6HCTQF1",
    address: "California, USA",
    social_links: [
      { platform: "instagram", url: "https://www.instagram.com/everafterca" },
      { platform: "tiktok", url: "https://www.tiktok.com/@everafter.ca" },
      { platform: "whatsapp", url: "https://wa.me/message/Z3PCMXW6HCTQF1" }
    ],
    quick_response_title: "Quick Response Promise",
    quick_response_text: "We understand how exciting (and overwhelming) planning can be. That's why we respond to all inquiries within 24 hours, and often much sooner. You deserve immediate attention."
  },
  homepage_seo: {
    business_name: "Everafter Studio",
    seo_title: "Wedding Videography & Photography California",
    seo_description: "California's premier wedding videography & photography studio. Award-winning cinematic films and professional photos for weddings, families, and businesses.",
    phone: "(442) 224-4820",
    email: "contact@everafterca.com",
    address_locality: "California",
    social_urls: [
      "https://www.instagram.com/everafterca",
      "https://www.tiktok.com/@everafter.ca"
    ]
  }
};

// ─── Key type ───────────────────────────────────────────────────────

export type HomepageContentKey = keyof typeof DEFAULTS;

const ALL_KEYS: HomepageContentKey[] = [
  'homepage_hero',
  'homepage_services_header',
  'homepage_portfolio_header',
  'homepage_testimonials',
  'homepage_blog_header',
  'homepage_contact',
  'homepage_seo',
];

// ─── Content map type ───────────────────────────────────────────────

export interface HomepageContentMap {
  homepage_hero: HeroContent;
  homepage_services_header: ServicesHeaderContent;
  homepage_portfolio_header: PortfolioHeaderContent;
  homepage_testimonials: TestimonialsContent;
  homepage_blog_header: BlogHeaderContent;
  homepage_contact: ContactContent;
  homepage_seo: SeoContent;
}

// ─── Hook ───────────────────────────────────────────────────────────

export const useHomepageContent = () => {
  const [content, setContent] = useState<HomepageContentMap>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const fetchContent = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ALL_KEYS);

      if (error) {
        console.error('Error fetching homepage content:', error);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const merged = { ...DEFAULTS } as HomepageContentMap;
        for (const row of data) {
          const key = row.key as HomepageContentKey;
          if (key in DEFAULTS && row.value) {
            // Deep merge: DB values override defaults, but missing fields fall back
            merged[key] = {
              ...DEFAULTS[key],
              ...(row.value as any),
            };
          }
        }
        setContent(merged);
      }
    } catch (err) {
      console.error('Error fetching homepage content:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();

    // Single real-time subscription for all homepage content keys
    const channel = supabase
      .channel('homepage-content-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'site_settings',
      }, (payload) => {
        const key = (payload.new as any)?.key;
        if (ALL_KEYS.includes(key)) {
          fetchContent();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchContent]);

  return { content, loading };
};
