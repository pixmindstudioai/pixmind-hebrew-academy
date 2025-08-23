-- Add embeds JSONB column to lessons table
-- This will store an array of embedded media URLs (YouTube, iframe links, etc.)

ALTER TABLE public.lessons 
ADD COLUMN embeds JSONB;