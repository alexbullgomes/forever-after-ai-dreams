-- 1. Create booking_pipeline_snapshots table
CREATE TABLE public.booking_pipeline_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  filter_range text DEFAULT 'all',
  total_in_flow integer NOT NULL DEFAULT 0,
  date_selected integer NOT NULL DEFAULT 0,
  time_selected integer NOT NULL DEFAULT 0,
  checkout_started integer NOT NULL DEFAULT 0,
  paid integer NOT NULL DEFAULT 0,
  abandoned integer NOT NULL DEFAULT 0,
  contacted integer NOT NULL DEFAULT 0,
  estimated_revenue numeric NOT NULL DEFAULT 0,
  archived_count integer NOT NULL DEFAULT 0,
  metrics_json jsonb DEFAULT '{}'
);

ALTER TABLE public.booking_pipeline_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage snapshots"
  ON public.booking_pipeline_snapshots FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::text));

-- 2. Add is_archived column to booking_requests
ALTER TABLE public.booking_requests
  ADD COLUMN is_archived boolean NOT NULL DEFAULT false;

CREATE INDEX idx_booking_requests_is_archived
  ON public.booking_requests(is_archived);

-- 3. Create archive_booking_pipeline RPC function
CREATE OR REPLACE FUNCTION public.archive_booking_pipeline(
  p_create_snapshot boolean DEFAULT true,
  p_filter_range text DEFAULT 'all'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_counts jsonb;
  v_revenue numeric := 0;
  v_archived integer;
  v_snapshot_id uuid;
BEGIN
  -- Admin check
  IF NOT has_role(v_user_id, 'admin'::text) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Aggregate current non-archived metrics
  SELECT jsonb_build_object(
    'total', COUNT(*) FILTER (WHERE stage != 'paid'),
    'date_selected', COUNT(*) FILTER (WHERE stage = 'date_selected'),
    'time_selected', COUNT(*) FILTER (WHERE stage = 'time_selected'),
    'checkout_started', COUNT(*) FILTER (WHERE stage = 'checkout_started'),
    'paid', COUNT(*) FILTER (WHERE stage = 'paid'),
    'contacted', COUNT(*) FILTER (WHERE stage = 'contacted'),
    'abandoned', COUNT(*) FILTER (WHERE stage != 'paid' AND stage != 'contacted'
      AND last_seen_at < now() - interval '24 hours')
  ) INTO v_counts
  FROM booking_requests
  WHERE is_archived = false;

  -- Calculate revenue estimate
  SELECT COALESCE(SUM(
    CASE
      WHEN br.product_id IS NOT NULL THEN COALESCE(p.price, 0)
      WHEN br.package_id IS NOT NULL THEN COALESCE(cp.minimum_deposit_cents::numeric / 100, 0)
      ELSE 0
    END
  ), 0) INTO v_revenue
  FROM booking_requests br
  LEFT JOIN products p ON p.id = br.product_id
  LEFT JOIN campaign_packages cp ON cp.id = br.package_id
  WHERE br.is_archived = false
    AND br.stage IN ('time_selected', 'checkout_started');

  -- Create snapshot if requested
  IF p_create_snapshot THEN
    INSERT INTO booking_pipeline_snapshots (
      created_by, filter_range,
      total_in_flow, date_selected, time_selected,
      checkout_started, paid, contacted, abandoned,
      estimated_revenue, archived_count, metrics_json
    ) VALUES (
      v_user_id, p_filter_range,
      (v_counts->>'total')::int,
      (v_counts->>'date_selected')::int,
      (v_counts->>'time_selected')::int,
      (v_counts->>'checkout_started')::int,
      (v_counts->>'paid')::int,
      (v_counts->>'contacted')::int,
      (v_counts->>'abandoned')::int,
      v_revenue,
      0, v_counts
    )
    RETURNING id INTO v_snapshot_id;
  END IF;

  -- Archive all non-archived requests
  UPDATE booking_requests
  SET is_archived = true
  WHERE is_archived = false;

  GET DIAGNOSTICS v_archived = ROW_COUNT;

  -- Update snapshot with archived count
  IF v_snapshot_id IS NOT NULL THEN
    UPDATE booking_pipeline_snapshots
    SET archived_count = v_archived
    WHERE id = v_snapshot_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'archived_count', v_archived,
    'snapshot_id', v_snapshot_id
  );
END;
$$;