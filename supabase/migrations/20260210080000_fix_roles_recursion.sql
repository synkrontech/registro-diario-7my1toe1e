-- Fix infinite recursion in roles policy by using the security definer function.
-- The previous policy caused recursion because it queried the roles table (via join)
-- while the policy itself was being evaluated for the roles table.

-- 1. Update "Manage roles" policy on public.roles
DROP POLICY IF EXISTS "Manage roles" ON public.roles;

CREATE POLICY "Manage roles" ON public.roles FOR ALL USING (
  -- Use security definer function to bypass RLS during permission check
  -- This function runs with elevated privileges and does not trigger RLS on roles table
  public.get_current_user_role() = 'admin'
);

-- 2. Update "Manage role_permissions" policy on public.role_permissions
-- Also updating this to use the helper function for consistency and to avoid potential recursion via roles table
DROP POLICY IF EXISTS "Manage role_permissions" ON public.role_permissions;

CREATE POLICY "Manage role_permissions" ON public.role_permissions FOR ALL USING (
  public.get_current_user_role() = 'admin'
);

-- 3. Update "View audit logs" policy on public.audit_logs
-- Updating for consistency and performance
DROP POLICY IF EXISTS "View audit logs" ON public.audit_logs;

CREATE POLICY "View audit logs" ON public.audit_logs FOR SELECT USING (
  public.get_current_user_role() IN ('admin', 'director')
);
