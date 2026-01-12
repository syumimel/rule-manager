# GitHub → Vercel 公開手順

## ✅ 前提条件

- [x] `.gitignore`が適切に設定されている（環境変数ファイルは除外済み）
- [x] Next.jsプロジェクトが完成している
- [ ] GitHubアカウントを持っている
- [ ] Vercelアカウントを持っている（GitHub連携可能）

## 📋 手順

### ステップ1: GitHubリポジトリの作成

1. [GitHub](https://github.com)にログイン
2. 右上の「+」→「New repository」をクリック
3. リポジトリ情報を入力:
   - Repository name: `rule-manager`（任意の名前）
   - Description: （任意）
   - Public / Private: お好みで選択
   - **「Initialize this repository with a README」はチェックしない**
4. 「Create repository」をクリック
5. 表示されるリポジトリURLをコピー（例: `https://github.com/your-username/rule-manager.git`）

### ステップ2: ローカルでGitリポジトリを初期化

プロジェクトディレクトリで以下を実行:

```bash
cd /home/ubuntu/Dropbox/dev_common/13_開発環境/04_prj/01_google/rule-manager

# Gitリポジトリを初期化
git init

# すべてのファイルをステージング
git add .

# 初回コミット
git commit -m "Initial commit: Rule Manager application"

# ブランチ名をmainに変更（必要に応じて）
git branch -M main

# GitHubリポジトリをリモートとして追加
git remote add origin https://github.com/your-username/rule-manager.git

# GitHubにプッシュ
git push -u origin main
```

**注意**: `your-username/rule-manager.git` の部分を、ステップ1で作成した実際のリポジトリURLに置き換えてください。

### ステップ3: Vercelでプロジェクトをインポート

1. [Vercel](https://vercel.com)にログイン（GitHubアカウントで連携推奨）
2. Dashboard > 「Add New...」→「Project」をクリック
3. 「Import Git Repository」で、作成したGitHubリポジトリを選択
4. プロジェクト設定を確認:
   - **Framework Preset**: Next.js（自動検出されるはず）
   - **Root Directory**: `./`（そのまま）
   - **Build Command**: `npm run build`（自動設定されるはず）
   - **Output Directory**: `.next`（自動設定されるはず）
5. 「Environment Variables」セクションで、以下の環境変数を追加:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
LINE_CHANNEL_ID=your_line_channel_id
LINE_CHANNEL_SECRET=your_line_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_line_access_token
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**重要**: `NEXT_PUBLIC_APP_URL`は、デプロイ後にVercelが提供するURLに更新する必要があります。

6. 「Deploy」ボタンをクリック

### ステップ4: デプロイ後の設定

#### 4-1. デプロイURLを確認

デプロイが完了したら、Vercel Dashboardで表示されるURLを確認（例: `https://rule-manager.vercel.app`）

#### 4-2. 環境変数の更新

1. Vercel Dashboard > Settings > Environment Variables
2. `NEXT_PUBLIC_APP_URL`を実際のデプロイURLに更新:
   ```
   NEXT_PUBLIC_APP_URL=https://your-actual-vercel-url.vercel.app
   ```
3. 「Redeploy」を実行

#### 4-3. Google認証の設定

1. [Google Cloud Console](https://console.cloud.google.com)にアクセス
2. 認証情報 > OAuth 2.0 クライアントIDを編集
3. 「承認済みのリダイレクト URI」に以下を追加:
   ```
   https://your-vercel-app.vercel.app/auth/callback
   ```

#### 4-4. LINE Webhook URLの更新

1. [LINE Developers Console](https://developers.line.biz/console/)にアクセス
2. チャネル設定 > Webhook URL
3. 以下を設定:
   ```
   https://your-vercel-app.vercel.app/api/line/webhook
   ```
4. 「検証」ボタンで動作確認

#### 4-5. Supabase認証の設定

1. Supabase Dashboard > Authentication > URL Configuration
2. 「Site URL」を更新:
   ```
   https://your-vercel-app.vercel.app
   ```
3. 「Redirect URLs」に以下を追加:
   ```
   https://your-vercel-app.vercel.app/auth/callback
   ```

### ステップ5: Supabase Edge Functionsのデプロイ（オプション）

```bash
# Supabase CLIをインストール（未インストールの場合）
npm install -g supabase

# Supabaseにログイン
supabase login

# プロジェクトをリンク
supabase link --project-ref your-project-ref

# Edge Functionsをデプロイ
supabase functions deploy calculate-numerology
supabase functions deploy calculate-random
```

## 🔍 デプロイ後の確認事項

- [ ] アプリケーションが正常に表示される
- [ ] Google認証でログインできる
- [ ] ダッシュボードが表示される
- [ ] LINE Webhookが動作する（テストメッセージを送信）
- [ ] 画像アップロードが動作する
- [ ] ルールのアップロードが動作する

## ⚠️ 注意事項

1. **環境変数の管理**
   - `.env.local`ファイルはGitに含まれない（`.gitignore`で除外済み）
   - Vercelの環境変数は、Settings > Environment Variablesで管理

2. **データベースマイグレーション**
   - Supabase Dashboard > SQL Editorで、`supabase/migrations/`内のSQLファイルを実行済みであることを確認

3. **Storageバケット**
   - Supabase Dashboard > Storageで、`fortune-images`バケットが作成されていることを確認

4. **セキュリティ**
   - `SUPABASE_SERVICE_ROLE_KEY`は機密情報のため、GitHubにプッシュしない
   - Vercelの環境変数は暗号化されて保存される

## 🐛 トラブルシューティング

### ビルドエラーが発生する場合

1. Vercel Dashboard > Deployments > 失敗したデプロイをクリック
2. ビルドログを確認
3. エラーメッセージに基づいて修正

### 環境変数が読み込まれない場合

1. Vercel Dashboard > Settings > Environment Variablesを確認
2. 変数名が正確か確認（大文字小文字も含む）
3. デプロイを再実行

### 認証が動作しない場合

1. Google認証のリダイレクトURIを確認
2. Supabaseの認証設定を確認
3. ブラウザのコンソールでエラーを確認

## 📚 参考資料

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Documentation](https://supabase.com/docs)





