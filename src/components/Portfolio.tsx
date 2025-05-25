import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Heart, Calendar } from "lucide-react";

const Portfolio = () => {
  const [activeFilter, setActiveFilter] = useState("all");

  const portfolioItems = [
    {
      id: 1,
      category: "video",
      title: "Sarah & Michael's Napa Valley Wedding",
      location: "Napa Valley, CA",
      date: "Summer 2024",
      image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=1200&fit=crop",
      type: "Cinematic Film"
    },
    {
      id: 2,
      category: "photo",
      title: "Emma & David's Romantic Ceremony",
      location: "California, CA",
      date: "Fall 2024",
      image: "/lovable-uploads/2ee7f946-776a-4a8f-a249-03cd6995cb76.png",
      type: "Photography"
    },
    {
      id: 3,
      category: "video",
      title: "Jessica & Ryan's Garden Wedding",
      location: "Sonoma, CA",
      date: "Spring 2024",
      image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&h=1200&fit=crop",
      type: "Cinematic Film"
    }
  ];

  const filteredItems = activeFilter === "all" 
    ? portfolioItems 
    : portfolioItems.filter(item => item.category === activeFilter);

  const filters = [
    { id: "all", label: "All Work" },
    { id: "video", label: "Wedding Films" },
    { id: "photo", label: "Photography" }
  ];

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
            <span className="block bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
              Love Stories
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Every couple has a unique story. Here are some of our recent celebrations captured across California.
          </p>

          {/* Filter buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {filters.map((filter) => (
              <Button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                variant={activeFilter === filter.id ? "default" : "outline"}
                className={`px-6 py-2 rounded-full transition-all duration-300 ${
                  activeFilter === filter.id
                    ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg"
                    : "border-gray-300 text-gray-700 hover:border-rose-300 hover:text-rose-600"
                }`}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {filteredItems.map((item) => (
            <Card key={item.id} className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 bg-white">
              <div className="relative overflow-hidden">
                <img 
                  src={item.image} 
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
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button 
            size="lg"
            className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-rose-500/25 transition-all duration-300"
          >
            View Complete Portfolio
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Portfolio;
