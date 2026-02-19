-- Fix the policy formatting to prevent syntax errors in generated types
-- This ensures the USING clause is on a single line, preventing multi-line comments in types.ts that break the build

DROP POLICY IF EXISTS "Consultor view assigned projects" ON public.projects;

CREATE POLICY "Consultor view assigned projects"
ON public.projects
FOR SELECT
TO public
USING (id IN (SELECT project_assignments.project_id FROM public.project_assignments WHERE project_assignments.user_id = auth.uid()));
