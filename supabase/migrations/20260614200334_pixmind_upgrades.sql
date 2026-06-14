-- =====================================================================
-- PixMind upgrades: XP-gated chapters/modules + storage buckets for
-- uploaded lesson videos and feed media. Additive & idempotent.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) XP unlock thresholds on modules + chapters
--    A chapter/module is locked until the member's xp_total >= min_xp.
-- ---------------------------------------------------------------------
ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS min_xp integer NOT NULL DEFAULT 0;

ALTER TABLE public.chapters
  ADD COLUMN IF NOT EXISTS min_xp integer NOT NULL DEFAULT 0;

-- ---------------------------------------------------------------------
-- 2) Storage buckets
--    lesson_videos  — admin-uploaded lesson MP4/WebM (large limit)
--    feed_media     — member-uploaded community photos/videos
-- ---------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lesson_videos', 'lesson_videos', true, 524288000,           -- 500 MB
  ARRAY['video/mp4','video/webm','video/quicktime','video/ogg']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'feed_media', 'feed_media', true, 104857600,                 -- 100 MB
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif',
        'video/mp4','video/webm','video/quicktime','video/ogg']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ---------------------------------------------------------------------
-- 3) Storage RLS (public read; authenticated write)
-- ---------------------------------------------------------------------
-- lesson_videos: anyone can view, any authenticated user can upload/manage
DROP POLICY IF EXISTS "lesson_videos public read" ON storage.objects;
CREATE POLICY "lesson_videos public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'lesson_videos');

DROP POLICY IF EXISTS "lesson_videos auth write" ON storage.objects;
CREATE POLICY "lesson_videos auth write" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'lesson_videos');

DROP POLICY IF EXISTS "lesson_videos auth update" ON storage.objects;
CREATE POLICY "lesson_videos auth update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'lesson_videos');

DROP POLICY IF EXISTS "lesson_videos auth delete" ON storage.objects;
CREATE POLICY "lesson_videos auth delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'lesson_videos');

-- feed_media: anyone can view; a member writes inside their own uid folder
DROP POLICY IF EXISTS "feed_media public read" ON storage.objects;
CREATE POLICY "feed_media public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'feed_media');

DROP POLICY IF EXISTS "feed_media owner write" ON storage.objects;
CREATE POLICY "feed_media owner write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'feed_media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "feed_media owner delete" ON storage.objects;
CREATE POLICY "feed_media owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'feed_media' AND (storage.foldername(name))[1] = auth.uid()::text);
