
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Play, Camera } from "lucide-react";

const PortfolioWithImages = () => {
  const [activeCategory, setActiveCategory] = useState("all");

  const portfolioItems = [
    {
      id: 1,
      title: "Sarah & Michael's Garden Wedding",
      category: "photo",
      location: "Napa Valley",
      image: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92",
      type: "Photography"
    },
    {
      id: 2,
      title: "Jessica & David's Beach Ceremony",
      category: "video",
      location: "Malibu",
      image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc",
      type: "Videography"
    },
    {
      id: 3,
      title: "Emma & James's Vineyard Celebration",
      category: "photo",
      location: "Sonoma",
      image: "https://images.unsplash.com/photo-1520854221256-17451cc331bf",
      type: "Photography"
    },
    {
      id: 4,
      title: "Ashley & Ryan's City Wedding",
      category: "video",
      location: "San Francisco",
      image: "https://images.unsplash.com/photo-1519741497674-611481863552",
      type: "Videography"
    },
    {
      id: 5,
      title: "Maria & Carlos's Rustic Wedding",
      category: "photo",
      location: "Paso Robles",
      image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8",
      type: "Photography"
    },
    {
      id: 6,
      title: "Rachel & Tom's Lake Wedding",
      category: "video",
      location: "Lake Tahoe",
      image: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a",
      type: "Videography"
    }
  ];

  const filteredItems = activeCategory === "all" 
    ? portfolioItems 
    : portfolioItems.filter(item => item.category === activeCategory);

  return (
    <div className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Heart className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
              Recent Love Stories
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Every couple has a unique story. Here are some of our recent celebrations 
            captured across California's most stunning venues.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex justify-center mb-12">
          <div className="flex space-x-4 bg-gray-100 p-2 rounded-full">
            <Button
              variant={activeCategory === "all" ? "default" : "ghost"}
              onClick={() => setActiveCategory("all")}
              className={`rounded-full px-6 ${
                activeCategory === "all" 
                  ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All Work
            </Button>
            <Button
              variant={activeCategory === "photo" ? "default" : "ghost"}
              onClick={() => setActiveCategory("photo")}
              className={`rounded-full px-6 ${
                activeCategory === "photo" 
                  ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Camera className="w-4 h-4 mr-2" />
              Photography
            </Button>
            <Button
              variant={activeCategory === "video" ? "default" : "ghost"}
              onClick={() => setActiveCategory("video")}
              className={`rounded-full px-6 ${
                activeCategory === "video" 
                  ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Play className="w-4 h-4 mr-2" />
              Videography
            </Button>
          </div>
        </div>

        {/* Portfolio Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((item) => (
            <Card key={item.id} className="group overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="relative overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="inline-block bg-rose-500 px-3 py-1 rounded-full text-sm font-medium mb-2">
                    {item.type}
                  </span>
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.location}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button 
            size="lg"
            className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-2xl hover:shadow-rose-500/25 transition-all duration-300"
          >
            View Full Portfolio
          </Button>
        </div>
      </div>
    </div>
  );
};

export { PortfolioWithImages };
