# ngrokとLINEイメージマップメッセージのトラブルシューティング

## 問題

LINE APIでイメージマップメッセージを送信すると、「読み込めませんでした」と表示される問題。

ブラウザでは画像が正常に表示されるが、LINEサーバーからアクセスすると読み込めない。

## 原因

ngrokの無料版は、最初のアクセス時に**警告ページ**を表示することがあります。この警告ページはHTMLを返すため、LINEサーバーが画像として認識できません。

## 解決方法

### 方法1: ngrokの警告ページをスキップ（推奨）

ngrokを起動する際に、警告ページをスキップするヘッダーを追加します：

```bash
ngrok http 3000 --request-header-add "ngrok-skip-browser-warning: true"
```

ただし、これはngrokクライアント側の設定であり、サーバー側から制御できません。

### 方法2: ngrokの有料版を使用

ngrokの有料版では、警告ページを無効にできます。

### 方法3: カスタムドメインを使用

ngrokのカスタムドメインを設定すると、警告ページが表示されにくくなります。

### 方法4: レスポンスヘッダーを確認

実際にLINEサーバーがどのようなレスポンスを受け取っているか確認するため、ログを追加しました。

## 実装した改善点

1. **適切なレスポンスヘッダーの追加**
   - `Content-Length`: 画像サイズを明示
   - `Accept-Ranges`: バイトリクエストを許可
   - `Access-Control-Allow-Origin`: CORS対応
   - `X-Content-Type-Options`: MIMEタイプスニッフィングを防止

2. **画像フォーマットの検証**
   - JPEGのマジックナンバーをチェック
   - HTMLやテキストが返されていないか確認

3. **エラーログの改善**
   - より詳細なエラー情報をログに記録

## デバッグ方法

### 1. 実際のレスポンスを確認

以下のコマンドで、LINEサーバーと同じようにリクエストを送信してレスポンスを確認：

```bash
curl -I https://unfluked-biramous-mitzie.ngrok-free.dev/api/imagemap/rm02/1040
```

レスポンスがHTML（ngrokの警告ページ）を返している場合：
```
Content-Type: text/html
```

画像を返している場合：
```
Content-Type: image/jpeg
```

### 2. User-Agentを変更してテスト

LINEのUser-Agentでリクエストを送信：

```bash
curl -H "User-Agent: LINE/1.0" https://unfluked-biramous-mitzie.ngrok-free.dev/api/imagemap/rm02/1040 -o test.jpg
file test.jpg
```

`test.jpg`がHTMLファイルの場合、ngrokの警告ページが返されています。

### 3. ngrokの設定を確認

ngrokの設定ファイル（`~/.ngrok2/ngrok.yml`）で警告ページを無効にできないか確認。

## 推奨される解決策

**最も確実な解決策は、ngrokではなく本番環境（Vercel等）を使用することです。**

ngrokは開発・テスト用途には便利ですが、LINE APIのような外部サービスとの連携では以下の問題があります：

1. 警告ページが表示される
2. URLがランダムに変わる
3. 無料版では接続数や帯域に制限がある

### Vercelへのデプロイ

1. GitHubにプッシュ
2. Vercelでプロジェクトをインポート
3. 環境変数を設定
4. デプロイ

これにより、安定したHTTPS URLが得られ、LINE APIと正常に連携できます。

## 一時的な回避策

ngrokを使い続ける場合、以下の設定を試してください：

1. **ngrokの設定ファイルを編集**:
   ```yaml
   # ~/.ngrok2/ngrok.yml
   version: "2"
   authtoken: YOUR_TOKEN
   tunnels:
     web:
       proto: http
       addr: 3000
       inspect: false  # インスペクターを無効化
   ```

2. **ngrokの起動時に設定を指定**:
   ```bash
   ngrok http 3000 --config ~/.ngrok2/ngrok.yml
   ```

ただし、無料版では警告ページを完全に無効化することは難しい場合があります。

## 参考リンク

- [ngrok Documentation](https://ngrok.com/docs)
- [LINE Messaging API - Imagemap Message](https://developers.line.biz/ja/reference/messaging-api/#imagemap-message)


