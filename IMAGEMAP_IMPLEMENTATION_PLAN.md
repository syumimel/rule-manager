# LINEイメージマップメッセージ実装計画

## 📋 要件整理

### 目標
- Next.js + SupabaseストレージでLINEのイメージマップメッセージを実装
- フォルダー単位で画像を管理（例: `rm001`, `rm002`）
- 各フォルダー内に拡張子なしのサイズ別画像（300, 700, 1040など）を配置
- LINE Messaging APIのイメージマップメッセージ形式に対応

### 技術的な課題
LINEのイメージマップでは、`baseUrl`に対して以下のように自動リクエストします：
```
{baseUrl}/1040  → 幅1040pxの画像
{baseUrl}/700   → 幅700pxの画像
{baseUrl}/460   → 幅460pxの画像
{baseUrl}/300   → 幅300pxの画像
{baseUrl}/240   → 幅240pxの画像
```

**問題点**: Supabaseストレージは通常ファイルに拡張子が必要で、このような「拡張子なしのパス」を直接サポートしていません。

### 解決策
**Next.js APIルートでプロキシする方法（推奨）**

```
LINE Server
  ↓ GET {baseUrl}/1040
Next.js API Route (/api/imagemap/[...path])
  ↓ パス解析: folder=rm001, size=1040
Supabase Storage (imagemap/rm001/1040.jpg)
  ↓ 画像データ取得
Next.js API Route
  ↓ Content-Type: image/jpeg で返却
LINE Server
```

## 🏗️ 実装計画

### フェーズ1: インフラストラクチャ

#### 1.1 Supabaseストレージバケットの確認・設定
- [ ] バケット `fortune-images` または新規バケット `line-images` を作成
- [ ] ストレージポリシーの設定（公開読み取り）
- [ ] ディレクトリ構造の確認
  ```
  line-images/
  └── imagemap/
      └── {folder_id}/  (例: rm001, rm002)
          ├── 240.jpg
          ├── 300.jpg
          ├── 460.jpg
          ├── 700.jpg
          └── 1040.jpg
  ```

#### 1.2 データベーススキーマ設計
- [ ] `imagemaps` テーブルの作成
  - `id` (UUID)
  - `fortune_teller_id` (UUID) - 占い師ID
  - `folder_id` (TEXT) - フォルダーID（例: rm001）
  - `name` (TEXT) - イメージマップ名
  - `base_url` (TEXT) - baseUrl（自動生成）
  - `alt_text` (TEXT) - altText
  - `base_width` (INTEGER) - baseSize.width
  - `base_height` (INTEGER) - baseSize.height
  - `actions` (JSONB) - actions配列
  - `video` (JSONB) - video設定（オプション）
  - `is_active` (BOOLEAN)
  - `created_at`, `updated_at`

### フェーズ2: バックエンド実装

#### 2.1 Next.js APIルート（プロキシ）
- [ ] `/api/imagemap/[...path]/route.ts` の実装
  - パス解析: `/api/imagemap/{folder}/{size}` → `{folder}`, `{size}`
  - サイズのバリデーション（240, 300, 460, 700, 1040）
  - Supabaseストレージから画像取得
  - 適切なContent-Typeヘッダーで返却
  - エラーハンドリング（404, 500）
  - キャッシュヘッダーの設定

#### 2.2 画像アップロード・処理ライブラリ
- [ ] `lib/imagemap/uploader.ts` の実装
  - 元画像から複数サイズを生成（sharp使用）
  - Supabaseストレージへ一括アップロード
  - アスペクト比を維持してリサイズ
  - サポートサイズ: 240, 300, 460, 700, 1040px

#### 2.3 イメージマップ管理ライブラリ
- [ ] `lib/imagemap/manager.ts` の実装
  - CRUD操作
  - baseUrlの自動生成
  - actions/video設定の検証

### フェーズ3: APIエンドポイント

#### 3.1 イメージマップ管理API
- [ ] `GET /api/imagemaps` - 一覧取得
- [ ] `POST /api/imagemaps` - 新規作成
  - 画像アップロード
  - 複数サイズ生成
  - データベース保存
- [ ] `GET /api/imagemaps/[id]` - 詳細取得
- [ ] `PUT /api/imagemaps/[id]` - 更新
- [ ] `DELETE /api/imagemaps/[id]` - 削除

#### 3.2 画像アップロードAPI
- [ ] `POST /api/imagemaps/upload` - 画像アップロード
  - フォルダーID指定
  - 複数サイズ自動生成
  - ストレージへの保存

### フェーズ4: フロントエンド実装

#### 4.1 イメージマップ管理画面
- [ ] `/dashboard/imagemaps/page.tsx`
  - 一覧表示
  - 新規登録フォーム
    - フォルダーID入力
    - 画像アップロード
    - baseSize設定（width, height）
    - altText入力
    - actions設定（URI/メッセージアクション）
    - video設定（オプション）
  - 編集・削除機能
  - プレビュー機能

#### 4.2 イメージマップ送信機能
- [ ] チャット画面からイメージマップ送信
  - イメージマップ選択
  - 送信ボタン
- [ ] JSON送信フォームでのイメージマップ送信
  - イメージマップ選択UI
  - JSON自動生成

#### 4.3 ナビゲーション
- [ ] DashboardNavに「イメージマップ」メニューを追加

### フェーズ5: テスト・検証

#### 5.1 動作確認
- [ ] 画像アップロードが正常に動作するか
- [ ] 複数サイズが正しく生成されるか
- [ ] APIルートで画像が正しく返却されるか
- [ ] LINEでイメージマップメッセージが正常に表示されるか
- [ ] アクション（URI/メッセージ）が正常に動作するか

#### 5.2 パフォーマンステスト
- [ ] 画像取得のレスポンスタイム
- [ ] キャッシュの効果
- [ ] 複数サイズ生成の処理時間

## 📁 ファイル構成

```
rule-manager/
├── app/
│   ├── api/
│   │   ├── imagemap/
│   │   │   └── [...path]/
│   │   │       └── route.ts          # プロキシAPI
│   │   └── imagemaps/
│   │       ├── route.ts              # 一覧・作成
│   │       ├── [id]/
│   │       │   └── route.ts          # 詳細・更新・削除
│   │       └── upload/
│   │           └── route.ts          # 画像アップロード
│   └── dashboard/
│       └── imagemaps/
│           └── page.tsx              # 管理画面
├── lib/
│   └── imagemap/
│       ├── manager.ts                # CRUD操作
│       ├── uploader.ts               # 画像アップロード・リサイズ
│       └── types.ts                  # 型定義
└── supabase/
    └── migrations/
        └── 013_create_imagemaps.sql  # データベーススキーマ
```

## 🔧 技術スタック

- **フレームワーク**: Next.js 14
- **ストレージ**: Supabase Storage
- **画像処理**: sharp
- **データベース**: Supabase PostgreSQL
- **LINE API**: LINE Messaging API

## 📝 実装の優先順位

1. **最優先**: Next.js APIルート（プロキシ）の実装
   - これがないと、LINEから画像を取得できない
   
2. **優先**: 画像アップロード・処理ライブラリ
   - 複数サイズの生成とSupabaseへの保存

3. **次**: データベーススキーマ
   - イメージマップ設定の管理

4. **次**: 管理画面
   - ユーザーが簡単にイメージマップを登録できるように

5. **最後**: 送信機能
   - チャット画面からイメージマップを送信

## 🚨 注意点

1. **HTTPS必須**: LINEはHTTPSのURLのみ受け付けます
2. **Content-Type**: `image/jpeg` または `image/png` を正しく返す必要があります
3. **レスポンス速度**: Supabaseからの取得にキャッシュを活用してください
4. **画像サイズ**: 元画像は1040px幅で用意し、それを縮小する形が理想的
5. **baseUrl**: デプロイ環境に応じて動的に生成する必要があります
   - 開発: `http://localhost:3000/api/imagemap/{folder_id}`
   - 本番: `https://your-domain.com/api/imagemap/{folder_id}`

## 📚 参考資料

- [LINE Messaging API - イメージマップメッセージ](https://developers.line.biz/ja/reference/messaging-api/#imagemap-message)
- 動作確認済みの例: `https://seminarjyoho.xsrv.jp/yahagiya/200`




