-- Create visitors table for persistent visitor tracking
CREATE TABLE public.visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  first_landing_url text,
  last_url text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  referrer text,
  device_type text,
  browser text,
  os text,
  screen_resolution text,
  linked_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'anonymous' CHECK (status IN ('anonymous', 'linked')),
  metadata jsonb DEFAULT '{}'
);

-- Create indexes for visitors
CREATE INDEX idx_visitors_visitor_id ON public.visitors(visitor_id);
CREATE INDEX idx_visitors_linked_user_id ON public.visitors(linked_user_id);
CREATE INDEX idx_visitors_status ON public.visitors(status);
CREATE INDEX idx_visitors_created_at ON public.visitors(created_at);

-- Create visitor_events table for tracking pre-login journey
CREATE TABLE public.visitor_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text NOT NULL REFERENCES public.visitors(visitor_id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL,
  event_name text,
  page_url text,
  page_title text,
  event_payload jsonb DEFAULT '{}',
  session_id text
);

-- Create indexes for visitor_events
CREATE INDEX idx_visitor_events_visitor_id ON public.visitor_events(visitor_id);
CREATE INDEX idx_visitor_events_event_type ON public.visitor_events(event_type);
CREATE INDEX idx_visitor_events_created_at ON public.visitor_events(created_at);

-- Enable RLS on visitors table
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;

-- RLS policies for visitors
CREATE POLICY "Admins can view all visitors"
  ON public.visitors FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all visitors"
  ON public.visitors FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can insert visitor records"
  ON public.visitors FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update own visitor record by visitor_id"
  ON public.visitors FOR UPDATE
  USING (true);

-- Enable RLS on visitor_events table
ALTER TABLE public.visitor_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for visitor_events
CREATE POLICY "Admins can view all visitor events"
  ON public.visitor_events FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can insert visitor events"
  ON public.visitor_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their linked visitor events"
  ON public.visitor_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.visitors v 
      WHERE v.visitor_id = visitor_events.visitor_id 
      AND v.linked_user_id = auth.uid()
    )
  );