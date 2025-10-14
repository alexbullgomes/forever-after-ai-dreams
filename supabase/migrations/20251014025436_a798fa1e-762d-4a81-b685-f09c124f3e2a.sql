-- Create promotional_popups table
CREATE TABLE promotional_popups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active BOOLEAN NOT NULL DEFAULT false,
  title TEXT NOT NULL,
  subtitle TEXT,
  discount_label TEXT NOT NULL,
  cta_label TEXT NOT NULL,
  phone_required BOOLEAN NOT NULL DEFAULT true,
  legal_note TEXT,
  icon TEXT NOT NULL DEFAULT 'gift',
  bg_gradient TEXT NOT NULL DEFAULT 'from-rose-500 to-pink-500',
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  show_once_per_session BOOLEAN NOT NULL DEFAULT true,
  countdown_hours INTEGER NOT NULL DEFAULT 12,
  delay_seconds INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only one active popup at a time
CREATE UNIQUE INDEX idx_promotional_popups_active 
  ON promotional_popups (is_active) 
  WHERE is_active = true;

-- Enable RLS
ALTER TABLE promotional_popups ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view active promotional popups"
  ON promotional_popups FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all promotional popups"
  ON promotional_popups FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create promotional popups"
  ON promotional_popups FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update promotional popups"
  ON promotional_popups FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete promotional popups"
  ON promotional_popups FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Create visitor_popup_submissions table
CREATE TABLE visitor_popup_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  popup_id UUID NOT NULL REFERENCES promotional_popups(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  synced_to_profile BOOLEAN NOT NULL DEFAULT false,
  synced_at TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB
);

CREATE INDEX idx_visitor_popup_submissions_visitor_id 
  ON visitor_popup_submissions(visitor_id);
CREATE INDEX idx_visitor_popup_submissions_synced 
  ON visitor_popup_submissions(synced_to_profile, visitor_id);

-- Enable RLS
ALTER TABLE visitor_popup_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can create visitor popup submissions"
  ON visitor_popup_submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own submissions"
  ON visitor_popup_submissions FOR SELECT
  USING (
    visitor_id IN (
      SELECT visitor_id FROM profiles WHERE id = auth.uid()
    ) OR user_id = auth.uid()
  );

CREATE POLICY "Admins can view all submissions"
  ON visitor_popup_submissions FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update submissions"
  ON visitor_popup_submissions FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Create updated_at trigger for promotional_popups
CREATE OR REPLACE FUNCTION update_promotional_popups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER promotional_popups_updated_at
  BEFORE UPDATE ON promotional_popups
  FOR EACH ROW
  EXECUTE FUNCTION update_promotional_popups_updated_at();