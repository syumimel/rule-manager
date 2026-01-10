-- message_logs テーブル作成（チャット機能用）
CREATE TABLE IF NOT EXISTS public.message_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  line_user_id TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('received', 'sent')),
  message_text TEXT NOT NULL,
  raw_event_data JSONB NOT NULL,
  reply_token TEXT,
  message_id TEXT,
  formatted_payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_message_logs_line_user_id ON public.message_logs(line_user_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_created_at ON public.message_logs(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_message_logs_message_id ON public.message_logs(message_id) WHERE message_id IS NOT NULL;

-- RLS設定
ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;

-- オウム返し設定テーブル（ユーザーごとの設定）
CREATE TABLE IF NOT EXISTS public.chat_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fortune_teller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  line_user_id TEXT NOT NULL,
  echo_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (fortune_teller_id, line_user_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_chat_settings_fortune_teller_id ON public.chat_settings(fortune_teller_id);
CREATE INDEX IF NOT EXISTS idx_chat_settings_line_user_id ON public.chat_settings(line_user_id);

-- RLS設定
ALTER TABLE public.chat_settings ENABLE ROW LEVEL SECURITY;

-- ポリシー: 占い師は自分の設定のみ閲覧・更新可能
CREATE POLICY "Fortune tellers can manage their own chat settings"
  ON public.chat_settings FOR ALL
  USING (fortune_teller_id = auth.uid())
  WITH CHECK (fortune_teller_id = auth.uid());

-- 管理者は全て閲覧・更新可能
CREATE POLICY "Admins can manage all chat settings"
  ON public.chat_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ポリシー: 占い師は自分のメッセージログを閲覧可能
CREATE POLICY "Fortune tellers can view their message logs"
  ON public.message_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_settings
      WHERE chat_settings.line_user_id = message_logs.line_user_id
      AND chat_settings.fortune_teller_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 管理者は全て閲覧可能
CREATE POLICY "Admins can view all message logs"
  ON public.message_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- システム（Webhook）はメッセージログを挿入可能
-- SECURITY DEFINER関数を使用する場合は不要だが、直接挿入も許可する
CREATE POLICY "System can insert message logs"
  ON public.message_logs FOR INSERT
  WITH CHECK (true);

-- Realtimeを有効化
ALTER PUBLICATION supabase_realtime ADD TABLE message_logs;

-- updated_at更新トリガー
CREATE TRIGGER update_chat_settings_updated_at BEFORE UPDATE ON public.chat_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

