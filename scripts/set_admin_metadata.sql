-- Update app_metadata for all admin users so their JWTs include the role
-- This ensures jwt_is_admin() also recognizes them via JWT claims

-- ana@anamurat.com
UPDATE auth.users SET raw_app_meta_data = 
  COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'ana@anamurat.com';

-- ana@anareiki.com
UPDATE auth.users SET raw_app_meta_data = 
  COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'ana@anareiki.com';

-- fmonfasani@gmail.com
UPDATE auth.users SET raw_app_meta_data = 
  COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'fmonfasani@gmail.com';
