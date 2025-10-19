-- Update brand_colors in site_settings to include hero section tokens
UPDATE site_settings
SET value = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(
                  jsonb_set(
                    jsonb_set(
                      jsonb_set(
                        jsonb_set(
                          value::jsonb,
                          '{hero_overlay_color}',
                          '"0 0 0"'
                        ),
                        '{hero_badge_bg_color}',
                        '"0 0 100"'
                      ),
                      '{hero_badge_icon}',
                      '"351 95 71"'
                    ),
                    '{hero_gradient_from}',
                    '"351 95 71"'
                  ),
                  '{hero_gradient_via}',
                  '"328 86 70"'
                ),
                '{hero_gradient_to}',
                '"261 90 76"'
              ),
              '{hero_text_primary}',
              '"0 0 100"'
            ),
            '{hero_text_muted}',
            '"0 0 100"'
          ),
          '{hero_trust_text}',
          '"0 0 100"'
        ),
        '{hero_glow_1_from}',
        '"351 95 71"'
      ),
      '{hero_glow_1_to}',
      '"328 86 70"'
    ),
    '{hero_glow_2_from}',
    '"261 90 76"'
  ),
  '{hero_glow_2_to}',
  '"328 86 70"'
)
WHERE key = 'brand_colors';