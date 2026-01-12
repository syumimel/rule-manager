# ILE (Inline Logic Engine) 実装まとめ

## 概要

LINE Messaging API用のインライン・ロジック・エンジン（ILE）を実装しました。自動返信のJSONメッセージ内に動的ロジックを埋め込み、API送信直前に純粋なJSON配列に変換します。

## 実装ファイル

- `lib/ile/types.ts` - 型定義
- `lib/ile/functions.ts` - ILE関数実装
- `lib/ile/engine.ts` - メインエンジン
- `app/api/line/webhook/route.ts` - 自動返信処理への統合

## 対応機能

### 1. 変数参照
- `${var_name}` - 変数を参照

### 2. 変数セット
- `${set(k, v)}` - 変数をセット（空文字に置換される）

### 3. 乱数生成
- `${rand(min, max)}` - 指定範囲の乱数を生成

### 4. テーブル参照
- `${tbl(generation_id, row_number, field_name)}` - rule_rowsテーブルから値を取得
  - `generation_id`が空文字の場合は最新のアクティブなgeneration_idを使用

### 5. 画像変換
- `${img_conv(prefix, suffix)}` - imagesテーブルから画像URLを取得
  - 画像名は `prefix + suffix` で検索

## 入力形式

### 形式1: __vars__と__messages__を含むオブジェクト

```json
{
  "__vars__": {
    "userName": "田中",
    "row_idx": "${rand(1, 100)}"
  },
  "__messages__": [
    {"type": "text", "text": "こんにちは、${userName}さん！"},
    {"type": "text", "text": "ラッキーナンバーは${row_idx}です✨"}
  ]
}
```

### 形式2: 直接メッセージ配列

```json
[
  {"type": "text", "text": "${set(row_idx, rand(0, 1))}本日の診断を開始します。"},
  {"type": "text", "text": "あなたのラッキーアイテムは…\n【${tbl('', row_idx, 'name')}】"}
]
```

## 処理フロー

1. `processILEMessages`関数が入力JSONを受け取る
2. `__vars__`がある場合は先に評価して変数コンテキストに保存
3. `__messages__`（または直接配列）を再帰的に走査
4. 各文字列値内の`${...}`式を評価
5. 関数呼び出しは再帰的に評価（引数内の`${}`も処理）
6. 純粋なLINE API JSON形式の配列を返す

## エラーハンドリング

- 変数未定義 → 空文字
- テーブル/行/フィールドが存在しない → 空文字
- 関数の引数が不正 → 空文字
- すべてエラーログを出力（コンソール）

## 自動返信への統合

`app/api/line/webhook/route.ts`の自動返信処理で、`reply_type === 'json'`の場合にILEエンジンで処理されます。

## 注意事項

- `set`関数の戻り値は空文字になる（副作用の不可視化）
- 変数コンテキストはメッセージ配列全体で共有される
- `tbl`関数の`generation_id`が空文字の場合は最新のアクティブなgeneration_idを使用
- 再帰的評価をサポート（関数の引数内に変数や関数呼び出しを含められる）



