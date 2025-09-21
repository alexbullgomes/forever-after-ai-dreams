import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Heart, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import GalleryLeadForm from "@/components/ui/gallery/GalleryLeadForm";
import { VideoThumbnail } from "@/components/ui/gallery/VideoThumbnail";

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
}

interface PortfolioProps {
  onBookingClick?: () => void;
}
const Portfolio = ({
  onBookingClick
}: PortfolioProps = {}) => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [isConsultationFormOpen, setIsConsultationFormOpen] = useState(false);
  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState<PortfolioItem | null>(null);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const handleViewPortfolioClick = () => {
    if (user) {
      navigate("/planner");
    } else if (onBookingClick) {
      onBookingClick();
    }
  };

  const handleCardClick = (item: PortfolioItem) => {
    if (user) {
      navigate("/planner");
    } else {
      setSelectedPortfolioItem(item);
      setIsConsultationFormOpen(true);
    }
  };
  // Fetch portfolio data from Supabase
  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        const { data, error } = await supabase
          .from('gallery_cards')
          .select('*')
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
          thumbImage: card.thumb_image_url
        }));

        setPortfolioItems(formattedItems);
      } catch (error) {
        console.error('Error fetching portfolio data:', error);
        // Fallback to empty array on error
        setPortfolioItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioData();
  }, []);
  const filteredItems = activeFilter === "all" 
    ? portfolioItems.filter(item => item.featured === true)
    : portfolioItems.filter(item => {
        if (activeFilter === "photo-videos") return item.category === "Photo & Videos";
        if (activeFilter === "weddings") return item.category === "Weddings";
        return false;
      });
  
  const filters = [{
    id: "all",
    label: "All Stories"
  }, {
    id: "photo-videos",
    label: "Photo & Videos"
  }, {
    id: "weddings",
    label: "Weddings"
  }];

  if (loading) {
    return (
      <section id="portfolio" className="py-20 bg-gradient-to-br from-rose-50 to-pink-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-4">
              <div className="flex items-center space-x-2 bg-gradient-to-r from-rose-100 to-pink-100 rounded-full px-4 py-2">
                <Heart className="w-5 h-5 text-rose-500" />
                <span className="text-rose-700 text-sm font-medium">Our Portfolio</span>
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Recent
              <span className="block bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">Stories</span>
            </h2>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
          </div>
        </div>
      </section>
    );
  }

  return <section id="portfolio" className="py-20 bg-gradient-to-br from-rose-50 to-pink-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <div className="flex items-center space-x-2 bg-gradient-to-r from-rose-100 to-pink-100 rounded-full px-4 py-2">
              <Heart className="w-5 h-5 text-rose-500" />
              <span className="text-rose-700 text-sm font-medium">Our Portfolio</span>
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Recent
            <span className="block bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">Stories</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">All stories are unique. Here are some of our recent celebrations captured across California.</p>

          {/* Filter buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {filters.map(filter => <Button key={filter.id} onClick={() => setActiveFilter(filter.id)} variant={activeFilter === filter.id ? "default" : "outline"} className={`px-6 py-2 rounded-full transition-all duration-300 ${activeFilter === filter.id ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg" : "border-gray-300 text-gray-700 hover:border-rose-300 hover:text-rose-600"}`}>
                {filter.label}
              </Button>)}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {filteredItems.map(item => <Card 
              key={item.id} 
              className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 bg-white cursor-pointer" 
              onClick={() => handleCardClick(item)}
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
                {item.category === "video" && <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer">
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                  </div>}

                {/* Category badge */}
                <div className="absolute top-4 left-4">
                  <span className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {item.type}
                  </span>
                </div>
              </div>

              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-rose-600 transition-colors">
                  {item.title}
                </h3>
                <div className="flex items-center text-gray-600 mb-2">
                  <span className="text-sm">{item.location}</span>
                </div>
                <div className="flex items-center text-gray-500">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="text-sm">{item.date}</span>
                </div>
              </CardContent>
            </Card>)}
        </div>

        <div className="text-center mt-12">
          <Button onClick={handleViewPortfolioClick} size="lg" className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-rose-500/25 transition-all duration-300">
            View Complete Portfolio
          </Button>
        </div>
      </div>

      <GalleryLeadForm
        isOpen={isConsultationFormOpen}
        onClose={() => setIsConsultationFormOpen(false)}
        cardData={selectedPortfolioItem ? {
          cardId: selectedPortfolioItem.id,
          cardTitle: selectedPortfolioItem.title,
          category: selectedPortfolioItem.category,
          locationCity: selectedPortfolioItem.location,
          eventSeasonOrDate: selectedPortfolioItem.date,
          collectionSection: 'Portfolio',
          type: selectedPortfolioItem.type
        } : undefined}
      />
    </section>;
};
export default Portfolio;