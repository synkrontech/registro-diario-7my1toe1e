-- Ensure role column exists in public.users if it was somehow missed or failed
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role text DEFAULT 'consultor';

-- Ensure the constraint exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
    ) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'director', 'gerente', 'consultor'));
    END IF;
END $$;
