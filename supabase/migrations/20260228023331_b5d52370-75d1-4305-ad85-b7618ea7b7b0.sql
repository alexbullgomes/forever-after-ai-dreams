
-- Seed homepage content keys into site_settings
-- Uses INSERT ... ON CONFLICT to be idempotent

INSERT INTO public.site_settings (key, value)
VALUES
  ('homepage_hero', '{
    "badge_text": "California-Based Premium Visual Storytelling",
    "headline_line1": "Everafter",
    "headline_line2": "Memories That Last",
    "description": "California-based visual storytelling brand specialized in cinematic photography and videography for weddings, families, and businesses.",
    "cta_text": "Let''s Plan Together",
    "video_webm_url": "https://supabasestudio.agcreationmkt.cloud/storage/v1/object/public/weddingvideo/bannerhomepage.webm",
    "video_mp4_url": "https://supabasestudio.agcreationmkt.cloud/storage/v1/object/public/weddingvideo/bannerhomepage.mp4?t=2025-10-06T20%3A46%3A21.431Z",
    "poster_url": "https://supabasestudio.agcreationmkt.cloud/storage/v1/object/public/weddingvideo/Homepicture.webp",
    "trust_indicators": [
      {"emoji": "⭐", "text": "500+ Happy Couples"},
      {"emoji": "🏆", "text": "Award Winning"},
      {"emoji": "📍", "text": "California Based"}
    ]
  }'::jsonb),

  ('homepage_services_header', '{
    "badge_text": "Our Services",
    "title_line1": "Capturing",
    "title_line2": "Every Frame",
    "subtitle": "Professional videography and photography services designed to tell your unique story.",
    "additional_features": [
      {"icon": "Clock", "title": "Quick Turnaround", "description": "Receive your highlights within 48 hours"},
      {"icon": "Award", "title": "Award Winning", "description": "Recognized for excellence in wedding cinematography"},
      {"icon": "Heart", "title": "Personal Touch", "description": "Tailored approach to your unique love story"}
    ]
  }'::jsonb),

  ('homepage_portfolio_header', '{
    "badge_text": "Our Portfolio",
    "title_line1": "Recent",
    "title_line2": "Stories",
    "subtitle": "All stories are unique. Here are some of our recent celebrations captured across California.",
    "cta_text": "View Complete Portfolio",
    "filters": [
      {"id": "all", "label": "Highlights"},
      {"id": "photo-videos", "label": "Photo & Videos"},
      {"id": "weddings", "label": "Weddings"}
    ]
  }'::jsonb),

  ('homepage_testimonials', '{
    "badge_text": "Happy Couples",
    "title_line1": "Loved by Couples",
    "title_line2": "Families & Brands",
    "subtitle": "See why people across California trust Ever After to capture their most meaningful moments.",
    "testimonials": [
      {
        "name": "Alana & Michael",
        "location": "San Diego Couple Family Documentary",
        "rating": 5,
        "text": "Absolutely breathtaking! They captured every moment perfectly. Our wedding film brings tears of joy every time we watch it. The attention to detail and artistic vision exceeded all our expectations.",
        "image_url": "/lovable-uploads/8218160d-57f7-4efa-9bcf-f22f3074d54a.png"
      },
      {
        "name": "Emma & David",
        "location": "Malibu Beach Ceremony",
        "rating": 5,
        "text": "Professional, creative, and so much fun to work with! They made us feel comfortable and the results were simply magical. Our photos are like artwork - we display them proudly in our home.",
        "image_url": "/lovable-uploads/a7af5164-9a69-4921-87dc-4d167dc3b382.png"
      },
      {
        "name": "Jessica & Ryan",
        "location": "Sonoma Garden Wedding",
        "rating": 5,
        "text": "The best investment we made for our wedding! The cinematic quality and storytelling approach created memories we''ll treasure forever. They truly understand how to capture love.",
        "image_url": "/lovable-uploads/16b44735-6be5-41eb-b64a-a9cd4a2c8571.png"
      },
      {
        "name": "Lauren & James",
        "location": "San Francisco City Wedding",
        "rating": 5,
        "text": "Incredible team with amazing artistic vision. They captured moments we didn''t even know were happening. The final film was beyond our wildest dreams - it''s our love story told beautifully.",
        "image_url": "/lovable-uploads/e4d4b04a-7d06-4b7d-9e8c-4b85c7039d41.png"
      }
    ],
    "stats": [
      {"value": "500+", "label": "Happy Couples"},
      {"value": "5★", "label": "Average Rating"},
      {"value": "50+", "label": "Venues Covered"},
      {"value": "8+", "label": "Years Experience"}
    ]
  }'::jsonb),

  ('homepage_blog_header', '{
    "badge_text": "Latest Stories",
    "title": "Insights & Inspiration",
    "subtitle": "Tips, behind-the-scenes stories, and inspiration from our team at EverAfter Studio."
  }'::jsonb),

  ('homepage_contact', '{
    "badge_text": "Get In Touch",
    "title_line1": "Let''s Create Something",
    "title_line2": "Beautiful Together",
    "subtitle": "Ready to turn your wedding day into a cinematic masterpiece? Let''s discuss your vision and create magic together.",
    "form_title": "Send us a message",
    "email": "contact@everafterca.com",
    "phone": "(442) 224-4820",
    "whatsapp_url": "https://wa.me/message/Z3PCMXW6HCTQF1",
    "address": "California, USA",
    "social_links": [
      {"platform": "instagram", "url": "https://www.instagram.com/everafterca"},
      {"platform": "tiktok", "url": "https://www.tiktok.com/@everafter.ca"},
      {"platform": "whatsapp", "url": "https://wa.me/message/Z3PCMXW6HCTQF1"}
    ],
    "quick_response_title": "Quick Response Promise",
    "quick_response_text": "We understand how exciting (and overwhelming) planning can be. That''s why we respond to all inquiries within 24 hours, and often much sooner. You deserve immediate attention."
  }'::jsonb),

  ('homepage_seo', '{
    "business_name": "Everafter Studio",
    "seo_title": "Wedding Videography & Photography California",
    "seo_description": "California''s premier wedding videography & photography studio. Award-winning cinematic films and professional photos for weddings, families, and businesses.",
    "phone": "(442) 224-4820",
    "email": "contact@everafterca.com",
    "address_locality": "California",
    "social_urls": [
      "https://www.instagram.com/everafterca",
      "https://www.tiktok.com/@everafter.ca"
    ]
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;
