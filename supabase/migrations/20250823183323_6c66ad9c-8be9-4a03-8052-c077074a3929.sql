-- Add attachments JSONB column to lessons table
-- This will store an array of file URLs or file metadata

ALTER TABLE public.lessons 
ADD COLUMN attachments JSONB;