# エラー対応ガイド

## 想定されるエラーと対応方法

### エラー1: 新規ユーザー登録時のエラー

**症状:**
- Google認証後にログインできない
- ブラウザのコンソールやサーバーログに以下のようなエラーが表示される:
  - `column "name" does not exist`
  - `Error in handle_new_user`

**原因:**
`handle_new_user()`関数が存在しない`name`カラムにINSERTしようとしている

**対応方法:**
Supabase Dashboard > SQL Editor で以下を実行:

```sql
-- handle_new_user()関数を修正（nameカラムを削除）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'fortune_teller')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### エラー2: 既存ユーザーのプロフィール取得エラー

**症状:**
- ログインは成功するが、ダッシュボードが表示されない
- `user_profiles`テーブルへのアクセスエラー

**原因:**
RLSポリシーの問題、またはテーブル構造の不整合

**対応方法:**
1. まず状態を確認:
```sql
-- user_profilesテーブルの構造を確認
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user_profiles';
```

2. 必要に応じて、`007_rollback_user_profiles_changes.sql`を実行

### エラー3: INSERTポリシーによるエラー

**症状:**
- 新規ユーザー登録時に「permission denied」エラー

**対応方法:**
```sql
-- INSERTポリシーを削除（SECURITY DEFINER関数なので不要）
DROP POLICY IF EXISTS "System can insert user profiles" ON public.user_profiles;
```

## 完全なロールバック（すべての問題を一度に修正）

すべての問題を一度に修正する場合:

Supabase Dashboard > SQL Editor で `supabase/migrations/007_rollback_user_profiles_changes.sql` を実行してください。

## エラーログの確認方法

1. **Supabase Dashboard > Logs > Postgres Logs** でデータベースエラーを確認
2. **開発サーバーのターミナル** でNext.jsのエラーログを確認
3. **ブラウザの開発者ツール > Console** でクライアント側のエラーを確認

## 現在の状態を確認するクエリ

```sql
-- 1. テーブル構造を確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 2. 関数の定義を確認
SELECT pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'handle_new_user'
  AND pronamespace = 'public'::regnamespace;

-- 3. INSERTポリシーを確認
SELECT policyname, cmd, with_check
FROM pg_policies
WHERE tablename = 'user_profiles' AND cmd = 'INSERT';
```




