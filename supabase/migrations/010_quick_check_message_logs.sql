-- クイックチェック: message_logsテーブルにデータがあるか確認
-- このクエリを実行して、結果を確認してください

-- 1. message_logsテーブルが存在するか
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'message_logs'
) AS message_logs_exists;

-- 2. データの件数を確認
SELECT COUNT(*) as total_messages FROM public.message_logs;

-- 3. 最新の5件を確認（あれば）
SELECT 
  id,
  line_user_id,
  message_type,
  LEFT(message_text, 50) as message_preview,
  created_at
FROM public.message_logs
ORDER BY created_at DESC
LIMIT 5;

-- 4. 参考: line_interactionsテーブルにはデータがあるか確認
-- （これがあれば、Webhookは動作している）
SELECT COUNT(*) as total_interactions FROM public.line_interactions;
SELECT 
  user_id,
  message_content,
  created_at
FROM public.line_interactions
ORDER BY created_at DESC
LIMIT 5;




