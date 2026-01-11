/**
 * ILE関数実装
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { ILEContext } from './types'

/**
 * 変数参照: ${var_name}
 */
export function getVariable(varName: string, context: ILEContext): string {
  const value = context.vars[varName]
  if (value === undefined || value === null) {
    return ''
  }
  return String(value)
}

/**
 * 変数セット: ${set(k, v)}
 * 戻り値は空文字（副作用の不可視化）
 */
export function setVariable(key: string, value: string, context: ILEContext): string {
  context.vars[key] = value
  return ''
}

/**
 * 乱数生成: ${rand(min, max)}
 */
export function generateRandom(min: number, max: number): string {
  const minNum = Math.floor(min)
  const maxNum = Math.floor(max)
  if (minNum > maxNum) {
    return ''
  }
  const random = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum
  return String(random)
}

/**
 * テーブル参照: ${tbl(generation_id, row_number, field_name)}
 * generation_idが空文字の場合は最新のアクティブなgeneration_idを使用
 */
export async function getTableValue(
  generationId: string,
  rowNumber: number,
  fieldName: string,
  context: ILEContext
): Promise<string> {
  try {
    const adminClient = createAdminClient()
    
    // generation_idが空文字の場合は最新のアクティブなものを取得
    let actualGenerationId = generationId
    if (!actualGenerationId || actualGenerationId.trim() === '') {
      const latestId = await getLatestActiveGenerationId(context.fortuneTellerId)
      if (!latestId) {
        return ''
      }
      actualGenerationId = latestId
    }
    
    const { data: row, error } = await adminClient
      .from('rule_rows')
      .select('data')
      .eq('generation_id', actualGenerationId)
      .eq('row_number', rowNumber)
      .single()

    if (error || !row || !row.data) {
      return ''
    }

    const fieldValue = row.data[fieldName]
    if (fieldValue === undefined || fieldValue === null) {
      return ''
    }
    return String(fieldValue)
  } catch (error) {
    console.error('getTableValue error:', error)
    return ''
  }
}

/**
 * 画像変換: ${img_conv(prefix, suffix)}
 * imagesテーブルからnameフィールドで検索してurlを返す
 */
export async function getImageUrl(
  prefix: string,
  suffix: string,
  context: ILEContext
): Promise<string> {
  try {
    const imageName = `${prefix}${suffix}`
    const adminClient = createAdminClient()
    
    const { data: image, error } = await adminClient
      .from('images')
      .select('url')
      .eq('fortune_teller_id', context.fortuneTellerId)
      .eq('name', imageName)
      .single()

    if (error || !image || !image.url) {
      return ''
    }
    return image.url
  } catch (error) {
    console.error('getImageUrl error:', error)
    return ''
  }
}

/**
 * 最新のアクティブなgeneration_idを取得
 */
export async function getLatestActiveGenerationId(
  fortuneTellerId: string
): Promise<string | null> {
  try {
    const adminClient = createAdminClient()
    
    // rule_generationsを取得（fortune_teller_idはrules経由で取得）
    const { data: generations, error } = await adminClient
      .from('rule_generations')
      .select(`
        id,
        rules!inner (
          fortune_teller_id
        )
      `)
      .eq('is_active', true)
      .order('uploaded_at', { ascending: false })

    if (error || !generations || generations.length === 0) {
      return null
    }

    // rules.fortune_teller_idでフィルタリング
    for (const gen of generations) {
      const rules = Array.isArray(gen.rules) ? gen.rules[0] : gen.rules
      if (rules && rules.fortune_teller_id === fortuneTellerId) {
        return gen.id
      }
    }

    return null
  } catch (error) {
    console.error('getLatestActiveGenerationId error:', error)
    return null
  }
}

