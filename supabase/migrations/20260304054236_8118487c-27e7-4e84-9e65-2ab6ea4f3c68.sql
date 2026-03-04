
-- Add visibility_mode column with default 'public'
ALTER TABLE promotional_campaigns
  ADD COLUMN visibility_mode text NOT NULL DEFAULT 'public';

-- Backfill existing campaigns based on is_active
UPDATE promotional_campaigns
  SET visibility_mode = CASE WHEN is_active = true THEN 'public' ELSE 'inactive' END;

-- Create sync trigger to keep is_active in sync with visibility_mode
CREATE OR REPLACE FUNCTION sync_campaign_is_active()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.is_active := (NEW.visibility_mode IN ('public', 'unlisted'));
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_campaign_is_active
  BEFORE INSERT OR UPDATE ON promotional_campaigns
  FOR EACH ROW EXECUTE FUNCTION sync_campaign_is_active();
