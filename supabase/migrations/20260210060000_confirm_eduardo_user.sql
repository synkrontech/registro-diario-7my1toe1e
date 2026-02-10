-- Manually confirm the user eduardo.melendez@me.com to restore access immediately
-- This updates the auth.users table in the auth schema
UPDATE auth.users
SET email_confirmed_at = now(),
    updated_at = now()
WHERE email = 'eduardo.melendez@me.com';
