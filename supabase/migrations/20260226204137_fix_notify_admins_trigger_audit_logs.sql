-- Replaces the notification trigger function to safely handle tables without an email column
-- using to_jsonb(NEW) to access properties dynamically without raising exceptions.
CREATE OR REPLACE FUNCTION public.notify_admins_on_event()
RETURNS TRIGGER AS $$
DECLARE
    admin_record RECORD;
    new_record_json JSONB;
    param_value TEXT;
BEGIN
    -- Convert NEW record to JSONB to safely access fields dynamically
    -- This prevents 'record has no field' errors
    new_record_json := to_jsonb(NEW);

    -- Determine the value to use in format() based on the table name
    IF TG_TABLE_NAME = 'users' THEN
        -- For users table, we want to show the email
        param_value := COALESCE(new_record_json->>'email', 'Desconocido');
    ELSIF TG_TABLE_NAME = 'audit_logs' THEN
        -- For audit_logs table, we want to show the action_type
        param_value := COALESCE(new_record_json->>'action_type', 'Desconocido');
    ELSE
        -- Fallback for safety to prevent runtime errors on other tables
        param_value := 'Desconocido';
    END IF;

    -- Notify all active admins
    FOR admin_record IN 
        SELECT u.id FROM public.users u
        JOIN public.roles r ON u.role_id = r.id
        WHERE r.name = 'admin' AND u.activo = true
    LOOP
        INSERT INTO public.notifications (user_id, title, message, type)
        VALUES (
            admin_record.id, 
            TG_ARGV[0], 
            format(TG_ARGV[1], param_value), 
            TG_ARGV[2]
        );
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
