# クイックスタートガイド

## 🚀 すぐに始める

### ステップ1: Supabaseプロジェクトを作成

1. [Supabase Dashboard](https://supabase.com/dashboard)にアクセス
2. 「New Project」をクリック
3. プロジェクト情報を入力して作成

### ステップ2: 環境変数を取得

1. 作成したプロジェクトを開く
2. 左メニューから「Settings」→「API」を選択
3. 以下の3つの値をコピー：
   - **Project URL**（例: `https://xxxxxxxxxxxxx.supabase.co`）
   - **anon public** key（長い文字列）
   - **service_role** key（長い文字列、⚠️ 機密情報）

### ステップ3: `.env.local`ファイルを編集

プロジェクトルートの`.env.local`ファイルを開き、以下のように設定：

```env
# Supabase設定（必須）
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# LINE設定（後で設定可能）
LINE_CHANNEL_ID=
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=

# アプリケーションURL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### ステップ4: データベースマイグレーションを実行

1. Supabase Dashboard > SQL Editor を開く
2. 「New query」をクリック
3. `supabase/migrations/001_initial_schema.sql` の内容をコピー
4. SQL Editorに貼り付けて「Run」をクリック

### ステップ5: 開発サーバーを起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

---

## ⚠️ エラーが発生した場合

### 「Your project's URL and Key are required」エラー

このエラーは、`.env.local`ファイルにSupabaseの環境変数が設定されていない場合に発生します。

**解決方法**:
1. `.env.local`ファイルを開く
2. `NEXT_PUBLIC_SUPABASE_URL`と`NEXT_PUBLIC_SUPABASE_ANON_KEY`に値を設定
3. 開発サーバーを再起動（`Ctrl+C`で停止してから`npm run dev`）

### 環境変数が読み込まれない

1. `.env.local`ファイルがプロジェクトルートにあるか確認
2. ファイル名が正確か確認（`.env.local`）
3. 開発サーバーを再起動
4. 値に余分なスペースや引用符がないか確認

---

## 📝 設定の確認方法

環境変数が正しく設定されているか確認：

```bash
# 環境変数を確認（開発サーバー起動時に表示される）
npm run dev
```

または、ブラウザのコンソールでエラーが出ないか確認してください。



