# Google OAuth設定ガイド（詳細版）

## リダイレクトURIの設定

Supabaseの認証コールバックURLをGoogle Cloud Consoleに設定する必要があります。

### あなたのSupabaseプロジェクトのリダイレクトURI

```
https://waruhzoamdlatflbaxkz.supabase.co/auth/v1/callback
```

このURLをGoogle Cloud Consoleの承認済みリダイレクトURIに追加してください。

---

## 設定手順

### ステップ1: Google Cloud Consoleにアクセス

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクトを選択（または新規作成）

### ステップ2: OAuth 2.0 クライアントIDを作成

1. 「APIとサービス」→「認証情報」に移動
2. 「認証情報を作成」→「OAuth 2.0 クライアントID」を選択

### ステップ3: 同意画面の設定（初回のみ）

1. 「OAuth同意画面」タブをクリック
2. ユーザータイプ: **外部** を選択
3. 「作成」をクリック
4. アプリ情報を入力：
   - **アプリ名**: 任意（例: Rule Manager）
   - **ユーザーサポートメール**: あなたのメールアドレス
   - **デベロッパーの連絡先情報**: あなたのメールアドレス
5. 「保存して次へ」をクリック
6. スコープ: デフォルトのまま「保存して次へ」
7. テストユーザー: 必要に応じて追加（開発中は自分のメールアドレスを追加）
8. 「ダッシュボードに戻る」をクリック

### ステップ4: OAuth 2.0 クライアントIDの作成

1. 「認証情報」タブに戻る
2. 「認証情報を作成」→「OAuth 2.0 クライアントID」を選択
3. アプリケーションの種類: **ウェブアプリケーション** を選択
4. 名前: 任意（例: Rule Manager Web Client）
5. **承認済みのリダイレクトURI**に以下を追加：

```
https://waruhzoamdlatflbaxkz.supabase.co/auth/v1/callback
```

6. 「作成」をクリック

### ステップ5: 認証情報をコピー

作成されたOAuth 2.0 クライアントIDから以下をコピー：
- **クライアントID**（Client ID）
- **クライアントシークレット**（Client Secret）

### ステップ6: Supabaseに認証情報を設定

1. [Supabase Dashboard](https://supabase.com/dashboard)にアクセス
2. プロジェクトを選択
3. 「Authentication」→「Providers」→「Google」を開く
4. 「Enable Google provider」をONにする
5. 以下を入力：
   - **Client ID (for OAuth)**: Google Cloud ConsoleからコピーしたクライアントID
   - **Client Secret (for OAuth)**: Google Cloud Consoleからコピーしたクライアントシークレット
6. 「Save」をクリック

### ステップ7: SupabaseのリダイレクトURL設定を確認

1. Supabase Dashboard > Authentication > URL Configuration
2. **Redirect URLs**に以下が含まれていることを確認：
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/**
   ```
3. 含まれていない場合は追加して「Save」をクリック

---

## 動作確認

1. 開発サーバーを起動：
   ```bash
   npm run dev
   ```

2. ブラウザで [http://localhost:3000](http://localhost:3000) を開く

3. 「Googleでログイン」をクリック

4. Google認証画面が表示され、ログインできることを確認

---

## トラブルシューティング

### 「provider is not enabled」エラー

- Supabase Dashboard > Authentication > Providers > Google
- 「Enable Google provider」がONになっているか確認

### リダイレクトURI不一致エラー

- Google Cloud Consoleの承認済みリダイレクトURIに以下が正確に設定されているか確認：
  ```
  https://waruhzoamdlatflbaxkz.supabase.co/auth/v1/callback
  ```
- 余分なスペースやスラッシュがないか確認

### 同意画面のエラー

- Google Cloud Console > OAuth同意画面が正しく設定されているか確認
- テストユーザーが必要な場合は、自分のメールアドレスを追加

---

## 参考

- [Supabase Google Auth Documentation](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)



