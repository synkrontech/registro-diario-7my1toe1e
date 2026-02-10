-- Replace the handle_new_user trigger function with a more robust version
-- to fix HTTP 500 errors during signup caused by casting issues or constraint violations.

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
  -- We extract the role from metadata, defaulting to 'consultor' if missing, null or invalid
  raw_role := NEW.raw_user_meta_data->>'role';
  
  BEGIN
    IF raw_role IS NULL THEN
      new_role := 'consultor';
    ELSE
      -- Try to cast to enum, if fails (e.g. invalid value), catch block will handle it
      new_role := raw_role::public.user_role;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback to default role on any error
    new_role := 'consultor';
  END;

  -- 2. Insert into public.users
  -- We use ON CONFLICT to ensure idempotency and avoid race conditions or duplicates
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
    role = EXCLUDED.role,
    activo = TRUE;

  -- 3. Handle Project Assignment
  -- Only attempt if role is consultor and a valid projectId is provided
  raw_project_id := NEW.raw_user_meta_data->>'projectId';
  
  IF new_role = 'consultor' AND raw_project_id IS NOT NULL AND raw_project_id <> '' THEN
    BEGIN
      -- Attempt to cast to UUID
      proj_id := raw_project_id::UUID;
      
      IF proj_id IS NOT NULL THEN
        -- Insert assignment safely
        INSERT INTO public.project_assignments (project_id, user_id)
        VALUES (proj_id, NEW.id)
        ON CONFLICT (project_id, user_id) DO NOTHING;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Log warning regarding invalid project ID but do not fail the transaction
      RAISE WARNING 'Invalid project ID provided during signup for user %: %', NEW.id, raw_project_id;
    END;
  END IF;

  RETURN NEW;
END;
$$;
