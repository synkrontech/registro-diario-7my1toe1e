-- 1. Create Notifications Table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all notifications" ON public.notifications
    FOR ALL USING (public.get_current_user_role() = 'admin');

-- 2. Update Permissions Table for Granular Permissions
ALTER TABLE public.permissions ADD COLUMN resource_id UUID NULL;
ALTER TABLE public.permissions ADD COLUMN resource_type TEXT NULL;

-- Remove unique constraint on code if it exists, and add composite unique constraint
-- Assuming there might be a constraint named 'permissions_code_key'
ALTER TABLE public.permissions DROP CONSTRAINT IF EXISTS permissions_code_key;
CREATE UNIQUE INDEX permissions_code_resource_idx ON public.permissions (code, (resource_id IS NULL)) WHERE resource_id IS NULL;
CREATE UNIQUE INDEX permissions_code_resource_val_idx ON public.permissions (code, resource_id) WHERE resource_id IS NOT NULL;

-- 3. Create Email Templates Table
CREATE TABLE public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for Email Templates
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email templates" ON public.email_templates
    FOR ALL USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Service role can read templates" ON public.email_templates
    FOR SELECT TO service_role USING (true);

-- 4. Seed Email Templates
INSERT INTO public.email_templates (slug, subject, body) VALUES
('user_registration', 'Bienvenido a Registro Diario', 'Hola {{nombre}},\n\nGracias por registrarte. Tu cuenta está pendiente de aprobación por un administrador.\n\nSaludos,\nEl equipo.'),
('user_approval', 'Tu cuenta ha sido aprobada', 'Hola {{nombre}},\n\nTu cuenta ha sido activada. Ya puedes acceder a la plataforma.\n\nLogin: {{url}}\n\nSaludos.'),
('user_rejection', 'Actualización sobre tu cuenta', 'Hola {{nombre}},\n\nLamentablemente tu solicitud de registro ha sido rechazada.\n\nMotivo: {{reason}}\n\nSaludos.'),
('admin_new_user', 'Nuevo usuario registrado', 'Hola Admin,\n\nEl usuario {{nombre}} ({{email}}) se ha registrado y requiere aprobación.');

-- 5. Triggers for Notifications

-- Function to notify admins
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

-- Trigger for New User (on public.users)
-- Assuming public.users is populated via trigger from auth.users, this triggers after that insert
DROP TRIGGER IF EXISTS on_new_user_notify_admin ON public.users;
CREATE TRIGGER on_new_user_notify_admin
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_admins_on_event('Nuevo Usuario', 'El usuario %s se ha registrado.', 'registration');

-- Trigger for Audit Log
DROP TRIGGER IF EXISTS on_audit_log_notify_admin ON public.audit_logs;
CREATE TRIGGER on_audit_log_notify_admin
    AFTER INSERT ON public.audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_admins_on_event('Alerta de Auditoría', 'Nueva acción registrada: %s', 'audit');

