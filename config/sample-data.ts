/**
 * サンプルデータ（テスト・開発用）
 */

export const sampleFortuneTypeDefinition = {
  fortune_type_id: 'numerology',
  name: '数秘術',
  description: '生年月日から数値を計算して運勢を占う',
  category: '数秘',
  calculation_function: 'supabase/functions/calculate-numerology',
  input_format: {
    birth_date: 'YYYYMMDD形式の生年月日',
  },
  output_format: {
    result_value: '1-9の数値（ライフパスナンバー）',
  },
  message_template_id: 'numerology-template-001',
  is_active: true,
  metadata: {
    author: 'admin',
    version: '1.0.0',
  },
}

export const sampleMessageTemplate = {
  template_id: 'numerology-template-001',
  fortune_type_id: 'numerology',
  name: '数秘術 基本テンプレート',
  description: '数秘術の基本的な返信メッセージ',
  templates: [
    {
      result_value: 1,
      messages: [
        {
          type: 'text',
          content: {
            text: 'あなたの数秘は「1」です。\nリーダーシップの数字です。',
          },
        },
        {
          type: 'text',
          content: {
            text: '今月の運勢は、新しいスタートの時期です。\n積極的に行動することで、良い結果が得られるでしょう。',
          },
        },
        {
          type: 'text',
          content: {
            text: '恋愛運: ★★★★☆\n仕事運: ★★★★★\n健康運: ★★★☆☆',
          },
        },
        {
          type: 'text',
          content: {
            text: 'アドバイス: 直感を信じて、新しい挑戦をしてみましょう。',
          },
        },
      ],
    },
    {
      result_value: 2,
      messages: [
        {
          type: 'text',
          content: {
            text: 'あなたの数秘は「2」です。\n協調性とバランスの数字です。',
          },
        },
        {
          type: 'text',
          content: {
            text: '今月の運勢は、パートナーシップが鍵となります。\n周囲との協力で大きな成果が得られるでしょう。',
          },
        },
        {
          type: 'text',
          content: {
            text: '恋愛運: ★★★★★\n仕事運: ★★★★☆\n健康運: ★★★★☆',
          },
        },
        {
          type: 'text',
          content: {
            text: 'アドバイス: 一人で抱え込まず、周囲に相談してみましょう。',
          },
        },
      ],
    },
    // 3-9まで同様に定義可能
  ],
  validation: {
    required_message_count: {
      min: 4,
      max: 5,
    },
    check_image_existence: true,
  },
}

export const sampleCSV = `カード名,意味,アドバイス,運勢
愚者,新しい始まり,直感を信じて行動,大吉
魔術師,創造力と意志,目標を明確に,中吉
女教皇,直感と内面の知恵,静かに考える時間を,小吉
女帝,豊かさと母性,自然に任せる,大吉
皇帝,権威と秩序,計画を立てて実行,中吉`



