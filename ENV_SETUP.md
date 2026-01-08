# 環境変数設定ガイド

## 必要な環境変数

以下の環境変数を`.env.local`ファイルに設定してください。

## 1. Supabase設定

### 取得方法
1. [Supabase Dashboard](https://supabase.com/dashboard)にログイン
2. プロジェクトを選択（または新規作成）
3. Settings > API から以下を取得：
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### 設定例
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 2. LINE設定

### 取得方法
1. [LINE Developers Console](https://developers.line.biz/console/)にログイン
2. プロバイダーを作成（初回のみ）
3. Messaging APIチャネルを作成
4. チャネル設定から以下を取得：
   - `Channel ID` → `LINE_CHANNEL_ID`
   - `Channel secret` → `LINE_CHANNEL_SECRET`
5. Messaging API設定 > Channel access token > 発行
   - `Channel access token` → `LINE_CHANNEL_ACCESS_TOKEN`
   - **注意**: トークンの値のみを設定（"Bearer "は付けない）

### 設定例
```env
LINE_CHANNEL_ID=1234567890
LINE_CHANNEL_SECRET=abcdefghijklmnopqrstuvwxyz123456
LINE_CHANNEL_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 3. アプリケーションURL

### 開発環境
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 本番環境
```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 完全な設定例

`.env.local`ファイルの完全な例：

```env
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eHh4eHgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NzE5MjEyMCwiZXhwIjoxOTYyNzc4MTIwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eHh4eHgiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjQ3MTkyMTIwLCJleHAiOjE5NjI3NzgxMjB9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# LINE設定
LINE_CHANNEL_ID=1234567890
LINE_CHANNEL_SECRET=abcdefghijklmnopqrstuvwxyz123456
LINE_CHANNEL_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# アプリケーションURL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## セキュリティ注意事項

⚠️ **重要**: `.env.local`ファイルは以下の点に注意してください：

1. **Gitにコミットしない**
   - `.gitignore`に含まれていることを確認
   - 機密情報が含まれるため、絶対に公開しない

2. **権限の管理**
   - `SUPABASE_SERVICE_ROLE_KEY`は特に機密性が高い
   - サーバーサイドでのみ使用し、クライアントに露出しない

3. **環境ごとに分ける**
   - 開発環境: `.env.local`
   - 本番環境: Vercelの環境変数設定

## 設定確認

環境変数が正しく設定されているか確認するには：

```bash
# 開発サーバー起動時に環境変数が読み込まれます
npm run dev
```

ブラウザのコンソールでエラーが出ないか確認してください。

## トラブルシューティング

### 環境変数が読み込まれない
- `.env.local`ファイルがプロジェクトルートにあるか確認
- ファイル名が正確か確認（`.env.local`）
- 開発サーバーを再起動

### Supabase接続エラー
- URLとキーが正しいか確認
- Supabaseプロジェクトがアクティブか確認

### LINE Webhookエラー
- Channel ID/Secretが正しいか確認
- Channel Access Tokenが有効か確認（期限切れの可能性）

