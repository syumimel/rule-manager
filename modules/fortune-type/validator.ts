import { FortuneTypeDefinition, FortuneTypeValidationResult, MessageTemplateDefinition, MessageTemplateValidationResult } from './types'
import { createClient } from '@/lib/supabase/server'

export async function validateFortuneTypeDefinition(
  definition: FortuneTypeDefinition
): Promise<FortuneTypeValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // 必須フィールドチェック
  if (!definition.fortune_type_id) {
    errors.push('fortune_type_idが指定されていません')
  } else if (!/^[a-zA-Z0-9_-]+$/.test(definition.fortune_type_id)) {
    errors.push('fortune_type_idは英数字、アンダースコア、ハイフンのみ使用可能です')
  }

  if (!definition.name) {
    errors.push('nameが指定されていません')
  }

  if (!definition.calculation_function) {
    errors.push('calculation_functionが指定されていません')
  }

  if (!definition.input_format || Object.keys(definition.input_format).length === 0) {
    errors.push('input_formatが指定されていません')
  }

  if (!definition.output_format || !definition.output_format.result_value) {
    errors.push('output_format.result_valueが指定されていません')
  }

  if (!definition.message_template_id) {
    errors.push('message_template_idが指定されていません')
  }

  // 計算関数のパス形式チェック
  if (definition.calculation_function) {
    if (
      !definition.calculation_function.startsWith('supabase/functions/') &&
      !definition.calculation_function.startsWith('http://') &&
      !definition.calculation_function.startsWith('https://')
    ) {
      warnings.push('calculation_functionは有効なパスまたはURL形式であることを確認してください')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

export async function validateMessageTemplate(
  template: MessageTemplateDefinition,
  fortuneTypeId?: string
): Promise<MessageTemplateValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []
  const missingValues: number[] = []
  const invalidMessageCounts: Array<{ result_value: number | string; count: number }> = []
  const missingImages: Array<{ result_value: number | string; image_id: string }> = []

  // 必須フィールドチェック
  if (!template.template_id) {
    errors.push('template_idが指定されていません')
  }

  if (!template.fortune_type_id) {
    errors.push('fortune_type_idが指定されていません')
  }

  if (!template.templates || template.templates.length === 0) {
    errors.push('templatesが指定されていません')
  }

  // fortune_type_idの一致チェック
  if (fortuneTypeId && template.fortune_type_id !== fortuneTypeId) {
    errors.push(`fortune_type_idが一致しません（期待: ${fortuneTypeId}, 実際: ${template.fortune_type_id}）`)
  }

  // メッセージ数のチェック
  const requiredMin = template.validation?.required_message_count?.min || 4
  const requiredMax = template.validation?.required_message_count?.max || 5

  for (const tpl of template.templates) {
    const messageCount = tpl.messages?.length || 0

    if (messageCount < requiredMin || messageCount > requiredMax) {
      invalidMessageCounts.push({
        result_value: tpl.result_value ?? 'null',
        count: messageCount,
      })
    }

    // 画像IDの存在確認（check_image_existenceがtrueの場合）
    if (template.validation?.check_image_existence) {
      for (const msg of tpl.messages || []) {
        if (msg.type === 'image' && msg.content?.image_id) {
          const supabase = await createClient()
          const { data: image, error } = await supabase
            .from('images')
            .select('id')
            .eq('id', msg.content.image_id)
            .single()

          if (error || !image) {
            missingImages.push({
              result_value: tpl.result_value ?? 'null',
              image_id: msg.content.image_id,
            })
          }
        }
      }
    }
  }

  // 数値範囲の網羅性チェック（fortune_type_idが指定されている場合）
  if (fortuneTypeId) {
    const supabase = await createClient()
    const { data: fortuneType } = await supabase
      .from('fortune_types')
      .select('definition')
      .eq('fortune_type_id', fortuneTypeId)
      .single()

    if (fortuneType) {
      const def = fortuneType.definition as FortuneTypeDefinition
      const outputFormat = def.output_format

      // result_valueの型を推測（簡易版）
      if (outputFormat.result_value.includes('number') || outputFormat.result_value.includes('1-')) {
        // 数値範囲の場合、全数値に対応するテンプレートがあるかチェック
        // これは簡易版で、実際の実装ではより詳細なチェックが必要
        const numericTemplates = template.templates.filter(
          (t) => typeof t.result_value === 'number'
        )
        const valueRangeTemplates = template.templates.filter(
          (t) => t.value_range !== undefined
        )

        if (numericTemplates.length === 0 && valueRangeTemplates.length === 0) {
          warnings.push('数値型のresult_valueに対応するテンプレートが見つかりません')
        }
      }
    }
  }

  if (invalidMessageCounts.length > 0) {
    errors.push(
      `メッセージ数が不正なテンプレートがあります（要求: ${requiredMin}-${requiredMax}ブロック）`
    )
  }

  if (missingImages.length > 0) {
    errors.push('存在しない画像IDが参照されています')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    missingValues: missingValues.length > 0 ? missingValues : undefined,
    invalidMessageCounts: invalidMessageCounts.length > 0 ? invalidMessageCounts : undefined,
    missingImages: missingImages.length > 0 ? missingImages : undefined,
  }
}



