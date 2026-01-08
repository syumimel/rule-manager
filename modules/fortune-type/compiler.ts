import { MessageTemplateDefinition } from './types'
import { createClient } from '@/lib/supabase/server'

/**
 * メッセージテンプレートを事前コンパイルしてfortune_message_mappingsに保存
 */
export async function compileMessageTemplate(
  templateId: string,
  template: MessageTemplateDefinition
): Promise<{ success: boolean; error?: string; compiledCount?: number }> {
  const supabase = await createClient()

  try {
    // 既存のマッピングを削除
    await supabase
      .from('fortune_message_mappings')
      .delete()
      .eq('template_id', templateId)

    let compiledCount = 0

    // 各テンプレートをコンパイル
    for (const tpl of template.templates) {
      if (tpl.result_value !== null && typeof tpl.result_value === 'number') {
        // 単一の数値
        const { error } = await supabase
          .from('fortune_message_mappings')
          .insert({
            template_id: templateId,
            result_value: tpl.result_value,
            messages: tpl.messages,
          })

        if (error) {
          throw new Error(`マッピングの保存に失敗しました: ${error.message}`)
        }

        compiledCount++
      } else if (tpl.value_range) {
        // 数値範囲
        const min = tpl.value_range.min ?? 1
        const max = tpl.value_range.max ?? 100

        for (let value = min; value <= max; value++) {
          const { error } = await supabase
            .from('fortune_message_mappings')
            .insert({
              template_id: templateId,
              result_value: value,
              messages: tpl.messages,
            })

          if (error) {
            throw new Error(`マッピングの保存に失敗しました: ${error.message}`)
          }

          compiledCount++
        }
      }
    }

    // テンプレートのis_validatedをtrueに更新
    await supabase
      .from('fortune_message_templates')
      .update({ is_validated: true })
      .eq('template_id', templateId)

    return {
      success: true,
      compiledCount,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'コンパイルに失敗しました',
    }
  }
}

/**
 * 事前コンパイル済みメッセージを取得
 */
export async function getCompiledMessage(
  templateId: string,
  resultValue: number
): Promise<{ messages: any[] } | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('fortune_message_mappings')
    .select('messages')
    .eq('template_id', templateId)
    .eq('result_value', resultValue)
    .single()

  if (error || !data) {
    return null
  }

  return {
    messages: data.messages,
  }
}



