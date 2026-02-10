-- Advanced User Management Migration

-- 1. Create Role-Based Access Control Tables
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.role_permissions (
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  target_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Seed Default Roles and Permissions
INSERT INTO public.roles (name, description) VALUES
('admin', 'Administrador con acceso total al sistema'),
('director', 'Director con acceso a reportes y gestión de proyectos'),
('gerente', 'Gerente encargado de la gestión operativa de proyectos'),
('consultor', 'Consultor que registra tiempos en proyectos asignados');

INSERT INTO public.permissions (code, description) VALUES
('users.view', 'Ver lista de usuarios'),
('users.manage', 'Crear, editar y activar usuarios'),
('roles.manage', 'Gestionar roles y permisos'),
('audit.view', 'Ver registro de auditoría'),
('projects.view', 'Ver proyectos'),
('projects.manage', 'Crear y editar proyectos'),
('times.approve', 'Aprobar registros de tiempo');

-- Assign Default Permissions
DO $$
DECLARE
  r_admin UUID;
  r_director UUID;
  r_gerente UUID;
  p_users_view UUID;
  p_users_manage UUID;
  p_roles_manage UUID;
  p_audit_view UUID;
  p_projects_view UUID;
  p_projects_manage UUID;
  p_times_approve UUID;
BEGIN
  SELECT id INTO r_admin FROM public.roles WHERE name = 'admin';
  SELECT id INTO r_director FROM public.roles WHERE name = 'director';
  SELECT id INTO r_gerente FROM public.roles WHERE name = 'gerente';
  
  SELECT id INTO p_users_view FROM public.permissions WHERE code = 'users.view';
  SELECT id INTO p_users_manage FROM public.permissions WHERE code = 'users.manage';
  SELECT id INTO p_roles_manage FROM public.permissions WHERE code = 'roles.manage';
  SELECT id INTO p_audit_view FROM public.permissions WHERE code = 'audit.view';
  SELECT id INTO p_projects_view FROM public.permissions WHERE code = 'projects.view';
  SELECT id INTO p_projects_manage FROM public.permissions WHERE code = 'projects.manage';
  SELECT id INTO p_times_approve FROM public.permissions WHERE code = 'times.approve';

  -- Admin: All permissions
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT r_admin, id FROM public.permissions;

  -- Director: View Users, View Audit, Manage Projects, Approve Times
  INSERT INTO public.role_permissions (role_id, permission_id) VALUES
  (r_director, p_users_view),
  (r_director, p_audit_view),
  (r_director, p_projects_view),
  (r_director, p_projects_manage),
  (r_director, p_times_approve);

  -- Gerente: View Projects, Manage Projects (Limited by policy usually), Approve Times
  INSERT INTO public.role_permissions (role_id, permission_id) VALUES
  (r_gerente, p_projects_view),
  (r_gerente, p_times_approve);
END $$;

-- 3. Migrate Users Table
ALTER TABLE public.users ADD COLUMN role_id UUID REFERENCES public.roles(id);

-- Update role_id based on old enum column
UPDATE public.users 
SET role_id = r.id
FROM public.roles r
WHERE public.users.role::text = r.name;

-- Fallback for any unmapped users
UPDATE public.users 
SET role_id = (SELECT id FROM public.roles WHERE name = 'consultor')
WHERE role_id IS NULL;

-- Make role_id mandatory
ALTER TABLE public.users ALTER COLUMN role_id SET NOT NULL;

-- Drop the old enum column
ALTER TABLE public.users DROP COLUMN role;

-- 4. Enable RLS on new tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies

-- Roles: All authenticated can read, only Admins can manage
CREATE POLICY "Read roles" ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage roles" ON public.roles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    JOIN public.roles r ON u.role_id = r.id 
    WHERE u.id = auth.uid() AND r.name = 'admin'
  )
);

-- Permissions: Read only for authenticated
CREATE POLICY "Read permissions" ON public.permissions FOR SELECT TO authenticated USING (true);

-- Role Permissions: Read for authenticated, Manage for Admins
CREATE POLICY "Read role_permissions" ON public.role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage role_permissions" ON public.role_permissions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    JOIN public.roles r ON u.role_id = r.id 
    WHERE u.id = auth.uid() AND r.name = 'admin'
  )
);

-- Audit Logs: Viewable by Admin/Director, Insertable by authenticated (via service/trigger)
CREATE POLICY "View audit logs" ON public.audit_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    JOIN public.roles r ON u.role_id = r.id 
    WHERE u.id = auth.uid() AND (r.name = 'admin' OR r.name = 'director')
  )
);
CREATE POLICY "Insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- 6. Update User Registration Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  target_role_id UUID;
  raw_role TEXT;
  raw_project_id TEXT;
  proj_id UUID;
BEGIN
  raw_role := NEW.raw_user_meta_data->>'role';
  
  -- Find role by name or default to consultor
  SELECT id INTO target_role_id FROM public.roles WHERE name = raw_role;
  
  IF target_role_id IS NULL THEN
    SELECT id INTO target_role_id FROM public.roles WHERE name = 'consultor';
  END IF;

  INSERT INTO public.users (id, email, nombre, apellido, role_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'apellido', 'Nuevo'),
    target_role_id
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nombre = EXCLUDED.nombre,
    apellido = EXCLUDED.apellido,
    role_id = EXCLUDED.role_id,
    activo = TRUE;

  -- Handle Project Assignment
  raw_project_id := NEW.raw_user_meta_data->>'projectId';
  
  IF (SELECT name FROM public.roles WHERE id = target_role_id) = 'consultor' AND raw_project_id IS NOT NULL AND raw_project_id <> '' THEN
     BEGIN
       proj_id := raw_project_id::UUID;
       IF proj_id IS NOT NULL THEN
         INSERT INTO public.project_assignments (project_id, user_id)
         VALUES (proj_id, NEW.id)
         ON CONFLICT (project_id, user_id) DO NOTHING;
       END IF;
     EXCEPTION WHEN OTHERS THEN
       -- Log error but don't fail transaction
       RAISE WARNING 'Invalid project ID % for user %', raw_project_id, NEW.id;
     END;
  END IF;

  RETURN NEW;
END;
$func$;
