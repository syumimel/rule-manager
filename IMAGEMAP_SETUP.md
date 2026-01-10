# イメージマップメッセージ機能 セットアップガイド

## 📋 概要

LINE Messaging APIのイメージマップメッセージ機能を実装しました。
ベース画像をアップロードすると、自動的に複数サイズ（240px, 300px, 460px, 700px, 1040px）の画像を生成し、Supabaseストレージに保存します。

## 🚀 セットアップ手順

### 1. データベースマイグレーション

Supabase Dashboard > SQL Editor で以下のマイグレーションを実行してください：

```sql
-- supabase/migrations/013_create_imagemaps.sql の内容を実行
```

### 2. Supabaseストレージバケットの確認

既存の `fortune-images` バケットを使用します。以下の構造で画像が保存されます：

```
fortune-images/
└── imagemap/
    └── {folder_id}/  (例: rm001, rm002)
        ├── 240.jpg
        ├── 300.jpg
        ├── 460.jpg
        ├── 700.jpg
        └── 1040.jpg
```

**バケットが存在しない場合**:
1. Supabase Dashboard > Storage を開く
2. 新しいバケットを作成
3. バケット名: `fortune-images`
4. Public bucket にチェック（LINEから画像にアクセスできるように）

### 3. 環境変数の確認

以下の環境変数が設定されていることを確認してください：

- `NEXT_PUBLIC_SUPABASE_URL`: SupabaseプロジェクトURL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase匿名キー
- `SUPABASE_SERVICE_ROLE_KEY`: Supabaseサービスロールキー（画像アップロードに必要）

### 4. 依存関係の確認

以下のパッケージがインストールされていることを確認してください：

```bash
npm install sharp @types/sharp
```

## 📁 実装されたファイル

### データベース
- `supabase/migrations/013_create_imagemaps.sql`: イメージマップテーブル作成

### ライブラリ
- `lib/imagemap/types.ts`: 型定義
- `lib/imagemap/uploader.ts`: 画像アップロード・リサイズ処理（sharp使用）
- `lib/imagemap/manager.ts`: CRUD操作
- `lib/imagemap/utils.ts`: ユーティリティ関数（LINE形式変換）

### APIエンドポイント
- `app/api/imagemap/[...path]/route.ts`: 画像プロキシAPI（LINEがアクセス）
- `app/api/imagemaps/route.ts`: イメージマップ一覧・作成API
- `app/api/imagemaps/[id]/route.ts`: イメージマップ詳細・更新・削除API
- `app/api/imagemaps/upload/route.ts`: 画像アップロードAPI

### フロントエンド
- `app/dashboard/imagemaps/page.tsx`: イメージマップ管理画面
- `app/dashboard/chat/page.tsx`: チャット画面（イメージマップ送信機能追加）
- `components/DashboardNav.tsx`: ナビゲーション（イメージマップメニュー追加）

## 🎯 使い方

### 1. イメージマップを登録

1. ダッシュボード > イメージマップ を開く
2. 「新規登録」をクリック
3. 以下の情報を入力：
   - **フォルダーID**: 例 `rm001`（英数字とハイフンのみ）
   - **ベース画像**: 1040px幅推奨
   - **名前**: イメージマップ名
   - **代替テキスト**: altText
   - **幅・高さ**: 自動検出されるが、手動で変更可能
4. 「画像をアップロード（複数サイズ生成）」をクリック
   - 240px, 300px, 460px, 700px, 1040px の画像が自動生成されます
5. **アクション**を設定（オプション）：
   - メッセージアクション: タップでメッセージを送信
   - URIアクション: タップでURLを開く
   - エリア（x, y, width, height）を指定
6. 「登録」をクリック

### 2. イメージマップを送信

#### チャット画面から
1. ダッシュボード > チャット を開く
2. 友達を選択
3. 「イメージマップを送信」をクリック
4. 送信したいイメージマップを選択

#### JSON送信フォームから
1. ダッシュボード > チャット を開く
2. JSON送信フォームに以下の形式で入力：

```json
[
  {
    "type": "imagemap",
    "baseUrl": "https://your-domain.com/api/imagemap/rm001",
    "altText": "This is an imagemap",
    "baseSize": {
      "width": 1040,
      "height": 1040
    },
    "actions": [
      {
        "type": "message",
        "text": "詳細を見る",
        "area": {
          "x": 0,
          "y": 0,
          "width": 520,
          "height": 1040
        }
      },
      {
        "type": "uri",
        "linkUri": "https://example.com/",
        "area": {
          "x": 520,
          "y": 0,
          "width": 520,
          "height": 1040
        }
      }
    ]
  }
]
```

## 🔧 技術的な仕組み

### 画像プロキシAPI

LINEのイメージマップは、`baseUrl`に対して以下のように自動リクエストします：

```
{baseUrl}/1040  → 幅1040pxの画像
{baseUrl}/700   → 幅700pxの画像
{baseUrl}/460   → 幅460pxの画像
{baseUrl}/300   → 幅300pxの画像
{baseUrl}/240   → 幅240pxの画像
```

Next.js APIルート `/api/imagemap/[...path]` がこのリクエストをインターセプトし、Supabaseストレージから適切なサイズの画像を取得して返却します。

### 画像生成

`sharp`ライブラリを使用して、元画像から複数サイズの画像を自動生成します。
アスペクト比を維持しながら、各サイズの画像を生成します。

## 🚨 注意点

1. **HTTPS必須**: LINEはHTTPSのURLのみ受け付けます（Vercel等でデプロイしてください）
2. **baseUrl自動生成**: デプロイ環境に応じて自動的に生成されます
   - Vercel: `https://${VERCEL_URL}/api/imagemap/{folder_id}`
   - カスタムドメイン: `https://your-domain.com/api/imagemap/{folder_id}`
   - 開発環境: `http://localhost:3000/api/imagemap/{folder_id}`
3. **画像サイズ**: 元画像は1040px幅で用意することを推奨します
4. **ストレージ容量**: 1つのイメージマップで5枚の画像が生成されるため、ストレージ容量に注意してください

## 📝 トラブルシューティング

### 画像が表示されない

1. SupabaseストレージバケットがPublicか確認
2. 画像が正しくアップロードされているか確認（Storage画面で確認）
3. APIルートが正しく動作しているか確認（ブラウザで直接アクセス）

### 複数サイズ生成に失敗する

1. `sharp`が正しくインストールされているか確認
2. `SUPABASE_SERVICE_ROLE_KEY`が正しく設定されているか確認
3. ストレージバケットの権限を確認

### baseUrlが正しくない

1. 環境変数 `NEXT_PUBLIC_APP_URL` または `VERCEL_URL` が設定されているか確認
2. Vercelでデプロイしている場合、自動的に `VERCEL_URL` が設定されます

## 📚 参考資料

- [LINE Messaging API - イメージマップメッセージ](https://developers.line.biz/ja/reference/messaging-api/#imagemap-message)
- [Sharp - 高性能な画像処理ライブラリ](https://sharp.pixelplumbing.com/)

