-- イメージマップテーブル作成
CREATE TABLE IF NOT EXISTS public.imagemaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fortune_teller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id TEXT NOT NULL, -- フォルダーID（例: rm001）
  name TEXT NOT NULL, -- イメージマップ名
  base_url TEXT NOT NULL, -- baseUrl（自動生成）
  alt_text TEXT NOT NULL, -- altText
  base_width INTEGER NOT NULL DEFAULT 1040, -- baseSize.width
  base_height INTEGER NOT NULL DEFAULT 1040, -- baseSize.height
  actions JSONB NOT NULL DEFAULT '[]'::jsonb, -- actions配列
  video JSONB, -- video設定（オプション）
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (fortune_teller_id, folder_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_imagemaps_fortune_teller_id ON public.imagemaps(fortune_teller_id);
CREATE INDEX IF NOT EXISTS idx_imagemaps_folder_id ON public.imagemaps(folder_id);
CREATE INDEX IF NOT EXISTS idx_imagemaps_is_active ON public.imagemaps(is_active);

-- RLS設定
ALTER TABLE public.imagemaps ENABLE ROW LEVEL SECURITY;

-- ポリシー: 占い師は自分のイメージマップを管理可能
CREATE POLICY "Fortune tellers can manage their own imagemaps"
  ON public.imagemaps FOR ALL
  USING (fortune_teller_id = auth.uid())
  WITH CHECK (fortune_teller_id = auth.uid());

-- 管理者は全て管理可能
CREATE POLICY "Admins can manage all imagemaps"
  ON public.imagemaps FOR ALL
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
CREATE TRIGGER update_imagemaps_updated_at BEFORE UPDATE ON public.imagemaps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();



