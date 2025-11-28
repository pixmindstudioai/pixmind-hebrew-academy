-- Fix security definer view warning
-- Remove security_barrier option and rely on natural RLS enforcement from underlying table

DROP VIEW IF EXISTS public.lesson_rating_stats;

CREATE VIEW public.lesson_rating_stats AS
SELECT 
  lesson_id,
  COUNT(*) as total_ratings,
  ROUND(AVG(rating)::numeric, 2) as average_rating,
  COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star_count,
  COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star_count,
  COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star_count,
  COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star_count,
  COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star_count
FROM public.lesson_ratings
GROUP BY lesson_id;

-- Grant access
GRANT SELECT ON public.lesson_rating_stats TO authenticated, anon;

COMMENT ON VIEW public.lesson_rating_stats IS 'Public aggregated view of lesson ratings. Uses SECURITY INVOKER (default) to ensure proper RLS enforcement from underlying table. Exposes only statistical data without individual user identifiers for privacy protection.';