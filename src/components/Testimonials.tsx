import { Card, CardContent } from "@/components/ui/card";
import { Star, Heart, Quote } from "lucide-react";
const Testimonials = () => {
  const testimonials = [{
    id: 1,
    name: "Alana & Michael",
    location: "San Diego Couple Family Documentary",
    rating: 5,
    text: "Absolutely breathtaking! They captured every moment perfectly. Our wedding film brings tears of joy every time we watch it. The attention to detail and artistic vision exceeded all our expectations.",
    image: "/lovable-uploads/8218160d-57f7-4efa-9bcf-f22f3074d54a.png"
  }, {
    id: 2,
    name: "Emma & David",
    location: "Malibu Beach Ceremony",
    rating: 5,
    text: "Professional, creative, and so much fun to work with! They made us feel comfortable and the results were simply magical. Our photos are like artwork - we display them proudly in our home.",
    image: "/lovable-uploads/a7af5164-9a69-4921-87dc-4d167dc3b382.png"
  }, {
    id: 3,
    name: "Jessica & Ryan",
    location: "Sonoma Garden Wedding",
    rating: 5,
    text: "The best investment we made for our wedding! The cinematic quality and storytelling approach created memories we'll treasure forever. They truly understand how to capture love.",
    image: "/lovable-uploads/16b44735-6be5-41eb-b64a-a9cd4a2c8571.png"
  }, {
    id: 4,
    name: "Lauren & James",
    location: "San Francisco City Wedding",
    rating: 5,
    text: "Incredible team with amazing artistic vision. They captured moments we didn't even know were happening. The final film was beyond our wildest dreams - it's our love story told beautifully.",
    image: "/lovable-uploads/e4d4b04a-7d06-4b7d-9e8c-4b85c7039d41.png"
  }];
  return <section className="py-20 bg-section-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <div className="flex items-center space-x-2 rounded-full px-4 py-2" style={{ backgroundColor: `hsl(var(--brand-badge-bg))` }}>
              <Heart className="w-5 h-5 text-brand-text-accent" />
              <span className="text-brand-badge-text text-sm font-medium">Happy Couples</span>
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Loved by Couples
            <span className="block bg-brand-gradient bg-clip-text text-transparent">Families & Brands</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See why people across California trust Ever After to capture their most meaningful moments.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => <Card key={testimonial.id} className={`group hover:shadow-2xl transition-all duration-500 border-0 bg-card/70 backdrop-blur-sm hover:scale-105 ${index % 2 === 1 ? 'md:mt-8' : ''}`}>
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name} 
                    className="w-16 h-16 rounded-full object-cover mr-4 ring-2" 
                    style={{ '--tw-ring-color': `hsl(var(--brand-badge-bg))` } as React.CSSProperties}
                    loading="lazy"
                    decoding="async"
                    width={64}
                    height={64}
                  />
                  <div>
                    <h4 className="text-lg font-bold text-foreground">{testimonial.name}</h4>
                    <p className="text-brand-text-accent text-sm font-medium">{testimonial.location}</p>
                  </div>
                </div>

                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />)}
                </div>

                <div className="relative">
                  <Quote className="absolute -top-2 -left-2 w-8 h-8" style={{ color: `hsl(var(--brand-badge-bg))` }} />
                  <p className="text-foreground/80 leading-relaxed pl-6 italic">
                    "{testimonial.text}"
                  </p>
                </div>
              </CardContent>
            </Card>)}
        </div>

        {/* Stats section */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="flex flex-col items-center">
            <div className="text-4xl font-bold bg-brand-gradient bg-clip-text text-transparent mb-2">
              500+
            </div>
            <p className="text-muted-foreground font-medium">Happy Couples</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-4xl font-bold bg-brand-gradient bg-clip-text text-transparent mb-2">
              5★
            </div>
            <p className="text-muted-foreground font-medium">Average Rating</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-4xl font-bold bg-brand-gradient bg-clip-text text-transparent mb-2">
              50+
            </div>
            <p className="text-muted-foreground font-medium">Venues Covered</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-4xl font-bold bg-brand-gradient bg-clip-text text-transparent mb-2">
              8+
            </div>
            <p className="text-muted-foreground font-medium">Years Experience</p>
          </div>
        </div>
      </div>
    </section>;
};
export default Testimonials;