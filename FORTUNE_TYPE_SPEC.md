# 占いタイプ定義・返信メッセージ仕様書

## 概要

占いのルール、内容、表示形式をプログラム変更なしに追加できる仕組みの詳細仕様です。

---

## 1. 占いタイプ定義（JSON）

### 1.1 スキーマ

```json
{
  "fortune_type_id": "string (required, unique)",
  "name": "string (required)",
  "description": "string (optional)",
  "category": "string (optional)",
  "calculation_function": "string (required)",
  "input_format": {
    "field_name": "format_description"
  },
  "output_format": {
    "result_value": "type_description",
    "additional_values": "type_description (optional)"
  },
  "message_template_id": "string (required)",
  "is_active": "boolean (default: true)",
  "metadata": {
    "author": "string (optional)",
    "version": "string (optional)"
  }
}
```

### 1.2 フィールド説明

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `fortune_type_id` | string | ✓ | 占いタイプの一意識別子（英数字、アンダースコア、ハイフンのみ） |
| `name` | string | ✓ | 占いタイプの表示名 |
| `description` | string | - | 占いタイプの説明 |
| `category` | string | - | カテゴリ（例: "数秘", "四柱推命", "タロット"） |
| `calculation_function` | string | ✓ | 計算ロジックのパス（Edge FunctionsまたはAPIエンドポイント） |
| `input_format` | object | ✓ | 入力データの形式定義 |
| `output_format` | object | ✓ | 出力データの形式定義（数値化された結果） |
| `message_template_id` | string | ✓ | 紐付ける返信メッセージテンプレートのID |
| `is_active` | boolean | - | 有効/無効フラグ（デフォルト: true） |
| `metadata` | object | - | メタデータ（作成者、バージョンなど） |

### 1.3 計算関数の仕様

**関数の呼び出し方法**:
- Supabase Edge Functions: `supabase/functions/{function_name}`
- 外部API: `https://{domain}/api/fortune/calculate/{function_name}`

**入力形式**:
```json
{
  "fortune_type_id": "numerology",
  "input_data": {
    "birth_date": "19900101"
  },
  "rule_generation_id": "uuid"
}
```

**出力形式**:
```json
{
  "result_value": 5,
  "additional_values": {
    "life_path": 5,
    "expression": 3
  }
}
```

**必須出力**:
- `result_value`: 数値（返信メッセージの選択に使用）

### 1.4 定義例

#### 例1: 数秘術

```json
{
  "fortune_type_id": "numerology",
  "name": "数秘術",
  "description": "生年月日から数値を計算して運勢を占う",
  "category": "数秘",
  "calculation_function": "supabase/functions/calculate-numerology",
  "input_format": {
    "birth_date": "YYYYMMDD形式の生年月日"
  },
  "output_format": {
    "result_value": "1-9の数値（ライフパスナンバー）"
  },
  "message_template_id": "numerology-template-001",
  "is_active": true,
  "metadata": {
    "author": "admin",
    "version": "1.0.0"
  }
}
```

#### 例2: タロットカード（乱数型）

```json
{
  "fortune_type_id": "tarot-single",
  "name": "タロット1枚引き",
  "description": "78枚のタロットカードから1枚を引く",
  "category": "タロット",
  "calculation_function": "supabase/functions/calculate-random",
  "input_format": {
    "no_input": "入力不要（乱数生成）"
  },
  "output_format": {
    "result_value": "1-78の数値（カード番号）"
  },
  "message_template_id": "tarot-single-template-001",
  "is_active": true
}
```

#### 例3: 四柱推命

```json
{
  "fortune_type_id": "four-pillars",
  "name": "四柱推命",
  "description": "生年月日時から命式を算出",
  "category": "四柱推命",
  "calculation_function": "supabase/functions/calculate-four-pillars",
  "input_format": {
    "birth_date": "YYYYMMDD形式の生年月日",
    "birth_time": "HHMM形式の生まれた時間（任意）"
  },
  "output_format": {
    "result_value": "1-60の数値（干支の組み合わせ）",
    "additional_values": {
      "heavenly_stem": "天干（1-10）",
      "earthly_branch": "地支（1-12）"
    }
  },
  "message_template_id": "four-pillars-template-001",
  "is_active": true
}
```

---

## 2. 返信メッセージテンプレート（JSON）

### 2.1 スキーマ

```json
{
  "template_id": "string (required, unique)",
  "fortune_type_id": "string (required)",
  "name": "string (required)",
  "description": "string (optional)",
  "templates": [
    {
      "result_value": "number | string (required)",
      "value_range": {
        "min": "number (optional)",
        "max": "number (optional)"
      },
      "messages": [
        {
          "type": "text | image | imagemap",
          "content": "object (required)"
        }
      ]
    }
  ],
  "default_messages": [
    {
      "type": "text | image | imagemap",
      "content": "object (required)"
    }
  ],
  "validation": {
    "required_message_count": {
      "min": 4,
      "max": 5
    },
    "check_image_existence": true
  }
}
```

### 2.2 メッセージタイプ別のcontent形式

#### 2.2.1 テキストメッセージ

```json
{
  "type": "text",
  "content": {
    "text": "メッセージ本文"
  }
}
```

#### 2.2.2 画像メッセージ

```json
{
  "type": "image",
  "content": {
    "image_id": "uuid (imagesテーブルのID)",
    "alt_text": "画像の説明（任意）"
  }
}
```

#### 2.2.3 イメージマップメッセージ

```json
{
  "type": "imagemap",
  "content": {
    "base_url": "https://example.com/images/{image_id}/",
    "alt_text": "イメージマップの説明",
    "width": 1040,
    "height": 1040,
    "actions": [
      {
        "type": "uri",
        "link_uri": "https://example.com/detail",
        "area": {
          "x": 0,
          "y": 0,
          "width": 520,
          "height": 1040
        }
      }
    ]
  }
}
```

### 2.3 テンプレート例

#### 例1: 数秘術の返信メッセージテンプレート

```json
{
  "template_id": "numerology-template-001",
  "fortune_type_id": "numerology",
  "name": "数秘術 基本テンプレート",
  "description": "数秘術の基本的な返信メッセージ",
  "templates": [
    {
      "result_value": 1,
      "messages": [
        {
          "type": "text",
          "content": {
            "text": "あなたの数秘は「1」です。\nリーダーシップの数字です。"
          }
        },
        {
          "type": "image",
          "content": {
            "image_id": "numerology-1-image-id",
            "alt_text": "数秘1のイメージ"
          }
        },
        {
          "type": "text",
          "content": {
            "text": "今月の運勢は、新しいスタートの時期です。\n積極的に行動することで、良い結果が得られるでしょう。"
          }
        },
        {
          "type": "text",
          "content": {
            "text": "恋愛運: ★★★★☆\n仕事運: ★★★★★\n健康運: ★★★☆☆"
          }
        }
      ]
    },
    {
      "result_value": 2,
      "messages": [
        {
          "type": "text",
          "content": {
            "text": "あなたの数秘は「2」です。\n協調性とバランスの数字です。"
          }
        },
        {
          "type": "image",
          "content": {
            "image_id": "numerology-2-image-id",
            "alt_text": "数秘2のイメージ"
          }
        },
        {
          "type": "text",
          "content": {
            "text": "今月の運勢は、パートナーシップが鍵となります。\n周囲との協力で大きな成果が得られるでしょう。"
          }
        },
        {
          "type": "text",
          "content": {
            "text": "恋愛運: ★★★★★\n仕事運: ★★★★☆\n健康運: ★★★★☆"
          }
        }
      ]
    }
    // ... 3-9まで同様に定義
  ],
  "default_messages": [
    {
      "type": "text",
      "content": {
        "text": "占い結果を取得できませんでした。\nもう一度お試しください。"
      }
    }
  ],
  "validation": {
    "required_message_count": {
      "min": 4,
      "max": 5
    },
    "check_image_existence": true
  }
}
```

#### 例2: タロットカードの返信メッセージテンプレート

```json
{
  "template_id": "tarot-single-template-001",
  "fortune_type_id": "tarot-single",
  "name": "タロット1枚引き 基本テンプレート",
  "templates": [
    {
      "result_value": 1,
      "messages": [
        {
          "type": "text",
          "content": {
            "text": "あなたが引いたカードは「愚者」です。"
          }
        },
        {
          "type": "image",
          "content": {
            "image_id": "tarot-fool-image-id",
            "alt_text": "タロット 愚者"
          }
        },
        {
          "type": "text",
          "content": {
            "text": "新しい始まりと可能性を表すカードです。\n未知の世界への一歩を踏み出す勇気が求められています。"
          }
        },
        {
          "type": "text",
          "content": {
            "text": "アドバイス: 直感を信じて、新しい挑戦をしてみましょう。"
          }
        }
      ]
    }
    // ... 78枚すべてを定義
  ],
  "validation": {
    "required_message_count": {
      "min": 4,
      "max": 5
    },
    "check_image_existence": true
  }
}
```

### 2.4 値範囲指定（数値範囲でのマッピング）

連続する数値範囲を指定する場合:

```json
{
  "result_value": null,
  "value_range": {
    "min": 1,
    "max": 10
  },
  "messages": [
    {
      "type": "text",
      "content": {
        "text": "あなたの運勢は「中吉」です。"
      }
    }
  ]
}
```

---

## 3. 事前検証の仕様

### 3.1 占いタイプ定義の検証

1. **必須フィールドチェック**
   - `fortune_type_id`, `name`, `calculation_function`, `input_format`, `output_format`, `message_template_id`が存在するか

2. **形式チェック**
   - `fortune_type_id`が英数字、アンダースコア、ハイフンのみか
   - `calculation_function`が有効なパスか

3. **参照整合性チェック**
   - `message_template_id`が存在するか

### 3.2 返信メッセージテンプレートの検証

1. **必須フィールドチェック**
   - `template_id`, `fortune_type_id`, `templates`が存在するか

2. **メッセージ数チェック**
   - 各テンプレートのメッセージ数が4〜5ブロックか

3. **数値範囲の網羅性チェック**
   - 占いタイプの`output_format.result_value`の全範囲に対応するテンプレートがあるか
   - 例: 数秘術（1-9）の場合、1〜9すべてに対応するテンプレートがあるか

4. **画像IDの存在確認**
   - `image_id`が指定されている場合、`images`テーブルに存在するか

5. **メッセージ形式チェック**
   - 各メッセージの`type`と`content`の形式が正しいか

### 3.3 検証エラーの例

```json
{
  "validation_result": {
    "is_valid": false,
    "errors": [
      {
        "type": "missing_template",
        "message": "result_value 5に対応するテンプレートが存在しません",
        "fortune_type_id": "numerology",
        "missing_value": 5
      },
      {
        "type": "invalid_message_count",
        "message": "result_value 3のメッセージ数が3ブロックです（4-5ブロック必要）",
        "template_id": "numerology-template-001",
        "result_value": 3,
        "message_count": 3
      },
      {
        "type": "image_not_found",
        "message": "画像ID 'invalid-image-id' が存在しません",
        "template_id": "numerology-template-001",
        "result_value": 1,
        "image_id": "invalid-image-id"
      }
    ]
  }
}
```

---

## 4. データベース設計

### 4.1 fortune_typesテーブル

```sql
CREATE TABLE fortune_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fortune_teller_id UUID NOT NULL REFERENCES auth.users(id),
  fortune_type_id VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  definition JSONB NOT NULL,
  calculation_function_path VARCHAR(500) NOT NULL,
  message_template_id VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_fortune_type_per_teller UNIQUE (fortune_teller_id, fortune_type_id)
);
```

### 4.2 fortune_message_templatesテーブル

```sql
CREATE TABLE fortune_message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id VARCHAR(100) NOT NULL UNIQUE,
  fortune_type_id VARCHAR(100) NOT NULL REFERENCES fortune_types(fortune_type_id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_config JSONB NOT NULL,
  validation_result JSONB,
  is_validated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4.3 fortune_message_mappingsテーブル（事前コンパイル結果）

```sql
CREATE TABLE fortune_message_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id VARCHAR(100) NOT NULL REFERENCES fortune_message_templates(template_id),
  result_value INTEGER NOT NULL,
  messages JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (template_id, result_value)
);
```

**事前コンパイル処理**:
1. テンプレートJSONをアップロード
2. 検証を実行
3. 各`result_value`に対応するメッセージを`fortune_message_mappings`テーブルに保存
4. 占い実行時はこのテーブルから直接取得（高速化）

---

## 5. 実装フロー

### 5.1 占いタイプの追加フロー

1. **定義ファイルの準備**
   - JSON定義ファイルを作成
   - 計算関数を実装（Edge FunctionsまたはAPI）

2. **管理画面でアップロード**
   - 占いタイプ定義JSONをアップロード
   - システムが検証を実行

3. **返信メッセージテンプレートの登録**
   - テンプレートJSONをアップロード
   - 事前検証を実行

4. **事前コンパイル**
   - テンプレートを`fortune_message_mappings`に展開
   - 検証結果を保存

5. **有効化**
   - 占いタイプを有効化
   - LINEで利用可能になる

### 5.2 占い実行フロー

1. LINE Webhook受信
2. 占いタイプを特定
3. 計算関数を呼び出し（外部）
4. `result_value`を取得
5. `fortune_message_mappings`からメッセージを取得（事前コンパイル済み）
6. LINE返信JSONを生成（動的生成なし）
7. Reply APIで返信

---

## 6. 計算関数の実装例

### 6.1 Supabase Edge Function例（数秘術）

```typescript
// supabase/functions/calculate-numerology/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { fortune_type_id, input_data, rule_generation_id } = await req.json()

  // 生年月日から数秘を計算
  const birthDate = input_data.birth_date // "19900101"
  const digits = birthDate.split('').map(Number)
  let sum = digits.reduce((a, b) => a + b, 0)
  
  // 1桁になるまで計算
  while (sum > 9) {
    sum = sum.toString().split('').map(Number).reduce((a, b) => a + b, 0)
  }

  return new Response(
    JSON.stringify({
      result_value: sum,
      additional_values: {
        life_path: sum
      }
    }),
    { headers: { "Content-Type": "application/json" } }
  )
})
```

---

## 7. 注意事項

1. **数値化の一貫性**
   - 占い結果は必ず数値（または数値の組み合わせ）に変換する
   - 文字列結果の場合は数値にマッピングする仕組みが必要

2. **テンプレートの網羅性**
   - 全数値範囲に対応するテンプレートを定義する
   - 未定義の数値が来た場合は`default_messages`を使用

3. **計算関数のエラーハンドリング**
   - 計算関数がエラーを返した場合の処理を定義
   - タイムアウト処理（例: 5秒）

4. **パフォーマンス**
   - 事前コンパイルにより、占い実行時の処理を最小化
   - `fortune_message_mappings`テーブルにインデックスを設定

---

以上



