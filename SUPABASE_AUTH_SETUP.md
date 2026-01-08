# Supabase Google認証設定ガイド

## エラー: "Unsupported provider: provider is not enabled"

このエラーは、SupabaseでGoogle認証プロバイダーが有効になっていない場合に発生します。

## 解決方法

### ステップ1: Google認証プロバイダーを有効化

1. **Supabase Dashboardにアクセス**
   - [Supabase Dashboard](https://supabase.com/dashboard)にログイン
   - プロジェクトを選択

2. **認証設定を開く**
   - 左メニューから「Authentication」を選択
   - 「Providers」タブをクリック

3. **Googleプロバイダーを有効化**
   - 「Google」を探してクリック
   - 「Enable Google provider」トグルをONにする

### ステップ2: Google OAuth認証情報の取得

#### 2.1 Google Cloud Consoleでプロジェクトを作成

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクトを作成（または既存のプロジェクトを選択）
3. 「APIとサービス」→「認証情報」に移動

#### 2.2 OAuth 2.0 クライアントIDを作成

1. 「認証情報を作成」→「OAuth 2.0 クライアントID」を選択
2. 同意画面を設定（初回のみ）
   - ユーザータイプ: 外部
   - アプリ名、ユーザーサポートメールなどを入力
   - スコープ: デフォルトのまま
   - テストユーザー: 必要に応じて追加
3. OAuth 2.0 クライアントIDを作成
   - アプリケーションの種類: ウェブアプリケーション
   - 名前: 任意（例: Rule Manager）
   - 承認済みのリダイレクトURI: 以下を追加
     ```
     https://your-project-ref.supabase.co/auth/v1/callback
     ```
     - `your-project-ref`は、Supabase Dashboard > Settings > General > Reference ID から取得

#### 2.3 認証情報をSupabaseに設定

1. Google Cloud Consoleで作成した認証情報から以下をコピー：
   - **クライアントID**（Client ID）
   - **クライアントシークレット**（Client Secret）

2. Supabase Dashboard > Authentication > Providers > Google に戻る

3. 以下を入力：
   - **Client ID (for OAuth)**: Google Cloud Consoleから取得したクライアントID
   - **Client Secret (for OAuth)**: Google Cloud Consoleから取得したクライアントシークレット

4. 「Save」をクリック

### ステップ3: リダイレクトURLの確認

Supabase Dashboard > Authentication > URL Configuration で以下を確認：

- **Site URL**: `http://localhost:3000`（開発環境）
- **Redirect URLs**: 以下が含まれていることを確認
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/**`

### ステップ4: 動作確認

1. 開発サーバーを再起動
   ```bash
   npm run dev
   ```

2. ブラウザで [http://localhost:3000](http://localhost:3000) を開く

3. 「Googleでログイン」をクリック

4. Google認証画面が表示され、ログインできることを確認

## トラブルシューティング

### エラーが続く場合

1. **プロバイダーが有効か確認**
   - Supabase Dashboard > Authentication > Providers > Google
   - 「Enable Google provider」がONになっているか確認

2. **認証情報が正しいか確認**
   - Client IDとClient Secretが正しく入力されているか
   - 余分なスペースや改行がないか

3. **リダイレクトURIが正しいか確認**
   - Google Cloud Consoleの承認済みリダイレクトURIに以下が含まれているか：
     ```
     https://your-project-ref.supabase.co/auth/v1/callback
     ```
   - `your-project-ref`は正しいか確認

4. **同意画面の設定**
   - Google Cloud Console > OAuth同意画面が正しく設定されているか
   - テストユーザーが必要な場合は追加されているか

5. **開発サーバーを再起動**
   - 環境変数の変更後は必ず再起動

## 参考リンク

- [Supabase Authentication Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Setup Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google Cloud Console](https://console.cloud.google.com/)



