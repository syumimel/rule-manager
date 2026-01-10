# Vercelリダイレクト問題の修正方法

## 問題

VercelでGoogle認証後、`http://localhost:3000/?code=...`にリダイレクトされてしまう。

## 原因

Supabase Dashboardの「Site URL」と「Redirect URLs」が`localhost:3000`のままになっているため。

## 解決方法

### ステップ1: Supabase Dashboardで設定を更新

1. [Supabase Dashboard](https://supabase.com/dashboard)にアクセス
2. プロジェクトを選択
3. **Authentication** → **URL Configuration** を開く

### ステップ2: Site URLを更新

**Site URL**をVercelのURLに変更：

```
https://rule-manager-git-main-syumimels-projects.vercel.app
```

または、カスタムドメインを使用している場合：

```
https://your-custom-domain.com
```

### ステップ3: Redirect URLsを更新

**Redirect URLs**に以下を追加（既存の`localhost:3000`は残しておいてもOK）：

```
https://rule-manager-git-main-syumimels-projects.vercel.app/auth/callback
https://rule-manager-git-main-syumimels-projects.vercel.app/**
```

**完全なRedirect URLsリスト（推奨）:**

```
http://localhost:3000/auth/callback
http://localhost:3000/**
https://rule-manager-git-main-syumimels-projects.vercel.app/auth/callback
https://rule-manager-git-main-syumimels-projects.vercel.app/**
```

これにより、開発環境と本番環境の両方で動作します。

### ステップ4: 保存

「Save」ボタンをクリックして設定を保存。

### ステップ5: 動作確認

1. Vercelのアプリにアクセス
2. 「Googleでログイン」をクリック
3. Google認証後、正しくVercelのURLにリダイレクトされることを確認

## 注意事項

### プロダクションドメインが変更された場合

Vercelでプロダクションドメインが変更された場合（例: カスタムドメインを設定した場合）は、Supabaseの設定も更新する必要があります。

### プレビューデプロイメント

Vercelのプレビューデプロイメント（`*-git-*-*.vercel.app`）を使用する場合、各プレビューURLを追加するか、ワイルドカードを使用できます：

```
https://*.vercel.app/**
```

ただし、セキュリティ上の理由から、特定のURLを指定することを推奨します。

## トラブルシューティング

### まだ`localhost:3000`にリダイレクトされる場合

1. **ブラウザのキャッシュをクリア**
2. **Supabaseの設定を再確認**（保存されているか確認）
3. **Vercelの環境変数を確認**（`NEXT_PUBLIC_SUPABASE_URL`が正しいか）

### リダイレクトループが発生する場合

1. **Redirect URLs**に`/**`が含まれているか確認
2. **Site URL**が正しいか確認
3. **ブラウザのコンソール**でエラーメッセージを確認

## 参考

- [Supabase Auth URL Configuration](https://supabase.com/docs/guides/auth/url-configuration)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)


