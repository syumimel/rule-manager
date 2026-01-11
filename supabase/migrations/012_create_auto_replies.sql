-- 自動返信テーブル作成
CREATE TABLE IF NOT EXISTS public.auto_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fortune_teller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  reply_type TEXT NOT NULL CHECK (reply_type IN ('text', 'json')),
  reply_text TEXT, -- reply_typeが'text'の場合
  reply_json JSONB, -- reply_typeが'json'の場合（LINE Messaging API形式のメッセージ配列）
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0, -- 優先順位（数値が大きいほど優先）
  match_type TEXT NOT NULL DEFAULT 'contains' CHECK (match_type IN ('exact', 'contains', 'starts_with', 'ends_with')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (fortune_teller_id, keyword, match_type)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_auto_replies_fortune_teller_id ON public.auto_replies(fortune_teller_id);
CREATE INDEX IF NOT EXISTS idx_auto_replies_keyword ON public.auto_replies(keyword);
CREATE INDEX IF NOT EXISTS idx_auto_replies_is_active ON public.auto_replies(is_active);
CREATE INDEX IF NOT EXISTS idx_auto_replies_priority ON public.auto_replies(priority DESC);

-- RLS設定
ALTER TABLE public.auto_replies ENABLE ROW LEVEL SECURITY;

-- ポリシー: 占い師は自分の自動返信を管理可能
CREATE POLICY "Fortune tellers can manage their own auto replies"
  ON public.auto_replies FOR ALL
  USING (fortune_teller_id = auth.uid())
  WITH CHECK (fortune_teller_id = auth.uid());

-- 管理者は全て管理可能
CREATE POLICY "Admins can manage all auto replies"
  ON public.auto_replies FOR ALL
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

-- updated_at更新トリガー
CREATE TRIGGER update_auto_replies_updated_at BEFORE UPDATE ON public.auto_replies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


