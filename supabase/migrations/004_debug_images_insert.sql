-- Debug: Check if user_profiles exist and test INSERT
-- This will help identify the issue

-- First, let's check if there are any user_profiles
SELECT id, email, role FROM public.user_profiles;

-- Check if is_admin function exists and works
SELECT public.is_admin('00000000-0000-0000-0000-000000000000'::uuid) as test_result;

-- Test INSERT with a simple policy check
-- Note: This is just for debugging, don't run in production
-- The actual INSERT should be done through the API

-- Let's also verify the images table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'images'
ORDER BY ordinal_position;



