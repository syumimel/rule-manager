# デプロイメントガイド

## Vercelへのデプロイ

### 1. 準備

1. **GitHubリポジトリにプッシュ**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin your-repository-url
   git push -u origin main
   ```

2. **Vercelアカウントの作成**
   - [Vercel](https://vercel.com)でアカウントを作成
   - GitHubアカウントと連携

### 2. プロジェクトのインポート

1. Vercel Dashboard > New Project
2. GitHubリポジトリを選択
3. プロジェクト設定:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 3. 環境変数の設定

Vercel Dashboard > Settings > Environment Variables で以下を設定:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
LINE_CHANNEL_ID
LINE_CHANNEL_SECRET
LINE_CHANNEL_ACCESS_TOKEN
NEXT_PUBLIC_APP_URL
```

### 4. デプロイ

1. Deployボタンをクリック
2. デプロイが完了するまで待機
3. デプロイURLを確認

### 5. デプロイ後の設定

1. **LINE Webhook URLの更新**
   - LINE Developers Console > Webhook URL
   - `https://your-vercel-app.vercel.app/api/line/webhook` を設定

2. **Supabase Edge Functionsのデプロイ**
   ```bash
   supabase link --project-ref your-project-ref
   supabase functions deploy calculate-numerology
   supabase functions deploy calculate-random
   ```

## Supabase Edge Functionsのデプロイ

### 1. Supabase CLIのインストール

```bash
npm install -g supabase
```

### 2. プロジェクトのリンク

```bash
supabase login
supabase link --project-ref your-project-ref
```

### 3. Edge Functionsのデプロイ

```bash
supabase functions deploy calculate-numerology
supabase functions deploy calculate-random
```

### 4. 環境変数の設定

Supabase Dashboard > Edge Functions > Settings で環境変数を設定

## トラブルシューティング

### ビルドエラー

- **TypeScriptエラー**: `tsconfig.json`の設定を確認
- **依存関係エラー**: `package.json`の依存関係を確認
- **環境変数エラー**: Vercelの環境変数設定を確認

### ランタイムエラー

- **Supabase接続エラー**: 環境変数を確認
- **LINE Webhookエラー**: Webhook URLと署名検証を確認
- **認証エラー**: Google認証の設定を確認

### パフォーマンス

- **遅いレスポンス**: Edge Functionsの最適化を検討
- **データベースクエリ**: インデックスの確認
- **画像アップロード**: Storageの設定を確認

## 本番環境のチェックリスト

- [ ] 環境変数がすべて設定されている
- [ ] Supabaseマイグレーションが実行されている
- [ ] Storageバケットが作成されている
- [ ] Edge Functionsがデプロイされている
- [ ] LINE Webhook URLが設定されている
- [ ] Google認証が設定されている
- [ ] エラーログの監視が設定されている
- [ ] バックアップが設定されている

## セキュリティチェックリスト

- [ ] RLSポリシーが適切に設定されている
- [ ] 環境変数が適切に保護されている
- [ ] LINE Webhookの署名検証が有効
- [ ] 認証が適切に実装されている
- [ ] データベース接続が安全



