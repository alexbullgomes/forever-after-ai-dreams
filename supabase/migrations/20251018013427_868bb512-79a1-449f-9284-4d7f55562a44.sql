-- Extend site_settings to support comprehensive brand color tokens
-- This migration adds semantic color tokens for icon backgrounds, text accents, badges, etc.

-- Update the existing brand_colors value to include new tokens
UPDATE site_settings
SET value = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                value,
                '{icon_bg_primary}',
                '"244 63 94"'
              ),
              '{icon_bg_secondary}',
              '"168 85 247"'
            ),
            '{icon_bg_accent}',
            '"236 72 153"'
          ),
          '{text_accent}',
          '"244 63 94"'
        ),
        '{badge_bg}',
        '"254 242 242"'
      ),
      '{badge_text}',
      '"225 29 72"'
    ),
    '{stats_text}',
    '"244 63 94"'
  ),
  '{feature_dot}',
  '"251 113 133"'
)
WHERE key = 'brand_colors';

-- Add comment for documentation
COMMENT ON TABLE site_settings IS 'Stores global site configuration including comprehensive brand color tokens for UI elements';
COMMENT ON COLUMN site_settings.value IS 'JSONB field storing brand colors: primary gradients (primary_from, primary_to, primary_hover_from, primary_hover_to), icon backgrounds (icon_bg_primary, icon_bg_secondary, icon_bg_accent), text accents (text_accent, badge_text, stats_text), backgrounds (badge_bg), and decorative elements (feature_dot). All colors in HSL format without "hsl()" wrapper.';