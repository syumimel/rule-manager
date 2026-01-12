# チャット機能デバッグガイド

## 友達一覧が表示されない場合の確認手順

### ステップ1: データベースマイグレーションの実行

**重要**: チャット機能を使用するには、まずデータベースマイグレーションを実行する必要があります。

1. [Supabase Dashboard](https://supabase.com/dashboard)にアクセス
2. プロジェクトを選択
3. **SQL Editor**を開く
4. **New query**をクリック
5. `supabase/migrations/008_create_message_logs_and_chat_settings.sql` の内容をコピーして実行

### ステップ2: マイグレーションが実行されたか確認

Supabase Dashboard > SQL Editor で以下を実行：

```sql
-- テーブルが存在するか確認
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'message_logs'
) AS message_logs_exists;
```

結果が `true` になれば、テーブルは作成されています。

### ステップ3: message_logsテーブルにデータがあるか確認

```sql
-- メッセージログの件数を確認
SELECT COUNT(*) as total_messages FROM public.message_logs;

-- ユーザー数を確認
SELECT COUNT(DISTINCT line_user_id) as unique_users FROM public.message_logs;

-- 最新のメッセージを確認
SELECT * FROM public.message_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

### ステップ4: Webhookが動作しているか確認

#### 4-1. LINE Developers Consoleで設定を確認

1. [LINE Developers Console](https://developers.line.biz/console/)にアクセス
2. チャネルを選択
3. **Messaging API** > **Webhook settings**を確認
4. **Webhook URL**が以下に設定されているか確認：
   ```
   https://unfluked-biramous-mitzie.ngrok-free.dev/api/webhook/line
   ```
5. **Webhook**が「利用可能」になっているか確認

#### 4-2. 環境変数の確認

`.env.local`またはVercelの環境変数で以下が設定されているか確認：

```
LINE_CHANNEL_ID=2008862684
LINE_CHANNEL_SECRET=2837726f19cd8c9d52b2dd54cebdc3e3
LINE_CHANNEL_ACCESS_TOKEN=Rxk2hhY2SX7RO+cD1043pB6tAE3P+p81EkTplS1p/k008uWCks+q2LVkXYtXFZEjaClvC4ZUT18ao3nD0wSdEWEiebf+/3J00nidM6cA9Kj6zq96tAshNTEJxkE7Au8vjZOTpbcdJI0XdIINclMBlgdB04t89/1O/w1cDnyilFU=
```

#### 4-3. Webhookのテスト

1. LINEアプリから、Botにメッセージを送信
2. Supabase Dashboard > Logs > Postgres Logs でエラーを確認
3. 開発サーバーのログでエラーを確認
4. `message_logs`テーブルにデータが追加されているか確認

### ステップ5: ブラウザのコンソールでエラーを確認

1. チャットページ（`/dashboard/chat`）を開く
2. ブラウザの開発者ツール（F12）を開く
3. **Console**タブでエラーメッセージを確認
4. **Network**タブで`/api/chat/threads`のレスポンスを確認

### ステップ6: APIエンドポイントを直接確認

ブラウザのコンソールで以下を実行：

```javascript
fetch('/api/chat/threads')
  .then(res => res.json())
  .then(data => console.log('Threads:', data))
  .catch(err => console.error('Error:', err))
```

## よくある問題と解決方法

### 問題1: マイグレーションが実行されていない

**症状**: 友達一覧が空、エラーログに「relation "message_logs" does not exist」

**解決方法**: `008_create_message_logs_and_chat_settings.sql`を実行

### 問題2: Webhookが動作していない

**症状**: LINEからメッセージを送っても、message_logsテーブルにデータが追加されない

**解決方法**:
- LINE Developers ConsoleでWebhook URLが正しいか確認
- ngrokが起動しているか確認（開発環境の場合）
- Webhook設定で「利用可能」になっているか確認

### 問題3: RLSポリシーの問題

**症状**: APIがエラーを返す、認証エラー

**解決方法**: `008_create_message_logs_and_chat_settings.sql`を再実行

### 問題4: 環境変数が設定されていない

**症状**: Webhookでエラーが発生

**解決方法**: `.env.local`（開発環境）またはVercelの環境変数（本番環境）を確認

## クイックチェック

1. **マイグレーション実行済み**: `009_check_chat_status.sql`を実行して確認
2. **LINEからメッセージ送信**: Botにメッセージを送信
3. **データベース確認**: `message_logs`テーブルにデータが追加されているか確認
4. **ブラウザリロード**: チャットページをリロード




