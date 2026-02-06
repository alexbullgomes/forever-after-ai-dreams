-- Phase 4: Backfill LIMITED overrides for existing expired holds
-- Insert one by one since we know the dates and table is clean after Phase 1
INSERT INTO availability_overrides (product_id, date, status, reason, created_by)
VALUES 
  (NULL::uuid, '2026-02-08', 'limited', 'Expired hold - requires team review', NULL::uuid),
  (NULL::uuid, '2026-02-14', 'limited', 'Expired hold - requires team review', NULL::uuid),
  (NULL::uuid, '2026-02-19', 'limited', 'Expired hold - requires team review', NULL::uuid);