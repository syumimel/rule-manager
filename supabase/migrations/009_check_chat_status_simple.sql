-- チャット機能の状態を確認するクエリ（簡易版）
-- Supabase Dashboard > SQL Editor で、このブロックをコピーして実行してください

-- ============================================
-- ブロック1: テーブルの存在確認
-- ============================================
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'message_logs'
) AS message_logs_exists,
EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'chat_settings'
) AS chat_settings_exists;

-- ============================================
-- ブロック2: データの確認（重要）
-- ============================================
-- この結果で、友達一覧が空の原因が分かります
SELECT 
  COUNT(*) as total_messages,
  COUNT(DISTINCT line_user_id) as unique_users
FROM public.message_logs;

-- ============================================
-- ブロック3: 最新のメッセージログ（10件）
-- ============================================
SELECT 
  id,
  line_user_id,
  message_type,
  LEFT(message_text, 50) as message_preview,
  created_at
FROM public.message_logs
ORDER BY created_at DESC
LIMIT 10;



