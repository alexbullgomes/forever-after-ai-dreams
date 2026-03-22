
CREATE TABLE navigation_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  url text NOT NULL,
  type text NOT NULL DEFAULT 'internal' CHECK (type IN ('internal', 'external')),
  open_in_new_tab boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE navigation_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active links" ON navigation_links
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage links" ON navigation_links
  FOR ALL USING (has_role(auth.uid(), 'admin'::text));
