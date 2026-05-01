-- ============ FAVORITES: conversations (lead) ============
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS is_favorite_lead boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS favorite_lead_at timestamptz,
  ADD COLUMN IF NOT EXISTS favorite_lead_by uuid;

CREATE INDEX IF NOT EXISTS idx_conversations_favorite_lead
  ON public.conversations(is_favorite_lead) WHERE is_favorite_lead = true;

-- ============ FAVORITES: profiles (customer) ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_favorite_customer boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS favorite_customer_at timestamptz,
  ADD COLUMN IF NOT EXISTS favorite_customer_by uuid,
  ADD COLUMN IF NOT EXISTS favorite_customer_note text;

CREATE INDEX IF NOT EXISTS idx_profiles_favorite_customer
  ON public.profiles(is_favorite_customer) WHERE is_favorite_customer = true;

-- ============ ARCHIVE: conversations ============
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_by uuid,
  ADD COLUMN IF NOT EXISTS archive_reason text,
  ADD COLUMN IF NOT EXISTS archive_batch_id uuid;

CREATE INDEX IF NOT EXISTS idx_conversations_active
  ON public.conversations(created_at DESC) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_archive_batch
  ON public.conversations(archive_batch_id) WHERE archive_batch_id IS NOT NULL;

-- ============ RPC: toggle favorite (admin only) ============
CREATE OR REPLACE FUNCTION public.toggle_favorite_conversation(
  p_conversation_id uuid,
  p_favorite boolean,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_customer_id text;
  v_profile_id uuid;
BEGIN
  IF NOT has_role(v_user_id, 'admin'::text) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT customer_id INTO v_customer_id
  FROM conversations WHERE id = p_conversation_id;

  IF v_customer_id IS NOT NULL THEN
    BEGIN
      v_profile_id := v_customer_id::uuid;
    EXCEPTION WHEN others THEN
      v_profile_id := NULL;
    END;

    IF v_profile_id IS NOT NULL THEN
      UPDATE profiles
      SET is_favorite_customer = p_favorite,
          favorite_customer_at = CASE WHEN p_favorite THEN now() ELSE NULL END,
          favorite_customer_by = CASE WHEN p_favorite THEN v_user_id ELSE NULL END,
          favorite_customer_note = CASE WHEN p_favorite THEN COALESCE(p_note, favorite_customer_note) ELSE NULL END
      WHERE id = v_profile_id;

      RETURN jsonb_build_object('kind', 'customer', 'favorited', p_favorite);
    END IF;
  END IF;

  -- Visitor-only lead
  UPDATE conversations
  SET is_favorite_lead = p_favorite,
      favorite_lead_at = CASE WHEN p_favorite THEN now() ELSE NULL END,
      favorite_lead_by = CASE WHEN p_favorite THEN v_user_id ELSE NULL END
  WHERE id = p_conversation_id;

  RETURN jsonb_build_object('kind', 'lead', 'favorited', p_favorite);
END;
$$;

-- ============ RPC: preview archive (admin only) ============
CREATE OR REPLACE FUNCTION public.preview_archive_visitor_conversations(
  p_older_than_days int DEFAULT 30,
  p_exclude_favorites boolean DEFAULT true,
  p_exclude_user_linked boolean DEFAULT true,
  p_exclude_with_contact boolean DEFAULT true,
  p_exclude_human_mode boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_cutoff timestamptz;
  v_result jsonb;
  v_msg_count int;
BEGIN
  IF NOT has_role(v_user_id, 'admin'::text) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  v_cutoff := CASE WHEN p_older_than_days <= 0 THEN now() + interval '1 day'
                   ELSE now() - (p_older_than_days || ' days')::interval END;

  WITH candidates AS (
    SELECT c.id, c.created_at
    FROM conversations c
    WHERE c.archived_at IS NULL
      AND (NOT p_exclude_user_linked OR c.customer_id IS NULL)
      AND c.created_at < v_cutoff
      AND (NOT p_exclude_favorites OR c.is_favorite_lead = false)
      AND (NOT p_exclude_human_mode OR COALESCE(c.mode, 'ai') != 'human')
      AND (NOT p_exclude_with_contact OR (c.user_email IS NULL AND c.user_name IS NULL))
  )
  SELECT jsonb_build_object(
    'affected_count', COUNT(*),
    'oldest', MIN(created_at),
    'newest', MAX(created_at)
  ) INTO v_result FROM candidates;

  SELECT COUNT(*) INTO v_msg_count
  FROM messages m
  WHERE m.conversation_id IN (
    SELECT c.id FROM conversations c
    WHERE c.archived_at IS NULL
      AND (NOT p_exclude_user_linked OR c.customer_id IS NULL)
      AND c.created_at < v_cutoff
      AND (NOT p_exclude_favorites OR c.is_favorite_lead = false)
      AND (NOT p_exclude_human_mode OR COALESCE(c.mode, 'ai') != 'human')
      AND (NOT p_exclude_with_contact OR (c.user_email IS NULL AND c.user_name IS NULL))
  );

  RETURN v_result || jsonb_build_object('messages_preserved', v_msg_count);
END;
$$;

-- ============ RPC: archive (admin only) ============
CREATE OR REPLACE FUNCTION public.archive_visitor_conversations(
  p_older_than_days int DEFAULT 30,
  p_exclude_favorites boolean DEFAULT true,
  p_exclude_user_linked boolean DEFAULT true,
  p_exclude_with_contact boolean DEFAULT true,
  p_exclude_human_mode boolean DEFAULT true,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_cutoff timestamptz;
  v_batch_id uuid := gen_random_uuid();
  v_count int;
BEGIN
  IF NOT has_role(v_user_id, 'admin'::text) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  v_cutoff := CASE WHEN p_older_than_days <= 0 THEN now() + interval '1 day'
                   ELSE now() - (p_older_than_days || ' days')::interval END;

  UPDATE conversations
  SET archived_at = now(),
      archived_by = v_user_id,
      archive_reason = p_reason,
      archive_batch_id = v_batch_id
  WHERE archived_at IS NULL
    AND (NOT p_exclude_user_linked OR customer_id IS NULL)
    AND created_at < v_cutoff
    AND (NOT p_exclude_favorites OR is_favorite_lead = false)
    AND (NOT p_exclude_human_mode OR COALESCE(mode, 'ai') != 'human')
    AND (NOT p_exclude_with_contact OR (user_email IS NULL AND user_name IS NULL));

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN jsonb_build_object('batch_id', v_batch_id, 'archived_count', v_count);
END;
$$;

-- ============ RPC: restore (admin only) ============
CREATE OR REPLACE FUNCTION public.restore_archived_conversations(p_conversation_ids uuid[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::text) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE conversations
  SET archived_at = NULL, archived_by = NULL,
      archive_reason = NULL, archive_batch_id = NULL
  WHERE id = ANY(p_conversation_ids) AND archived_at IS NOT NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN jsonb_build_object('restored_count', v_count);
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_archive_batch(p_batch_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::text) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE conversations
  SET archived_at = NULL, archived_by = NULL,
      archive_reason = NULL, archive_batch_id = NULL
  WHERE archive_batch_id = p_batch_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN jsonb_build_object('restored_count', v_count);
END;
$$;

-- ============ Trigger: auto-unarchive on new visitor message ============
CREATE OR REPLACE FUNCTION public.auto_unarchive_on_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'user' THEN
    UPDATE conversations
    SET archived_at = NULL, archived_by = NULL,
        archive_reason = NULL, archive_batch_id = NULL
    WHERE id = NEW.conversation_id AND archived_at IS NOT NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_unarchive_on_new_message ON public.messages;
CREATE TRIGGER trg_auto_unarchive_on_new_message
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.auto_unarchive_on_new_message();

-- ============ Trigger: migrate favorite-lead -> favorite-customer on link ============
CREATE OR REPLACE FUNCTION public.migrate_favorite_on_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  IF NEW.customer_id IS NOT NULL
     AND (OLD.customer_id IS NULL OR OLD.customer_id <> NEW.customer_id)
     AND COALESCE(OLD.is_favorite_lead, false) = true THEN
    BEGIN
      v_profile_id := NEW.customer_id::uuid;
    EXCEPTION WHEN others THEN
      v_profile_id := NULL;
    END;

    IF v_profile_id IS NOT NULL THEN
      UPDATE profiles
      SET is_favorite_customer = true,
          favorite_customer_at = COALESCE(favorite_customer_at, OLD.favorite_lead_at, now()),
          favorite_customer_by = COALESCE(favorite_customer_by, OLD.favorite_lead_by)
      WHERE id = v_profile_id AND is_favorite_customer = false;

      NEW.is_favorite_lead := false;
      NEW.favorite_lead_at := NULL;
      NEW.favorite_lead_by := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_migrate_favorite_on_link ON public.conversations;
CREATE TRIGGER trg_migrate_favorite_on_link
BEFORE UPDATE OF customer_id ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.migrate_favorite_on_link();