-- Set the default value of the activo column to false for new users
ALTER TABLE public.users ALTER COLUMN activo SET DEFAULT false;

-- Update the handle_new_user trigger function to respect the default active status
-- and avoid automatically setting activo to true on conflict
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_role public.user_role;
  proj_id UUID;
  raw_role TEXT;
  raw_project_id TEXT;
BEGIN
  -- 1. Extract and validate Role
  raw_role := NEW.raw_user_meta_data->>'role';
  
  BEGIN
    IF raw_role IS NULL THEN
      new_role := 'consultor';
    ELSE
      new_role := raw_role::public.user_role;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    new_role := 'consultor';
  END;

  -- 2. Insert into public.users
  -- We use ON CONFLICT to ensure idempotency
  -- We REMOVED the automatic activation (activo = TRUE) on conflict
  INSERT INTO public.users (id, email, nombre, apellido, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'apellido', 'Nuevo'),
    new_role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nombre = EXCLUDED.nombre,
    apellido = EXCLUDED.apellido,
    role = EXCLUDED.role;
    -- activo is intentionally left untouched on update to preserve manual approval status

  -- 3. Handle Project Assignment
  raw_project_id := NEW.raw_user_meta_data->>'projectId';
  
  IF new_role = 'consultor' AND raw_project_id IS NOT NULL AND raw_project_id <> '' THEN
    BEGIN
      proj_id := raw_project_id::UUID;
      IF proj_id IS NOT NULL THEN
        INSERT INTO public.project_assignments (project_id, user_id)
        VALUES (proj_id, NEW.id)
        ON CONFLICT (project_id, user_id) DO NOTHING;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Invalid project ID provided during signup for user %: %', NEW.id, raw_project_id;
    END;
  END IF;

  RETURN NEW;
END;
$$;
