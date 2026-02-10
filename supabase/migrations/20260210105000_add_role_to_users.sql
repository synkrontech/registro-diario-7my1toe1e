-- Add role column to users table if it doesn't exist
-- This migration is inserted before the seed data migration (20260210110000)
-- to ensure the role column exists for the seed script.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE public.users ADD COLUMN role text DEFAULT 'consultor';
        
        -- Add check constraint for valid roles to ensure data integrity
        -- Roles: admin, director, gerente, consultor
        ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'director', 'gerente', 'consultor'));
    END IF;
END $$;
