# データベースセットアップガイド

## ステップ1: データベースマイグレーションの実行

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. プロジェクトを選択
3. 左メニューから「**SQL Editor**」を開く
4. 「**New query**」をクリック
5. 以下のSQLをコピーして、SQL Editorに貼り付け：

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase Auth users)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'fortune_teller' CHECK (role IN ('admin', 'fortune_teller')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rules table
CREATE TABLE public.rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  fortune_teller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rule generations table
CREATE TABLE public.rule_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID NOT NULL REFERENCES public.rules(id) ON DELETE CASCADE,
  generation_number INTEGER NOT NULL CHECK (generation_number >= 1 AND generation_number <= 6),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  row_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (rule_id, generation_number)
);

-- Rule rows table
CREATE TABLE public.rule_rows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generation_id UUID NOT NULL REFERENCES public.rule_generations(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Images table
CREATE TABLE public.images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fortune_teller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES public.rules(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Line interactions table
CREATE TABLE public.line_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL, -- LINE user ID
  event_type VARCHAR(50) NOT NULL,
  message_content TEXT,
  reply_content JSONB,
  fortune_type VARCHAR(100),
  rule_id UUID REFERENCES public.rules(id) ON DELETE SET NULL,
  generation_id UUID REFERENCES public.rule_generations(id) ON DELETE SET NULL,
  result_value INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Line settings table
CREATE TABLE public.line_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fortune_teller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  channel_secret TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (fortune_teller_id)
);

-- Fortune types table
CREATE TABLE public.fortune_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fortune_teller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fortune_type_id VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  definition JSONB NOT NULL,
  calculation_function_path VARCHAR(500) NOT NULL,
  message_template_id VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (fortune_teller_id, fortune_type_id)
);

-- Fortune message templates table
CREATE TABLE public.fortune_message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id VARCHAR(100) NOT NULL UNIQUE,
  fortune_type_id VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_config JSONB NOT NULL,
  validation_result JSONB,
  is_validated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fortune message mappings table (pre-compiled messages)
CREATE TABLE public.fortune_message_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id VARCHAR(100) NOT NULL REFERENCES public.fortune_message_templates(template_id) ON DELETE CASCADE,
  result_value INTEGER NOT NULL,
  messages JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (template_id, result_value)
);

-- Indexes
CREATE INDEX idx_rules_fortune_teller_id ON public.rules(fortune_teller_id);
CREATE INDEX idx_rule_generations_rule_id ON public.rule_generations(rule_id);
CREATE INDEX idx_rule_generations_is_active ON public.rule_generations(rule_id, is_active) WHERE is_active = true;
CREATE INDEX idx_rule_rows_generation_id ON public.rule_rows(generation_id);
CREATE INDEX idx_images_fortune_teller_id ON public.images(fortune_teller_id);
CREATE INDEX idx_line_interactions_user_id ON public.line_interactions(user_id);
CREATE INDEX idx_line_interactions_created_at ON public.line_interactions(created_at);
CREATE INDEX idx_fortune_types_fortune_teller_id ON public.fortune_types(fortune_teller_id);
CREATE INDEX idx_fortune_types_fortune_type_id ON public.fortune_types(fortune_type_id);
CREATE INDEX idx_fortune_message_mappings_template_result ON public.fortune_message_mappings(template_id, result_value);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.line_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fortune_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fortune_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fortune_message_mappings ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Rules policies
CREATE POLICY "Fortune tellers can manage their own rules"
  ON public.rules FOR ALL
  USING (fortune_teller_id = auth.uid());

CREATE POLICY "Admins can manage all rules"
  ON public.rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Rule generations policies (inherits from rules)
CREATE POLICY "Users can manage generations for their rules"
  ON public.rule_generations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.rules
      WHERE id = rule_generations.rule_id
      AND (fortune_teller_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
      ))
    )
  );

-- Rule rows policies (inherits from generations)
CREATE POLICY "Users can manage rows for their generations"
  ON public.rule_rows FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.rule_generations rg
      JOIN public.rules r ON r.id = rg.rule_id
      WHERE rg.id = rule_rows.generation_id
      AND (r.fortune_teller_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
      ))
    )
  );

-- Images policies
CREATE POLICY "Fortune tellers can manage their own images"
  ON public.images FOR ALL
  USING (fortune_teller_id = auth.uid());

CREATE POLICY "Admins can manage all images"
  ON public.images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Line settings policies
CREATE POLICY "Fortune tellers can manage their own line settings"
  ON public.line_settings FOR ALL
  USING (fortune_teller_id = auth.uid());

-- Fortune types policies
CREATE POLICY "Fortune tellers can manage their own fortune types"
  ON public.fortune_types FOR ALL
  USING (fortune_teller_id = auth.uid());

CREATE POLICY "Admins can manage all fortune types"
  ON public.fortune_types FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Fortune message templates policies (inherits from fortune types)
CREATE POLICY "Users can manage templates for their fortune types"
  ON public.fortune_message_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.fortune_types
      WHERE fortune_type_id = fortune_message_templates.fortune_type_id
      AND (fortune_teller_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
      ))
    )
  );

-- Fortune message mappings policies (inherits from templates)
CREATE POLICY "Users can view mappings for their templates"
  ON public.fortune_message_mappings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.fortune_message_templates fmt
      JOIN public.fortune_types ft ON ft.fortune_type_id = fmt.fortune_type_id
      WHERE fmt.template_id = fortune_message_mappings.template_id
      AND (ft.fortune_teller_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
      ))
    )
  );

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'fortune_teller');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_rules_updated_at BEFORE UPDATE ON public.rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_images_updated_at BEFORE UPDATE ON public.images
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_line_settings_updated_at BEFORE UPDATE ON public.line_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fortune_types_updated_at BEFORE UPDATE ON public.fortune_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fortune_message_templates_updated_at BEFORE UPDATE ON public.fortune_message_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

6. 「**Run**」ボタンをクリック（または `Ctrl+Enter`）
7. 成功メッセージが表示されることを確認

## ステップ2: テーブル作成の確認

以下のSQLを実行して、テーブルが正しく作成されたか確認：

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

以下の10個のテーブルが表示されるはずです：
- `fortune_message_mappings`
- `fortune_message_templates`
- `fortune_types`
- `images`
- `line_interactions`
- `line_settings`
- `rule_generations`
- `rule_rows`
- `rules`
- `user_profiles`

## ステップ3: Storageバケットの作成

画像をアップロードするために、Supabase Storageバケットを作成します：

1. Supabase Dashboard > **Storage** を開く
2. 「**New bucket**」をクリック
3. バケット名: `fortune-images`
4. 「**Public bucket**」にチェック（LINEから画像URLにアクセスするため）
5. 「**Create bucket**」をクリック

## ステップ4: 現在のユーザープロファイルの作成

既にログインしている場合、ユーザープロファイルが自動的に作成されていない可能性があります。以下のSQLを実行して、現在のユーザーにプロファイルを作成：

```sql
INSERT INTO public.user_profiles (id, email, role)
SELECT id, email, 'fortune_teller'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.user_profiles);
```

## 完了！

これでデータベースのセットアップが完了しました。ダッシュボードに戻って、各機能を試してみてください。



