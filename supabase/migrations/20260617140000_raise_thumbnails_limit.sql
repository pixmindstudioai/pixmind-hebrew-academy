-- Raise the 'thumbnails' bucket file-size limit so admins can upload
-- high-resolution certificate template images (and course thumbnails) without
-- the old ~5 MB friction. Certificate template images live in this bucket under
-- certificates/templates/.
--
-- NOTE: the EFFECTIVE upload ceiling is also bounded by the project's global
-- storage upload limit (Supabase Dashboard → Project Settings → Storage →
-- "Upload file size limit"); raise that too if you ever need files this large.
UPDATE storage.buckets
   SET file_size_limit = 2147483648   -- 2 GB
 WHERE id = 'thumbnails';
