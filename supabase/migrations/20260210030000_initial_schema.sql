-- Create Enum Types
CREATE TYPE user_role AS ENUM ('admin', 'director', 'gerente', 'consultor');
CREATE TYPE project_status AS ENUM ('activo', 'pausado', 'finalizado');
CREATE TYPE time_entry_status AS ENUM ('pendiente', 'aprobado', 'rechazado');

-- Create Tables
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'consultor',
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  codigo TEXT UNIQUE NOT NULL,
  pais TEXT NOT NULL,
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE public.systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  codigo TEXT UNIQUE NOT NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  codigo TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  gerente_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  system_id UUID REFERENCES public.systems(id) ON DELETE SET NULL,
  status project_status DEFAULT 'activo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.project_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(project_id, user_id)
);

CREATE TABLE public.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  fecha DATE NOT NULL,
  startTime TEXT NOT NULL,
  endTime TEXT NOT NULL,
  description TEXT,
  durationMinutes INTEGER NOT NULL,
  status time_entry_status DEFAULT 'pendiente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- Functions & Triggers

-- Sync auth.users to public.users and handle initial assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_role user_role;
  proj_id UUID;
BEGIN
  -- Cast role safely
  BEGIN
    new_role := (NEW.raw_user_meta_data->>'role')::user_role;
  EXCEPTION WHEN OTHERS THEN
    new_role := 'consultor';
  END;

  IF new_role IS NULL THEN
    new_role := 'consultor';
  END IF;

  INSERT INTO public.users (id, email, nombre, apellido, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'apellido', 'Nuevo'),
    new_role
  );

  -- Handle Project Assignment if provided in metadata (for demo/registration)
  proj_id := (NEW.raw_user_meta_data->>'projectId')::UUID;
  IF proj_id IS NOT NULL AND new_role = 'consultor' THEN
    INSERT INTO public.project_assignments (project_id, user_id)
    VALUES (proj_id, NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Policies

-- Users
CREATE POLICY "Admin and Director view all users" ON public.users FOR SELECT
USING (auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'director')));

CREATE POLICY "Users view own profile" ON public.users FOR SELECT
USING (auth.uid() = id);

-- Clients & Systems
CREATE POLICY "Read clients" ON public.clients FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Read systems" ON public.systems FOR SELECT
USING (auth.role() = 'authenticated');

-- Projects
CREATE POLICY "Admin/Director manage projects" ON public.projects FOR ALL
USING (auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'director')));

CREATE POLICY "Gerente view managed projects" ON public.projects FOR SELECT
USING (gerente_id = auth.uid());

CREATE POLICY "Consultor view assigned projects" ON public.projects FOR SELECT
USING (id IN (SELECT project_id FROM public.project_assignments WHERE user_id = auth.uid()));

-- Allow Anon to read projects for Registration Form (Demo purposes)
CREATE POLICY "Anon read projects" ON public.projects FOR SELECT
TO anon, authenticated
USING (true);

-- Project Assignments
CREATE POLICY "Manage assignments" ON public.project_assignments FOR ALL
USING (auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'director', 'gerente')));

CREATE POLICY "View own assignments" ON public.project_assignments FOR SELECT
USING (user_id = auth.uid());

-- Time Entries
CREATE POLICY "Admin/Director manage time entries" ON public.time_entries FOR ALL
USING (auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'director')));

CREATE POLICY "Users manage own entries" ON public.time_entries FOR ALL
USING (user_id = auth.uid());

CREATE POLICY "Gerente view project entries" ON public.time_entries FOR SELECT
USING (project_id IN (SELECT id FROM public.projects WHERE gerente_id = auth.uid()));

-- Seed Data
INSERT INTO public.clients (nombre, codigo, pais) VALUES
('TechCorp', 'TC001', 'USA'),
('Innovate S.A.', 'IN002', 'Spain'),
('Global Services', 'GS003', 'Mexico');

INSERT INTO public.systems (nombre, codigo, descripcion) VALUES
('ERP Legacy', 'SYS01', 'Sistema antiguo de gestión'),
('CRM Cloud', 'SYS02', 'Nueva implementación CRM'),
('App Móvil', 'SYS03', 'Aplicación para clientes');

DO $$
DECLARE
  client_id UUID;
  system_id UUID;
BEGIN
  SELECT id INTO client_id FROM public.clients WHERE codigo = 'TC001' LIMIT 1;
  SELECT id INTO system_id FROM public.systems WHERE codigo = 'SYS01' LIMIT 1;
  
  INSERT INTO public.projects (nombre, codigo, client_id, system_id, status)
  VALUES ('Migración ERP', 'PRJ-001', client_id, system_id, 'activo');
  
  SELECT id INTO client_id FROM public.clients WHERE codigo = 'IN002' LIMIT 1;
  SELECT id INTO system_id FROM public.systems WHERE codigo = 'SYS02' LIMIT 1;
  
  INSERT INTO public.projects (nombre, codigo, client_id, system_id, status)
  VALUES ('Implementación CRM', 'PRJ-002', client_id, system_id, 'activo');
END $$;
