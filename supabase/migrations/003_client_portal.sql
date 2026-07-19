-- Client portal + finishing status
-- Run in Supabase SQL Editor after 002_storage.sql

DO $$ BEGIN
  ALTER TYPE project_status ADD VALUE 'finishing';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS access_token uuid DEFAULT gen_random_uuid() UNIQUE;

UPDATE public.projects SET access_token = gen_random_uuid() WHERE access_token IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS projects_access_token_idx ON public.projects (access_token);

-- Track when status last changed (for client portal)
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS status_updated_at timestamptz DEFAULT now();

UPDATE public.projects SET status_updated_at = updated_at WHERE status_updated_at IS NULL;

CREATE OR REPLACE FUNCTION public.set_project_status_timestamp()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS projects_status_updated_at ON public.projects;
CREATE TRIGGER projects_status_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_project_status_timestamp();
