-- =====================================================
-- MIGRATION 015: Rename 'user' role to 'consultante'
-- Description: Updates the profiles role check constraint
--              and migrates existing 'user' roles
-- =====================================================

-- 1. Drop old constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Add new constraint with 'consultante' instead of 'user'
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('consultante', 'admin'));

-- 3. Migrate existing 'user' roles to 'consultante'
UPDATE public.profiles SET role = 'consultante' WHERE role = 'user';

-- 4. Update default for future rows
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'consultante';
