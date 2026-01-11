-- 現在の状態を確認するクエリ
-- Supabase Dashboard > SQL Editor で実行して、現在の状態を確認してください

-- 1. user_profilesテーブルの構造を確認
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 2. handle_new_user()関数の定義を確認
SELECT 
    pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'handle_new_user'
  AND pronamespace = 'public'::regnamespace;

-- 3. user_profilesテーブルのINSERTポリシーを確認
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_profiles'
  AND cmd = 'INSERT';

-- 4. 既存のuser_profilesレコードを確認（nameカラムがあるかどうか）
SELECT * FROM public.user_profiles LIMIT 5;




