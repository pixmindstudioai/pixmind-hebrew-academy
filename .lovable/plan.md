

## Fix: Update `check_one_target` constraint on `calendar_event_visibility`

### Problem
The `calendar_event_visibility` table has a CHECK constraint (`check_one_target`) that only allows either `module_id` OR `bundle_id` to be set (exactly one non-null). The recent addition of `cohort_id` is not accounted for in this constraint, so inserting a row with only `cohort_id` set fails.

### Solution
Create a migration to drop the old constraint and add a new one that allows exactly one of `module_id`, `bundle_id`, or `cohort_id` to be non-null.

### Migration SQL
```sql
ALTER TABLE public.calendar_event_visibility
  DROP CONSTRAINT check_one_target;

ALTER TABLE public.calendar_event_visibility
  ADD CONSTRAINT check_one_target CHECK (
    (module_id IS NOT NULL AND bundle_id IS NULL AND cohort_id IS NULL) OR
    (module_id IS NULL AND bundle_id IS NOT NULL AND cohort_id IS NULL) OR
    (module_id IS NULL AND bundle_id IS NULL AND cohort_id IS NOT NULL)
  );
```

### Files Changed
- 1 new migration file

No frontend code changes needed.

