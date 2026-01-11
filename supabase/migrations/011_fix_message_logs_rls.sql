-- message_logsテーブルのRLSポリシーを修正
-- 認証された占い師は全てのメッセージログを閲覧可能にする

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Fortune tellers can view their message logs" ON public.message_logs;
DROP POLICY IF EXISTS "Admins can view all message logs" ON public.message_logs;

-- 新しいポリシー: 認証された占い師（user_profilesに存在するユーザー）は全てのメッセージログを閲覧可能
CREATE POLICY "Authenticated fortune tellers can view all message logs"
  ON public.message_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
    )
  );

-- 管理者は全て閲覧可能（重複しているが、明確にするために残す）
CREATE POLICY "Admins can view all message logs"
  ON public.message_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );



