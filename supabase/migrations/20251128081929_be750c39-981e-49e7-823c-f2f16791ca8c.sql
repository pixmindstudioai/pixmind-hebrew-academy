-- Security Fix: Protect user identity in lesson ratings

-- Step 1: Drop the overly permissive policy that allows anyone to view all ratings
DROP POLICY IF EXISTS "Users can view all ratings" ON public.lesson_ratings;

-- Step 2: Create restrictive policies for lesson_ratings
-- Only allow users to view their own ratings
CREATE POLICY "authenticated_users_view_own_ratings"
  ON public.lesson_ratings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow admins to view all ratings for moderation
CREATE POLICY "admins_view_all_ratings"
  ON public.lesson_ratings
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Step 3: Create a secure aggregated view for public rating statistics
CREATE OR REPLACE VIEW public.lesson_rating_stats AS
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

-- Step 4: Grant public access to the aggregated view (no user_id exposure)
GRANT SELECT ON public.lesson_rating_stats TO authenticated, anon;

-- Step 5: Add helpful comments
COMMENT ON VIEW public.lesson_rating_stats IS 'Public aggregated view of lesson ratings. Exposes only statistical data without individual user identifiers for privacy protection.';
COMMENT ON TABLE public.lesson_ratings IS 'Lesson ratings table. RLS policies ensure users can only view their own ratings. Use lesson_rating_stats view for public rating display.';