-- ==========================================
-- 1. Database Schema Initialization (Enums)
-- ==========================================
DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('activo', 'pausado', 'finalizado');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE time_entry_status AS ENUM ('pendiente', 'aprobado', 'rechazado');
EXCEPTION WHEN duplicate_object THEN null; END $$;


-- ==========================================
-- 2. Role-Based Access Control (RBAC) Setup
-- ==========================================
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL,
    description TEXT,
    resource_id UUID,
    resource_type TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS permissions_code_idx ON public.permissions (code) WHERE resource_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS permissions_code_resource_idx ON public.permissions (code, resource_id) WHERE resource_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);


-- ==========================================
-- 3. Main Entities
-- ==========================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    codigo TEXT UNIQUE NOT NULL,
    pais TEXT,
    email TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS email TEXT;

CREATE TABLE IF NOT EXISTS public.systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    codigo TEXT UNIQUE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.systems ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    codigo TEXT UNIQUE,
    status project_status DEFAULT 'activo',
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    system_id UUID REFERENCES public.systems(id) ON DELETE SET NULL,
    gerente_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    work_front TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS system_id UUID REFERENCES public.systems(id) ON DELETE SET NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS status project_status DEFAULT 'activo';

CREATE TABLE IF NOT EXISTS public.project_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(project_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    fecha DATE NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT NOT NULL,
    durationminutes INTEGER NOT NULL,
    description TEXT,
    status time_entry_status DEFAULT 'pendiente',
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ;
ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;


-- ==========================================
-- 4. Utilities
-- ==========================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    target_user_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT,
    message TEXT NOT NULL,
    type TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    idioma TEXT,
    timezone TEXT,
    settings JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);


-- ==========================================
-- 5. Functions & Triggers
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _role_name TEXT;
    _role_id UUID;
BEGIN
    _role_name := NEW.raw_user_meta_data->>'role';
    IF _role_name IS NULL OR _role_name = '' THEN
        _role_name := 'consultor';
    END IF;

    SELECT id INTO _role_id FROM public.roles WHERE name = _role_name LIMIT 1;
    IF _role_id IS NULL THEN
        SELECT id INTO _role_id FROM public.roles WHERE name = 'consultor' LIMIT 1;
    END IF;

    BEGIN
        INSERT INTO public.users (id, email, nombre, apellido, role_id, activo)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
            COALESCE(NEW.raw_user_meta_data->>'apellido', 'Nuevo'),
            _role_id,
            TRUE
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            nombre = EXCLUDED.nombre,
            apellido = EXCLUDED.apellido,
            role_id = EXCLUDED.role_id,
            activo = EXCLUDED.activo;
    EXCEPTION WHEN OTHERS THEN
        -- Fallback for older schema compatibilities
        INSERT INTO public.users (id, email, nombre, apellido, role, role_id, activo)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
            COALESCE(NEW.raw_user_meta_data->>'apellido', 'Nuevo'),
            'consultor'::public.user_role,
            _role_id,
            TRUE
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            nombre = EXCLUDED.nombre,
            apellido = EXCLUDED.apellido,
            role_id = EXCLUDED.role_id,
            activo = EXCLUDED.activo;
    END;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


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
    SELECT r.name INTO _role_name
    FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.id = auth.uid();
    
    -- Fallback to old enum column if relation fails
    IF _role_name IS NULL THEN
        SELECT role::text INTO _role_name FROM public.users WHERE id = auth.uid();
    END IF;

    RETURN _role_name;
END;
$$;


CREATE OR REPLACE FUNCTION public.notify_admins_on_event()
RETURNS TRIGGER AS $$
DECLARE
    admin_record RECORD;
BEGIN
    FOR admin_record IN 
        SELECT u.id FROM public.users u
        JOIN public.roles r ON u.role_id = r.id
        WHERE r.name = 'admin' AND u.activo = true
    LOOP
        INSERT INTO public.notifications (user_id, title, message, type)
        VALUES (
            admin_record.id, 
            TG_ARGV[0], 
            format(TG_ARGV[1], COALESCE(NEW.email, 'Desconocido')), 
            TG_ARGV[2]
        );
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_user_notify_admin ON public.users;
CREATE TRIGGER on_new_user_notify_admin
    AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.notify_admins_on_event('Nuevo Usuario', 'El usuario %s se ha registrado.', 'registration');

DROP TRIGGER IF EXISTS on_audit_log_notify_admin ON public.audit_logs;
CREATE TRIGGER on_audit_log_notify_admin
    AFTER INSERT ON public.audit_logs
    FOR EACH ROW EXECUTE FUNCTION public.notify_admins_on_event('Alerta de Auditoría', 'Nueva acción registrada: %s', 'audit');


-- ==========================================
-- 6. Row Level Security (RLS)
-- ==========================================
DO $$ 
DECLARE 
    t text;
    pol record;
BEGIN
    -- Enable RLS
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN (
        'roles', 'permissions', 'role_permissions', 'users', 'clients', 'systems', 'projects', 
        'project_assignments', 'time_entries', 'audit_logs', 'notifications', 'email_templates', 'user_preferences'
    ) LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    END LOOP;

    -- Clean existing policies safely
    FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- RBAC tables
CREATE POLICY "Auth read roles" ON public.roles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth read permissions" ON public.permissions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth read role_permissions" ON public.role_permissions FOR SELECT USING (auth.role() = 'authenticated');

-- Users
CREATE POLICY "Users read own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins manage all users" ON public.users FOR ALL USING (public.get_current_user_role() IN ('admin', 'director'));

-- Clients & Systems
CREATE POLICY "Auth read clients" ON public.clients FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin manage clients" ON public.clients FOR ALL USING (public.get_current_user_role() IN ('admin', 'director'));

CREATE POLICY "Auth read systems" ON public.systems FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin manage systems" ON public.systems FOR ALL USING (public.get_current_user_role() IN ('admin', 'director'));

-- Projects
CREATE POLICY "Consultor read assigned projects" ON public.projects FOR SELECT USING (
    id IN (SELECT project_id FROM public.project_assignments WHERE user_id = auth.uid()) OR
    public.get_current_user_role() IN ('admin', 'director', 'gerente')
);
CREATE POLICY "Admin manage projects" ON public.projects FOR ALL USING (public.get_current_user_role() IN ('admin', 'director'));
CREATE POLICY "Anon read projects" ON public.projects FOR SELECT TO anon USING (true); -- Demo registration

-- Project Assignments
CREATE POLICY "Users read own assignments" ON public.project_assignments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admin manage assignments" ON public.project_assignments FOR ALL USING (public.get_current_user_role() IN ('admin', 'director', 'gerente'));

-- Time Entries
CREATE POLICY "Users manage own entries" ON public.time_entries FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Gerente read managed project entries" ON public.time_entries FOR SELECT USING (
    project_id IN (SELECT id FROM public.projects WHERE gerente_id = auth.uid())
);
CREATE POLICY "Admin manage all entries" ON public.time_entries FOR ALL USING (public.get_current_user_role() IN ('admin', 'director'));

-- Utilities
CREATE POLICY "Admin manage audit_logs" ON public.audit_logs FOR ALL USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Users manage own notifications" ON public.notifications FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admin manage all notifications" ON public.notifications FOR ALL USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Auth read email_templates" ON public.email_templates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin manage email_templates" ON public.email_templates FOR ALL USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Users manage own preferences" ON public.user_preferences FOR ALL USING (user_id = auth.uid());


-- ==========================================
-- 7. Seed Data & Integrity
-- ==========================================
DO $seed$
DECLARE
    admin_id UUID := gen_random_uuid();
    r_admin UUID;
    r_director UUID;
    r_gerente UUID;
    r_consultor UUID;
    r_colaborador UUID;
BEGIN
    -- 1. Insert Default Roles
    INSERT INTO public.roles (name, description) VALUES
    ('admin', 'Administrador del Sistema'),
    ('director', 'Director General'),
    ('gerente', 'Gerente de Proyectos'),
    ('consultor', 'Consultor'),
    ('colaborador', 'Colaborador')
    ON CONFLICT (name) DO NOTHING;

    -- 2. Insert Permissions
    INSERT INTO public.permissions (code, description) VALUES
    ('users.read', 'Leer usuarios'),
    ('users.write', 'Modificar usuarios'),
    ('projects.read', 'Leer proyectos'),
    ('projects.write', 'Modificar proyectos')
    ON CONFLICT DO NOTHING;

    -- 3. Map Permissions to Admin Role
    SELECT id INTO r_admin FROM public.roles WHERE name = 'admin';
    
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT r_admin, p.id FROM public.permissions p
    ON CONFLICT DO NOTHING;

    -- 4. Seed Admin Auth User (Strict Data Integrity check)
    INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
        is_super_admin, role, aud,
        confirmation_token, recovery_token, email_change_token_new,
        email_change, email_change_token_current,
        phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
        admin_id, '00000000-0000-0000-0000-000000000000', 'admin@goskip.app',
        crypt('Admin123!', gen_salt('bf')), NOW(), NOW(), NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"nombre": "Admin", "apellido": "Sistema", "role": "admin"}',
        false, 'authenticated', 'authenticated',
        '', '', '', '', '', NULL, '', '', ''
    ) ON CONFLICT (id) DO NOTHING;

END $seed$;

