-- =====================================================================
-- In-app notifications (Phase 1 — web).
-- A persistent notifications table + SECURITY DEFINER fan-out triggers that
-- create a notification on: new follower, feed like, feed comment, direct
-- message, course access granted, and a newly-published chapter in a course
-- the user is enrolled in. Self-actions are suppressed.
-- (Announcement notifications are a deliberate follow-up — fanning a broadcast
--  out to every member needs a separate audience/last-seen design.)
-- Members can only read/update/delete their OWN rows; rows are created ONLY by
-- these SECURITY DEFINER triggers, never directly by clients.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,  -- recipient
  type        text NOT NULL,            -- follow | like | comment | message | course_access | chapter
  title       text NOT NULL,
  body        text,
  route       text,                     -- in-app route to open on tap
  actor_id    uuid REFERENCES public.users(id) ON DELETE SET NULL,          -- who triggered it
  entity_type text,                     -- user | post | message | module
  entity_id   uuid,
  is_read     boolean NOT NULL DEFAULT false,
  read_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON public.notifications (user_id, is_read, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notif_select_own ON public.notifications;
CREATE POLICY notif_select_own ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS notif_update_own ON public.notifications;
CREATE POLICY notif_update_own ON public.notifications
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS notif_delete_own ON public.notifications;
CREATE POLICY notif_delete_own ON public.notifications
  FOR DELETE USING (user_id = auth.uid());
-- (no INSERT policy on purpose: only the SECURITY DEFINER functions below insert)

-- single-recipient insert helper — suppresses self-notifications + null recipient
CREATE OR REPLACE FUNCTION public._notify(
  p_user_id uuid, p_type text, p_title text, p_body text,
  p_route text, p_actor_id uuid, p_entity_type text, p_entity_id uuid
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_user_id IS NULL OR p_user_id = p_actor_id THEN RETURN; END IF;
  INSERT INTO public.notifications (user_id, type, title, body, route, actor_id, entity_type, entity_id)
  VALUES (p_user_id, p_type, p_title, p_body, p_route, p_actor_id, p_entity_type, p_entity_id);
END $$;

-- new follower ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actor_name text;
BEGIN
  SELECT full_name INTO actor_name FROM public.users WHERE id = NEW.follower_id;
  PERFORM public._notify(
    NEW.following_id, 'follow',
    COALESCE(NULLIF(actor_name, ''), 'משתמש') || ' התחיל/ה לעקוב אחריך',
    NULL, '/profile/' || NEW.follower_id::text, NEW.follower_id, 'user', NEW.follower_id);
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS trg_notify_follow ON public.user_follows;
CREATE TRIGGER trg_notify_follow AFTER INSERT ON public.user_follows
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_follow();

-- feed like (notify post author) --------------------------------------
CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE post_author uuid; actor_name text;
BEGIN
  SELECT author_id INTO post_author FROM public.feed_posts WHERE id = NEW.post_id;
  SELECT full_name INTO actor_name FROM public.users WHERE id = NEW.user_id;
  PERFORM public._notify(
    post_author, 'like',
    COALESCE(NULLIF(actor_name, ''), 'משתמש') || ' אהב/ה את הפוסט שלך',
    NULL, '/feed', NEW.user_id, 'post', NEW.post_id);
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS trg_notify_like ON public.feed_post_likes;
CREATE TRIGGER trg_notify_like AFTER INSERT ON public.feed_post_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_like();

-- feed comment (notify post author) -----------------------------------
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE post_author uuid; actor_name text;
BEGIN
  SELECT author_id INTO post_author FROM public.feed_posts WHERE id = NEW.post_id;
  SELECT full_name INTO actor_name FROM public.users WHERE id = NEW.author_id;
  PERFORM public._notify(
    post_author, 'comment',
    COALESCE(NULLIF(actor_name, ''), 'משתמש') || ' הגיב/ה על הפוסט שלך',
    LEFT(NEW.content, 120), '/feed', NEW.author_id, 'post', NEW.post_id);
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS trg_notify_comment ON public.feed_comments;
CREATE TRIGGER trg_notify_comment AFTER INSERT ON public.feed_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_comment();

-- direct message (notify recipient) -----------------------------------
CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actor_name text;
BEGIN
  SELECT full_name INTO actor_name FROM public.users WHERE id = NEW.sender_id;
  PERFORM public._notify(
    NEW.recipient_id, 'message',
    COALESCE(NULLIF(actor_name, ''), 'משתמש') || ' שלח/ה לך הודעה',
    NULLIF(LEFT(NEW.content, 120), ''), '/messages', NEW.sender_id, 'message', NEW.id);
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS trg_notify_message ON public.direct_messages;
CREATE TRIGGER trg_notify_message AFTER INSERT ON public.direct_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_message();

-- course access granted (notify the user; table is email-keyed) -------
CREATE OR REPLACE FUNCTION public.notify_on_course_access()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE recipient uuid; m_title text;
BEGIN
  SELECT id INTO recipient FROM public.users WHERE lower(email) = lower(NEW.user_email) LIMIT 1;
  IF recipient IS NULL THEN RETURN NULL; END IF;
  SELECT title INTO m_title FROM public.modules WHERE id = NEW.module_id;
  PERFORM public._notify(
    recipient, 'course_access',
    'נפתחה לך גישה לקורס: ' || COALESCE(m_title, 'קורס חדש'),
    NULL, '/courses/' || NEW.module_id::text, NULL, 'module', NEW.module_id);
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS trg_notify_course_access ON public.user_module_access;
CREATE TRIGGER trg_notify_course_access AFTER INSERT ON public.user_module_access
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_course_access();

-- new chapter published — fan out to everyone enrolled in the module ---
CREATE OR REPLACE FUNCTION public.notify_on_chapter()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m_title text;
BEGIN
  IF NEW.status <> 'active' THEN RETURN NULL; END IF;                 -- only when published
  IF TG_OP = 'UPDATE' AND OLD.status = 'active' THEN RETURN NULL; END IF; -- already published
  SELECT title INTO m_title FROM public.modules WHERE id = NEW.module_id;
  INSERT INTO public.notifications (user_id, type, title, body, route, actor_id, entity_type, entity_id)
  SELECT u.id, 'chapter',
         'פרק חדש בקורס: ' || COALESCE(m_title, 'הקורס שלך'),
         NEW.title, '/courses/' || NEW.module_id::text, NULL, 'module', NEW.module_id
  FROM public.user_module_access uma
  JOIN public.users u ON lower(u.email) = lower(uma.user_email)
  WHERE uma.module_id = NEW.module_id
    AND (uma.expires_at IS NULL OR uma.expires_at > now());
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS trg_notify_chapter ON public.chapters;
CREATE TRIGGER trg_notify_chapter
  AFTER INSERT OR UPDATE OF status ON public.chapters
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_chapter();

-- let the bell update live via Supabase Realtime (idempotent) ----------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
