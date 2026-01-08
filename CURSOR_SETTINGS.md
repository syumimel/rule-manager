# Cursorエディタ設定ガイド

## フォントサイズの変更方法

### 方法1: 設定ファイルで変更（推奨）

プロジェクトに`.vscode/settings.json`ファイルを作成しました。
このファイルでエディタのフォントサイズを設定できます。

現在の設定：
- 通常のエディタ: 12px
- Markdownファイル: 11px
- TypeScript/JavaScript: 12px

### 方法2: 設定UIから変更

1. **設定を開く**
   - `Ctrl + ,` (Windows/Linux) または `Cmd + ,` (Mac)
   - または: File > Preferences > Settings

2. **フォントサイズを検索**
   - 検索バーに「font size」と入力
   - 「Editor: Font Size」を選択

3. **値を変更**
   - デフォルト: 14
   - 推奨: 12（小さめ）または 10（さらに小さく）

### 方法3: キーボードショートカット

- **フォントサイズを小さく**: `Ctrl + -` (Windows/Linux) または `Cmd + -` (Mac)
- **フォントサイズを大きく**: `Ctrl + +` (Windows/Linux) または `Cmd + +` (Mac)
- **フォントサイズをリセット**: `Ctrl + 0` (Windows/Linux) または `Cmd + 0` (Mac)

## その他の便利な設定

### 行の高さを調整

```json
{
  "editor.lineHeight": 1.4  // デフォルトは1.5、より小さくする場合は1.2など
}
```

### フォントファミリーを変更

```json
{
  "editor.fontFamily": "'Fira Code', 'Consolas', monospace"
}
```

### タブサイズを変更

```json
{
  "editor.tabSize": 2  // または 4
}
```

## 設定の適用範囲

- **ワークスペース設定**: `.vscode/settings.json`（このプロジェクトのみ）
- **ユーザー設定**: Cursorの設定UIから変更（すべてのプロジェクトに適用）

## 現在の設定ファイル

`.vscode/settings.json`に以下の設定が含まれています：

- エディタフォントサイズ: 12px
- Markdownフォントサイズ: 11px
- 行の高さ: 1.5
- タブサイズ: 2スペース

変更したい場合は、`.vscode/settings.json`を編集してください。



