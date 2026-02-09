import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Heart, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { VideoThumbnail } from "@/components/ui/gallery/VideoThumbnail";
import GalleryLeadForm, { GalleryLeadFormRef } from "@/components/ui/gallery/GalleryLeadForm";

interface PortfolioItem {
  id: string;
  category: string;
  title: string;
  location: string;
  date: string;
  type: string;
  featured: boolean;
  video?: string;
  videoMp4?: string;
  image: string;
  thumbWebm?: string;
  thumbMp4?: string;
  thumbImage?: string;
  // Redirect fields
  destinationType?: string;
  campaignSlug?: string;
  customUrl?: string;
}

interface PortfolioProps {
  onBookingClick?: () => void;
}

const Portfolio = ({
  onBookingClick
}: PortfolioProps = {}) => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const formRef = useRef<GalleryLeadFormRef>(null);

  const handleViewPortfolioClick = () => {
    if (user) {
      navigate("/services");
    } else if (onBookingClick) {
      onBookingClick();
    }
  };

  const handleCardClick = (item: PortfolioItem) => {
    // Priority 1: Campaign page
    if (item.destinationType === 'campaign' && item.campaignSlug) {
      navigate(`/promo/${item.campaignSlug}`);
      return;
    }
    
    // Priority 2: Custom URL
    if (item.destinationType === 'url' && item.customUrl) {
      if (item.customUrl.startsWith('http://') || item.customUrl.startsWith('https://')) {
        window.location.href = item.customUrl;
      } else {
        // Try adding https if missing
        window.location.href = `https://${item.customUrl}`;
      }
      return;
    }
    
    // Priority 3: Fallback - show the lead capture form
    formRef.current?.openWithCard({
      id: item.id,
      title: item.title,
      category: item.category,
      locationCity: item.location,
      eventSeasonOrDate: item.date
    });
  };

  // Fetch portfolio data from Supabase with campaign join
  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        const { data, error } = await supabase
          .from('gallery_cards')
          .select(`
            *,
            promotional_campaigns!gallery_cards_campaign_id_fkey(slug)
          `)
          .eq('is_published', true)
          .order('order_index', { ascending: true });

        if (error) throw error;

        const formattedItems: PortfolioItem[] = (data || []).map(card => ({
          id: card.id,
          category: card.category,
          title: card.title,
          location: card.location_city || '',
          date: card.event_season_or_date || '',
          type: card.category === 'Weddings' ? 'Wedding' : 'Photo & Video',
          featured: card.featured || false,
          video: card.video_url,
          videoMp4: card.video_mp4_url,
          image: card.thumbnail_url || '',
          thumbWebm: card.thumb_webm_url,
          thumbMp4: card.thumb_mp4_url,
          thumbImage: card.thumb_image_url,
          // Redirect fields
          destinationType: card.destination_type || 'none',
          campaignSlug: card.promotional_campaigns?.slug || null,
          customUrl: card.custom_url || null
        }));

        setPortfolioItems(formattedItems);
      } catch (error) {
        console.error('Error fetching portfolio data:', error);
        setPortfolioItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioData();
  }, []);

  const filteredItems = activeFilter === "all" 
    ? portfolioItems
    : portfolioItems.filter(item => {
        if (activeFilter === "photo-videos") return item.category === "Photo & Videos";
        if (activeFilter === "weddings") return item.category === "Weddings";
        return false;
      });
  
  const filters = [{
    id: "all",
    label: "Highlights"
  }, {
    id: "photo-videos",
    label: "Photo & Videos"
  }, {
    id: "weddings",
    label: "Weddings"
  }];

  if (loading) {
    return (
      <section id="portfolio" className="py-20 bg-section-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-4">
              <div className="flex items-center space-x-2 rounded-full px-4 py-2" style={{ backgroundColor: `hsl(var(--brand-badge-bg))` }}>
                <Heart className="w-5 h-5 text-brand-text-accent" />
                <span className="text-brand-badge-text text-sm font-medium">Our Portfolio</span>
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Recent
              <span className="block bg-brand-gradient bg-clip-text text-transparent">Stories</span>
            </h2>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary-from"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="portfolio" className="py-20 bg-section-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <div className="flex items-center space-x-2 rounded-full px-4 py-2" style={{ backgroundColor: `hsl(var(--brand-badge-bg))` }}>
              <Heart className="w-5 h-5 text-brand-text-accent" />
              <span className="text-brand-badge-text text-sm font-medium">Our Portfolio</span>
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Recent
            <span className="block bg-brand-gradient bg-clip-text text-transparent">Stories</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">All stories are unique. Here are some of our recent celebrations captured across California.</p>

          {/* Filter buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {filters.map(filter => (
              <Button 
                key={filter.id} 
                onClick={() => setActiveFilter(filter.id)} 
                variant={activeFilter === filter.id ? "default" : "outline"} 
                className={`px-6 py-2 rounded-full transition-all duration-300 ${activeFilter === filter.id ? "bg-brand-gradient text-white shadow-lg" : "border-border text-foreground/80 hover:border-brand-text-accent/30 hover:text-brand-text-accent"}`}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {filteredItems.map(item => (
            <Card 
              key={item.id} 
              role="button"
              tabIndex={0}
              aria-label={`View ${item.title} - ${item.type} in ${item.location}`}
              className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 bg-card cursor-pointer" 
              onClick={() => handleCardClick(item)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardClick(item);
                }
              }}
            >
              <div className="relative overflow-hidden">
                <VideoThumbnail
                  webmUrl={item.thumbWebm}
                  mp4Url={item.thumbMp4}
                  imageUrl={item.thumbImage}
                  fallbackImageUrl={item.image}
                  alt={item.title}
                  className="w-full h-80 object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Play button for videos */}
                {item.category === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer">
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                  </div>
                )}

                {/* Category badge */}
                <div className="absolute top-4 left-4">
                  <span className="bg-brand-gradient text-white px-3 py-1 rounded-full text-sm font-medium">
                    {item.type}
                  </span>
                </div>
              </div>

              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-brand-text-accent transition-colors">
                  {item.title}
                </h3>
                <div className="flex items-center text-muted-foreground mb-2">
                  <span className="text-sm">{item.location}</span>
                </div>
                <div className="flex items-center text-muted-foreground/70">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="text-sm">{item.date}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button onClick={handleViewPortfolioClick} size="lg" className="bg-brand-gradient hover:bg-brand-gradient-hover text-white px-8 py-4 text-lg font-semibold rounded-full shadow-lg transition-all duration-300">
            View Complete Portfolio
          </Button>
        </div>
      </div>

      {/* Lead capture form for cards without destination */}
      <GalleryLeadForm ref={formRef} />
    </section>
  );
};

export default Portfolio;
