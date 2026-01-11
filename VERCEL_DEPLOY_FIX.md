# Vercelデプロイ成功ガイド

## 🔍 エラーの確認方法

### ステップ1: ビルドログを確認

1. Vercel Dashboard > rule-manager プロジェクト
2. 「Build Logs」ボタンをクリック
3. エラーメッセージを確認

### ステップ2: よくあるエラーと解決方法

## ❌ エラー1: 環境変数が設定されていない

**エラーメッセージ例:**
```
Error: Missing Supabase environment variables
```

**解決方法:**
1. Vercel Dashboard > Settings > Environment Variables
2. 以下の環境変数を追加:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
LINE_CHANNEL_ID=your_line_channel_id
LINE_CHANNEL_SECRET=your_line_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_line_access_token
```

3. 「Redeploy」を実行

## ❌ エラー2: TypeScript/ビルドエラー

**エラーメッセージ例:**
```
Type error: ...
```

**解決方法:**
1. ローカルでビルドを実行して確認:
```bash
npm run build
```

2. エラーを修正
3. コミット・プッシュ:
```bash
git add .
git commit -m "Fix: エラー内容"
git push
```

## ❌ エラー3: 依存関係の問題

**エラーメッセージ例:**
```
Module not found: ...
```

**解決方法:**
1. `package.json`を確認
2. 依存関係を再インストール:
```bash
npm install
```

3. コミット・プッシュ

## ✅ デプロイ成功の確認

デプロイが成功すると:
- 「Production Deployment」セクションに緑のチェックマークが表示される
- 「Visit」ボタンが有効になる
- デプロイURLが表示される（例: `https://rule-manager.vercel.app`）

## 🔄 再デプロイの方法

### 方法1: 自動再デプロイ
- GitHubにプッシュすると自動的に再デプロイされます

### 方法2: 手動再デプロイ
1. Vercel Dashboard > Deployments
2. 最新のデプロイを選択
3. 「Redeploy」をクリック

### 方法3: 環境変数変更後の再デプロイ
1. Settings > Environment Variables で変更
2. 自動的に再デプロイが開始されます

## 📋 デプロイ前チェックリスト

- [ ] ローカルで `npm run build` が成功する
- [ ] 環境変数がすべて設定されている
- [ ] TypeScriptエラーがない
- [ ] `.gitignore`に`.env.local`が含まれている（機密情報を保護）

## 🚀 デプロイ後の設定

デプロイが成功したら:

1. **デプロイURLを確認**
   - Vercel Dashboardで表示されるURL（例: `https://rule-manager-xxx.vercel.app`）

2. **Google認証の設定**
   - Google Cloud Console > OAuth 2.0 クライアントID
   - リダイレクトURI: `https://your-app.vercel.app/auth/callback`

3. **LINE Webhookの設定**
   - LINE Developers Console > Webhook URL
   - `https://your-app.vercel.app/api/line/webhook`

4. **Supabase認証の設定**
   - Supabase Dashboard > Authentication > URL Configuration
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/auth/callback`



