ALTER TABLE public.calendar_event_visibility
  DROP CONSTRAINT IF EXISTS check_one_target;

ALTER TABLE public.calendar_event_visibility
  ADD CONSTRAINT check_one_target CHECK (
    (module_id IS NOT NULL AND bundle_id IS NULL AND cohort_id IS NULL) OR
    (module_id IS NULL AND bundle_id IS NOT NULL AND cohort_id IS NULL) OR
    (module_id IS NULL AND bundle_id IS NULL AND cohort_id IS NOT NULL)
  );