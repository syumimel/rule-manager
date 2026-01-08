# 占いルール管理システム

LINE公式アカウントを用いた占い提供システム

## 技術スタック

- **Next.js**: 14+ (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (PostgreSQL, Storage, Auth, Edge Functions)
- **Vercel** (デプロイ)

## 機能概要

- ✅ Google認証によるログイン
- ✅ CSVファイルのアップロード・管理（最大6世代）
- ✅ 占いタイプ定義の管理（JSON定義）
- ✅ 返信メッセージテンプレートの事前コンパイル
- ✅ LINE Webhook連携（占い実行・返信）
- ✅ 画像管理（Supabase Storage）
- ✅ 統計情報表示
- ✅ ログ確認

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# LINE
LINE_CHANNEL_ID=your_line_channel_id
LINE_CHANNEL_SECRET=your_line_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
# 注意: トークンの値のみを設定（"Bearer "は付けない）

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Supabaseプロジェクトの設定

1. **Supabaseプロジェクトを作成**
   - [Supabase](https://supabase.com)でプロジェクトを作成

2. **データベースマイグレーションを実行**
   - Supabase Dashboard > SQL Editorで `supabase/migrations/001_initial_schema.sql` を実行

3. **Storageバケットを作成**
   - Storage > New bucket
   - バケット名: `fortune-images`
   - Public bucket: 有効

4. **Google認証を設定**
   - Authentication > Providers > Google
   - Google OAuth認証情報を設定

5. **Edge Functionsをデプロイ**
   ```bash
   # Supabase CLIが必要
   supabase functions deploy calculate-numerology
   supabase functions deploy calculate-random
   ```

### 4. LINE Developers Consoleの設定

1. **LINE Developers Consoleでプロバイダーとチャネルを作成**
   - Messaging APIチャネルを作成
   - Channel IDとChannel Secretを取得

2. **Webhook URLを設定**
   - Webhook URL: `https://your-domain.com/api/line/webhook`
   - Webhookの利用: 有効

3. **Channel Access Tokenを発行**
   - Messaging API設定 > Channel access token > 発行

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## プロジェクト構造

```
rule-manager/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 認証関連ページ
│   │   ├── callback/      # 認証コールバック
│   │   └── login/         # ログイン画面
│   ├── (dashboard)/       # 管理画面
│   │   ├── dashboard/     # ダッシュボード
│   │   ├── rules/         # ルール管理
│   │   ├── images/        # 画像管理
│   │   ├── fortune-types/ # 占いタイプ管理
│   │   ├── message-templates/ # メッセージテンプレート管理
│   │   ├── logs/          # ログ確認
│   │   └── settings/      # 設定
│   └── api/               # API Routes
│       ├── rules/         # ルールAPI
│       ├── images/        # 画像API
│       ├── fortune-types/ # 占いタイプAPI
│       ├── message-templates/ # テンプレートAPI
│       └── line/          # LINE API
│           ├── webhook/   # Webhook受信
│           └── settings/  # LINE設定
├── modules/               # 機能モジュール
│   ├── auth/              # 認証
│   ├── csv-import/        # CSV取込
│   ├── generation/        # 世代管理
│   ├── fortune/           # 占い実行
│   ├── fortune-type/       # 占いタイプ管理
│   ├── image/             # 画像管理
│   ├── line/              # LINE連携
│   └── log/               # ログ
├── lib/                   # 共通ライブラリ
│   └── supabase/          # Supabaseクライアント
├── components/            # Reactコンポーネント
├── supabase/              # Supabase設定
│   ├── migrations/        # データベースマイグレーション
│   └── functions/         # Edge Functions
└── public/                # 静的ファイル
```

## 使い方

### 1. ルールのアップロード

1. ダッシュボード > 占いルール
2. CSVファイルをアップロード（最大4000行、20列）
3. ルール名とカテゴリを入力
4. アップロード実行

### 2. 占いタイプの登録

1. ダッシュボード > 占いタイプ
2. JSON定義をアップロード（`FORTUNE_TYPE_SPEC.md`を参照）
3. 計算関数のパスを指定

### 3. メッセージテンプレートの登録

1. ダッシュボード > メッセージテンプレート
2. JSONテンプレートをアップロード
3. 自動的に検証・コンパイルが実行される

### 4. LINE設定

1. ダッシュボード > 設定
2. Channel IDとChannel Secretを入力
3. Webhook URLをLINE Developers Consoleに設定

## ドキュメント

- [要件定義書](./REQUIREMENTS.md)
- [占いタイプ定義・返信メッセージ仕様書](./FORTUNE_TYPE_SPEC.md)
- [実装進捗状況](./PROGRESS.md)

## 開発状況

主要機能の実装が完了しました。詳細は [PROGRESS.md](./PROGRESS.md) を参照してください。

## ライセンス

このプロジェクトはプライベートプロジェクトです。
