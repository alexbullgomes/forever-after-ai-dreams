-- Insert landing_page_cards settings
INSERT INTO public.site_settings (key, value)
VALUES (
  'landing_page_cards',
  '{
    "show_cards_section": true,
    "cards": [
      {
        "icon": "Heart",
        "title": "Personalized Planner",
        "description": "Meet EVA — our smart assistant who builds your ideal package and unlocks exclusive deals.",
        "features": ["EVA, AI-Powered Recommendations", "Smart Custom Packages for You", "Matches for Your Event Type", "Thoughtful Budget Optimization"],
        "button_label": "More Details",
        "button_link": "/services"
      },
      {
        "icon": "Camera",
        "title": "Photo & Video Services",
        "description": "Life moves fast, but memories don''t have to fade. We capture moments you''ll want to hold onto forever.",
        "features": ["Genuine Family Portraits", "Stories Behind Your Business", "Corporate Gatherings", "Celebrations and Milestones"],
        "button_label": "More Details",
        "button_link": ""
      },
      {
        "icon": "Sparkles",
        "title": "Wedding Packages",
        "description": "Your love story feels like a movie — we''ll film the moment that matters most.",
        "features": ["Photos + Video Packages", "Artistic & Emotional Photography", "Cinematic Wedding Films", "Personalized & Fast Delivery"],
        "button_label": "More Details",
        "button_link": "/wedding-packages"
      }
    ]
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;