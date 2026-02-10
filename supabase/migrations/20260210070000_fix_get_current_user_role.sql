-- Fix the get_current_user_role function which was referencing the dropped 'role' column
-- and update dependent policies to use the new text-based role check.

-- 1. Drop existing policies that depend on the function to avoid dependency errors when dropping the function
DROP POLICY IF EXISTS "Admin and Director view all users" ON public.users;
DROP POLICY IF EXISTS "Admin/Director manage projects" ON public.projects;
DROP POLICY IF EXISTS "Manage assignments" ON public.project_assignments;
DROP POLICY IF EXISTS "Admin/Director manage time entries" ON public.time_entries;

-- 2. Drop the broken function
DROP FUNCTION IF EXISTS public.get_current_user_role();

-- 3. Re-create the function to use the new relation (users -> roles)
-- Returns TEXT now instead of user_role enum to support dynamic role names
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  _role_name TEXT;
BEGIN
  -- Join with roles table to get the role name via role_id
  SELECT r.name INTO _role_name
  FROM public.users u
  JOIN public.roles r ON u.role_id = r.id
  WHERE u.id = auth.uid();
  
  RETURN _role_name;
END;
$$;

-- 4. Grant execution permissions
GRANT EXECUTE ON FUNCTION public.get_current_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role TO anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_role TO service_role;

-- 5. Re-create policies using the new function and TEXT comparison

-- Users: Admin and Director can view all users
CREATE POLICY "Admin and Director view all users" ON public.users FOR SELECT
USING (
  public.get_current_user_role() IN ('admin', 'director')
);

-- Projects: Admin and Director can manage (ALL) projects
CREATE POLICY "Admin/Director manage projects" ON public.projects FOR ALL
USING (
  public.get_current_user_role() IN ('admin', 'director')
);

-- Project Assignments: Admin, Director, Gerente can manage assignments
CREATE POLICY "Manage assignments" ON public.project_assignments FOR ALL
USING (
  public.get_current_user_role() IN ('admin', 'director', 'gerente')
);

-- Time Entries: Admin and Director can manage time entries
CREATE POLICY "Admin/Director manage time entries" ON public.time_entries FOR ALL
USING (
  public.get_current_user_role() IN ('admin', 'director')
);
