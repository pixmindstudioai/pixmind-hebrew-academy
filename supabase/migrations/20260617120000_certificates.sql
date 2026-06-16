-- =====================================================================
-- Course-completion certificates.
-- Admin uploads a template image per course and marks (via an interactive
-- editor) where the student's name (Hebrew + English) and signatures go, with
-- per-field font/size/color/align. On completion the student gets a
-- personalized certificate rendered client-side and stored for download.
-- Reuses the existing public 'thumbnails' storage bucket (admin-write template
-- images under certificates/templates/, student-written issued certs under
-- certificates/issued/<uid>/ — the bucket already allows authenticated writes
-- and public reads).
-- =====================================================================

-- 1) Bilingual name -----------------------------------------------------
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name_en text;

-- expose it on the safe public view (recreate with the extra column)
CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT id, full_name, full_name_en, profile_picture_url, headline, bio,
         cover_image_url, links, xp_total, level, current_streak,
         longest_streak, created_at
  FROM public.users
  WHERE COALESCE(status, 'active') <> 'suspended';
GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- 2) Template config (one active template per module) -------------------
-- config jsonb shape (normalized 0..1 coords; fontSize = fraction of template height):
--   { "fields": [ { "key":"name_he", "x":0.5, "y":0.46, "width":0.7,
--                   "fontFamily":"Heebo", "fontSize":0.045, "color":"#ffffff",
--                   "align":"center", "weight":700, "lang":"he" }, ... ],
--     "signatures": [ { "x":0.3, "y":0.85, "width":0.18, "imageUrl":null, "label":"" } ] }
CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id          uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  name               text NOT NULL DEFAULT 'תעודה',
  template_image_url text,
  config             jsonb NOT NULL DEFAULT '{"fields":[],"signatures":[]}'::jsonb,
  is_active          boolean NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (module_id)
);

-- 3) Issued certificates ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.certificates_issued (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  module_id         uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  template_id       uuid REFERENCES public.certificate_templates(id) ON DELETE SET NULL,
  certificate_url   text,
  verification_code text NOT NULL UNIQUE,
  issued_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);
CREATE INDEX IF NOT EXISTS idx_cert_issued_user ON public.certificates_issued (user_id);

-- 4) RLS ----------------------------------------------------------------
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates_issued   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cert_tpl_read ON public.certificate_templates;
CREATE POLICY cert_tpl_read ON public.certificate_templates
  FOR SELECT USING (is_active OR public.is_admin());
DROP POLICY IF EXISTS cert_tpl_admin_write ON public.certificate_templates;
CREATE POLICY cert_tpl_admin_write ON public.certificate_templates
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS cert_issued_read_own ON public.certificates_issued;
CREATE POLICY cert_issued_read_own ON public.certificates_issued
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
-- inserts/updates only via SECURITY DEFINER RPCs below (no direct client write)

-- 5) Completion check ---------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_module_complete(p_user_id uuid, p_module_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH active_lessons AS (
    SELECT l.id
    FROM public.lessons l
    JOIN public.chapters c ON c.id = l.chapter_id
    WHERE c.module_id = p_module_id AND c.status = 'active' AND l.status = 'active'
  )
  SELECT EXISTS (SELECT 1 FROM active_lessons)
     AND NOT EXISTS (
       SELECT 1 FROM active_lessons al
       LEFT JOIN public.user_progress up
              ON up.lesson_id = al.id AND up.user_id = p_user_id
       WHERE COALESCE(up.completed, false) = false
     );
$$;

-- 6) Issue a certificate (server-authoritative: must have completed) -----
CREATE OR REPLACE FUNCTION public.issue_certificate(p_module_id uuid)
RETURNS public.certificates_issued LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_tpl public.certificate_templates;
  v_row public.certificates_issued;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  SELECT * INTO v_row FROM public.certificates_issued
   WHERE user_id = v_uid AND module_id = p_module_id;
  IF FOUND THEN RETURN v_row; END IF;

  IF NOT public.is_module_complete(v_uid, p_module_id) THEN
    RAISE EXCEPTION 'module not completed';
  END IF;

  SELECT * INTO v_tpl FROM public.certificate_templates
   WHERE module_id = p_module_id AND is_active LIMIT 1;

  INSERT INTO public.certificates_issued (user_id, module_id, template_id, verification_code)
  VALUES (v_uid, p_module_id, v_tpl.id,
          upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)))
  RETURNING * INTO v_row;
  RETURN v_row;
END $$;

-- 7) Save the rendered certificate URL on the caller's own cert ----------
CREATE OR REPLACE FUNCTION public.set_certificate_url(p_module_id uuid, p_url text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  UPDATE public.certificates_issued
     SET certificate_url = p_url
   WHERE user_id = v_uid AND module_id = p_module_id;
END $$;

-- 8) Public certificate verification (for a /verify/<code> page) ---------
CREATE OR REPLACE FUNCTION public.verify_certificate(p_code text)
RETURNS TABLE (full_name text, full_name_en text, module_title text, issued_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT u.full_name, u.full_name_en, m.title, ci.issued_at
  FROM public.certificates_issued ci
  JOIN public.users u   ON u.id = ci.user_id
  JOIN public.modules m ON m.id = ci.module_id
  WHERE ci.verification_code = p_code;
$$;
