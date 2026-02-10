-- Fix infinite recursion in RLS policies by using a Security Definer function
-- to check user roles without triggering recursive RLS checks on the public.users table.

-- 1. Create a secure function to get the current user's role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS public.user_role
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  _role public.user_role;
BEGIN
  -- This runs with the privileges of the function creator (usually postgres/service_role),
  -- bypassing RLS on public.users to avoid recursion.
  SELECT role INTO _role FROM public.users WHERE id = auth.uid();
  RETURN _role;
END;
$$;

-- 2. Grant execution permissions
GRANT EXECUTE ON FUNCTION public.get_current_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role TO anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_role TO service_role;

-- 3. Refactor "users" table policies to use the function
DROP POLICY IF EXISTS "Admin and Director view all users" ON public.users;

CREATE POLICY "Admin and Director view all users" ON public.users FOR SELECT
USING (
  public.get_current_user_role() IN ('admin', 'director')
);

-- 4. Refactor "projects" table policies to use the function (Optimization & Stability)
DROP POLICY IF EXISTS "Admin/Director manage projects" ON public.projects;

CREATE POLICY "Admin/Director manage projects" ON public.projects FOR ALL
USING (
  public.get_current_user_role() IN ('admin', 'director')
);

-- 5. Refactor "project_assignments" table policies
DROP POLICY IF EXISTS "Manage assignments" ON public.project_assignments;

CREATE POLICY "Manage assignments" ON public.project_assignments FOR ALL
USING (
  public.get_current_user_role() IN ('admin', 'director', 'gerente')
);

-- 6. Refactor "time_entries" table policies
DROP POLICY IF EXISTS "Admin/Director manage time entries" ON public.time_entries;

CREATE POLICY "Admin/Director manage time entries" ON public.time_entries FOR ALL
USING (
  public.get_current_user_role() IN ('admin', 'director')
);
