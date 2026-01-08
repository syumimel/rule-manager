-- ユーザーが誤って実行したSQLを元に戻すマイグレーション
-- このファイルをSupabase Dashboard > SQL Editorで実行してください

-- 1. handle_new_user()関数を元の実装に戻す
-- 元の実装: nameカラムを使わず、roleのみを設定
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'fortune_teller')
  ON CONFLICT (id) DO NOTHING; -- 既に存在する場合は何もしない
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- エラーをログに記録（Supabaseのログで確認可能）
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW; -- エラーが発生しても認証は続行
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 追加されたINSERTポリシーを削除
-- 注意: 元のスキーマにはuser_profilesのINSERTポリシーは存在しませんでした
-- SECURITY DEFINER関数なので、ポリシーなしでも動作するはずです
DROP POLICY IF EXISTS "System can insert user profiles" ON public.user_profiles;

-- 確認: 関数が正しく更新されたか確認
-- 以下のクエリで確認できます（オプション）
-- SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'handle_new_user';

