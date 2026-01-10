-- チャット機能の状態を確認するクエリ
-- Supabase Dashboard > SQL Editor で実行して、現在の状態を確認してください

-- 1. message_logsテーブルが存在するか確認
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'message_logs'
) AS message_logs_exists;

-- 2. chat_settingsテーブルが存在するか確認
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'chat_settings'
) AS chat_settings_exists;

-- 3. message_logsテーブルの構造を確認
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'message_logs'
ORDER BY ordinal_position;

-- 4. message_logsテーブルにデータがあるか確認
SELECT COUNT(*) as total_messages FROM public.message_logs;
SELECT COUNT(DISTINCT line_user_id) as unique_users FROM public.message_logs;

-- 5. 最新のメッセージログを確認（10件）
SELECT 
  id,
  line_user_id,
  message_type,
  message_text,
  created_at
FROM public.message_logs
ORDER BY created_at DESC
LIMIT 10;

-- 6. RLSポリシーを確認
SELECT 
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('message_logs', 'chat_settings')
ORDER BY tablename, policyname;

-- 7. Realtimeが有効か確認
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename = 'message_logs';

