-- =====================================================================
-- PixMind Studio Academy — Gamification + Social layer (Claws-style)
-- Additive & idempotent. Does NOT touch existing data.
--   • XP / levels / streaks on public.users
--   • XP reward on challenges (lesson_tasks)
--   • xp_transactions ledger (server-authoritative)
--   • badges + user_badges
--   • feed_posts / feed_post_likes / feed_comments
--   • user_follows
--   • direct_messages (DMs)
--   • public_profiles view (safe columns, readable by members)
--   • RPCs: complete_lesson, award_xp, toggle_post_like, _level_from_xp
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Profile + gamification columns on public.users
-- ---------------------------------------------------------------------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS xp_total        integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level           integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS current_streak  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_on  date,
  ADD COLUMN IF NOT EXISTS headline        text,
  ADD COLUMN IF NOT EXISTS bio             text,
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS links           jsonb NOT NULL DEFAULT '[]'::jsonb;

-- ---------------------------------------------------------------------
-- 2) XP reward on challenges (the existing lesson_tasks table)
-- ---------------------------------------------------------------------
ALTER TABLE public.lesson_tasks
  ADD COLUMN IF NOT EXISTS xp_reward integer NOT NULL DEFAULT 50;

-- ---------------------------------------------------------------------
-- 3) XP transactions ledger (single source of truth)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.xp_transactions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount       integer NOT NULL,
  source_type  text NOT NULL,          -- 'lesson' | 'challenge' | 'badge' | 'manual' | 'post'
  source_id    uuid,
  reason       text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
-- one award per (user, source_type, source_id) — makes lesson/challenge XP idempotent
CREATE UNIQUE INDEX IF NOT EXISTS uq_xp_tx_source
  ON public.xp_transactions (user_id, source_type, source_id)
  WHERE source_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_xp_tx_user ON public.xp_transactions (user_id, created_at DESC);

-- ---------------------------------------------------------------------
-- 4) Badges + user_badges
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.badges (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text UNIQUE NOT NULL,
  name        text NOT NULL,
  description text,
  icon        text NOT NULL DEFAULT 'Award',   -- lucide icon name
  tier        text NOT NULL DEFAULT 'bronze',  -- bronze | silver | gold | special
  xp_bonus    integer NOT NULL DEFAULT 0,
  criteria    jsonb,
  sort_order  integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_id   uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges (user_id);

-- ---------------------------------------------------------------------
-- 5) Social feed
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feed_posts (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id            uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type                 text NOT NULL DEFAULT 'update',  -- update | win | question | showcase
  content              text NOT NULL DEFAULT '',
  images               text[] NOT NULL DEFAULT '{}',
  tags                 text[] NOT NULL DEFAULT '{}',
  related_challenge_id uuid,
  like_count           integer NOT NULL DEFAULT 0,
  comment_count        integer NOT NULL DEFAULT 0,
  pinned               boolean NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_feed_posts_created ON public.feed_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_author ON public.feed_posts (author_id);

CREATE TABLE IF NOT EXISTS public.feed_post_likes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_feed_likes_post ON public.feed_post_likes (post_id);

CREATE TABLE IF NOT EXISTS public.feed_comments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id           uuid NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  author_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  parent_comment_id uuid REFERENCES public.feed_comments(id) ON DELETE CASCADE,
  content           text NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_feed_comments_post ON public.feed_comments (post_id, created_at);

-- keep feed_posts.comment_count in sync
CREATE OR REPLACE FUNCTION public.sync_feed_comment_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.feed_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.feed_posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS trg_feed_comment_count ON public.feed_comments;
CREATE TRIGGER trg_feed_comment_count
  AFTER INSERT OR DELETE ON public.feed_comments
  FOR EACH ROW EXECUTE FUNCTION public.sync_feed_comment_count();

-- ---------------------------------------------------------------------
-- 6) Follow graph
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_follows (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id  uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.user_follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.user_follows (following_id);

-- ---------------------------------------------------------------------
-- 7) Direct messages (member <-> member)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id       uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content         text NOT NULL DEFAULT '',
  attachment_url  text,
  attachment_type text,   -- image | video | audio | file
  attachment_name text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  read_at         timestamptz
);
CREATE INDEX IF NOT EXISTS idx_dm_pair ON public.direct_messages (sender_id, recipient_id, created_at);
CREATE INDEX IF NOT EXISTS idx_dm_recipient ON public.direct_messages (recipient_id, created_at);

-- =====================================================================
-- 8) Level helper + XP engine (SECURITY DEFINER)
-- =====================================================================
-- level = floor((50 + sqrt(2500 + 200*xp)) / 100)
--   L1=0xp · L2=100 · L3=300 · L4=600 · L5=1000 · L6=1500 ...
CREATE OR REPLACE FUNCTION public._level_from_xp(p_xp integer)
RETURNS integer LANGUAGE sql IMMUTABLE AS $$
  SELECT GREATEST(1, floor((50 + sqrt(2500 + 200 * GREATEST(p_xp, 0))) / 100)::int);
$$;

CREATE OR REPLACE FUNCTION public.award_xp(
  p_user_id uuid,
  p_amount integer,
  p_source_type text,
  p_source_id uuid DEFAULT NULL,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_inserted   integer;
  v_new_xp     integer;
  v_old_level  integer;
  v_new_level  integer;
  v_today      date := current_date;
  v_last       date;
  v_streak     integer;
  v_longest    integer;
BEGIN
  IF p_user_id IS NULL OR p_amount IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'missing args');
  END IF;

  -- idempotent for sourced awards (lesson/challenge/badge once)
  INSERT INTO public.xp_transactions (user_id, amount, source_type, source_id, reason)
  VALUES (p_user_id, p_amount, p_source_type, p_source_id, p_reason)
  ON CONFLICT (user_id, source_type, source_id) WHERE source_id IS NOT NULL
  DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted = 0 THEN
    SELECT xp_total, level INTO v_new_xp, v_new_level FROM public.users WHERE id = p_user_id;
    RETURN jsonb_build_object('ok', true, 'awarded', false, 'xp_total', v_new_xp, 'level', v_new_level);
  END IF;

  SELECT level, last_active_on, current_streak, longest_streak
    INTO v_old_level, v_last, v_streak, v_longest
    FROM public.users WHERE id = p_user_id FOR UPDATE;

  -- streak: increment on a new active day, reset if a day was skipped
  IF v_last IS NULL THEN
    v_streak := 1;
  ELSIF v_last = v_today THEN
    v_streak := GREATEST(v_streak, 1);
  ELSIF v_last = v_today - 1 THEN
    v_streak := v_streak + 1;
  ELSE
    v_streak := 1;
  END IF;
  v_longest := GREATEST(COALESCE(v_longest, 0), v_streak);

  -- allow the privileged-column guard trigger to accept this XP write
  PERFORM set_config('pixmind.allow_xp', 'on', true);

  UPDATE public.users
     SET xp_total       = xp_total + p_amount,
         level          = public._level_from_xp(xp_total + p_amount),
         current_streak = v_streak,
         longest_streak = v_longest,
         last_active_on = v_today,
         updated_at     = now()
   WHERE id = p_user_id
   RETURNING xp_total, level INTO v_new_xp, v_new_level;

  RETURN jsonb_build_object(
    'ok', true, 'awarded', true, 'amount', p_amount,
    'xp_total', v_new_xp, 'level', v_new_level,
    'leveled_up', v_new_level > COALESCE(v_old_level, 1),
    'streak', v_streak
  );
END $$;

-- Mark a lesson complete/incomplete; awards +20 XP once per lesson.
CREATE OR REPLACE FUNCTION public.complete_lesson(p_lesson_id uuid, p_done boolean DEFAULT true)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_res jsonb := jsonb_build_object('ok', true, 'awarded', false);
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not authenticated');
  END IF;

  INSERT INTO public.user_progress (user_id, lesson_id, completed, completed_at)
  VALUES (v_uid, p_lesson_id, p_done, CASE WHEN p_done THEN now() ELSE NULL END)
  ON CONFLICT (user_id, lesson_id)
  DO UPDATE SET completed    = EXCLUDED.completed,
               completed_at = CASE WHEN EXCLUDED.completed THEN now() ELSE NULL END,
               updated_at   = now();

  IF p_done THEN
    v_res := public.award_xp(v_uid, 20, 'lesson', p_lesson_id, 'השלמת שיעור');
  END IF;

  RETURN v_res;
END $$;

-- Toggle a like on a feed post; recounts authoritatively.
CREATE OR REPLACE FUNCTION public.toggle_post_like(p_post_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_liked boolean;
  v_count integer;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not authenticated');
  END IF;

  IF EXISTS (SELECT 1 FROM public.feed_post_likes WHERE post_id = p_post_id AND user_id = v_uid) THEN
    DELETE FROM public.feed_post_likes WHERE post_id = p_post_id AND user_id = v_uid;
    v_liked := false;
  ELSE
    INSERT INTO public.feed_post_likes (post_id, user_id) VALUES (p_post_id, v_uid)
    ON CONFLICT DO NOTHING;
    v_liked := true;
  END IF;

  SELECT count(*) INTO v_count FROM public.feed_post_likes WHERE post_id = p_post_id;
  UPDATE public.feed_posts SET like_count = v_count WHERE id = p_post_id;

  RETURN jsonb_build_object('ok', true, 'liked', v_liked, 'count', v_count);
END $$;

-- Approve a challenge submission -> award the challenge xp_reward (admin only).
CREATE OR REPLACE FUNCTION public.approve_submission_xp(p_submission_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid;
  v_email text;
  v_task uuid;
  v_xp integer;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'admin only');
  END IF;

  SELECT s.user_id, s.user_email, s.task_id INTO v_user, v_email, v_task
    FROM public.task_submissions s WHERE s.id = p_submission_id;

  IF v_user IS NULL AND v_email IS NOT NULL THEN
    SELECT id INTO v_user FROM public.users WHERE lower(email) = lower(v_email) LIMIT 1;
  END IF;
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no user for submission');
  END IF;

  SELECT COALESCE(xp_reward, 50) INTO v_xp FROM public.lesson_tasks WHERE id = v_task;
  RETURN public.award_xp(v_user, COALESCE(v_xp, 50), 'challenge', v_task, 'אתגר אושר');
END $$;

-- =====================================================================
-- 9) Safe public profile view (members can see each other)
-- =====================================================================
CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT id, full_name, profile_picture_url, headline, bio, cover_image_url,
         links, xp_total, level, current_streak, longest_streak, created_at
  FROM public.users
  WHERE COALESCE(status, 'active') <> 'suspended';

GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- =====================================================================
-- 10) RLS
-- =====================================================================
ALTER TABLE public.xp_transactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_posts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_post_likes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_comments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages  ENABLE ROW LEVEL SECURITY;

-- xp_transactions: read own (+ admin); writes only via SECURITY DEFINER RPCs
DROP POLICY IF EXISTS "xp read own" ON public.xp_transactions;
CREATE POLICY "xp read own" ON public.xp_transactions FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

-- badges: everyone reads active badges, admin manages
DROP POLICY IF EXISTS "badges read" ON public.badges;
CREATE POLICY "badges read" ON public.badges FOR SELECT USING (is_active OR public.is_admin());
DROP POLICY IF EXISTS "badges admin" ON public.badges;
CREATE POLICY "badges admin" ON public.badges FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- user_badges: everyone reads (shown on profiles), admin manages
DROP POLICY IF EXISTS "user_badges read" ON public.user_badges;
CREATE POLICY "user_badges read" ON public.user_badges FOR SELECT USING (true);
DROP POLICY IF EXISTS "user_badges admin" ON public.user_badges;
CREATE POLICY "user_badges admin" ON public.user_badges FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- feed_posts: members read all, author writes own, admin moderates
DROP POLICY IF EXISTS "posts read" ON public.feed_posts;
CREATE POLICY "posts read" ON public.feed_posts FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "posts insert own" ON public.feed_posts;
CREATE POLICY "posts insert own" ON public.feed_posts FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
DROP POLICY IF EXISTS "posts update own" ON public.feed_posts;
CREATE POLICY "posts update own" ON public.feed_posts FOR UPDATE TO authenticated
  USING (author_id = auth.uid() OR public.is_admin()) WITH CHECK (author_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "posts delete own" ON public.feed_posts;
CREATE POLICY "posts delete own" ON public.feed_posts FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.is_admin());

-- feed_post_likes: read all, manage own
DROP POLICY IF EXISTS "likes read" ON public.feed_post_likes;
CREATE POLICY "likes read" ON public.feed_post_likes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "likes write own" ON public.feed_post_likes;
CREATE POLICY "likes write own" ON public.feed_post_likes FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- feed_comments: read all, author writes own
DROP POLICY IF EXISTS "comments read" ON public.feed_comments;
CREATE POLICY "comments read" ON public.feed_comments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "comments insert own" ON public.feed_comments;
CREATE POLICY "comments insert own" ON public.feed_comments FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
DROP POLICY IF EXISTS "comments delete own" ON public.feed_comments;
CREATE POLICY "comments delete own" ON public.feed_comments FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.is_admin());

-- user_follows: read all, manage own edges
DROP POLICY IF EXISTS "follows read" ON public.user_follows;
CREATE POLICY "follows read" ON public.user_follows FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "follows write own" ON public.user_follows;
CREATE POLICY "follows write own" ON public.user_follows FOR ALL TO authenticated
  USING (follower_id = auth.uid()) WITH CHECK (follower_id = auth.uid());

-- direct_messages: only the two participants
DROP POLICY IF EXISTS "dm read participants" ON public.direct_messages;
CREATE POLICY "dm read participants" ON public.direct_messages FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());
DROP POLICY IF EXISTS "dm send own" ON public.direct_messages;
CREATE POLICY "dm send own" ON public.direct_messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
DROP POLICY IF EXISTS "dm mark read" ON public.direct_messages;
CREATE POLICY "dm mark read" ON public.direct_messages FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid()) WITH CHECK (recipient_id = auth.uid());

-- Allow members to update their OWN profile (new social columns)
DROP POLICY IF EXISTS "users update own profile" ON public.users;
CREATE POLICY "users update own profile" ON public.users FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Guard: non-admins can never escalate role/status or fake XP/level/streak.
-- XP columns may only change when award_xp set the per-transaction flag.
CREATE OR REPLACE FUNCTION public.protect_user_privileged_columns()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;
  NEW.role   := OLD.role;
  NEW.status := OLD.status;
  NEW.email  := OLD.email;
  IF current_setting('pixmind.allow_xp', true) IS DISTINCT FROM 'on' THEN
    NEW.xp_total       := OLD.xp_total;
    NEW.level          := OLD.level;
    NEW.current_streak := OLD.current_streak;
    NEW.longest_streak := OLD.longest_streak;
    NEW.last_active_on := OLD.last_active_on;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_protect_user_columns ON public.users;
CREATE TRIGGER trg_protect_user_columns
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.protect_user_privileged_columns();

-- =====================================================================
-- 11) Seed a starter badge catalogue (idempotent on code)
-- =====================================================================
INSERT INTO public.badges (code, name, description, icon, tier, xp_bonus, sort_order) VALUES
  ('first_step',   'צעד ראשון',     'השלמת השיעור הראשון שלך',        'Footprints', 'bronze',  0,  10),
  ('streak_7',     'שבוע רצוף',      '7 ימי פעילות ברצף',              'Flame',      'silver',  50, 20),
  ('streak_30',    'חודש של אש',     '30 ימי פעילות ברצף',            'Flame',      'gold',    200,30),
  ('challenger',   'מתמודד',         'אתגר ראשון אושר',               'Target',     'bronze',  0,  40),
  ('challenge_10', 'אלוף האתגרים',   '10 אתגרים אושרו',               'Trophy',     'gold',    150,50),
  ('level_5',      'רמה 5',          'הגעת לרמה 5',                   'Star',       'silver',  0,  60),
  ('level_10',     'רמה 10',         'הגעת לרמה 10',                  'Sparkles',   'gold',    0,  70),
  ('social',       'חברותי',         'הפוסט הראשון שלך בקהילה',        'MessageCircle','bronze',0,  80),
  ('popular',      'מוכר',           'הפוסט שלך קיבל 10 לייקים',       'Heart',      'silver',  50, 90),
  ('graduate',     'בוגר',           'סיימת קורס מלא',                'GraduationCap','gold',  300,100)
ON CONFLICT (code) DO NOTHING;
