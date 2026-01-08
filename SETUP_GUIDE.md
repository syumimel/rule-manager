# セットアップガイド

このガイドでは、占いルール管理システムのセットアップ手順を順を追って説明します。

## 📋 セットアップチェックリスト

- [x] 依存関係のインストール
- [ ] 環境変数の設定
- [ ] Supabaseプロジェクトの設定
- [ ] データベースマイグレーションの実行
- [ ] Storageバケットの作成
- [ ] Google認証の設定
- [ ] Edge Functionsのデプロイ
- [ ] LINE設定
- [ ] 開発サーバーの起動確認

---

## ステップ1: 環境変数の設定

### 1.1 `.env.local`ファイルを編集

プロジェクトルートの`.env.local`ファイルを開き、以下の値を設定してください。

```env
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# LINE設定
LINE_CHANNEL_ID=your_channel_id
LINE_CHANNEL_SECRET=your_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token

# アプリケーションURL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

詳細は `ENV_SETUP.md` を参照してください。

---

## ステップ2: Supabaseプロジェクトの設定

### 2.1 Supabaseプロジェクトの作成

1. [Supabase Dashboard](https://supabase.com/dashboard)にアクセス
2. 「New Project」をクリック
3. プロジェクト情報を入力：
   - **Name**: プロジェクト名（例: rule-manager）
   - **Database Password**: 強力なパスワードを設定
   - **Region**: 最寄りのリージョンを選択
4. 「Create new project」をクリック

### 2.2 環境変数の取得

1. プロジェクトが作成されたら、Settings > API に移動
2. 以下の値を取得：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### 2.3 データベースマイグレーションの実行

1. Supabase Dashboard > SQL Editor に移動
2. 「New query」をクリック
3. `supabase/migrations/001_initial_schema.sql` の内容をコピー＆ペースト
4. 「Run」をクリックして実行
5. エラーがないか確認

### 2.4 Storageバケットの作成

1. Supabase Dashboard > Storage に移動
2. 「New bucket」をクリック
3. 設定：
   - **Name**: `fortune-images`
   - **Public bucket**: ✅ 有効にする
4. 「Create bucket」をクリック

### 2.5 Google認証の設定

1. Supabase Dashboard > Authentication > Providers に移動
2. 「Google」を選択
3. 「Enable Google provider」を有効にする
4. Google Cloud Consoleで以下を設定：
   - OAuth 2.0 Client ID を作成
   - 承認済みのリダイレクト URI に以下を追加：
     - `https://your-project.supabase.co/auth/v1/callback`
5. Client ID と Client Secret をSupabaseに設定
6. 「Save」をクリック

---

## ステップ3: Edge Functionsのデプロイ

### 3.1 Supabase CLIのインストール

```bash
npm install -g supabase
```

### 3.2 プロジェクトのリンク

```bash
supabase login
supabase link --project-ref your-project-ref
```

プロジェクト参照IDは、Supabase Dashboard > Settings > General から取得できます。

### 3.3 Edge Functionsのデプロイ

```bash
supabase functions deploy calculate-numerology
supabase functions deploy calculate-random
```

---

## ステップ4: LINE設定

### 4.1 LINE Developers Consoleの設定

1. [LINE Developers Console](https://developers.line.biz/console/)にアクセス
2. プロバイダーを作成（初回のみ）
3. Messaging APIチャネルを作成
4. チャネル設定から以下を取得：
   - **Channel ID** → `LINE_CHANNEL_ID`
   - **Channel secret** → `LINE_CHANNEL_SECRET`
5. Messaging API設定 > Channel access token > 発行
   - **Channel access token** → `LINE_CHANNEL_ACCESS_TOKEN`

### 4.2 Webhook URLの設定

1. LINE Developers Console > Messaging API設定
2. Webhook URL に以下を設定：
   - 開発環境: `http://localhost:3000/api/line/webhook`（ngrokなどが必要）
   - 本番環境: `https://your-domain.com/api/line/webhook`
3. 「Webhookの利用」を有効にする
4. 「検証」をクリックして接続を確認

---

## ステップ5: 開発サーバーの起動

### 5.1 環境変数の確認

`.env.local`ファイルにすべての環境変数が設定されているか確認してください。

### 5.2 開発サーバーの起動

```bash
npm run dev
```

### 5.3 動作確認

1. ブラウザで [http://localhost:3000](http://localhost:3000) を開く
2. ログイン画面が表示されることを確認
3. Google認証でログインできることを確認
4. ダッシュボードが表示されることを確認

---

## トラブルシューティング

### エラーが発生した場合

1. **環境変数エラー**
   - `.env.local`ファイルが正しく設定されているか確認
   - 開発サーバーを再起動

2. **Supabase接続エラー**
   - URLとキーが正しいか確認
   - Supabaseプロジェクトがアクティブか確認

3. **認証エラー**
   - Google認証の設定を確認
   - リダイレクトURLが正しいか確認

4. **データベースエラー**
   - マイグレーションが正しく実行されたか確認
   - RLSポリシーが有効か確認

詳細は `TROUBLESHOOTING.md` を参照してください。

---

## 次のステップ

セットアップが完了したら：

1. **テストデータの投入**
   - CSVファイルをアップロード
   - 占いタイプ定義を登録
   - メッセージテンプレートを登録

2. **動作確認**
   - 各機能の動作を確認
   - LINE Webhookのテスト

3. **本番環境へのデプロイ**
   - Vercelへのデプロイ
   - 環境変数の設定
   - 動作確認

詳細は `DEPLOYMENT.md` を参照してください。



