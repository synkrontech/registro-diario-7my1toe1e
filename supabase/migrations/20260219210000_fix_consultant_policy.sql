-- Fix the formatting of the "Consultor view assigned projects" policy to prevent syntax errors in generated types
-- The previous policy definition contained newlines in the USING clause which broke the TypeScript comment generation in supabase gen types
-- This migration drops and recreates the policy with a single-line USING clause to ensure clean type generation

DROP POLICY IF EXISTS "Consultor view assigned projects" ON public.projects;

CREATE POLICY "Consultor view assigned projects"
ON public.projects
FOR SELECT
TO public
USING (id IN (SELECT project_assignments.project_id FROM public.project_assignments WHERE project_assignments.user_id = auth.uid()));
